// app/api/employee/attendance/check-out/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { ICheckOutRequest, IAttendanceApiResponse } from '@/types/employee/attendance';
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
    
    const { timestamp, location, tasks, deviceInfo } = body;
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

    // Check if already checked out
    const lastCheckOut = attendance.checkOuts[attendance.checkOuts.length - 1];
    const lastCheckIn = attendance.checkIns[attendance.checkIns.length - 1];
    
    if (lastCheckOut && lastCheckOut.timestamp > lastCheckIn.timestamp) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'You are already checked out'
      }, { status: 400 });
    }

    // Validate tasks completion
    const hasPendingTasks = tasks.some((task: any) => !task.completed);
    if (hasPendingTasks) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Please complete all tasks before checking out'
      }, { status: 400 });
    }

    // Calculate early departure
    const checkOutTime = timestamp ? new Date(timestamp) : now;
    const scheduledEnd = attendance.scheduledEnd;
    const earlyMinutes = Math.max(0, (scheduledEnd.getTime() - checkOutTime.getTime()) / (1000 * 60));

    // Add check-out record
    attendance.checkOuts.push({
      timestamp: checkOutTime,
      location,
      isEarly: earlyMinutes > 0,
      earlyMinutes,
      tasksCompleted: true,
      deviceInfo: deviceInfo || 'Web Browser'
    });

    // Update tasks
    tasks.forEach((taskData: any) => {
      const task = attendance.tasks.id(taskData.taskId);
      if (task) {
        task.timeSpent = taskData.timeSpent;
        task.completed = taskData.completed;
        task.updatedAt = new Date();
      }
    });

    // Update status for early departure
    if (earlyMinutes > 0) {
      attendance.earlyDepartureMinutes = earlyMinutes;
      attendance.status = 'early-departure';
    }

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
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