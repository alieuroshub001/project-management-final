// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Project, { IProjectDocument } from '@/models/Project/Project';
import { TeamMember } from '@/models/Project/TeamMember';
import { Task } from '@/models/Project/Task';
import { Milestone } from '@/models/Project/MileStone';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import { 
  IProjectUpdateRequest,
  IProjectApiResponse, 
  IProject,
  IProjectWithDetails
} from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IProject
function convertToIProject(doc: IProjectDocument): IProject {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    name: doc.name,
    description: doc.description,
    status: doc.status as any,
    priority: doc.priority as any,
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    createdByEmail: doc.createdByEmail,
    projectManager: doc.projectManager.toString(),
    projectManagerName: doc.projectManagerName,
    projectManagerEmail: doc.projectManagerEmail,
    startDate: doc.startDate,
    endDate: doc.endDate,
    estimatedHours: doc.estimatedHours,
    actualHours: doc.actualHours,
    budget: doc.budget,
    actualCost: doc.actualCost,
    progress: doc.progress,
    category: doc.category as any,
    tags: doc.tags,
    isArchived: doc.isArchived,
    attachments: doc.attachments,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Check if user has access to project
async function hasProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId);
  if (!project) return false;

  // Check if user is creator, manager, or team member
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

// GET - Get single project with details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    // Check access
    const hasAccess = await hasProjectAccess(params.id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const project = await Project.findById(params.id) as IProjectDocument | null;
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    // Get additional details
    const [teamMembers, tasks, milestones, recentActivity] = await Promise.all([
      TeamMember.find({ projectId: params.id, isActive: true }),
      Task.find({ projectId: params.id }),
      Milestone.find({ projectId: params.id }),
      ProjectActivity.findByProject(params.id, 20)
    ]);

    // Calculate total time spent (you might want to implement this in TimeEntry model)
    const totalTimeSpent = 0; // TODO: Calculate from TimeEntry

    const projectWithDetails: IProjectWithDetails = {
      ...convertToIProject(project),
      teamMembers: teamMembers.map(tm => ({
        id: tm._id.toString(),
        projectId: tm.projectId.toString(),
        employeeId: tm.employeeId.toString(),
        employeeName: tm.employeeName,
        employeeEmail: tm.employeeEmail,
        employeeMobile: tm.employeeMobile,
        role: tm.role as any,
        permissions: tm.permissions as any,
        hourlyRate: tm.hourlyRate,
        joinedAt: tm.joinedAt,
        leftAt: tm.leftAt,
        isActive: tm.isActive,
        totalHoursLogged: tm.totalHoursLogged,
        createdAt: tm.createdAt,
        updatedAt: tm.updatedAt
      })),
      tasks: tasks.map(task => ({
        id: task._id.toString(),
        projectId: task.projectId.toString(),
        title: task.title,
        description: task.description,
        status: task.status as any,
        priority: task.priority as any,
        assignedTo: task.assignedTo?.toString(),
        assignedToName: task.assignedToName,
        assignedToEmail: task.assignedToEmail,
        assignedBy: task.assignedBy.toString(),
        assignedByName: task.assignedByName,
        createdBy: task.createdBy.toString(),
        createdByName: task.createdByName,
        startDate: task.startDate,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        progress: task.progress,
        category: task.category as any,
        tags: task.tags,
        parentTaskId: task.parentTaskId?.toString(),
        dependencies: task.dependencies?.map(dep => dep.toString()),
        attachments: task.attachments,
        checklist: task.checklist?.map(item => ({
          id: item.id,
          taskId: task._id.toString(),
          title: item.title,
          isCompleted: item.isCompleted,
          completedBy: item.completedBy,
          completedByName: item.completedByName,
          completedAt: item.completedAt,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        })),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })),
      milestones: milestones.map(milestone => ({
        id: milestone._id.toString(),
        projectId: milestone.projectId.toString(),
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate,
        status: milestone.status as any,
        completedAt: milestone.completedAt,
        completedBy: milestone.completedBy?.toString(),
        completedByName: milestone.completedByName,
        tasks: milestone.tasks?.map(taskId => taskId.toString()),
        createdBy: milestone.createdBy.toString(),
        createdByName: milestone.createdByName,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity._id.toString(),
        projectId: activity.projectId.toString(),
        activityType: activity.activityType as any,
        description: activity.description,
        performedBy: activity.performedBy.toString(),
        performedByName: activity.performedByName,
        entityType: activity.entityType as any,
        entityId: activity.entityId,
        metadata: activity.metadata,
        createdAt: activity.createdAt
      })),
      totalTimeSpent,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      totalTasks: tasks.length
    };

    return NextResponse.json<IProjectApiResponse<IProjectWithDetails>>({
      success: true,
      message: 'Project retrieved successfully',
      data: projectWithDetails
    });

  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve project',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const project = await Project.findById(params.id) as IProjectDocument | null;
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    // Check if user can edit
    if (!project.canEdit(session.user.id)) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to edit this project'
      }, { status: 403 });
    }

    const body: IProjectUpdateRequest = await request.json();
    const {
      name,
      description,
      status,
      priority,
      projectManager,
      startDate,
      endDate,
      estimatedHours,
      actualHours,
      budget,
      actualCost,
      progress,
      category,
      tags,
      cloudinaryAttachments,
      filesToDelete
    } = body;

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (budget !== undefined) updateData.budget = budget;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (progress !== undefined) updateData.progress = progress;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    // Handle project manager change
    if (projectManager !== undefined && projectManager !== project.projectManager.toString()) {
      // TODO: Fetch new manager details from User model
      updateData.projectManager = projectManager;
      // updateData.projectManagerName = newManager.name;
      // updateData.projectManagerEmail = newManager.email;
    }

    // Handle attachments
    if (cloudinaryAttachments) {
      updateData.attachments = [...(project.attachments || []), ...cloudinaryAttachments];
    }

    // Handle file deletion
    if (filesToDelete && filesToDelete.length > 0) {
      updateData.attachments = (project.attachments || []).filter(
        (file: any) => !filesToDelete.includes(file.public_id)
      );
    }

    // Validate date range if both dates provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'End date must be after start date'
        }, { status: 400 });
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ) as IProjectDocument | null;

    if (!updatedProject) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update project'
      }, { status: 500 });
    }

    // Create activity log
    await ProjectActivity.create({
      projectId: params.id,
      activityType: 'project-updated',
      description: `Project "${updatedProject.name}" was updated`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'project',
      entityId: params.id
    });

    return NextResponse.json<IProjectApiResponse<IProject>>({
      success: true,
      message: 'Project updated successfully',
      data: convertToIProject(updatedProject)
    });

  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const project = await Project.findById(params.id) as IProjectDocument | null;
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    // Check if user can delete (only creator or admin should be able to delete)
    if (project.createdBy.toString() !== session.user.id) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to delete this project'
      }, { status: 403 });
    }

    // Instead of hard delete, archive the project
    const archivedProject = await Project.findByIdAndUpdate(
      params.id,
      { isArchived: true },
      { new: true }
    ) as IProjectDocument | null;

    if (!archivedProject) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to delete project'
      }, { status: 500 });
    }

    // Create activity log
    await ProjectActivity.create({
      projectId: params.id,
      activityType: 'project-updated',
      description: `Project "${project.name}" was archived`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'project',
      entityId: params.id
    });

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Project archived successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}