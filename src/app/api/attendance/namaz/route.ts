// app/api/attendance/namaz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance, { IAttendanceDocument } from '@/models/Attendance';
import { 
  INamazBreakStartRequest,
  INamazBreakEndRequest,
  IAttendanceApiResponse,
  INamazBreak,
  NamazType
} from '@/types/attendance';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper function to convert namaz break data
function convertToINamazBreak(namazBreakData: any, attendanceId: string): INamazBreak {
  return {
    id: namazBreakData.id,
    attendanceId,
    namazType: namazBreakData.namazType,
    startTime: namazBreakData.startTime,
    endTime: namazBreakData.endTime,
    duration: namazBreakData.duration,
    isActive: namazBreakData.isActive,
    createdAt: namazBreakData.createdAt
  };
}

// Helper function to get approximate namaz times (basic calculation)
function getNamazTimes(): Record<NamazType, { start: string; end: string }> {
  // This is a simplified version. In production, you'd use proper Islamic calendar libraries
  return {
    fajr: { start: '04:30', end: '06:00' },
    zuhr: { start: '12:00', end: '15:30' },
    asr: { start: '15:30', end: '18:00' },
    maghrib: { start: '18:00', end: '19:30' },
    isha: { start: '19:30', end: '21:00' }
  };
}

// Helper function to validate namaz timing
function isValidNamazTime(namazType: NamazType): boolean {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const namazTimes = getNamazTimes();
  const namazTime = namazTimes[namazType];
  
  return currentTime >= namazTime.start && currentTime <= namazTime.end;
}

// POST - Start a namaz break
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

    const body: INamazBreakStartRequest = await request.json();
    const { namazType } = body;

    // Validate required fields
    if (!namazType) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Namaz type is required'
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
        message: 'Cannot start namaz break without checking in first'
      }, { status: 400 });
    }

    if (todaysAttendance.checkOutTime) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Cannot start namaz break after checking out'
      }, { status: 400 });
    }

    // Check if employee is already on any break
    if (todaysAttendance.isCurrentlyOnBreak()) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Already on a break. Please end current break before starting namaz break.'
      }, { status: 400 });
    }

    // Check if this namaz has already been taken today
    const existingNamazBreak = todaysAttendance.namazBreaks.find(nb => 
      nb.namazType === namazType && !nb.isActive
    );
    
    if (existingNamazBreak) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `${namazType.charAt(0).toUpperCase() + namazType.slice(1)} namaz break has already been taken today`
      }, { status: 400 });
    }

    // Optional: Validate timing (can be disabled for flexibility)
    // if (!isValidNamazTime(namazType)) {
    //   return NextResponse.json<IAttendanceApiResponse>({
    //     success: false,
    //     message: `Current time is not appropriate for ${namazType} namaz`
    //   }, { status: 400 });
    // }

    // Check daily namaz break limits (example: max 90 minutes total)
    const totalNamazBreakTime = todaysAttendance.calculateNamazBreakTime();
    const maxDailyNamazMinutes = 90; // 1.5 hours
    
    if (totalNamazBreakTime >= maxDailyNamazMinutes) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: `Daily namaz break limit of ${maxDailyNamazMinutes} minutes has been reached`
      }, { status: 400 });
    }

    // Create new namaz break
    const namazBreakId = new mongoose.Types.ObjectId().toString();
    const newNamazBreak = {
      id: namazBreakId,
      namazType,
      startTime: new Date(),
      duration: 0,
      isActive: true,
      createdAt: new Date()
    };

    // Add namaz break to attendance record
    todaysAttendance.addNamazBreak(newNamazBreak);
    await todaysAttendance.save();

    return NextResponse.json<IAttendanceApiResponse<INamazBreak>>({
      success: true,
      message: `${namazType.charAt(0).toUpperCase() + namazType.slice(1)} namaz break started`,
      data: convertToINamazBreak(newNamazBreak, todaysAttendance._id?.toString() || '')
    }, { status: 201 });

  } catch (error) {
    console.error('Start namaz break error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to start namaz break',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - End a namaz break
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

    const body: INamazBreakEndRequest = await request.json();
    const { namazBreakId } = body;

    if (!namazBreakId) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Namaz break ID is required'
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

    // Find the active namaz break
    const namazBreak = todaysAttendance.namazBreaks.find(nb => nb.id === namazBreakId && nb.isActive);
    if (!namazBreak) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Active namaz break not found'
      }, { status: 404 });
    }

    // End the namaz break
    todaysAttendance.endNamazBreak(namazBreakId);
    await todaysAttendance.save();

    const updatedNamazBreak = todaysAttendance.namazBreaks.find(nb => nb.id === namazBreakId);
    if (!updatedNamazBreak) {
      return NextResponse.json<IAttendanceApiResponse>({
        success: false,
        message: 'Failed to end namaz break'
      }, { status: 500 });
    }

    return NextResponse.json<IAttendanceApiResponse<{
      namazBreak: INamazBreak;
      duration: number;
      message: string;
    }>>({
      success: true,
      message: `${updatedNamazBreak.namazType.charAt(0).toUpperCase() + updatedNamazBreak.namazType.slice(1)} namaz break ended`,
      data: {
        namazBreak: convertToINamazBreak(updatedNamazBreak, todaysAttendance._id?.toString() || ''),
        duration: updatedNamazBreak.duration,
        message: `May Allah accept your prayer. Break lasted ${updatedNamazBreak.duration} minutes`
      }
    });

  } catch (error) {
    console.error('End namaz break error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to end namaz break',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get namaz break status and timing
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

    // Get today's attendance record
    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);
    
    const namazTimes = getNamazTimes();
    
    if (!todaysAttendance) {
      return NextResponse.json<IAttendanceApiResponse<{
        activeNamazBreaks: INamazBreak[];
        completedNamazBreaks: INamazBreak[];
        namazTimes: typeof namazTimes;
        totalNamazBreakTimeToday: number;
      }>>({
        success: true,
        message: 'Namaz break status retrieved successfully',
        data: {
          activeNamazBreaks: [],
          completedNamazBreaks: [],
          namazTimes,
          totalNamazBreakTimeToday: 0
        }
      });
    }

    const activeNamazBreaks = todaysAttendance.namazBreaks
      .filter(nb => nb.isActive)
      .map(nb => convertToINamazBreak(nb, todaysAttendance._id?.toString() || ''));

    const completedNamazBreaks = todaysAttendance.namazBreaks
      .filter(nb => !nb.isActive)
      .map(nb => convertToINamazBreak(nb, todaysAttendance._id?.toString() || ''));

    const totalNamazBreakTimeToday = todaysAttendance.calculateNamazBreakTime();

    // Check which namaz prayers are still available
    const availableNamazTypes = Object.keys(namazTimes).filter(namazType => 
      !completedNamazBreaks.some(nb => nb.namazType === namazType)
    ) as NamazType[];

    return NextResponse.json<IAttendanceApiResponse<{
      activeNamazBreaks: INamazBreak[];
      completedNamazBreaks: INamazBreak[];
      namazTimes: typeof namazTimes;
      availableNamazTypes: NamazType[];
      totalNamazBreakTimeToday: number;
      remainingNamazBreakTime: number;
    }>>({
      success: true,
      message: 'Namaz break status retrieved successfully',
      data: {
        activeNamazBreaks,
        completedNamazBreaks,
        namazTimes,
        availableNamazTypes,
        totalNamazBreakTimeToday,
        remainingNamazBreakTime: Math.max(0, 90 - totalNamazBreakTimeToday) // Assuming 90 min daily limit
      }
    });

  } catch (error) {
    console.error('Get namaz break status error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve namaz break status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}