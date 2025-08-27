// app/api/leave/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Leave, { ILeaveDocument } from '@/models/Leave';
import { ILeaveApiResponse, ILeave } from '@/types/leave';
import { convertLeaveDocumentToILeave } from '@/utils/leave';
import { authOptions } from '@/lib/auth';

export async function POST(
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

    // Check if leave can be cancelled
    if (!leave.canCancel()) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Leave cannot be cancelled at this time'
      }, { status: 400 });
    }

    const cancelledLeave = await Leave.findByIdAndUpdate(
      params.id,
      { status: 'cancelled' },
      { new: true }
    ) as ILeaveDocument | null;

    if (!cancelledLeave) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Failed to cancel leave'
      }, { status: 500 });
    }

    return NextResponse.json<ILeaveApiResponse<ILeave>>({
      success: true,
      message: 'Leave cancelled successfully',
      data: convertLeaveDocumentToILeave(cancelledLeave)
    });

  } catch (error) {
    console.error('Cancel leave error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to cancel leave',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}