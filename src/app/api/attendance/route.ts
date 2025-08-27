// app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  IAttendanceFilterRequest,
  IAttendanceApiResponse,
  IAttendance,
  IAttendanceWithDetails,
  ShiftType,
  AttendanceStatus
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
    status: doc.status as AttendanceStatus,
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

// GET - List attendance records with filters
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
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
    const employeeId = searchParams.get('employeeId') || session.user.id;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shift = searchParams.get('shift') as ShiftType;
    const status = searchParams.get('status') as AttendanceStatus;
    const isLateCheckIn = searchParams.get('isLateCheckIn');
    const isEarlyCheckOut = searchParams.get('isEarlyCheckOut');

    // Build filter object
    const filter: any = { employeeId };
    
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }

    if (shift) filter.shift = shift;
    if (status) filter.status = status;
    if (isLateCheckIn !== null) filter.isLateCheckIn = isLateCheckIn === 'true';
    if (isEarlyCheckOut !== null) filter.isEarlyCheckOut = isEarlyCheckOut === 'true';

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() as Promise<IAttendanceDocument[]>,
      Attendance.countDocuments(filter)
    ]);

    const convertedRecords = attendanceRecords.map(convertToIAttendance);

    // Calculate summary statistics
    const summary = {
      totalRecords: total,
      presentDays: attendanceRecords.filter(r => r.status === 'present').length,
      totalWorkingHours: attendanceRecords.reduce((sum, r) => sum + r.totalWorkingHours, 0),
      averageWorkingHours: attendanceRecords.length > 0 ? 
        attendanceRecords.reduce((sum, r) => sum + r.totalWorkingHours, 0) / attendanceRecords.length : 0,
      lateCheckIns: attendanceRecords.filter(r => r.isLateCheckIn).length,
      earlyCheckOuts: attendanceRecords.filter(r => r.isEarlyCheckOut).length
    };

    return NextResponse.json<IAttendanceApiResponse<{
      attendance: IAttendance[];
      summary: typeof summary;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: {
        attendance: convertedRecords,
        summary,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve attendance records',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create attendance record (used for admin purposes or backdating)
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
      employeeId = session.user.id,
      date,
      shift,
      checkInTime,
      checkOutTime,
      totalWorkingHours,
      status,
      isLateCheckIn = false,
      lateCheckInReason,
      isEarlyCheckOut = false,
      earlyCheckOutReason,
      tasksPerformed = [],
      location
    } = body;

    // Validate required fields
    if (!date || !shift) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Missing required fields: date, shift'
      }, { status: 400 });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Attendance record already exists for this date'
      }, { status: 400 });
    }

    const attendanceData = {
      employeeId,
      employeeName: session.user.name,
      employeeEmail: session.user.email,
      employeeMobile: session.user.mobile || '',
      date: new Date(date),
      shift,
      checkInTime: checkInTime ? new Date(checkInTime) : undefined,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
      totalWorkingHours: totalWorkingHours || 0,
      status: status || 'absent',
      isLateCheckIn,
      lateCheckInReason,
      isEarlyCheckOut,
      earlyCheckOutReason,
      breaks: [],
      namazBreaks: [],
      tasksPerformed: tasksPerformed.map((task: any) => ({
        id: new Date().getTime().toString() + Math.random(),
        taskDescription: task.taskDescription,
        timeSpent: task.timeSpent,
        taskCategory: task.taskCategory,
        priority: task.priority,
        notes: task.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      location
    };

    const attendance = await Attendance.create(attendanceData) as IAttendanceDocument;

    return NextResponse.json<IAttendanceApiResponse<IAttendance>>({
      success: true,
      message: 'Attendance record created successfully',
      data: convertToIAttendance(attendance)
    }, { status: 201 });

  } catch (error) {
    console.error('Create attendance error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to create attendance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}