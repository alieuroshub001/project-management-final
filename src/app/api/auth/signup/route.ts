// app/api/employee/auth/signup/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { createOTPRecord, hashPassword } from '@/lib/auth';
import User from '@/models/User';
import { IApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, email, mobile, password, confirmPassword } = await request.json();

    // Validate input
    if (!name || !email || !mobile || !password || !confirmPassword) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // Validate mobile format
    const mobileRegex = /^\+92\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Mobile number must start with +92 followed by 10 digits'
      }, { status: 400 });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Passwords do not match'
      }, { status: 400 });
    }

    // Check if user exists with email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'User already exists with this email'
      }, { status: 400 });
    }

    // Check if user exists with mobile
    const existingUserByMobile = await User.findOne({ mobile });
    if (existingUserByMobile) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'User already exists with this mobile number'
      }, { status: 400 });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      confirmPassword: hashedPassword, // Store hashed confirm password (validation is handled by model)
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