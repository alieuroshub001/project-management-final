// app/api/attendance/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  IAttendanceApiResponse,
  IAttendanceDashboard,
  ITodaysAttendance,
  IAttendance,
  ShiftType
} from '@/types/attendance';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IAttendance
function convertToIAttendance(doc: IAttendanceDocument): IAttendance {
  const docId = doc._id?.toString() || '';
  return {
    id: docId,
    employeeId: doc.employeeId.toString(),
    employeeName: doc.employeeName,
    employeeEmail: doc.employeeEmail,
    employeeMobile: doc.employeeMobile,
    date: doc.date,
    shift: doc.shift as ShiftType,
    checkInTime: doc.checkInTime,
    checkOutTime: doc.checkOutTime,
    totalWorkingHours: doc.totalWorkingHours,
    status: doc.status as any,
    isLateCheckIn: doc.isLateCheckIn,
    lateCheckInReason: doc.lateCheckInReason,
    isEarlyCheckOut: doc.isEarlyCheckOut,
    earlyCheckOutReason: doc.earlyCheckOutReason,
    breaks: doc.breaks.map(b => ({
      id: b.id,
      attendanceId: docId,
      breakType: b.breakType as any,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      reason: b.reason,
      isActive: b.isActive,
      createdAt: b.createdAt
    })),
    namazBreaks: doc.namazBreaks.map(nb => ({
      id: nb.id,
      attendanceId: docId,
      namazType: nb.namazType as any,
      startTime: nb.startTime,
      endTime: nb.endTime,
      duration: nb.duration,
      isActive: nb.isActive,
      createdAt: nb.createdAt
    })),
    tasksPerformed: doc.tasksPerformed.map(task => ({
      id: task.id,
      attendanceId: docId,
      taskDescription: task.taskDescription,
      timeSpent: task.timeSpent,
      taskCategory: task.taskCategory as any,
      priority: task.priority as any,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    })),
    overtime: doc.overtime ? {
      id: docId + '_overtime',
      attendanceId: docId,
      overtimeHours: doc.overtime.overtimeHours,
      reason: doc.overtime.reason,
      approvedBy: doc.overtime.approvedBy,
      approvedByName: doc.overtime.approvedByName,
      approvedAt: doc.overtime.approvedAt,
      status: doc.overtime.status as any,
      createdAt: doc.overtime.createdAt
    } : undefined,
    location: doc.location,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Helper function to calculate current working hours
function calculateCurrentWorkingHours(attendance: IAttendanceDocument): number {
  if (!attendance.checkInTime) return 0;
  
  const now = new Date();
  const endTime = attendance.checkOutTime || now;
  
  const grossMinutes = Math.round((endTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60));
  const breakTime = attendance.calculateBreakTime();
  const namazBreakTime = attendance.calculateNamazBreakTime();
  
  // Calculate ongoing break time if still working
  let ongoingBreakTime = 0;
  if (!attendance.checkOutTime) {
    ongoingBreakTime = attendance.breaks.filter(b => b.isActive).reduce((total, b) => {
      return total + Math.round((now.getTime() - b.startTime.getTime()) / (1000 * 60));
    }, 0);
    
    ongoingBreakTime += attendance.namazBreaks.filter(nb => nb.isActive).reduce((total, nb) => {
      return total + Math.round((now.getTime() - nb.startTime.getTime()) / (1000 * 60));
    }, 0);
  }
  
  return Math.max(0, grossMinutes - breakTime - namazBreakTime - ongoingBreakTime);
}

// GET - Get attendance dashboard data
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

    const employeeId = session.user.id;

    // Get today's attendance
    const todaysAttendance = await Attendance.findTodaysAttendance(employeeId);
    
    // Calculate current working hours and break times
    let currentWorkingHours = 0;
    let totalBreakTime = 0;
    
    if (todaysAttendance) {
      currentWorkingHours = calculateCurrentWorkingHours(todaysAttendance);
      totalBreakTime = todaysAttendance.calculateBreakTime() + todaysAttendance.calculateNamazBreakTime();
      
      // Add ongoing break time
      if (!todaysAttendance.checkOutTime) {
        const now = new Date();
        totalBreakTime += todaysAttendance.breaks.filter(b => b.isActive).reduce((total, b) => {
          return total + Math.round((now.getTime() - b.startTime.getTime()) / (1000 * 60));
        }, 0);
        
        totalBreakTime += todaysAttendance.namazBreaks.filter(nb => nb.isActive).reduce((total, nb) => {
          return total + Math.round((now.getTime() - nb.startTime.getTime()) / (1000 * 60));
        }, 0);
      }
    }
    
    // Prepare today's attendance data
    const todaysData: ITodaysAttendance = {
      hasCheckedIn: !!todaysAttendance?.checkInTime,
      hasCheckedOut: !!todaysAttendance?.checkOutTime,
      currentStatus: todaysAttendance?.status as any || 'absent',
      attendance: todaysAttendance ? convertToIAttendance(todaysAttendance) : undefined,
      activeBreaks: todaysAttendance?.breaks.filter(b => b.isActive).map(b => ({
        id: b.id,
        attendanceId: todaysAttendance._id?.toString() || '',
        breakType: b.breakType as any,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        reason: b.reason,
        isActive: b.isActive,
        createdAt: b.createdAt
      })) || [],
      activeNamazBreaks: todaysAttendance?.namazBreaks.filter(nb => nb.isActive).map(nb => ({
        id: nb.id,
        attendanceId: todaysAttendance._id?.toString() || '',
        namazType: nb.namazType as any,
        startTime: nb.startTime,
        endTime: nb.endTime,
        duration: nb.duration,
        isActive: nb.isActive,
        createdAt: nb.createdAt
      })) || [],
      totalWorkingHours: currentWorkingHours,
      totalBreakTime: totalBreakTime,
      remainingWorkingHours: Math.max(0, 480 - currentWorkingHours) // 8 hours = 480 minutes
    };

    // Get weekly stats
    const weeklyStats = await Attendance.getWeeklyStats(employeeId);

    // Get monthly stats
    const now = new Date();
    const monthlyStats = await Attendance.getMonthlyStats(employeeId, now.getMonth() + 1, now.getFullYear());

    // Get recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAttendanceRecords = await Attendance.findByEmployee(
      employeeId, 
      sevenDaysAgo, 
      new Date()
    ) as IAttendanceDocument[];

    const recentAttendance = recentAttendanceRecords
      .slice(0, 7)
      .map(convertToIAttendance);

    // Generate upcoming shifts (mock data - you might want to implement a shift scheduling system)
    const upcomingShifts = [];
    for (let i = 1; i <= 5; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      // Skip weekends
      if (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
        continue;
      }
      
      // This should come from a shift scheduling system
      upcomingShifts.push({
        date: futureDate,
        shift: 'morning' as ShiftType,
        startTime: '08:00',
        endTime: '16:00'
      });
    }

    const dashboardData: IAttendanceDashboard = {
      todaysAttendance: todaysData,
      weeklyStats: {
        totalWorkingDays: weeklyStats.totalWorkingDays,
        presentDays: weeklyStats.presentDays,
        totalWorkingHours: weeklyStats.totalWorkingHours,
        averageWorkingHours: weeklyStats.averageWorkingHours,
        lateCheckIns: weeklyStats.lateCheckIns
      },
      monthlyStats: {
        totalWorkingDays: monthlyStats.totalWorkingDays,
        presentDays: monthlyStats.presentDays,
        totalWorkingHours: monthlyStats.totalWorkingHours,
        attendancePercentage: monthlyStats.attendancePercentage,
        totalOvertimeHours: monthlyStats.records.reduce((sum: number, record: IAttendanceDocument) => {
          return sum + (record.overtime?.overtimeHours || 0);
        }, 0)
      },
      recentAttendance,
      upcomingShifts
    };

    return NextResponse.json<IAttendanceApiResponse<IAttendanceDashboard>>({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Generate attendance report
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
    const { 
      startDate, 
      endDate, 
      employeeId = session.user.id,
      includeBreakdown = true 
    } = body;

    // Validate date range
    if (!startDate || !endDate) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Start date and end date are required'
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Start date must be before end date'
      }, { status: 400 });
    }

    // Get attendance records for the period
    const attendanceRecords = await Attendance.findByEmployee(
      employeeId,
      start,
      end
    ) as IAttendanceDocument[];

    // Calculate summary statistics
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'partial').length;
    const absentDays = totalDays - attendanceRecords.length;
    const lateCheckIns = attendanceRecords.filter(r => r.isLateCheckIn).length;
    const earlyCheckOuts = attendanceRecords.filter(r => r.isEarlyCheckOut).length;
    
    // Use proper working hours calculation
    const totalWorkingHours = attendanceRecords.reduce((sum, r) => {
      return sum + calculateCurrentWorkingHours(r);
    }, 0);
    
    const totalBreakTime = attendanceRecords.reduce((sum, r) => {
      return sum + r.calculateBreakTime() + r.calculateNamazBreakTime();
    }, 0);
    
    const totalOvertimeHours = attendanceRecords.reduce((sum, r) => {
      return sum + (r.overtime?.overtimeHours || 0);
    }, 0);

    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate average times
    const checkInTimes = attendanceRecords.filter(r => r.checkInTime).map(r => r.checkInTime!);
    const checkOutTimes = attendanceRecords.filter(r => r.checkOutTime).map(r => r.checkOutTime!);

    const averageCheckInTime = checkInTimes.length > 0 
      ? new Date(checkInTimes.reduce((sum, time) => sum + time.getTime(), 0) / checkInTimes.length)
        .toTimeString().slice(0, 5)
      : 'N/A';

    const averageCheckOutTime = checkOutTimes.length > 0
      ? new Date(checkOutTimes.reduce((sum, time) => sum + time.getTime(), 0) / checkOutTimes.length)
        .toTimeString().slice(0, 5)
      : 'N/A';

    const report = {
      employeeId: session.user.id,
      employeeName: session.user.name,
      department: 'N/A', // This should come from user profile
      startDate: start,
      endDate: end,
      totalDays,
      presentDays,
      absentDays,
      lateCheckIns,
      earlyCheckOuts,
      totalWorkingHours,
      totalBreakTime,
      totalOvertimeHours,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      averageCheckInTime,
      averageCheckOutTime,
      attendanceRecords: includeBreakdown ? attendanceRecords.map(convertToIAttendance) : []
    };

    return NextResponse.json<IAttendanceApiResponse<typeof report>>({
      success: true,
      message: 'Attendance report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to generate attendance report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}