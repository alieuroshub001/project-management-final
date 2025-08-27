// app/api/profile/settings/two-factor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IProfileApiResponse } from '@/types/profile';

// PUT - Toggle two-factor authentication
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

    const { enabled } = await request.json();

    // Update two-factor setting
    if (!profile.settings) {
      profile.settings = {};
    }

    profile.settings.twoFactorEnabled = enabled;
    await profile.save();

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Toggle two-factor error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update two-factor authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}