// app/api/employee/attendance/break/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { IBreakStartRequest, IAttendanceApiResponse } from '@/types/employee/attendance';
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
    const body: IBreakStartRequest = await request.json();
    
    const { breakType, reason, namazType } = body;

    // Get today's attendance
    const attendance = await Attendance.getTodayAttendance(session.user.id);
    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No check-in found for today'
      }, { status: 400 });
    }

    if (attendance.checkOut) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Already checked out, cannot start break'
      }, { status: 400 });
    }

    // Start break
    const breakId = attendance.startBreak(breakType, namazType);
    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse<{ breakId: string }>>({
      success: true,
      message: 'Break started successfully',
      data: { breakId }
    });

  } catch (error) {
    console.error('Start break error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to start break',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}