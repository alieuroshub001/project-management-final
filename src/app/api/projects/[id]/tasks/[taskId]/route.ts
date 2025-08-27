// app/api/employee/projects/[id]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Task, ITaskDocument } from '@/models/Project/Task';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import { Comment } from '@/models/Project/Comment';
import { TimeEntry } from '@/models/Project/TimeEntry';
import Project from '@/models/Project/Project';
import { 
  ITaskUpdateRequest,
  IProjectApiResponse, 
  ITask,
  ITaskWithDetails
} from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to ITask
function convertToITask(doc: ITaskDocument): ITask {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    projectId: doc.projectId.toString(),
    title: doc.title,
    description: doc.description,
    status: doc.status as any,
    priority: doc.priority as any,
    assignedTo: doc.assignedTo?.toString(),
    assignedToName: doc.assignedToName,
    assignedToEmail: doc.assignedToEmail,
    assignedBy: doc.assignedBy.toString(),
    assignedByName: doc.assignedByName,
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    startDate: doc.startDate,
    dueDate: doc.dueDate,
    completedAt: doc.completedAt,
    estimatedHours: doc.estimatedHours,
    actualHours: doc.actualHours,
    progress: doc.progress,
    category: doc.category as any,
    tags: doc.tags,
    parentTaskId: doc.parentTaskId?.toString(),
    dependencies: doc.dependencies?.map(dep => dep.toString()),
    attachments: doc.attachments,
    checklist: doc.checklist?.map(item => ({
      id: item.id,
      taskId: doc._id.toString(),
      title: item.title,
      isCompleted: item.isCompleted,
      completedBy: item.completedBy,
      completedByName: item.completedByName,
      completedAt: item.completedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Check if user has access to project
async function hasProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId);
  if (!project) return false;

  if (project.createdBy.toString() === userId || project.projectManager.toString() === userId) {
    return true;
  }

  const teamMember = await TeamMember.findOne({
    projectId,
    employeeId: userId,
    isActive: true
  });

  return !!teamMember;
}

// GET - Get single task with details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
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
    const taskId = params.taskId;

    // Check project access
    const hasAccess = await hasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const task = await Task.findOne({ 
      _id: taskId, 
      projectId: projectId 
    }) as ITaskDocument | null;

    if (!task) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Task not found'
      }, { status: 404 });
    }

    // Get additional details
    const [assignedToDetails, subtasks, comments, timeEntries, dependentTasks] = await Promise.all([
      task.assignedTo ? TeamMember.findOne({ 
        projectId: projectId, 
        employeeId: task.assignedTo 
      }) : null,
      Task.find({ parentTaskId: taskId }),
      Comment.findByTask ? Comment.findByTask(taskId) : Comment.find({ taskId: taskId }),
      TimeEntry.find({ taskId: taskId }),
      task.dependencies ? Task.find({ _id: { $in: task.dependencies } }) : []
    ]);

    const taskWithDetails: ITaskWithDetails = {
      ...convertToITask(task),
      assignedToDetails: assignedToDetails ? {
        id: assignedToDetails._id.toString(),
        projectId: assignedToDetails.projectId.toString(),
        employeeId: assignedToDetails.employeeId.toString(),
        employeeName: assignedToDetails.employeeName,
        employeeEmail: assignedToDetails.employeeEmail,
        employeeMobile: assignedToDetails.employeeMobile,
        role: assignedToDetails.role as any,
        permissions: assignedToDetails.permissions as any,
        hourlyRate: assignedToDetails.hourlyRate,
        joinedAt: assignedToDetails.joinedAt,
        leftAt: assignedToDetails.leftAt,
        isActive: assignedToDetails.isActive,
        totalHoursLogged: assignedToDetails.totalHoursLogged,
        createdAt: assignedToDetails.createdAt,
        updatedAt: assignedToDetails.updatedAt
      } : undefined,
      subtasks: subtasks?.map(convertToITask),
      comments: comments.map(comment => ({
        id: comment._id.toString(),
        projectId: comment.projectId?.toString(),
        taskId: comment.taskId?.toString(),
        commentType: comment.commentType as any,
        content: comment.content,
        authorId: comment.authorId.toString(),
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        parentCommentId: comment.parentCommentId?.toString(),
        mentions: comment.mentions,
        attachments: comment.attachments,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      })),
      timeEntries: timeEntries.map(entry => ({
        id: entry._id.toString(),
        projectId: entry.projectId.toString(),
        taskId: entry.taskId?.toString(),
        employeeId: entry.employeeId.toString(),
        employeeName: entry.employeeName,
        description: entry.description,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        hourlyRate: entry.hourlyRate,
        billableAmount: entry.billableAmount,
        isBillable: entry.isBillable,
        status: entry.status as any,
        approvedBy: entry.approvedBy?.toString(),
        approvedByName: entry.approvedByName,
        approvedAt: entry.approvedAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      dependentTasks: dependentTasks?.map(convertToITask)
    };

    return NextResponse.json<IProjectApiResponse<ITaskWithDetails>>({
      success: true,
      message: 'Task retrieved successfully',
      data: taskWithDetails
    });

  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
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
    const taskId = params.taskId;

    // Check project access
    const hasAccess = await hasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const task = await Task.findOne({ 
      _id: taskId, 
      projectId: projectId 
    }) as ITaskDocument | null;

    if (!task) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Task not found'
      }, { status: 404 });
    }

    // Check permissions - user should be able to edit if they're creator, assignee, or have edit-tasks permission
    const teamMember = await TeamMember.findOne({
      projectId: projectId,
      employeeId: session.user.id,
      isActive: true
    });

    const canEdit = task.createdBy.toString() === session.user.id ||
                   task.assignedTo?.toString() === session.user.id ||
                   teamMember?.hasPermission('edit-tasks');

    if (!canEdit) {
      const project = await Project.findById(projectId);
      if (!project || (project.createdBy.toString() !== session.user.id && project.projectManager.toString() !== session.user.id)) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Insufficient permissions to edit this task'
        }, { status: 403 });
      }
    }

    const body: ITaskUpdateRequest = await request.json();
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      startDate,
      dueDate,
      completedAt,
      estimatedHours,
      actualHours,
      progress,
      category,
      tags,
      dependencies,
      cloudinaryAttachments,
      checklist,
      filesToDelete
    } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (progress !== undefined) updateData.progress = progress;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (dependencies !== undefined) updateData.dependencies = dependencies;
    if (checklist !== undefined) updateData.checklist = checklist;

    // Handle assignee change
    if (assignedTo !== undefined) {
      if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
        // Validate new assignee is team member
        const assigneeMember = await TeamMember.findOne({
          projectId: projectId,
          employeeId: assignedTo,
          isActive: true
        });
        
        if (!assigneeMember) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Assigned user is not a member of this project'
          }, { status: 400 });
        }

        updateData.assignedTo = assignedTo;
        updateData.assignedToName = assigneeMember.employeeName;
        updateData.assignedToEmail = assigneeMember.employeeEmail;
      } else if (!assignedTo) {
        updateData.assignedTo = null;
        updateData.assignedToName = null;
        updateData.assignedToEmail = null;
      }
    }

    // Handle attachments
    if (cloudinaryAttachments) {
      updateData.attachments = [...(task.attachments || []), ...cloudinaryAttachments];
    }

    // Handle file deletion
    if (filesToDelete && filesToDelete.length > 0) {
      updateData.attachments = (task.attachments || []).filter(
        (file: any) => !filesToDelete.includes(file.public_id)
      );
    }

    // Validate dependencies if provided
    if (dependencies && dependencies.length > 0) {
      const dependentTasks = await Task.find({ 
        _id: { $in: dependencies }, 
        projectId: projectId 
      });
      
      if (dependentTasks.length !== dependencies.length) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Some dependency tasks not found in this project'
        }, { status: 400 });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    ) as ITaskDocument | null;

    if (!updatedTask) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update task'
      }, { status: 500 });
    }

    // Create activity logs
    await ProjectActivity.create({
      projectId: projectId,
      activityType: 'task-updated',
      description: `Task "${updatedTask.title}" was updated`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'task',
      entityId: taskId
    });

    // Log assignment change
    if (assignedTo !== undefined && assignedTo !== task.assignedTo?.toString()) {
      const assigneeMember = assignedTo ? await TeamMember.findOne({
        projectId: projectId,
        employeeId: assignedTo
      }) : null;

      await ProjectActivity.create({
        projectId: projectId,
        activityType: 'task-assigned',
        description: assignedTo 
          ? `Task "${updatedTask.title}" was assigned to ${assigneeMember?.employeeName}`
          : `Task "${updatedTask.title}" was unassigned`,
        performedBy: session.user.id,
        performedByName: session.user.name,
        entityType: 'task',
        entityId: taskId
      });
    }

    // Log completion
    if (status === 'completed' && task.status !== 'completed') {
      await ProjectActivity.create({
        projectId: projectId,
        activityType: 'task-completed',
        description: `Task "${updatedTask.title}" was completed`,
        performedBy: session.user.id,
        performedByName: session.user.name,
        entityType: 'task',
        entityId: taskId
      });
    }

    return NextResponse.json<IProjectApiResponse<ITask>>({
      success: true,
      message: 'Task updated successfully',
      data: convertToITask(updatedTask)
    });

  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
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
    const taskId = params.taskId;

    // Check project access
    const hasAccess = await hasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const task = await Task.findOne({ 
      _id: taskId, 
      projectId: projectId 
    }) as ITaskDocument | null;

    if (!task) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Task not found'
      }, { status: 404 });
    }

    // Check permissions - only creator or users with delete-tasks permission
    const teamMember = await TeamMember.findOne({
      projectId: projectId,
      employeeId: session.user.id,
      isActive: true
    });

    const canDelete = task.createdBy.toString() === session.user.id ||
                     teamMember?.hasPermission('delete-tasks');

    if (!canDelete) {
      const project = await Project.findById(projectId);
      if (!project || (project.createdBy.toString() !== session.user.id && project.projectManager.toString() !== session.user.id)) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Insufficient permissions to delete this task'
        }, { status: 403 });
      }
    }

    // Check if task has subtasks
    const subtasks = await Task.find({ parentTaskId: taskId });
    if (subtasks.length > 0) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Cannot delete task with existing subtasks'
      }, { status: 400 });
    }

    // Remove task from any dependencies
    await Task.updateMany(
      { dependencies: taskId },
      { $pull: { dependencies: taskId } }
    );

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    // Create activity log
    await ProjectActivity.create({
      projectId: projectId,
      activityType: 'task-updated',
      description: `Task "${task.title}" was deleted`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'task',
      entityId: taskId
    });

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}