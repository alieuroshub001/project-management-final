// app/api/employee/leave/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import LeaveBalance from '@/models/LeaveBalance';
import { ILeaveApiResponse, ILeaveBalance } from '@/types/leave';
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const balanceDoc = await LeaveBalance.getOrCreate(session.user.id, year);
    const balance: ILeaveBalance = {
        id: balanceDoc.id ?? balanceDoc._id?.toString?.() ?? '', // ensure id is present
        employeeId: balanceDoc.employeeId?.toString?.() ?? '',
        year: balanceDoc.year,
        annualLeave: 0,
        sickLeave: 0,
        casualLeave: 0,
        unpaidLeave: 0,
        usedAnnualLeave: 0,
        usedSickLeave: 0,
        usedCasualLeave: 0,
        usedUnpaidLeave: 0,
        createdAt: balanceDoc.createdAt ?? new Date(),
        updatedAt: balanceDoc.updatedAt ?? new Date()
    };

    return NextResponse.json<ILeaveApiResponse<ILeaveBalance>>({
      success: true,
      message: 'Leave balance retrieved successfully',
      data: balance
    });

  } catch (error) {
    console.error('Get leave balance error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to retrieve leave balance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}