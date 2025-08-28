// app/api/projects/[id]/time-entries/[entryId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { TimeEntry, ITimeEntryDocument } from '@/models/Project/TimeEntry';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import Project from '@/models/Project/Project';
import { 
  ITimeEntryUpdateRequest,
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

// GET - Get single time entry
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
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
    const entryId = params.entryId;

    // Check project access
    const hasAccess = await hasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const timeEntry = await TimeEntry.findOne({ 
      _id: entryId, 
      projectId: projectId 
    }) as ITimeEntryDocument | null;

    if (!timeEntry) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Time entry not found'
      }, { status: 404 });
    }

    return NextResponse.json<IProjectApiResponse<ITimeEntry>>({
      success: true,
      message: 'Time entry retrieved successfully',
      data: convertToITimeEntry(timeEntry)
    });

  } catch (error) {
    console.error('Get time entry error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update time entry
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
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
    const entryId = params.entryId;

    // Check project access
    const hasAccess = await hasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const timeEntry = await TimeEntry.findOne({ 
      _id: entryId, 
      projectId: projectId 
    }) as ITimeEntryDocument | null;

    if (!timeEntry) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Time entry not found'
      }, { status: 404 });
    }

    // Check permissions - user should be able to edit if they're the owner or have approval rights
    const project = await Project.findById(projectId);
    const canEdit = timeEntry.employeeId.toString() === session.user.id ||
                   (project && (project.createdBy.toString() === session.user.id || 
                               project.projectManager.toString() === session.user.id));

    if (!canEdit) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to edit this time entry'
      }, { status: 403 });
    }

    // Don't allow editing approved entries unless user is PM/creator
    if (timeEntry.status === 'approved' && timeEntry.employeeId.toString() === session.user.id) {
      if (!project || (project.createdBy.toString() !== session.user.id && 
                      project.projectManager.toString() !== session.user.id)) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Cannot edit approved time entries'
        }, { status: 403 });
      }
    }

    const body: ITimeEntryUpdateRequest = await request.json();
    const {
      description,
      startTime,
      endTime,
      duration,
      isBillable,
      status
    } = body;

    // Build update object
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (isBillable !== undefined) updateData.isBillable = isBillable;
    if (status !== undefined) {
      // Only PM/creator can approve/reject
      if ((status === 'approved' || status === 'rejected') && 
          project && (project.createdBy.toString() === session.user.id || 
                     project.projectManager.toString() === session.user.id)) {
        updateData.status = status;
        updateData.approvedBy = session.user.id;
        updateData.approvedByName = session.user.name;
        updateData.approvedAt = new Date();
      } else if (status === 'submitted' && timeEntry.employeeId.toString() === session.user.id) {
        updateData.status = status;
      } else if (status === 'draft') {
        updateData.status = status;
        updateData.approvedBy = null;
        updateData.approvedByName = null;
        updateData.approvedAt = null;
      }
    }

    // Recalculate duration if times are updated
    if ((updateData.startTime || updateData.endTime !== undefined) && duration === undefined) {
      const start = updateData.startTime || timeEntry.startTime;
      const end = updateData.endTime || timeEntry.endTime;
      
      if (start && end) {
        updateData.duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes
      }
    } else if (duration !== undefined) {
      updateData.duration = duration;
    }

    // Check for overlapping time entries if times are being updated
    if (updateData.startTime || updateData.endTime !== undefined) {
      const start = updateData.startTime || timeEntry.startTime;
      const end = updateData.endTime || timeEntry.endTime;
      
      if (start && end) {
        const overlappingEntry = await TimeEntry.findOne({
          _id: { $ne: entryId },
          employeeId: timeEntry.employeeId,
          $or: [
            {
              startTime: { $lte: start },
              endTime: { $gte: start }
            },
            {
              startTime: { $lte: end },
              endTime: { $gte: end }
            }
          ]
        });

        if (overlappingEntry) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Time entry overlaps with existing entry'
          }, { status: 400 });
        }
      }
    }

    const updatedTimeEntry = await TimeEntry.findByIdAndUpdate(
      entryId,
      updateData,
      { new: true }
    ) as ITimeEntryDocument | null;

    if (!updatedTimeEntry) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update time entry'
      }, { status: 500 });
    }

    // Update team member's total hours if duration changed
    if (updateData.duration !== undefined) {
      const teamMember = await TeamMember.findOne({
        projectId: projectId,
        employeeId: timeEntry.employeeId
      });
      
      if (teamMember) {
        const hoursDiff = (updateData.duration - timeEntry.duration) / 60;
        teamMember.totalHoursLogged = (teamMember.totalHoursLogged || 0) + hoursDiff;
        await teamMember.save();
      }
    }

    // Create activity log for status changes
    if (updateData.status && updateData.status !== timeEntry.status) {
      let activityDescription = '';
      switch (updateData.status) {
        case 'approved':
          activityDescription = `Time entry was approved`;
          break;
        case 'rejected':
          activityDescription = `Time entry was rejected`;
          break;
        case 'submitted':
          activityDescription = `Time entry was submitted for approval`;
          break;
        default:
          activityDescription = `Time entry status updated to ${updateData.status}`;
      }

      await ProjectActivity.create({
        projectId: projectId,
        activityType: 'time-logged',
        description: activityDescription,
        performedBy: session.user.id,
        performedByName: session.user.name,
        entityType: 'time-entry',
        entityId: entryId
      });
    }

    return NextResponse.json<IProjectApiResponse<ITimeEntry>>({
      success: true,
      message: 'Time entry updated successfully',
      data: convertToITimeEntry(updatedTimeEntry)
    });

  } catch (error) {
    console.error('Update time entry error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete time entry
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
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
    const entryId = params.entryId;

    // Check project access
    const hasAccess = await hasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Project not found or access denied'
      }, { status: 404 });
    }

    const timeEntry = await TimeEntry.findOne({ 
      _id: entryId, 
      projectId: projectId 
    }) as ITimeEntryDocument | null;

    if (!timeEntry) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Time entry not found'
      }, { status: 404 });
    }

    // Check permissions - only owner or PM/creator can delete
    const project = await Project.findById(projectId);
    const canDelete = timeEntry.employeeId.toString() === session.user.id ||
                     (project && (project.createdBy.toString() === session.user.id || 
                                 project.projectManager.toString() === session.user.id));

    if (!canDelete) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to delete this time entry'
      }, { status: 403 });
    }

    // Don't allow deleting approved entries unless user is PM/creator
    if (timeEntry.status === 'approved' && timeEntry.employeeId.toString() === session.user.id) {
      if (!project || (project.createdBy.toString() !== session.user.id && 
                      project.projectManager.toString() !== session.user.id)) {
        return NextResponse.json<IProjectApiResponse>({
          success: false,
          message: 'Cannot delete approved time entries'
        }, { status: 403 });
      }
    }

    // Update team member's total hours
    const teamMember = await TeamMember.findOne({
      projectId: projectId,
      employeeId: timeEntry.employeeId
    });
    
    if (teamMember) {
      teamMember.totalHoursLogged = Math.max(0, (teamMember.totalHoursLogged || 0) - (timeEntry.duration / 60));
      await teamMember.save();
    }

    // Delete the time entry
    await TimeEntry.findByIdAndDelete(entryId);

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Time entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete time entry error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to delete time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}