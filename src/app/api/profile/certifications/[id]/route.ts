// app/api/profile/certifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IProfileApiResponse } from '@/types/profile';

// DELETE - Delete certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    // Await the params promise
    const resolvedParams = await params;
    const certificationId = resolvedParams.id;

    await connectToDatabase();

    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    if (!profile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found'
      }, { status: 404 });
    }

    // Find and remove certification
    const initialLength = profile.certifications?.length || 0;
    profile.certifications = profile.certifications?.filter(cert => cert.id !== certificationId) || [];

    if (profile.certifications.length === initialLength) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Certification not found'
      }, { status: 404 });
    }

    await profile.save();

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Certification deleted successfully'
    });

  } catch (error) {
    console.error('Delete certification error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to delete certification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}