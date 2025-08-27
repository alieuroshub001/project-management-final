// app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyOTP, hashPassword } from '@/lib/auth';
import User from '@/models/User';
import { IApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email, otp, type, newPassword } = await request.json();

    // Verify OTP first for both flows
    const isValid = await verifyOTP(email, otp, type);
    if (!isValid) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid or expired OTP'
      }, { status: 400 });
    }

    if (type === 'verification') {
      // Handle email verification
      await User.findOneAndUpdate(
        { email },
        { emailVerified: true }
      );
      
      return NextResponse.json<IApiResponse>({
        success: true,
        message: 'Email verified successfully. You can now login.'
      });
    } 
    else if (type === 'password-reset' && newPassword) {
      // Handle password reset
      const hashedPassword = await hashPassword(newPassword);
      await User.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );
      
      return NextResponse.json<IApiResponse>({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.'
      });
    }
    else {
      // For password reset flow when just verifying OTP without password yet
      return NextResponse.json<IApiResponse>({
        success: true,
        message: 'OTP verified successfully. Please set your new password.'
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}