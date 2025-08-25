// app/api/employee/attendance/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { IAttendanceApiResponse } from '@/types/employee/attendance';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: today
    });

    if (!attendance) {
      // Return empty record with today's date
      const emptyAttendance = {
        employeeId: session.user.id,
        employeeName: session.user.name,
        employeeEmail: session.user.email,
        employeeMobile: session.user.mobile,
        date: today,
        shift: 'morning',
        scheduledStart: new Date(today.setHours(8, 0, 0, 0)),
        scheduledEnd: new Date(today.setHours(16, 0, 0, 0)),
        checkIns: [],
        checkOuts: [],
        breaks: [],
        tasks: [],
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        breakHours: 0,
        status: 'absent',
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return NextResponse.json<IAttendanceApiResponse>({
        success: true,
        message: 'No attendance record for today',
        data: emptyAttendance
      });
    }

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Today\'s attendance retrieved successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Get today\'s attendance error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve today\'s attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}