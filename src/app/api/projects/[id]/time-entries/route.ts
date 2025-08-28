// app/api/projects/[id]/time-entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { TimeEntry, ITimeEntryDocument } from '@/models/Project/TimeEntry';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import { Task } from '@/models/Project/Task';
import Project from '@/models/Project/Project';
import { 
  ITimeEntryCreateRequest,
  IProjectApiResponse, 
  ITimeEntry
} from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to ITimeEntry
function convertToITimeEntry(doc: ITimeEntryDocument): ITimeEntry {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    taskId: doc.taskId?.toString(),
    employeeId: doc.employeeId.toString(),
    employeeName: doc.employeeName,
    description: doc.description,
    startTime: doc.startTime,
    endTime: doc.endTime,
    duration: doc.duration,
    hourlyRate: doc.hourlyRate,
    billableAmount: doc.billableAmount,
    isBillable: doc.isBillable,
    status: doc.status as any,
    approvedBy: doc.approvedBy?.toString(),
    approvedByName: doc.approvedByName,
    approvedAt: doc.approvedAt,
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

// GET - List time entries for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Await the params promise
    const { id } = await params;

    // Check project access
    const hasAccess = await hasProjectAccess(id, session.user.id);
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
    const employeeId = searchParams.get('employeeId');
    const taskId = searchParams.get('taskId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isBillable = searchParams.get('isBillable');

    // Build filter object
    const filter: any = { projectId: id };
    
    if (employeeId) filter.employeeId = employeeId;
    if (taskId) filter.taskId = taskId;
    if (status) filter.status = status;
    if (isBillable !== null && isBillable !== undefined) {
      filter.isBillable = isBillable === 'true';
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [timeEntries, total] = await Promise.all([
      TimeEntry.find(filter)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<ITimeEntryDocument[]>,
      TimeEntry.countDocuments(filter)
    ]);

    const convertedTimeEntries = timeEntries.map(convertToITimeEntry);

    return NextResponse.json<IProjectApiResponse<{
      timeEntries: ITimeEntry[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Time entries retrieved successfully',
      data: {
        timeEntries: convertedTimeEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get time entries error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve time entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new time entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Await the params promise
    const { id } = await params;

    // Check project access and permissions
    const hasAccess = await hasProjectAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    // Check if user has permission to track time
    const teamMember = await TeamMember.findOne({
      projectId: id,
      employeeId: session.user.id,
      isActive: true
    });

    if (!teamMember?.hasPermission('track-time')) {
      const project = await Project.findById(id);
      if (!project || (project.createdBy.toString() !== session.user.id && project.projectManager.toString() !== session.user.id)) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Insufficient permissions to track time'
        }, { status: 403 });
      }
    }

    const body: ITimeEntryCreateRequest = await request.json();
    const {
      taskId,
      description,
      startTime,
      endTime,
      duration,
      isBillable
    } = body;

    // Validate required fields
    if (!description || !startTime) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: description, startTime'
      }, { status: 400 });
    }

    // Validate task belongs to project if provided
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, projectId: id });
      if (!task) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Task not found in this project'
        }, { status: 400 });
      }
    }

    // Calculate duration if not provided but endTime is available
    let calculatedDuration = duration;
    if (!calculatedDuration && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      calculatedDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes
    }

    if (!calculatedDuration) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Duration must be provided or endTime must be specified'
      }, { status: 400 });
    }

    // Check for overlapping time entries for the same user
    const overlappingEntry = await TimeEntry.findOne({
      employeeId: session.user.id,
      $or: [
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gte: new Date(startTime) }
        },
        ...(endTime ? [{
          startTime: { $lte: new Date(endTime) },
          endTime: { $gte: new Date(endTime) }
        }] : [])
      ]
    });

    if (overlappingEntry) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Time entry overlaps with existing entry'
      }, { status: 400 });
    }

    const timeEntryData = {
      projectId: id,
      taskId: taskId || undefined,
      employeeId: session.user.id,
      employeeName: session.user.name,
      description,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      duration: calculatedDuration,
      hourlyRate: teamMember?.hourlyRate,
      isBillable: isBillable !== undefined ? isBillable : true
    };

    const timeEntry = await TimeEntry.create(timeEntryData) as ITimeEntryDocument;

    // Update team member's total hours
    if (teamMember) {
      teamMember.totalHoursLogged = (teamMember.totalHoursLogged || 0) + (calculatedDuration / 60);
      await teamMember.save();
    }

    // Create activity log
    await ProjectActivity.create({
      projectId: id,
      activityType: 'time-logged',
      description: `${Math.round(calculatedDuration / 60 * 10) / 10} hours logged${taskId ? ' for task' : ''}`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'time-entry',
      entityId: timeEntry._id.toString()
    });

    return NextResponse.json<IProjectApiResponse<ITimeEntry>>({
      success: true,
      message: 'Time entry created successfully',
      data: convertToITimeEntry(timeEntry)
    }, { status: 201 });

  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to create time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}