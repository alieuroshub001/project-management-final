// app/api/projects/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Task, ITaskDocument } from '@/models/Project/Task';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import Project from '@/models/Project/Project';
import { 
  ITaskCreateRequest,
  IProjectApiResponse, 
  ITask,
  ITaskFilter
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

// GET - List tasks for a project
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

    // Check project access
    const hasAccess = await hasProjectAccess(params.id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
    const status = searchParams.get('status')?.split(',') || [];
    const priority = searchParams.get('priority')?.split(',') || [];
    const assignedTo = searchParams.get('assignedTo');
    const category = searchParams.get('category')?.split(',') || [];
    const isOverdue = searchParams.get('isOverdue');

    // Build filter object
    const filter: any = { projectId: params.id };
    
    if (status.length > 0) filter.status = { $in: status };
    if (priority.length > 0) filter.priority = { $in: priority };
    if (assignedTo) filter.assignedTo = assignedTo;
    if (category.length > 0) filter.category = { $in: category };
    if (isOverdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ['completed', 'cancelled'] };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() as Promise<ITaskDocument[]>,
      Task.countDocuments(filter)
    ]);

    const convertedTasks = tasks.map(convertToITask);

    return NextResponse.json<IProjectApiResponse<{
      tasks: ITask[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks: convertedTasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new task
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

    // Check project access and permissions
    const hasAccess = await hasProjectAccess(params.id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    // Check if user has permission to create tasks
    const teamMember = await TeamMember.findOne({
      projectId: params.id,
      employeeId: session.user.id,
      isActive: true
    });

    if (!teamMember?.hasPermission('create-tasks')) {
      const project = await Project.findById(params.id);
      if (!project || (project.createdBy.toString() !== session.user.id && project.projectManager.toString() !== session.user.id)) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Insufficient permissions to create tasks'
        }, { status: 403 });
      }
    }

    const body: ITaskCreateRequest = await request.json();
    const {
      title,
      description,
      priority = 'medium',
      assignedTo,
      startDate,
      dueDate,
      estimatedHours,
      category,
      tags,
      parentTaskId,
      dependencies,
      cloudinaryAttachments,
      checklist
    } = body;

    // Validate required fields
    if (!title || !description || !estimatedHours) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: title, description, estimatedHours'
      }, { status: 400 });
    }

    // Validate assignee is team member if provided
    if (assignedTo) {
      const assigneeMember = await TeamMember.findOne({
        projectId: params.id,
        employeeId: assignedTo,
        isActive: true
      });
      
      if (!assigneeMember) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Assigned user is not a member of this project'
        }, { status: 400 });
      }
    }

    // Validate parent task exists if provided
    if (parentTaskId) {
      const parentTask = await Task.findOne({ _id: parentTaskId, projectId: params.id });
      if (!parentTask) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Parent task not found in this project'
        }, { status: 400 });
      }
    }

    // Validate dependencies exist if provided
    if (dependencies && dependencies.length > 0) {
      const dependentTasks = await Task.find({ 
        _id: { $in: dependencies }, 
        projectId: params.id 
      });
      
      if (dependentTasks.length !== dependencies.length) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Some dependency tasks not found in this project'
        }, { status: 400 });
      }
    }

    const taskData = {
      projectId: params.id,
      title,
      description,
      priority,
      assignedTo: assignedTo || undefined,
      assignedToName: assignedTo ? teamMember?.employeeName : undefined,
      assignedToEmail: assignedTo ? teamMember?.employeeEmail : undefined,
      assignedBy: session.user.id,
      assignedByName: session.user.name,
      createdBy: session.user.id,
      createdByName: session.user.name,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours,
      category,
      tags: tags || [],
      parentTaskId: parentTaskId || undefined,
      dependencies: dependencies || [],
      attachments: cloudinaryAttachments || [],
      checklist: checklist?.map(item => ({
        ...item,
        id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9)
      })) || []
    };

    const task = await Task.create(taskData) as ITaskDocument;

    // Create activity log
    await ProjectActivity.create({
      projectId: params.id,
      activityType: 'task-created',
      description: `Task "${title}" was created`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'task',
      entityId: task._id.toString()
    });

    // Create assignment activity if assigned
    if (assignedTo && assignedTo !== session.user.id) {
      await ProjectActivity.create({
        projectId: params.id,
        activityType: 'task-assigned',
        description: `Task "${title}" was assigned to ${teamMember?.employeeName}`,
        performedBy: session.user.id,
        performedByName: session.user.name,
        entityType: 'task',
        entityId: task._id.toString()
      });
    }

    return NextResponse.json<IProjectApiResponse<ITask>>({
      success: true,
      message: 'Task created successfully',
      data: convertToITask(task)
    }, { status: 201 });

  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to create task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}