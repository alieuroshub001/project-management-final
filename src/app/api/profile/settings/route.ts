// app/api/profile/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IProfileApiResponse } from '@/types/profile';

// GET - Get user settings
export async function GET(request: NextRequest) {
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

    // Return settings data (you can extend this based on your settings model)
    const settings = {
      notifications: {
        emailNotifications: profile.settings?.emailNotifications ?? true,
        pushNotifications: profile.settings?.pushNotifications ?? true,
        profileUpdates: profile.settings?.profileUpdates ?? true,
        teamAnnouncements: profile.settings?.teamAnnouncements ?? true,
        birthdayReminders: profile.settings?.birthdayReminders ?? true,
        workAnniversaries: profile.settings?.workAnniversaries ?? true,
      },
      privacy: {
        profileVisibility: profile.settings?.profileVisibility ?? 'public',
        showEmail: profile.settings?.showEmail ?? true,
        showMobile: profile.settings?.showMobile ?? false,
        showBirthday: profile.settings?.showBirthday ?? true,
        showWorkAnniversary: profile.settings?.showWorkAnniversary ?? true,
      },
      twoFactorEnabled: profile.settings?.twoFactorEnabled ?? false
    };

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to retrieve settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}