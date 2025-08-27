// app/api/employee/attendance/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  ICheckOutRequest,
  IAttendanceApiResponse,
  IAttendance,
  ShiftType
} from '@/types/attendance';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper function to get shift end time
function getShiftEndTime(shift: ShiftType, checkInTime: Date): Date {
  const checkInDate = new Date(checkInTime);
  
  switch (shift) {
    case 'morning':
      // 8 AM - 4 PM
      const morningEnd = new Date(checkInDate);
      morningEnd.setHours(16, 0, 0, 0);
      return morningEnd;
      
    case 'evening':
      // 4 PM - 12 AM
      const eveningEnd = new Date(checkInDate);
      eveningEnd.setHours(24, 0, 0, 0);
      return eveningEnd;
      
    case 'night':
      // 12 AM - 8 AM
      const nightEnd = new Date(checkInDate);
      nightEnd.setHours(8, 0, 0, 0);
      return nightEnd;
      
    case 'random':
      // For random shift, assume 8 hours from check-in
      return new Date(checkInTime.getTime() + 8 * 60 * 60 * 1000);
      
    default:
      return new Date(checkInTime.getTime() + 8 * 60 * 60 * 1000);
  }
}

// Helper function to check if check-out is early
function isEarlyCheckOut(actualCheckOut: Date, shiftEnd: Date, graceMinutes: number = 15): boolean {
  const graceTime = new Date(shiftEnd.getTime() - graceMinutes * 60 * 1000);
  return actualCheckOut < graceTime;
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

// POST - Check out
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
    const { tasksPerformed, location, earlyCheckOutReason } = body;

    // Validate required fields
    if (!tasksPerformed || tasksPerformed.length === 0) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Tasks performed during the shift are required'
      }, { status: 400 });
    }

    // Validate tasks - ensure total time spent doesn't exceed working hours
    const totalTaskTime = tasksPerformed.reduce((sum, task) => sum + task.timeSpent, 0);
    if (totalTaskTime <= 0) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Total task time must be greater than 0'
      }, { status: 400 });
    }

    // Get today's attendance record
    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);
    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No check-in record found for today'
      }, { status: 404 });
    }

    if (!todaysAttendance.checkInTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot check out without checking in first'
      }, { status: 400 });
    }

    if (todaysAttendance.checkOutTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Already checked out today'
      }, { status: 400 });
    }

    // Check if employee is currently on a break
    if (todaysAttendance.isCurrentlyOnBreak()) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot check out while on a break. Please end your break first.'
      }, { status: 400 });
    }

    const checkOutTime = new Date();
    const shiftEndTime = getShiftEndTime(todaysAttendance.shift as ShiftType, todaysAttendance.checkInTime);
    
    // Check if check-out is early
    const isEarly = isEarlyCheckOut(checkOutTime, shiftEndTime);
    
    // If early and no reason provided, require reason
    if (isEarly && !earlyCheckOutReason) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Early check-out reason is required when checking out more than 15 minutes before shift end'
      }, { status: 400 });
    }

    // Calculate working hours (will be done by the model's pre-save middleware)
    const grossWorkingMinutes = Math.round((checkOutTime.getTime() - todaysAttendance.checkInTime.getTime()) / (1000 * 60));
    const breakTime = todaysAttendance.calculateBreakTime();
    const namazBreakTime = todaysAttendance.calculateNamazBreakTime();
    const netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakTime - namazBreakTime);

    // Check if total task time is reasonable compared to working hours
    if (totalTaskTime > netWorkingMinutes + 60) { // Allow 60 minutes buffer
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `Total task time (${totalTaskTime} minutes) cannot exceed working hours (${netWorkingMinutes} minutes)`
      }, { status: 400 });
    }

    // Prepare tasks with IDs
    const tasksWithIds = tasksPerformed.map(task => ({
      id: new mongoose.Types.ObjectId().toString(),
      taskDescription: task.taskDescription,
      timeSpent: task.timeSpent,
      taskCategory: task.taskCategory,
      priority: task.priority,
      notes: task.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Update attendance record
    const updateData: any = {
      checkOutTime,
      isEarlyCheckOut: isEarly,
      earlyCheckOutReason: isEarly ? earlyCheckOutReason : undefined,
      tasksPerformed: tasksWithIds,
      'location.checkOutLocation': location
    };

    // Calculate overtime if applicable
    const standardShiftMinutes = 8 * 60; // 8 hours
    if (netWorkingMinutes > standardShiftMinutes) {
      const overtimeMinutes = netWorkingMinutes - standardShiftMinutes;
      updateData.overtime = {
        overtimeHours: overtimeMinutes,
        reason: `Overtime work on ${new Date().toLocaleDateString()}`,
        status: 'pending',
        createdAt: new Date()
      };
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      todaysAttendance._id,
      updateData,
      { new: true }
    ) as IAttendanceDocument;

    if (!updatedAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Failed to update attendance record'
      }, { status: 500 });
    }

    // Calculate summary
    const workingSummary = {
      totalWorkingTime: netWorkingMinutes,
      totalBreakTime: breakTime + namazBreakTime,
      totalTaskTime,
      isEarlyCheckOut: isEarly,
      overtimeHours: updateData.overtime?.overtimeHours || 0
    };

    return NextResponse.json<IAttendanceApiResponse<{
      attendance: IAttendance;
      summary: typeof workingSummary;
      message: string;
    }>>({
      success: true,
      message: isEarly 
        ? `Checked out successfully (Early by ${Math.round((shiftEndTime.getTime() - checkOutTime.getTime()) / (1000 * 60))} minutes)`
        : 'Checked out successfully',
      data: {
        attendance: convertToIAttendance(updatedAttendance),
        summary: workingSummary,
        message: isEarly 
          ? 'You have checked out early. Please ensure to complete your full shift in the future.'
          : 'Thank you for your work today! Have a great day.'
      }
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

// PUT - Update tasks performed (for modifications after checkout)
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
    const { tasksPerformed, date } = body;

    if (!tasksPerformed || tasksPerformed.length === 0) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Tasks performed are required'
      }, { status: 400 });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: targetDate
    });

    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Attendance record not found for the specified date'
      }, { status: 404 });
    }

    if (!attendance.checkOutTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot update tasks for a day where you have not checked out'
      }, { status: 400 });
    }

    // Validate total task time against working hours
    const totalTaskTime = tasksPerformed.reduce((sum: number, task: any) => sum + task.timeSpent, 0);
    if (totalTaskTime > attendance.totalWorkingHours + 60) { // Allow 60 minutes buffer
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `Total task time (${totalTaskTime} minutes) cannot exceed working hours (${attendance.totalWorkingHours} minutes)`
      }, { status: 400 });
    }

    // Prepare updated tasks
    const updatedTasks = tasksPerformed.map((task: any) => ({
      id: task.id || new mongoose.Types.ObjectId().toString(),
      taskDescription: task.taskDescription,
      timeSpent: task.timeSpent,
      taskCategory: task.taskCategory,
      priority: task.priority,
      notes: task.notes,
      createdAt: task.createdAt || new Date(),
      updatedAt: new Date()
    }));

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      { tasksPerformed: updatedTasks },
      { new: true }
    ) as IAttendanceDocument;

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
      success: true,
      message: 'Tasks updated successfully',
      data: convertToIAttendance(updatedAttendance)
    });

  } catch (error) {
    console.error('Update tasks error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to update tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}