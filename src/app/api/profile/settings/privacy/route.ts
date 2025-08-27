// app/api/profile/settings/privacy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IProfileApiResponse } from '@/types/profile';

// PUT - Update privacy settings
export async function PUT(request: NextRequest) {
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

    const privacySettings = await request.json();

    // Update privacy settings
    if (!profile.settings) {
      profile.settings = {};
    }

    profile.settings = {
      ...profile.settings,
      ...privacySettings
    };

    await profile.save();

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update privacy settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}