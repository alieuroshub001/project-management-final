// app/api/employee/leave/[id]/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Leave, { ILeaveDocument } from '@/models/Leave';
import { ILeaveUpdateRequest, ILeaveApiResponse, ILeave } from '@/types/leave';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to ILeave
function convertToILeave(doc: ILeaveDocument): ILeave {
  return {
    id: (typeof doc._id === 'string' ? doc._id : (doc._id as { toString: () => string }).toString()),
    employeeId: doc.employeeId.toString(),
    employeeName: doc.employeeName,
    employeeEmail: doc.employeeEmail,
    employeeMobile: doc.employeeMobile,
    leaveType: doc.leaveType as any,
    startDate: doc.startDate,
    endDate: doc.endDate,
    totalDays: doc.totalDays,
    reason: doc.reason,
    status: doc.status as any,
    reviewedBy: doc.reviewedBy?.toString(),
    reviewedByName: doc.reviewedByName,
    reviewedAt: doc.reviewedAt,
    reviewComments: doc.reviewComments,
    emergencyContact: doc.emergencyContact,
    handoverNotes: doc.handoverNotes,
    attachments: doc.attachments,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    
    const body: ILeaveUpdateRequest = await request.json();
    const { leaveType, startDate, endDate, reason, emergencyContact, handoverNotes, cloudinaryAttachments, filesToDelete } = body;

    // Find the leave
    const leave = await Leave.findOne({
      _id: params.id,
      employeeId: session.user.id
    }) as ILeaveDocument | null;

    if (!leave) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Leave not found'
      }, { status: 404 });
    }

    // Check if leave can be updated
    if (leave.status !== 'pending') {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Only pending leaves can be updated'
      }, { status: 400 });
    }

    // Update fields
    const updateData: any = {};
    if (leaveType) updateData.leaveType = leaveType;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (reason) updateData.reason = reason;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (handoverNotes !== undefined) updateData.handoverNotes = handoverNotes;

    // Handle attachments
    if (cloudinaryAttachments) {
      updateData.attachments = [...(leave.attachments || []), ...cloudinaryAttachments];
    }

    // Handle file deletion
    if (filesToDelete && filesToDelete.length > 0) {
      updateData.attachments = (leave.attachments || []).filter(
        (file: any) => !filesToDelete.includes(file.public_id)
      );
    }

    // Recalculate total days if dates changed
    if (startDate || endDate) {
      const start = updateData.startDate || leave.startDate;
      const end = updateData.endDate || leave.endDate;
      updateData.totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ) as ILeaveDocument | null;

    if (!updatedLeave) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Failed to update leave'
      }, { status: 500 });
    }

    return NextResponse.json<ILeaveApiResponse<ILeave>>({
      success: true,
      message: 'Leave updated successfully',
      data: convertToILeave(updatedLeave)
    });

  } catch (error) {
    console.error('Update leave error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to update leave',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}