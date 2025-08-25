// app/api/employee/attendance/break/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { IBreakEndRequest, IAttendanceApiResponse } from '@/types/employee/attendance';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    const body: IBreakEndRequest = await request.json();
    
    const { breakId, end } = body;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: today
    });

    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No attendance record found for today.'
      }, { status: 404 });
    }

    // Find the break
    const breakRecord = attendance.breaks.id(breakId);
    if (!breakRecord) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Break not found'
      }, { status: 404 });
    }

    if (breakRecord.end) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Break already ended'
      }, { status: 400 });
    }

    // End the break
    breakRecord.end = end ? new Date(end) : now;

    // Update status back to present
    attendance.status = 'present';

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Break ended successfully',
      data: attendance
    });

  } catch (error) {
    console.error('End break error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to end break',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}