// app/api/attendance/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  ICheckInRequest,
  IAttendanceApiResponse,
  IAttendance,
  ShiftType
} from '@/types/attendance';
import { authOptions } from '@/lib/auth';

// Helper function to get shift timings
function getShiftTimings(shift: ShiftType, customStartTime?: Date, customEndTime?: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (shift) {
    case 'morning':
      return {
        startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM
      };
    case 'evening':
      return {
        startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM
        endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000), // 12:00 AM (next day)
      };
    case 'night':
      return {
        startTime: new Date(today.getTime()), // 12:00 AM
        endTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
      };
    case 'random':
      return {
        startTime: customStartTime || new Date(),
        endTime: customEndTime || new Date(Date.now() + 8 * 60 * 60 * 1000), // Default 8 hours
      };
    default:
      throw new Error('Invalid shift type');
  }
}

// Helper function to check if check-in is late
function isLateCheckIn(actualCheckIn: Date, shiftStart: Date, graceMinutes: number = 15): boolean {
  const graceTime = new Date(shiftStart.getTime() + graceMinutes * 60 * 1000);
  return actualCheckIn > graceTime;
}

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

// POST - Check in
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

    const body: ICheckInRequest & { lateCheckInReason?: string } = await request.json();
    const { shift, location, customStartTime, customEndTime, lateCheckInReason } = body;

    // Validate required fields
    if (!shift) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Shift type is required'
      }, { status: 400 });
    }

    // Validate random shift requirements
    if (shift === 'random' && (!customStartTime || !customEndTime)) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Custom start and end times are required for random shift'
      }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findTodaysAttendance(session.user.id);
    if (existingAttendance?.checkInTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Already checked in today'
      }, { status: 400 });
    }

    const checkInTime = new Date();
    const shiftTimings = getShiftTimings(shift, 
      customStartTime ? new Date(customStartTime) : undefined,
      customEndTime ? new Date(customEndTime) : undefined
    );

    // Check if check-in is late
    const isLate = isLateCheckIn(checkInTime, shiftTimings.startTime);
    
    // If late and no reason provided, require reason
    if (isLate && !lateCheckInReason) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Late check-in reason is required when checking in more than 15 minutes after shift start'
      }, { status: 400 });
    }

    let attendance: IAttendanceDocument;

    if (existingAttendance) {
      // Update existing record with check-in
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        {
          checkInTime,
          status: 'partial', // Will be updated to 'present' when checked out
          isLateCheckIn: isLate,
          lateCheckInReason: isLate ? lateCheckInReason : undefined,
          'location.checkInLocation': location
        },
        { new: true }
      ) as IAttendanceDocument;
    } else {
      // Create new attendance record
      const attendanceData = {
        employeeId: session.user.id,
        employeeName: session.user.name,
        employeeEmail: session.user.email,
        employeeMobile: session.user.mobile || '',
        date: today,
        shift,
        checkInTime,
        status: 'partial',
        isLateCheckIn: isLate,
        lateCheckInReason: isLate ? lateCheckInReason : undefined,
        isEarlyCheckOut: false,
        totalWorkingHours: 0,
        breaks: [],
        namazBreaks: [],
        tasksPerformed: [],
        location: {
          checkInLocation: location
        }
      };

      attendance = await Attendance.create(attendanceData) as IAttendanceDocument;
    }

    return NextResponse.json<IAttendanceApiResponse<{
      attendance: IAttendance;
      message: string;
      shiftTimings: {
        startTime: Date;
        endTime: Date;
      };
    }>>({
      success: true,
      message: isLate 
        ? `Checked in successfully (Late by ${Math.round((checkInTime.getTime() - shiftTimings.startTime.getTime()) / (1000 * 60))} minutes)`
        : 'Checked in successfully',
      data: {
        attendance: convertToIAttendance(attendance),
        message: isLate 
          ? 'You have checked in late. Please ensure to arrive on time in the future.'
          : 'Welcome! Your shift has started.',
        shiftTimings
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to check in',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get today's check-in status
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

    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);

    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse<{
        hasCheckedIn: boolean;
        canCheckIn: boolean;
        message: string;
      }>>({
        success: true,
        message: 'No attendance record for today',
        data: {
          hasCheckedIn: false,
          canCheckIn: true,
          message: 'Ready to check in'
        }
      });
    }

    const hasCheckedIn = !!todaysAttendance.checkInTime;
    const hasCheckedOut = !!todaysAttendance.checkOutTime;
    const isOnBreak = todaysAttendance.isCurrentlyOnBreak();

    return NextResponse.json<IAttendanceApiResponse<{
      hasCheckedIn: boolean;
      hasCheckedOut: boolean;
      isOnBreak: boolean;
      canCheckIn: boolean;
      canCheckOut: boolean;
      attendance: IAttendance;
      currentWorkingHours: number;
    }>>({
      success: true,
      message: 'Today\'s attendance status retrieved successfully',
      data: {
        hasCheckedIn,
        hasCheckedOut,
        isOnBreak,
        canCheckIn: !hasCheckedIn,
        canCheckOut: hasCheckedIn && !hasCheckedOut && !isOnBreak,
        attendance: convertToIAttendance(todaysAttendance),
        currentWorkingHours: hasCheckedIn && !hasCheckedOut 
          ? Math.round((new Date().getTime() - todaysAttendance.checkInTime!.getTime()) / (1000 * 60))
          : todaysAttendance.totalWorkingHours
      }
    });

  } catch (error) {
    console.error('Get check-in status error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to get check-in status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}