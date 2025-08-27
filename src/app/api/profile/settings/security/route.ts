// app/api/profile/settings/security/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { IProfileApiResponse } from '@/types/profile';

// PUT - Change password
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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Current password and new password are required'
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'New password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Get user with password
    const user = await User.findById(session.user.id).select('+password');
    if (!user) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await User.findByIdAndUpdate(session.user.id, {
      password: hashedNewPassword,
      confirmPassword: hashedNewPassword
    });

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}