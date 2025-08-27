// app/api/attendance/quick-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import { IAttendanceApiResponse } from '@/types/attendance';
import { authOptions } from '@/lib/auth';

interface QuickActionStatus {
  canCheckIn: boolean;
  canCheckOut: boolean;
  hasActiveBreaks: boolean;
  hasActiveNamazBreaks: boolean;
  isCheckedIn: boolean;
  currentStatus: string;
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

    // Get today's attendance record
    const todaysAttendance = await Attendance.findTodaysAttendance(session.user.id);
    
    let status: QuickActionStatus;

    if (!todaysAttendance) {
      status = {
        canCheckIn: true,
        canCheckOut: false,
        hasActiveBreaks: false,
        hasActiveNamazBreaks: false,
        isCheckedIn: false,
        currentStatus: 'Not checked in'
      };
    } else {
      const hasCheckedIn = !!todaysAttendance.checkInTime;
      const hasCheckedOut = !!todaysAttendance.checkOutTime;
      const activeBreaks = todaysAttendance.breaks.filter(b => b.isActive);
      const activeNamazBreaks = todaysAttendance.namazBreaks.filter(nb => nb.isActive);

      status = {
        canCheckIn: !hasCheckedIn,
        canCheckOut: hasCheckedIn && !hasCheckedOut && activeBreaks.length === 0 && activeNamazBreaks.length === 0,
        hasActiveBreaks: activeBreaks.length > 0,
        hasActiveNamazBreaks: activeNamazBreaks.length > 0,
        isCheckedIn: hasCheckedIn,
        currentStatus: hasCheckedOut 
          ? 'Checked out' 
          : hasCheckedIn 
            ? (activeBreaks.length > 0 || activeNamazBreaks.length > 0 ? 'On break' : 'Working')
            : 'Not checked in'
      };
    }

    return NextResponse.json<IAttendanceApiResponse<QuickActionStatus>>({
      success: true,
      message: 'Quick status retrieved successfully',
      data: status
    });

  } catch (error) {
    console.error('Get quick status error:', error);
    return NextResponse.json<IAttendanceApiResponse>({
      success: false,
      message: 'Failed to retrieve quick status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}