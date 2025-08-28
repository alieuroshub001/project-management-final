// app/api/projects/[id]/team/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { TeamMember, ITeamMemberDocument } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import Project from '@/models/Project/Project';
import { 
  ITeamMemberUpdateRequest,
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

// GET - Get team member details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
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
    const memberId = params.memberId;

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

    const teamMember = await TeamMember.findOne({
      _id: memberId,
      projectId: projectId
    }) as ITeamMemberDocument | null;

    if (!teamMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Team member not found'
      }, { status: 404 });
    }

    return NextResponse.json<IProjectApiResponse<ITeamMember>>({
      success: true,
      message: 'Team member retrieved successfully',
      data: convertToITeamMember(teamMember)
    });

  } catch (error) {
    console.error('Get team member error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve team member',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update team member
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
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
    const memberId = params.memberId;

    // Check if user can manage team
    const canManage = await canManageTeam(projectId, session.user.id);
    if (!canManage) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to manage team'
      }, { status: 403 });
    }

    const teamMember = await TeamMember.findOne({
      _id: memberId,
      projectId: projectId
    }) as ITeamMemberDocument | null;

    if (!teamMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Team member not found'
      }, { status: 404 });
    }

    const body: ITeamMemberUpdateRequest = await request.json();
    const { role, permissions, hourlyRate, isActive } = body;

    // Build update object
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      if (!isActive) {
        updateData.leftAt = new Date();
      } else if (isActive && teamMember.leftAt) {
        updateData.leftAt = null;
      }
    }

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      memberId,
      updateData,
      { new: true }
    ) as ITeamMemberDocument | null;

    if (!updatedTeamMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update team member'
      }, { status: 500 });
    }

    // Create activity log
    const activityDescription = isActive === false
      ? `${teamMember.employeeName} was removed from the project`
      : `${teamMember.employeeName}'s role was updated to ${role || teamMember.role}`;

    await ProjectActivity.create({
      projectId: projectId,
      activityType: isActive === false ? 'member-removed' : 'member-added', // You might want to add 'member-updated'
      description: activityDescription,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'team-member',
      entityId: memberId
    });

    return NextResponse.json<IProjectApiResponse<ITeamMember>>({
      success: true,
      message: 'Team member updated successfully',
      data: convertToITeamMember(updatedTeamMember)
    });

  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update team member',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove team member (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
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
    const memberId = params.memberId;

    // Check if user can manage team
    const canManage = await canManageTeam(projectId, session.user.id);
    if (!canManage) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to manage team'
      }, { status: 403 });
    }

    const teamMember = await TeamMember.findOne({
      _id: memberId,
      projectId: projectId
    }) as ITeamMemberDocument | null;

    if (!teamMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Team member not found'
      }, { status: 404 });
    }

    // Prevent removing project creator or manager
    const project = await Project.findById(projectId);
    if (project && (teamMember.employeeId.toString() === project.createdBy.toString() || 
                    teamMember.employeeId.toString() === project.projectManager.toString())) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Cannot remove project creator or project manager'
      }, { status: 400 });
    }

    // Soft delete - mark as inactive
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      memberId,
      { 
        isActive: false,
        leftAt: new Date()
      },
      { new: true }
    ) as ITeamMemberDocument | null;

    if (!updatedTeamMember) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to remove team member'
      }, { status: 500 });
    }

    // Create activity log
    await ProjectActivity.create({
      projectId: projectId,
      activityType: 'member-removed',
      description: `${teamMember.employeeName} was removed from the project`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'team-member',
      entityId: memberId
    });

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Team member removed successfully'
    });

  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to remove team member',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}