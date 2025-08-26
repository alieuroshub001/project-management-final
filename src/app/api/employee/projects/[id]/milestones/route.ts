// app/api/employee/projects/[id]/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Milestone, IMilestoneDocument } from '@/models/employee/Project/MileStone';
import { TeamMember } from '@/models/employee/Project/TeamMember';
import { ProjectActivity } from '@/models/employee/Project/ProjectActivity';
import { Task } from '@/models/employee/Project/Task';
import Project from '@/models/employee/Project/Project';
import { 
  IMilestoneCreateRequest,
  IProjectApiResponse, 
  IMilestone
} from '@/types/employee/projectmanagement';
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

// GET - List milestones for a project
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

    // Check if user has access
    const hasAccess = await canManageMilestones(params.id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const overdue = searchParams.get('overdue') === 'true';

    let milestones: IMilestoneDocument[];

    if (upcoming) {
      const days = parseInt(searchParams.get('days') || '7');
      milestones = await Milestone.findUpcoming(days) as IMilestoneDocument[];
      milestones = milestones.filter(m => m.projectId.toString() === params.id);
    } else if (overdue) {
      milestones = await Milestone.findOverdue() as IMilestoneDocument[];
      milestones = milestones.filter(m => m.projectId.toString() === params.id);
    } else {
      const filter: any = { projectId: params.id };
      if (status) filter.status = status;
      
      milestones = await Milestone.find(filter).sort({ dueDate: 1 }) as IMilestoneDocument[];
    }

    const convertedMilestones = milestones.map(convertToIMilestone);

    return NextResponse.json<IProjectApiResponse<IMilestone[]>>({
      success: true,
      message: 'Milestones retrieved successfully',
      data: convertedMilestones
    });

  } catch (error) {
    console.error('Get milestones error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve milestones',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new milestone
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

    // Check if user can manage milestones (only PM or creator)
    const project = await Project.findById(params.id);
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
        message: 'Insufficient permissions to create milestones'
      }, { status: 403 });
    }

    const body: IMilestoneCreateRequest = await request.json();
    const { title, description, dueDate, tasks } = body;

    // Validate required fields
    if (!title || !description || !dueDate) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: title, description, dueDate'
      }, { status: 400 });
    }

    // Validate tasks belong to project if provided
    if (tasks && tasks.length > 0) {
      const projectTasks = await Task.find({ 
        _id: { $in: tasks }, 
        projectId: params.id 
      });
      
      if (projectTasks.length !== tasks.length) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Some tasks do not belong to this project'
        }, { status: 400 });
      }
    }

    const milestoneData = {
      projectId: params.id,
      title,
      description,
      dueDate: new Date(dueDate),
      tasks: tasks || [],
      createdBy: session.user.id,
      createdByName: session.user.name
    };

    const milestone = await Milestone.create(milestoneData) as IMilestoneDocument;

    // Create activity log
    await ProjectActivity.create({
      projectId: params.id,
      activityType: 'milestone-created',
      description: `Milestone "${title}" was created`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'milestone',
      entityId: milestone._id.toString()
    });
    
    return NextResponse.json<IProjectApiResponse<IMilestone>>({
      success: true,
      message: 'Milestone created successfully',
      data: convertToIMilestone(milestone)
    }, { status: 201 });

  } catch (error) {
    console.error('Create milestone error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to create milestone',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}