// app/api/employee/attendance/breaks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  IBreakStartRequest,
  IBreakEndRequest,
  IAttendanceApiResponse,
  IBreak
} from '@/types/attendance';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper function to convert break data
function convertToIBreak(breakData: any, attendanceId: string): IBreak {
  return {
    id: breakData.id,
    attendanceId,
    breakType: breakData.breakType,
    startTime: breakData.startTime,
    endTime: breakData.endTime,
    duration: breakData.duration,
    reason: breakData.reason,
    isActive: breakData.isActive,
    createdAt: breakData.createdAt
  };
}

// POST - Start a break
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

    const body: IBreakStartRequest = await request.json();
    const { breakType, reason } = body;

    // Validate required fields
    if (!breakType) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Break type is required'
      }, { status: 400 });
    }

    // Get today's attendance record
    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);
    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No attendance record found for today. Please check in first.'
      }, { status: 404 });
    }

    if (!todaysAttendance.checkInTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot start break without checking in first'
      }, { status: 400 });
    }

    if (todaysAttendance.checkOutTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot start break after checking out'
      }, { status: 400 });
    }

    // Check if employee is already on a break
    if (todaysAttendance.isCurrentlyOnBreak()) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Already on a break. Please end current break before starting a new one.'
      }, { status: 400 });
    }

    // Check daily break limits (configurable - example: max 2 hours total breaks)
    const totalBreakTime = todaysAttendance.calculateBreakTime();
    const maxDailyBreakMinutes = 120; // 2 hours
    
    if (totalBreakTime >= maxDailyBreakMinutes) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `Daily break limit of ${maxDailyBreakMinutes} minutes has been reached`
      }, { status: 400 });
    }

    // Create new break
    const breakId = new mongoose.Types.ObjectId().toString();
    const newBreak = {
      id: breakId,
      breakType,
      startTime: new Date(),
      duration: 0,
      reason,
      isActive: true,
      createdAt: new Date()
    };

    // Add break to attendance record
    todaysAttendance.addBreak(newBreak);
    await todaysAttendance.save();

    return NextResponse.json<IAttendanceApiResponse<IBreak>>({
      success: true,
      message: `${breakType.charAt(0).toUpperCase() + breakType.slice(1)} break started`,
      data: convertToIBreak(newBreak, todaysAttendance._id?.toString() || '')
    }, { status: 201 });

  } catch (error) {
    console.error('Start break error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to start break',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - End a break
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

    const body: IBreakEndRequest = await request.json();
    const { breakId } = body;

    if (!breakId) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Break ID is required'
      }, { status: 400 });
    }

    // Get today's attendance record
    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);
    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'No attendance record found for today'
      }, { status: 404 });
    }

    // Find the active break
    const breakItem = todaysAttendance.breaks.find(b => b.id === breakId && b.isActive);
    if (!breakItem) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Active break not found'
      }, { status: 404 });
    }

    // End the break
    todaysAttendance.endBreak(breakId);
    await todaysAttendance.save();

    const updatedBreak = todaysAttendance.breaks.find(b => b.id === breakId);
    if (!updatedBreak) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Failed to end break'
      }, { status: 500 });
    }

    return NextResponse.json<IAttendanceApiResponse<{
      break: IBreak;
      duration: number;
      message: string;
    }>>({
      success: true,
      message: `${updatedBreak.breakType.charAt(0).toUpperCase() + updatedBreak.breakType.slice(1)} break ended`,
      data: {
        break: convertToIBreak(updatedBreak, todaysAttendance._id?.toString() || ''),
        duration: updatedBreak.duration,
        message: `Break lasted ${updatedBreak.duration} minutes`
      }
    });

  } catch (error) {
    console.error('End break error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to end break',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get active breaks
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

    // Get today's attendance record with active breaks
    const todaysAttendance = await Attendance.findActiveBreaks(session.user.id);
    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse<{
        activeBreaks: IBreak[];
        totalBreakTimeToday: number;
      }>>({
        success: true,
        message: 'No active breaks found',
        data: {
          activeBreaks: [],
          totalBreakTimeToday: 0
        }
      });
    }

    const activeBreaks = todaysAttendance.breaks
      .filter(b => b.isActive)
      .map(b => convertToIBreak(b, todaysAttendance._id?.toString() || ''));

    const totalBreakTimeToday = todaysAttendance.calculateBreakTime();

    return NextResponse.json<IAttendanceApiResponse<{
      activeBreaks: IBreak[];
      totalBreakTimeToday: number;
      remainingBreakTime: number;
    }>>({
      success: true,
      message: 'Active breaks retrieved successfully',
      data: {
        activeBreaks,
        totalBreakTimeToday,
        remainingBreakTime: Math.max(0, 120 - totalBreakTimeToday) // Assuming 120 min daily limit
      }
    });

  } catch (error) {
    console.error('Get active breaks error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve active breaks',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}