// app/api/employee/attendance/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { ICheckInRequest, IAttendanceApiResponse, IAttendance } from '@/types/employee/attendance';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

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
    
    const { shiftId, location, reason } = body;

    // Validate required fields
    if (!shiftId) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Shift ID is required'
      }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if already checked in today
    const existingAttendance = await Attendance.getTodayAttendance(session.user.id);
    if (existingAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Already checked in today'
      }, { status: 400 });
    }

    // Get shift details (in a real app, you'd fetch from Shift model)
    // For now, using default shift
    const shift = {
      id: shiftId,
      name: shiftId === 'morning' ? 'Morning Shift' : shiftId === 'evening' ? 'Evening Shift' : 'Night Shift',
      startTime: shiftId === 'morning' ? '08:00' : shiftId === 'evening' ? '16:00' : '00:00',
      endTime: shiftId === 'morning' ? '16:00' : shiftId === 'evening' ? '00:00' : '08:00'
    };

    // Determine check-in status
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    let checkInStatus: 'on-time' | 'late' | 'early' = 'on-time';

    if (currentTime > shift.startTime) {
      checkInStatus = 'late';
    } else if (currentTime < shift.startTime) {
      checkInStatus = 'early';
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId: new Types.ObjectId(session.user.id),
      employeeName: session.user.name,
      employeeEmail: session.user.email,
      employeeMobile: session.user.mobile,
      date: today,
      shiftId: new Types.ObjectId(shiftId),
      shiftName: shift.name,
      shiftStartTime: shift.startTime,
      shiftEndTime: shift.endTime,
      checkIn: now,
      checkInLocation: location,
      checkInReason: reason,
      checkInStatus,
      status: 'present',
      totalHours: 0,
      actualWorkHours: 0,
      overtimeHours: 0,
      breaks: [],
      namazBreaks: [],
      tasks: []
    });

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
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