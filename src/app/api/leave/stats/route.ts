// app/api/employee/leave/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Leave from '@/models/Leave';
import { ILeaveApiResponse } from '@/types/leave';
import { authOptions } from '@/lib/auth';

interface LeaveStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  upcomingLeaves: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    
    const employeeId = session.user.id;
    const today = new Date();
    
    // Get counts for different statuses
    const [totalApplications, pendingApplications, approvedApplications, rejectedApplications] = await Promise.all([
      Leave.countDocuments({ employeeId }),
      Leave.countDocuments({ employeeId, status: 'pending' }),
      Leave.countDocuments({ employeeId, status: 'approved' }),
      Leave.countDocuments({ employeeId, status: 'rejected' })
    ]);

    // Get upcoming leaves (approved leaves with start date in the future)
    const upcomingLeaves = await Leave.countDocuments({
      employeeId,
      status: 'approved',
      startDate: { $gt: today }
    });

    const stats: LeaveStats = {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      upcomingLeaves
    };

    return NextResponse.json<ILeaveApiResponse<LeaveStats>>({
      success: true,
      message: 'Leave statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get leave stats error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to retrieve leave statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}