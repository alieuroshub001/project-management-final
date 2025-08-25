// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { hashPassword, createOTPRecord } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { ISignupForm, IApiResponse } from '@/types';

// Email validation helper
const validateEmail = (email: string, role: string): { isValid: boolean; isDomainRestricted: boolean; requiredDomain?: string } => {
  // Basic email format validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return { isValid: false, isDomainRestricted: false };
  }
  
  // Domain restriction for hr and employee roles
  if (role === 'hr' || role === 'employee') {
    const isValidDomain = email.endsWith('@euroshub.gmail.com');
    return { 
      isValid: isValidDomain, 
      isDomainRestricted: true, 
      requiredDomain: '@euroshub.gmail.com' 
    };
  }
  
  // Admin can use any valid email
  return { isValid: true, isDomainRestricted: false };
};

// Mobile number validation for Pakistan format
const validateMobileNumber = (mobile: string): boolean => {
  return /^\+92[0-9]{10}$/.test(mobile);
};

// Password strength validation
const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  // Add more password rules if needed
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: ISignupForm = await request.json();
    const { name, email, password, confirmPassword, role, mobileNumber, employeeId } = body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword || !role || !mobileNumber) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'All fields are required',
      }, { status: 400 });
    }

    // Validate role
    if (!['admin', 'hr', 'employee'].includes(role)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid role specified',
      }, { status: 400 });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Passwords do not match',
      }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: passwordValidation.message || 'Invalid password',
      }, { status: 400 });
    }

    // Validate email format and domain restrictions
    const emailValidation = validateEmail(email.toLowerCase().trim(), role);
    if (!emailValidation.isValid) {
      const message = emailValidation.isDomainRestricted 
        ? `${role.toUpperCase()} accounts must use ${emailValidation.requiredDomain} email domain`
        : 'Invalid email format';
      
      return NextResponse.json<IApiResponse>({
        success: false,
        message,
      }, { status: 400 });
    }

    // Validate mobile number
    if (!validateMobileNumber(mobileNumber)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid mobile number format. Use: +92xxxxxxxxxx',
      }, { status: 400 });
    }

    // For admin role, validate employee ID is provided
    if (role === 'admin' && !employeeId) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee ID is required for admin accounts',
      }, { status: 400 });
    }

    // For hr/employee roles, employee ID should not be provided during signup
    if ((role === 'hr' || role === 'employee') && employeeId) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Employee ID will be assigned after admin approval',
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'User with this email already exists',
      }, { status: 400 });
    }

    // Check if employee ID is already taken (for admin)
    if (role === 'admin' && employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'Employee ID already exists',
        }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      mobileNumber,
      emailVerified: false,
      // Admin gets employee ID immediately, others get it after approval
      ...(role === 'admin' && employeeId && { employeeId }),
      // Admin is auto-approved and activated, others need approval
      isApproved: role === 'admin',
      accountActivated: role === 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create user
    const newUser = await User.create(userData);

    // Generate and send OTP for email verification
    try {
      const { otp, recipientEmail } = await createOTPRecord(
        newUser.email,
        newUser.role,
        'verification'
      );

      await sendOTPEmail(recipientEmail, otp, 'verification');

      // Success response based on role
      let successMessage: string;
      
      if (role === 'admin') {
        successMessage = 'Admin account created successfully! Please verify your email with the OTP sent to the admin email.';
      } else {
        successMessage = `Account created successfully! Please verify your email with the OTP sent to ${recipientEmail}. Your account is pending admin approval.`;
      }

      return NextResponse.json<IApiResponse>({
        success: true,
        message: successMessage,
        data: {
          userId: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          isApproved: newUser.isApproved,
          accountActivated: newUser.accountActivated,
          requiresApproval: role !== 'admin',
          otpSentTo: recipientEmail,
        },
      }, { status: 201 });

    } catch (otpError) {
      // If OTP sending fails, we should still inform about successful user creation
      // but mention the OTP issue
      console.error('OTP sending failed:', otpError);
      
      return NextResponse.json<IApiResponse>({
        success: true,
        message: 'Account created successfully, but there was an issue sending the verification email. Please try requesting a new OTP.',
        data: {
          userId: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          isApproved: newUser.isApproved,
          accountActivated: newUser.accountActivated,
          requiresApproval: role !== 'admin',
          otpSendingFailed: true,
        },
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      // Handle duplicate key error
      if (error.message.includes('duplicate key error')) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'User with this email or employee ID already exists',
        }, { status: 400 });
      }
      
      // Handle validation errors
      if (error.message.includes('validation failed')) {
        return NextResponse.json<IApiResponse>({
          success: false,
          message: 'Validation failed. Please check your input data.',
          error: error.message,
        }, { status: 400 });
      }
    }

    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Internal server error occurred during signup',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed',
  }, { status: 405 });
}