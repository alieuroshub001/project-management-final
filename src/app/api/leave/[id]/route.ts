// app/api/leave/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Leave, { ILeaveDocument } from '@/models/Leave';
import { ILeaveApiResponse, ILeave } from '@/types/leave';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to ILeave
function convertToILeave(doc: ILeaveDocument): ILeave {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
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

export async function GET(
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

    return NextResponse.json<ILeaveApiResponse<ILeave>>({
      success: true,
      message: 'Leave retrieved successfully',
      data: convertToILeave(leave)
    });

  } catch (error) {
    console.error('Get leave error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to retrieve leave',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}