// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { createOTPRecord, hashPassword } from '@/lib/auth';
import User from '@/models/User';
import { IApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'User already exists'
      }, { status: 400 });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false
    });

    // Generate and send OTP
    await createOTPRecord(email, 'verification');

    return NextResponse.json<IApiResponse>({
      success: true,
      message: 'User created. Please check your email for verification OTP.',
      data: { userId: newUser._id }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}