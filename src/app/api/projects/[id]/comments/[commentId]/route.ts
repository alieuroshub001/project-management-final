// app/api/projects/[id]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Comment, ICommentDocument } from '@/models/Project/Comment';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import Project from '@/models/Project/Project';
import { 
  ICommentUpdateRequest,
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
async function canAccessComment(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId);
  if (!project) return false;

  // Check if user is creator or project manager
  if (project.createdBy.toString() === userId || project.projectManager.toString() === userId) {
    return true;
  }

  // Check if user is team member
  const teamMember = await TeamMember.findOne({
    projectId,
    employeeId: userId,
    isActive: true
  });

  return !!teamMember;
}

// GET - Get comment details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
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

    // Await params before using them
    const params = await context.params;
    const projectId = params.id;
    const commentId = params.commentId;

    // Check if user has access to view project
    const hasAccess = await canAccessComment(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      projectId: projectId
    }) as ICommentDocument | null;

    if (!comment) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Comment not found'
      }, { status: 404 });
    }

    // Get replies to this comment
    const replies = await Comment.find({
      parentCommentId: commentId
    }).sort({ createdAt: 1 }) as ICommentDocument[];

    const commentWithReplies = {
      ...convertToIComment(comment),
      replies: replies.map(convertToIComment)
    };

    return NextResponse.json<IProjectApiResponse<typeof commentWithReplies>>({
      success: true,
      message: 'Comment retrieved successfully',
      data: commentWithReplies
    });

  } catch (error) {
    console.error('Get comment error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update comment
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
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

    // Await params before using them
    const params = await context.params;
    const projectId = params.id;
    const commentId = params.commentId;

    // Check if user has access to the project
    const hasAccess = await canAccessComment(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      projectId: projectId
    }) as ICommentDocument | null;

    if (!comment) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Comment not found'
      }, { status: 404 });
    }

    // Check if user can edit this comment (only author can edit)
    if (!comment.canEdit(session.user.id)) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to edit this comment'
      }, { status: 403 });
    }

    const body: ICommentUpdateRequest = await request.json();
    const { content, mentions, cloudinaryAttachments, filesToDelete } = body;

    // Build update object
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (mentions !== undefined) updateData.mentions = mentions;

    // Handle attachments
    if (cloudinaryAttachments) {
      updateData.attachments = [...(comment.attachments || []), ...cloudinaryAttachments];
    }

    // Handle file deletion
    if (filesToDelete && filesToDelete.length > 0) {
      updateData.attachments = (comment.attachments || []).filter(
        (file: any) => !filesToDelete.includes(file.public_id)
      );
    }

    // Mark as edited
    updateData.isEdited = true;
    updateData.editedAt = new Date();

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      updateData,
      { new: true }
    ) as ICommentDocument | null;

    if (!updatedComment) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update comment'
      }, { status: 500 });
    }

    return NextResponse.json<IProjectApiResponse<IComment>>({
      success: true,
      message: 'Comment updated successfully',
      data: convertToIComment(updatedComment)
    });

  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete comment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
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

    // Await params before using them
    const params = await context.params;
    const projectId = params.id;
    const commentId = params.commentId;

    // Check if user has access to the project
    const hasAccess = await canAccessComment(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      projectId: projectId
    }) as ICommentDocument | null;

    if (!comment) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Comment not found'
      }, { status: 404 });
    }

    // Check if user can delete this comment (only author or project manager/creator)
    const project = await Project.findById(projectId);
    const canDelete = comment.canDelete(session.user.id) ||
                     (project && (project.createdBy.toString() === session.user.id || 
                                 project.projectManager.toString() === session.user.id));

    if (!canDelete) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to delete this comment'
      }, { status: 403 });
    }

    // Check if comment has replies
    const replies = await Comment.find({ parentCommentId: commentId });
    if (replies.length > 0) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Cannot delete comment with existing replies'
      }, { status: 400 });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to delete comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}