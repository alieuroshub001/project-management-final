// app/api/attendance/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { IAttendanceApiResponse } from '@/types/attendance';
import { authOptions } from '@/lib/auth';

interface AttendanceStatsData {
  todayStats: {
    checkInTime?: string;
    workingHours: number;
    breakTime: number;
    status: string;
  };
  weekStats: {
    presentDays: number;
    totalDays: number;
    totalHours: number;
    averageHours: number;
    punctualityScore: number;
  };
  monthStats: {
    presentDays: number;
    totalDays: number;
    totalHours: number;
    attendanceRate: number;
    performanceScore: number;
  };
  yearStats: {
    totalWorkingDays: number;
    presentDays: number;
    totalHours: number;
    overtimeHours: number;
    averageMonthlyHours: number;
  };
}

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
    const timeframe = searchParams.get('timeframe') || 'month';
    const employeeId = session.user.id;

    // Get today's stats
    const todaysAttendance = await Attendance.findTodaysAttendance(employeeId);
    const todayStats = {
      checkInTime: todaysAttendance?.checkInTime?.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      workingHours: todaysAttendance?.checkInTime && !todaysAttendance?.checkOutTime 
        ? Math.round((new Date().getTime() - todaysAttendance.checkInTime.getTime()) / (1000 * 60))
        : todaysAttendance?.totalWorkingHours || 0,
      breakTime: (todaysAttendance?.calculateBreakTime() || 0) + (todaysAttendance?.calculateNamazBreakTime() || 0),
      status: todaysAttendance?.status || 'absent'
    };

    // Get weekly stats
    const weeklyStats = await Attendance.getWeeklyStats(employeeId);
    const weekStats = {
      presentDays: weeklyStats.presentDays,
      totalDays: Math.max(weeklyStats.totalWorkingDays, new Date().getDay() + 1), // Including today
      totalHours: weeklyStats.totalWorkingHours,
      averageHours: weeklyStats.averageWorkingHours,
      punctualityScore: Math.round(((weeklyStats.presentDays - weeklyStats.lateCheckIns) / Math.max(weeklyStats.presentDays, 1)) * 100)
    };

    // Get monthly stats
    const now = new Date();
    const monthlyStats = await Attendance.getMonthlyStats(employeeId, now.getMonth() + 1, now.getFullYear());
    const monthStats = {
      presentDays: monthlyStats.presentDays,
      totalDays: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), // Days in current month
      totalHours: monthlyStats.totalWorkingHours,
      attendanceRate: monthlyStats.attendancePercentage,
      performanceScore: Math.round(monthlyStats.attendancePercentage * 0.7 + (weekStats.punctualityScore * 0.3)) // Weighted score
    };

    // Get yearly stats
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const yearlyRecords = await Attendance.findByEmployee(employeeId, yearStart, yearEnd) as IAttendanceDocument[];
    
    const yearStats = {
      totalWorkingDays: 252, // Approximate working days in a year (365 - weekends - holidays)
      presentDays: yearlyRecords.filter(r => r.status === 'present').length,
      totalHours: yearlyRecords.reduce((sum, r) => sum + r.totalWorkingHours, 0),
      overtimeHours: yearlyRecords.reduce((sum, r) => sum + (r.overtime?.overtimeHours || 0), 0),
      averageMonthlyHours: yearlyRecords.length > 0 ? 
        yearlyRecords.reduce((sum, r) => sum + r.totalWorkingHours, 0) / 12 : 0
    };

    const statsData: AttendanceStatsData = {
      todayStats,
      weekStats,
      monthStats,
      yearStats
    };

    return NextResponse.json<IAttendanceApiResponse<AttendanceStatsData>>({
      success: true,
      message: 'Attendance stats retrieved successfully',
      data: statsData
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve attendance stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}