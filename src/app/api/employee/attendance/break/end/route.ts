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
    
    const { breakId } = body;

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
        message: 'Already checked out, cannot end break'
      }, { status: 400 });
    }

    // End break
    attendance.endBreak(breakId);
    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Break ended successfully'
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