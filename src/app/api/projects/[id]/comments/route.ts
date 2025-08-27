// app/api/projects/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Comment, ICommentDocument } from '@/models/Project/Comment';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import Project from '@/models/Project/Project';
import { 
  ICommentCreateRequest,
  IProjectApiResponse, 
  IComment
} from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IComment
function convertToIComment(doc: ICommentDocument): IComment {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    projectId: doc.projectId?.toString(),
    taskId: doc.taskId?.toString(),
    commentType: doc.commentType as any,
    content: doc.content,
    authorId: doc.authorId.toString(),
    authorName: doc.authorName,
    authorEmail: doc.authorEmail,
    parentCommentId: doc.parentCommentId?.toString(),
    mentions: doc.mentions,
    attachments: doc.attachments,
    isEdited: doc.isEdited,
    editedAt: doc.editedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Check if user has access to comment on project
async function canComment(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId);
  if (!project) return false;

  // Check if user is creator or project manager
  if (project.createdBy.toString() === userId || project.projectManager.toString() === userId) {
    return true;
  }

  // Check if user is team member with comment permission
  const teamMember = await TeamMember.findOne({
    projectId,
    employeeId: userId,
    isActive: true
  });

  return teamMember?.hasPermission('comment') || false;
}

// GET - List comments for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user has access to view project
    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    const hasAccess = project.createdBy.toString() === session.user.id ||
                     project.projectManager.toString() === session.user.id ||
                     await TeamMember.findOne({
                       projectId: params.id,
                       employeeId: session.user.id,
                       isActive: true
                     });

    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const commentType = searchParams.get('commentType');

    // Build filter object
    const filter: any = { projectId: params.id };
    if (commentType) filter.commentType = commentType;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<ICommentDocument[]>,
      Comment.countDocuments(filter)
    ]);

    const convertedComments = comments.map(convertToIComment);

    return NextResponse.json<IProjectApiResponse<{
      comments: IComment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Comments retrieved successfully',
      data: {
        comments: convertedComments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve comments',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user can comment
    const canUserComment = await canComment(params.id, session.user.id);
    if (!canUserComment) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to comment'
      }, { status: 403 });
    }

    const body: ICommentCreateRequest = await request.json();
    const {
      taskId,
      commentType,
      content,
      parentCommentId,
      mentions,
      cloudinaryAttachments
    } = body;

    // Validate required fields
    if (!commentType || !content) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: commentType, content'
      }, { status: 400 });
    }

    // Validate parent comment if provided
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        _id: parentCommentId,
        $or: [
          { projectId: params.id },
          { taskId: taskId }
        ]
      });

      if (!parentComment) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Parent comment not found'
        }, { status: 400 });
      }
    }

    const commentData = {
      projectId: commentType === 'project-comment' ? params.id : undefined,
      taskId: taskId || undefined,
      commentType,
      content,
      authorId: session.user.id,
      authorName: session.user.name,
      authorEmail: session.user.email,
      parentCommentId: parentCommentId || undefined,
      mentions: mentions || [],
      attachments: cloudinaryAttachments || []
    };

    const comment = await Comment.create(commentData) as ICommentDocument;

    // Create activity log
    await ProjectActivity.create({
      projectId: params.id,
      activityType: 'comment-added',
      description: `Comment was added${taskId ? ' to task' : ' to project'}`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'comment',
      entityId: comment._id.toString()
    });

    return NextResponse.json<IProjectApiResponse<IComment>>({
      success: true,
      message: 'Comment created successfully',
      data: convertToIComment(comment)
    }, { status: 201 });

  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to create comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}