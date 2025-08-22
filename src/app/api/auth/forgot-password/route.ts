// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { createOTPRecord } from '@/lib/auth';
import User from '@/models/User';
import { IApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email } = await request.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'If an account exists with this email, a password reset OTP has been sent'
      }, { status: 200 }); // Changed to 200 to prevent email enumeration
    }

    // Generate and send OTP
    await createOTPRecord(email, 'password-reset');

    return NextResponse.json<IApiResponse>({
      success: true,
      message: 'Password reset OTP sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}