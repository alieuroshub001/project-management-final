// app/api/employee/attendance/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { IAttendanceApiResponse } from '@/types/employee/attendance';
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
    const body = await request.json();
    
    const { description, timeAllocated, priority } = body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    let attendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: today
    });

    if (!attendance) {
      // Create new attendance record if none exists
      attendance = await Attendance.create({
        employeeId: session.user.id,
        employeeName: session.user.name,
        employeeEmail: session.user.email,
        employeeMobile: session.user.mobile,
        date: today,
        shift: 'morning',
        scheduledStart: new Date(today.setHours(8, 0, 0, 0)),
        scheduledEnd: new Date(today.setHours(16, 0, 0, 0)),
        status: 'absent'
      });
    }

    // Add task
    attendance.tasks.push({
      description,
      timeAllocated,
      priority: priority || 'medium',
      timeSpent: 0,
      completed: false
    });

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    
    const { taskId, timeSpent, completed } = body;
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
        message: 'No attendance record found for today'
      }, { status: 404 });
    }

    // Find and update the task
    const task = attendance.tasks.id(taskId);
    if (!task) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Task not found'
      }, { status: 404 });
    }

    if (timeSpent !== undefined) {
      task.timeSpent = timeSpent;
    }
    
    if (completed !== undefined) {
      task.completed = completed;
      task.completedAt = completed ? new Date() : undefined;
    }

    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Task updated successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to update task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Task ID is required'
      }, { status: 400 });
    }

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
        message: 'No attendance record found for today'
      }, { status: 404 });
    }

    // Remove the task
    attendance.tasks.pull({ _id: taskId });
    await attendance.save();

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Task deleted successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}