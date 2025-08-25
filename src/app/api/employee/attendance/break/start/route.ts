// app/api/employee/attendance/break/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { IBreakRequest, IAttendanceApiResponse } from '@/types/employee/attendance';
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
    const body: IBreakRequest = await request.json();
    
    const { type, start } = body;
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
        message: 'No attendance record found for today. Please check in first.'
      }, { status: 404 });
    }

    // Check if already on break
    const currentBreak = attendance.breaks.find((b: any) => !b.end);
    if (currentBreak) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'You are already on a break. Please end your current break first.'
      }, { status: 400 });
    }

    // Add break record
    attendance.breaks.push({
      type,
      start: start ? new Date(start) : now,
      isPaid: type === 'prayer' // Example: prayer breaks are paid
    });

    // Update status
    attendance.status = 'on-break';

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Break started successfully',
      data: attendance
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