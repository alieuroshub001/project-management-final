// app/api/profile/education/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IProfileApiResponse } from '@/types/profile';

interface Params {
  id: string;
}

// DELETE - Delete education entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    if (!profile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found'
      }, { status: 404 });
    }

    const educationId = params.id;

    // Find and remove education entry
    const initialLength = profile.education?.length || 0;
    profile.education = profile.education?.filter(edu => edu.id !== educationId) || [];

    if (profile.education.length === initialLength) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Education entry not found'
      }, { status: 404 });
    }

    await profile.save();

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Education entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete education error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to delete education entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}