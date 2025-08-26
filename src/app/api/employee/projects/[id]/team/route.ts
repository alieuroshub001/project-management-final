// app/api/employee/projects/[id]/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { TeamMember, ITeamMemberDocument } from '@/models/employee/Project/TeamMember';
import { ProjectActivity } from '@/models/employee/Project/ProjectActivity';
import Project from '@/models/employee/Project/Project';
import { 
  ITeamMemberAddRequest,
  IProjectApiResponse, 
  ITeamMember
} from '@/types/employee/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to ITeamMember
function convertToITeamMember(doc: ITeamMemberDocument): ITeamMember {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    projectId: doc.projectId.toString(),
    employeeId: doc.employeeId.toString(),
    employeeName: doc.employeeName,
    employeeEmail: doc.employeeEmail,
    employeeMobile: doc.employeeMobile,
    role: doc.role as any,
    permissions: doc.permissions as any,
    hourlyRate: doc.hourlyRate,
    joinedAt: doc.joinedAt,
    leftAt: doc.leftAt,
    isActive: doc.isActive,
    totalHoursLogged: doc.totalHoursLogged,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Check if user has access to manage team
async function canManageTeam(projectId: string, userId: string): Promise<boolean> {
  const project = await Project.findById(projectId);
  if (!project) return false;

  // Check if user is creator or project manager
  if (project.createdBy.toString() === userId || project.projectManager.toString() === userId) {
    return true;
  }

  // Check if user has manage-team permission
  const teamMember = await TeamMember.findOne({
    projectId,
    employeeId: userId,
    isActive: true
  });

  return teamMember?.hasPermission('manage-team') || false;
}

// GET - List team members
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

    const teamMembers = await TeamMember.findByProject(params.id) as ITeamMemberDocument[];
    const convertedMembers = teamMembers.map(convertToITeamMember);

    return NextResponse.json<IProjectApiResponse<ITeamMember[]>>({
      success: true,
      message: 'Team members retrieved successfully',
      data: convertedMembers
    });

  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve team members',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add team member
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

    // Check if user can manage team
    const canManage = await canManageTeam(params.id, session.user.id);
    if (!canManage) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to manage team'
      }, { status: 403 });
    }

    const body: ITeamMemberAddRequest = await request.json();
    const { employeeId, role, permissions, hourlyRate } = body;

    // Validate required fields
    if (!employeeId || !role || !permissions) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: employeeId, role, permissions'
      }, { status: 400 });
    }

    // Check if employee is already a team member
    const existingMember = await TeamMember.findOne({
      projectId: params.id,
      employeeId,
      isActive: true
    });

    if (existingMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Employee is already a team member'
      }, { status: 400 });
    }

    // TODO: Fetch employee details from User model
    // For now, we'll need these details passed in the request or fetched separately
    const employeeDetails = {
      name: 'Employee Name', // This should be fetched from User model
      email: 'employee@example.com', // This should be fetched from User model
      mobile: '1234567890' // This should be fetched from User model
    };

    const teamMemberData = {
      projectId: params.id,
      employeeId,
      employeeName: employeeDetails.name,
      employeeEmail: employeeDetails.email,
      employeeMobile: employeeDetails.mobile,
      role,
      permissions,
      hourlyRate
    };

    const teamMember = await TeamMember.create(teamMemberData) as ITeamMemberDocument;

    // Create activity log
    await ProjectActivity.create({
      projectId: params.id,
      activityType: 'member-added',
      description: `${employeeDetails.name} was added to the project as ${role}`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'team-member',
      entityId: teamMember._id.toString()
    });

    return NextResponse.json<IProjectApiResponse<ITeamMember>>({
      success: true,
      message: 'Team member added successfully',
      data: convertToITeamMember(teamMember)
    }, { status: 201 });

  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to add team member',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}