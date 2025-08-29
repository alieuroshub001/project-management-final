// app/api/leave/balance/route.ts
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
    
    // Fixed: Properly map all the fields from the document
    const balance: ILeaveBalance = {
      id: balanceDoc._id?.toString() || balanceDoc.id?.toString() || '',
      employeeId: balanceDoc.employeeId?.toString() || '',
      year: balanceDoc.year,
      // Map all leave types properly
      annualLeave: balanceDoc.annualLeave || 0,
      sickLeave: balanceDoc.sickLeave || 0,
      casualLeave: balanceDoc.casualLeave || 0,
      maternityLeave: balanceDoc.maternityLeave || 0,
      paternityLeave: balanceDoc.paternityLeave || 0,
      unpaidLeave: balanceDoc.unpaidLeave || 0,
      compensatoryLeave: balanceDoc.compensatoryLeave || 0,
      bereavementLeave: balanceDoc.bereavementLeave || 0,
      sabbaticalLeave: balanceDoc.sabbaticalLeave || 0,
      halfDayLeave: balanceDoc.halfDayLeave || 0,
      shortLeave: balanceDoc.shortLeave || 0,
      // Map all used leave types
      usedAnnualLeave: balanceDoc.usedAnnualLeave || 0,
      usedSickLeave: balanceDoc.usedSickLeave || 0,
      usedCasualLeave: balanceDoc.usedCasualLeave || 0,
      usedMaternityLeave: balanceDoc.usedMaternityLeave || 0,
      usedPaternityLeave: balanceDoc.usedPaternityLeave || 0,
      usedUnpaidLeave: balanceDoc.usedUnpaidLeave || 0,
      usedCompensatoryLeave: balanceDoc.usedCompensatoryLeave || 0,
      usedBereavementLeave: balanceDoc.usedBereavementLeave || 0,
      usedSabbaticalLeave: balanceDoc.usedSabbaticalLeave || 0,
      usedHalfDayLeave: balanceDoc.usedHalfDayLeave || 0,
      usedShortLeave: balanceDoc.usedShortLeave || 0,
      createdAt: balanceDoc.createdAt || new Date(),
      updatedAt: balanceDoc.updatedAt || new Date()
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