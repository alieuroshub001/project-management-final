// app/api/projects/[id]/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { TeamMember, ITeamMemberDocument } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import Project from '@/models/Project/Project';
import { 
  ITeamMemberAddRequest,
  IProjectApiResponse, 
  ITeamMember
} from '@/types/projectmanagement';
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

    // Await the params promise
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    await connectToDatabase();

    // Check if user has access to view project
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    const hasAccess = project.createdBy.toString() === session.user.id ||
                     project.projectManager.toString() === session.user.id ||
                     await TeamMember.findOne({
                       projectId: projectId,
                       employeeId: session.user.id,
                       isActive: true
                     });

    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    const teamMembers = await TeamMember.findByProject(projectId) as ITeamMemberDocument[];
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

    // Await the params promise
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    await connectToDatabase();

    // Check if user can manage team
    const canManage = await canManageTeam(projectId, session.user.id);
    if (!canManage) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to manage team'
      }, { status: 403 });
    }

    const body: ITeamMemberAddRequest & { 
      employeeName?: string; 
      employeeEmail?: string; 
      employeeMobile?: string; 
    } = await request.json();
    
    const { employeeId, role, permissions, hourlyRate, employeeName, employeeEmail, employeeMobile } = body;

    // Validate required fields
    if (!employeeId || !role || !permissions) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: employeeId, role, permissions'
      }, { status: 400 });
    }

    // Validate permissions array
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'At least one permission is required'
      }, { status: 400 });
    }

    // Check if employee is already a team member
    const existingMember = await TeamMember.findOne({
      projectId: projectId,
      employeeId,
      isActive: true
    });

    if (existingMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Employee is already a team member'
      }, { status: 400 });
    }

    let employeeDetails = {
      name: employeeName || 'Unknown Employee',
      email: employeeEmail || '',
      mobile: employeeMobile || ''
    };

    // If employee details weren't provided, fetch from User model
    if (!employeeName || !employeeEmail) {
      try {
        const employee = await User.findById(employeeId).select('name email mobile');
        
        if (!employee) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Employee not found'
          }, { status: 404 });
        }

        if (!employee.emailVerified) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Employee email is not verified'
          }, { status: 400 });
        }

        employeeDetails = {
          name: employee.name || 'Unknown Employee',
          email: employee.email || '',
          mobile: employee.mobile || ''
        };
      } catch (userError) {
        console.error('Error fetching employee details:', userError);
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Failed to fetch employee details'
        }, { status: 500 });
      }
    }

    const teamMemberData = {
      projectId: projectId,
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
      projectId: projectId,
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