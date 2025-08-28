// app/api/projects/[id]/milestones/[milestoneId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Milestone, IMilestoneDocument } from '@/models/Project/MileStone';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import { Task } from '@/models/Project/Task';
import Project from '@/models/Project/Project';
import { 
  IMilestoneUpdateRequest,
  IProjectApiResponse, 
  IMilestone
} from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IMilestone
function convertToIMilestone(doc: IMilestoneDocument): IMilestone {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    projectId: doc.projectId.toString(),
    title: doc.title,
    description: doc.description,
    dueDate: doc.dueDate,
    status: doc.status as any,
    completedAt: doc.completedAt,
    completedBy: doc.completedBy?.toString(),
    completedByName: doc.completedByName,
    tasks: doc.tasks?.map(taskId => taskId.toString()),
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Check if user has access to manage milestones
async function canManageMilestones(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId);
  if (!project) return false;

  // Check if user is creator or project manager
  if (project.createdBy.toString() === userId || project.projectManager.toString() === userId) {
    return true;
  }

  // Check if user is team member (for viewing)
  const teamMember = await TeamMember.findOne({
    projectId,
    employeeId: userId,
    isActive: true
  });

  return !!teamMember;
}

// GET - Get single milestone with details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; milestoneId: string }> }
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
    const milestoneId = params.milestoneId;

    // Check if user has access
    const hasAccess = await canManageMilestones(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      projectId: projectId 
    }) as IMilestoneDocument | null;

    if (!milestone) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Milestone not found'
      }, { status: 404 });
    }

    // Get associated tasks
    const associatedTasks = milestone.tasks && milestone.tasks.length > 0 
      ? await Task.find({ _id: { $in: milestone.tasks } })
      : [];

    const milestoneWithDetails = {
      ...convertToIMilestone(milestone),
      associatedTasks: associatedTasks.map(task => ({
        id: task._id.toString(),
        title: task.title,
        status: task.status,
        progress: task.progress,
        assignedToName: task.assignedToName
      }))
    };

    return NextResponse.json<IProjectApiResponse<typeof milestoneWithDetails>>({
      success: true,
      message: 'Milestone retrieved successfully',
      data: milestoneWithDetails
    });

  } catch (error) {
    console.error('Get milestone error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve milestone',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update milestone
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; milestoneId: string }> }
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
    const milestoneId = params.milestoneId;

    // Check if user can manage milestones (only PM or creator)
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    const canManage = project.createdBy.toString() === session.user.id || 
                     project.projectManager.toString() === session.user.id;

    if (!canManage) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to update milestones'
      }, { status: 403 });
    }

    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      projectId: projectId 
    }) as IMilestoneDocument | null;

    if (!milestone) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Milestone not found'
      }, { status: 404 });
    }

    const body: IMilestoneUpdateRequest = await request.json();
    const { title, description, dueDate, status, tasks, completedAt } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    if (tasks !== undefined) updateData.tasks = tasks;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

    // Handle completion
    if (status === 'completed' && milestone.status !== 'completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = session.user.id;
      updateData.completedByName = session.user.name;
    }

    // Validate tasks belong to project if provided
    if (tasks && tasks.length > 0) {
      const projectTasks = await Task.find({ 
        _id: { $in: tasks }, 
        projectId: projectId 
      });
      
      if (projectTasks.length !== tasks.length) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Some tasks do not belong to this project'
        }, { status: 400 });
      }
    }

    const updatedMilestone = await Milestone.findByIdAndUpdate(
      milestoneId,
      updateData,
      { new: true }
    ) as IMilestoneDocument | null;

    if (!updatedMilestone) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update milestone'
      }, { status: 500 });
    }

    // Create activity log
    await ProjectActivity.create({
      projectId: projectId,
      activityType: status === 'completed' && milestone.status !== 'completed' 
        ? 'milestone-completed' 
        : 'milestone-created', // You might want to add 'milestone-updated'
      description: status === 'completed' && milestone.status !== 'completed'
        ? `Milestone "${updatedMilestone.title}" was completed`
        : `Milestone "${updatedMilestone.title}" was updated`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'milestone',
      entityId: milestoneId
    });
    
    return NextResponse.json<IProjectApiResponse<IMilestone>>({
      success: true,
      message: 'Milestone updated successfully',
      data: convertToIMilestone(updatedMilestone)
    });

  } catch (error) {
    console.error('Update milestone error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update milestone',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete milestone
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; milestoneId: string }> }
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
    const milestoneId = params.milestoneId;

    // Check if user can manage milestones (only PM or creator)
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    const canManage = project.createdBy.toString() === session.user.id || 
                     project.projectManager.toString() === session.user.id;

    if (!canManage) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to delete milestones'
      }, { status: 403 });
    }

    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      projectId: projectId 
    }) as IMilestoneDocument | null;

    if (!milestone) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Milestone not found'
      }, { status: 404 });
    }

    // Delete the milestone
    await Milestone.findByIdAndDelete(milestoneId);

    // Create activity log
    await ProjectActivity.create({
      projectId: projectId,
      activityType: 'milestone-created', // You might want to add 'milestone-deleted'
      description: `Milestone "${milestone.title}" was deleted`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'milestone',
      entityId: milestoneId
    });

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Milestone deleted successfully'
    });

  } catch (error) {
    console.error('Delete milestone error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to delete milestone',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}