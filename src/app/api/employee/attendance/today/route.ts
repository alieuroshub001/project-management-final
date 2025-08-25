// app/api/employee/attendance/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/employee/Attendance';
import { IAttendanceApiResponse, IAttendance } from '@/types/employee/attendance';
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

    // Get today's attendance
    const attendance = await Attendance.getTodayAttendance(session.user.id);

    return NextResponse.json<IAttendanceApiResponse<IAttendance | null>>({
      success: true,
      message: 'Today\'s attendance retrieved successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve today\'s attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}