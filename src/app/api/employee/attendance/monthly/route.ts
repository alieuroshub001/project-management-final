// app/api/employee/attendance/monthly/route.ts
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

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Get monthly attendance
    const attendanceRecords = await Attendance.getMonthlyAttendance(session.user.id, year, month);

    return NextResponse.json<IAttendanceApiResponse<IAttendance[]>>({
      success: true,
      message: 'Monthly attendance retrieved successfully',
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Get monthly attendance error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve monthly attendance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}