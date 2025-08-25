// app/api/employee/attendance/summary/route.ts
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
    
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days

    const summary = await Attendance.getAttendanceSummary(
      session.user.id,
      startDate,
      endDate
    );

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Attendance summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Get attendance summary error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve attendance summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}