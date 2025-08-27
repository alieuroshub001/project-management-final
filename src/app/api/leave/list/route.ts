// app/api/employee/leave/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Leave from '@/models/Leave';
import { ILeaveApiResponse, ILeave, LeaveFilter } from '@/types/leave';
import { authOptions } from '@/lib/auth';

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
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: any = { employeeId: session.user.id };
    
    if (status) filter.status = { $in: status.split(',') };
    if (leaveType) filter.leaveType = { $in: leaveType.split(',') };
    if (year) {
      filter.startDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const skip = (page - 1) * limit;
    
    const leavesRaw = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Ensure each leave has an 'id' property
    const leaves: ILeave[] = leavesRaw.map((leave: any) => ({
      ...leave,
      id: leave._id?.toString?.() ?? leave.id // fallback if already present
    }));

    const total = await Leave.countDocuments(filter);

    return NextResponse.json<ILeaveApiResponse<{ leaves: ILeave[]; total: number; page: number; totalPages: number }>>({
      success: true,
      message: 'Leaves retrieved successfully',
      data: {
        leaves,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get leaves error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to retrieve leaves',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}