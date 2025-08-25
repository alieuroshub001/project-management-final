// app/api/employee/attendance/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { ICheckInRequest, IAttendanceApiResponse, IAttendance } from '@/types/employee/attendance';
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
    const body: ICheckInRequest = await request.json();
    
    const { timestamp, location, deviceInfo } = body;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let attendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: today
    });

    if (!attendance) {
      // Create new attendance record with default shift (morning)
      attendance = await Attendance.create({
        employeeId: session.user.id,
        employeeName: session.user.name,
        employeeEmail: session.user.email,
        employeeMobile: session.user.mobile,
        date: today,
        shift: 'morning',
        scheduledStart: new Date(today.setHours(8, 0, 0, 0)), // 8:00 AM
        scheduledEnd: new Date(today.setHours(16, 0, 0, 0)),  // 4:00 PM
        status: 'present'
      });
    }

    // Check if already checked in today
    const lastCheckIn = attendance.checkIns[attendance.checkIns.length - 1];
    if (lastCheckIn && !attendance.checkOuts.find((co: any) => co.timestamp > lastCheckIn.timestamp)) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'You are already checked in'
      }, { status: 400 });
    }

    // Calculate lateness
    const checkInTime = timestamp ? new Date(timestamp) : now;
    const scheduledStart = attendance.scheduledStart;
    const lateMinutes = Math.max(0, (checkInTime.getTime() - scheduledStart.getTime()) / (1000 * 60) - 15); // 15 min grace period

    // Add check-in record
    attendance.checkIns.push({
      timestamp: checkInTime,
      location,
      isLate: lateMinutes > 0,
      lateMinutes,
      deviceInfo: deviceInfo || 'Web Browser'
    });

    // Update status
    attendance.status = 'present';
    if (lateMinutes > 0) {
      attendance.lateMinutes = lateMinutes;
      attendance.status = 'late';
    }

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to check in',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}