// app/api/employee/attendance/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { ICheckOutRequest, IAttendanceApiResponse, IAttendance } from '@/types/employee/attendance';
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
    const body: ICheckOutRequest = await request.json();
    
    const { location, tasks } = body;

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
        message: 'Already checked out today'
      }, { status: 400 });
    }

    // Update attendance with check-out details
    attendance.checkOut = new Date();
    attendance.checkOutLocation = location;
    
    // Add tasks if provided
    if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        attendance.addTask(task);
      });
    }

    // Recalculate hours
    attendance.calculateHours();

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to check out',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}