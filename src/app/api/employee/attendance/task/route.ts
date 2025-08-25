// app/api/employee/attendance/task/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { ITaskAddRequest, IAttendanceApiResponse, IAttendance } from '@/types/employee/attendance';
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
    const body: ITaskAddRequest = await request.json();
    
    const { description, startTime, endTime, timeSpent } = body;

    // Get today's attendance
    const attendance = await Attendance.getTodayAttendance(session.user.id);
    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No check-in found for today'
      }, { status: 400 });
    }

    // Add task
    attendance.addTask({
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        timeSpent,
        status: 'pending'
    });

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
      success: true,
      message: 'Task added successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Add task error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to add task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}