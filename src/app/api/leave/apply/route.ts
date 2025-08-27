// app/api/leave/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Leave, { ILeaveDocument } from '@/models/Leave';
import LeaveBalance from '@/models/LeaveBalance';
import { ILeaveCreateRequest, ILeaveApiResponse, ILeave } from '@/types/leave';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to ILeave
function convertToILeave(doc: ILeaveDocument): ILeave {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    employeeId: doc.employeeId.toString(),
    employeeName: doc.employeeName,
    employeeEmail: doc.employeeEmail,
    employeeMobile: doc.employeeMobile,
    leaveType: doc.leaveType as any,
    startDate: doc.startDate,
    endDate: doc.endDate,
    totalDays: doc.totalDays,
    reason: doc.reason,
    status: doc.status as any,
    reviewedBy: doc.reviewedBy?.toString(),
    reviewedByName: doc.reviewedByName,
    reviewedAt: doc.reviewedAt,
    reviewComments: doc.reviewComments,
    emergencyContact: doc.emergencyContact,
    handoverNotes: doc.handoverNotes,
    attachments: doc.attachments,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();
    const body: ILeaveCreateRequest = await request.json();
    
    const { leaveType, startDate, endDate, reason, emergencyContact, handoverNotes, cloudinaryAttachments } = body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json<ILeaveApiResponse>({
        success: false,
        message: 'Leave type, dates, and reason are required'
      }, { status: 400 });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.getOrCreate(session.user.id, currentYear);
    
    // Add balance validation logic here based on leaveType

    // Create leave application
    const leave = await Leave.create({
      employeeId: session.user.id,
      employeeName: session.user.name,
      employeeEmail: session.user.email,
      employeeMobile: session.user.mobile,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      emergencyContact,
      handoverNotes,
      attachments: cloudinaryAttachments || [],
      status: 'pending'
    }) as ILeaveDocument;

    return NextResponse.json<ILeaveApiResponse<ILeave>>({
      success: true,
      message: 'Leave application submitted successfully',
      data: convertToILeave(leave)
    });

  } catch (error) {
    console.error('Leave application error:', error);
    return NextResponse.json<ILeaveApiResponse>({
      success: false,
      message: 'Failed to submit leave application',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}