// app/api/attendance/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  IAttendanceUpdateRequest,
  IAttendanceApiResponse,
  IAttendance,
  ShiftType
} from '@/types/attendance';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

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

// GET - Get specific attendance record
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;

    const attendance = await Attendance.findById(params.id) as IAttendanceDocument | null;
    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Attendance record not found'
      }, { status: 404 });
    }

    // Check if user can access this record
    if (attendance.employeeId.toString() !== session.user.id) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
      success: true,
      message: 'Attendance record retrieved successfully',
      data: convertToIAttendance(attendance)
    });

  } catch (error) {
    console.error('Get attendance record error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update attendance record (for corrections/admin purposes)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;

    const attendance = await Attendance.findById(params.id) as IAttendanceDocument | null;
    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Attendance record not found'
      }, { status: 404 });
    }

    // Check if user can update this record
    if (attendance.employeeId.toString() !== session.user.id) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    // Only allow updates to records that are not from today (prevent gaming the system)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recordDate = new Date(attendance.date);
    recordDate.setHours(0, 0, 0, 0);

    if (recordDate.getTime() === today.getTime()) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot update today\'s attendance record. Use check-in/check-out endpoints.'
      }, { status: 400 });
    }

    const body: IAttendanceUpdateRequest = await request.json();
    const {
      checkInTime,
      checkOutTime,
      lateCheckInReason,
      earlyCheckOutReason,
      tasksPerformed
    } = body;

    // Build update object
    const updateData: any = {};

    if (checkInTime !== undefined) {
      updateData.checkInTime = checkInTime ? new Date(checkInTime) : null;
    }

    if (checkOutTime !== undefined) {
      updateData.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
    }

    if (lateCheckInReason !== undefined) {
      updateData.lateCheckInReason = lateCheckInReason;
    }

    if (earlyCheckOutReason !== undefined) {
      updateData.earlyCheckOutReason = earlyCheckOutReason;
    }

    if (tasksPerformed !== undefined) {
      updateData.tasksPerformed = tasksPerformed.map((task: any) => ({
        id: task.id || new mongoose.Types.ObjectId().toString(),
        taskDescription: task.taskDescription,
        timeSpent: task.timeSpent,
        taskCategory: task.taskCategory,
        priority: task.priority,
        notes: task.notes,
        createdAt: task.createdAt || new Date(),
        updatedAt: new Date()
      }));
    }

    // Validate date logic if both times are being updated
    if (updateData.checkInTime && updateData.checkOutTime) {
      if (updateData.checkOutTime <= updateData.checkInTime) {
        return NextResponse.json<IAttendanceApiResponse>({
          success: false,
          message: 'Check-out time must be after check-in time'
        }, { status: 400 });
      }
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ) as IAttendanceDocument | null;

    if (!updatedAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Failed to update attendance record'
      }, { status: 500 });
    }

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
      success: true,
      message: 'Attendance record updated successfully',
      data: convertToIAttendance(updatedAttendance)
    });

  } catch (error) {
    console.error('Update attendance record error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to update attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete attendance record (soft delete/archive)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;

    const attendance = await Attendance.findById(params.id) as IAttendanceDocument | null;
    if (!attendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Attendance record not found'
      }, { status: 404 });
    }

    // Check if user can delete this record (only their own records)
    if (attendance.employeeId.toString() !== session.user.id) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    // Prevent deletion of recent records (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (attendance.date > sevenDaysAgo) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot delete attendance records from the last 7 days'
      }, { status: 400 });
    }

    // Instead of hard delete, you might want to mark as deleted or archive
    // For now, we'll do a hard delete, but in production consider soft delete
    await Attendance.findByIdAndDelete(params.id);

    return NextResponse.json<IAttendanceApiResponse>({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Delete attendance record error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to delete attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}