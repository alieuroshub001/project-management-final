// app/api/attendance/checkout/route.ts
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

// Helper function to validate tasks
function validateTasks(tasksPerformed: any[], expectedWorkingMinutes: number) {
  const errors: string[] = [];
  
  // Check if tasks are provided
  if (!tasksPerformed || tasksPerformed.length === 0) {
    errors.push('At least one task is required for checkout');
    return errors;
  }

  let totalTaskTime = 0;
  
  // Validate each task
  tasksPerformed.forEach((task, index) => {
    if (!task.taskDescription || task.taskDescription.trim() === '') {
      errors.push(`Task ${index + 1}: Task description is required`);
    }
    
    if (!task.timeSpent || task.timeSpent <= 0) {
      errors.push(`Task ${index + 1}: Time spent must be greater than 0 minutes`);
    }
    
    if (task.timeSpent > 600) { // More than 10 hours for a single task
      errors.push(`Task ${index + 1}: Time spent seems too high (${task.timeSpent} minutes). Please verify.`);
    }
    
    totalTaskTime += task.timeSpent || 0;
  });

  // Validate total task time against working hours
  if (expectedWorkingMinutes > 0) {
    const timeDifference = Math.abs(totalTaskTime - expectedWorkingMinutes);
    const allowedVariance = Math.max(60, expectedWorkingMinutes * 0.25); // 25% variance or 60 minutes minimum
    
    if (timeDifference > allowedVariance) {
      if (totalTaskTime > expectedWorkingMinutes + allowedVariance) {
        errors.push(`Total task time (${Math.round(totalTaskTime)} minutes) significantly exceeds your working time (${Math.round(expectedWorkingMinutes)} minutes). Please review your task entries.`);
      } else if (totalTaskTime < expectedWorkingMinutes - allowedVariance) {
        errors.push(`Total task time (${Math.round(totalTaskTime)} minutes) is significantly less than your working time (${Math.round(expectedWorkingMinutes)} minutes). Please account for all work performed.`);
      }
    }
  }
  
  if (totalTaskTime < 30) {
    errors.push('Total task time should be at least 30 minutes');
  }

  return errors;
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

    // Get today's attendance record
    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);
    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No check-in record found for today. Please check in first.'
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
      const activeBreaks = todaysAttendance.breaks.filter(b => b.isActive);
      const activeNamazBreaks = todaysAttendance.namazBreaks.filter(nb => nb.isActive);
      
      let breakDetails = '';
      if (activeBreaks.length > 0) {
        breakDetails = `Active break: ${activeBreaks[0].breakType}`;
      }
      if (activeNamazBreaks.length > 0) {
        breakDetails += (breakDetails ? ', ' : '') + `Active prayer: ${activeNamazBreaks[0].namazType}`;
      }
      
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `Cannot check out while on a break. Please end your current break first. ${breakDetails}`
      }, { status: 400 });
    }

    const checkOutTime = new Date();
    
    // Calculate working hours
    const grossWorkingMinutes = Math.round((checkOutTime.getTime() - todaysAttendance.checkInTime.getTime()) / (1000 * 60));
    const breakTime = todaysAttendance.calculateBreakTime();
    const namazBreakTime = todaysAttendance.calculateNamazBreakTime();
    const netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakTime - namazBreakTime);

    // Validate tasks
    const taskValidationErrors = validateTasks(tasksPerformed, netWorkingMinutes);
    if (taskValidationErrors.length > 0) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Task validation failed',
        error: taskValidationErrors.join('; ')
      }, { status: 400 });
    }

    // Check for early checkout
    const shiftEndTime = getShiftEndTime(todaysAttendance.shift as ShiftType, todaysAttendance.checkInTime);
    const isEarly = isEarlyCheckOut(checkOutTime, shiftEndTime);
    
    // If early and no reason provided, require reason
    if (isEarly && (!earlyCheckOutReason || earlyCheckOutReason.trim() === '')) {
      const earlyMinutes = Math.round((shiftEndTime.getTime() - checkOutTime.getTime()) / (1000 * 60));
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `You are checking out ${earlyMinutes} minutes early. Please provide a reason for early check-out.`
      }, { status: 400 });
    }

    // Prepare tasks with IDs
    const tasksWithIds = tasksPerformed.map(task => ({
      id: new mongoose.Types.ObjectId().toString(),
      taskDescription: task.taskDescription.trim(),
      timeSpent: Math.max(0, task.timeSpent || 0),
      taskCategory: task.taskCategory || 'other',
      priority: task.priority || 'medium',
      notes: task.notes?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Calculate total task time for validation
    const totalTaskTime = tasksWithIds.reduce((sum, task) => sum + task.timeSpent, 0);

    // Update attendance record
    const updateData: any = {
      checkOutTime,
      isEarlyCheckOut: isEarly,
      earlyCheckOutReason: isEarly ? earlyCheckOutReason?.trim() : undefined,
      tasksPerformed: tasksWithIds,
      'location.checkOutLocation': location,
      status: 'present' // Mark as present when checked out
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

    // Calculate final working hours (the pre-save middleware should handle this)
    const finalWorkingHours = updatedAttendance.calculateWorkingHours();

    // Calculate summary
    const workingSummary = {
      grossWorkingTime: grossWorkingMinutes,
      totalBreakTime: breakTime + namazBreakTime,
      netWorkingTime: finalWorkingHours,
      totalTaskTime,
      isEarlyCheckOut: isEarly,
      overtimeHours: updateData.overtime?.overtimeHours || 0,
      earlyMinutes: isEarly ? Math.round((shiftEndTime.getTime() - checkOutTime.getTime()) / (1000 * 60)) : 0
    };

    const successMessage = isEarly 
      ? `Checked out successfully (Early by ${workingSummary.earlyMinutes} minutes)`
      : 'Checked out successfully';

    const additionalMessage = isEarly 
      ? 'You have checked out early. Please ensure to complete your full shift in the future.'
      : finalWorkingHours > standardShiftMinutes
      ? `Great job! You worked ${Math.round((finalWorkingHours - standardShiftMinutes))} minutes of overtime today.`
      : 'Thank you for your work today! Have a great day.';

    return NextResponse.json<IAttendanceApiResponse<{
      attendance: IAttendance;
      summary: typeof workingSummary;
      message: string;
    }>>({
      success: true,
      message: successMessage,
      data: {
        attendance: convertToIAttendance(updatedAttendance),
        summary: workingSummary,
        message: additionalMessage
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

    // Calculate the net working time for validation
    const grossWorkingMinutes = Math.round((attendance.checkOutTime.getTime() - attendance.checkInTime!.getTime()) / (1000 * 60));
    const breakTime = attendance.calculateBreakTime();
    const namazBreakTime = attendance.calculateNamazBreakTime();
    const netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakTime - namazBreakTime);

    // Validate the updated tasks
    const taskValidationErrors = validateTasks(tasksPerformed, netWorkingMinutes);
    if (taskValidationErrors.length > 0) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Task validation failed',
        error: taskValidationErrors.join('; ')
      }, { status: 400 });
    }

    // Prepare updated tasks
    const updatedTasks = tasksPerformed.map((task: any) => ({
      id: task.id || new mongoose.Types.ObjectId().toString(),
      taskDescription: task.taskDescription.trim(),
      timeSpent: Math.max(0, task.timeSpent || 0),
      taskCategory: task.taskCategory || 'other',
      priority: task.priority || 'medium',
      notes: task.notes?.trim() || '',
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