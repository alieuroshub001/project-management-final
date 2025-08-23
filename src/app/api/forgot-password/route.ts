// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createOTPRecord, verifyOTP, hashPassword } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { IApiResponse } from '@/types';

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResendOTPRequest {
  email: string;
}

// Password strength validation
const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
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

// Helper function to send password reset OTP
const sendPasswordResetOTP = async (userEmail: string, userRole: string) => {
  try {
    const { otp, recipientEmail } = await createOTPRecord(userEmail, userRole, 'password-reset');
    await sendOTPEmail(recipientEmail, otp, 'password-reset');
    return { success: true, recipientEmail };
  } catch (error) {
    console.error('Failed to send password reset OTP:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// POST: Initiate password reset (send OTP)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Email address is required',
      }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Please provide a valid email address',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json<IApiResponse>({
        success: true,
        message: 'If an account with this email exists, you will receive password reset instructions.',
      }, { status: 200 });
    }

    // Check if user's email is verified
    if (!user.emailVerified) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Please verify your email address first before requesting a password reset.',
      }, { status: 403 });
    }

    // Check if user account is approved (admin is auto-approved)
    if (!user.isApproved) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Your account is pending approval. Password reset is not available for pending accounts.',
      }, { status: 403 });
    }

    // Send password reset OTP
    const otpResult = await sendPasswordResetOTP(user.email, user.role);
    
    if (otpResult.success) {
      return NextResponse.json<IApiResponse>({
        success: true,
        message: `Password reset OTP has been sent to ${otpResult.recipientEmail}. The OTP will expire in 10 minutes.`,
        data: {
          email: user.email,
          role: user.role,
          otpSentTo: otpResult.recipientEmail,
          expiresIn: '10 minutes'
        },
      }, { status: 200 });
    } else {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Failed to send password reset OTP. Please try again.',
        error: otpResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'An internal server error occurred while processing your request',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// PUT: Reset password with OTP
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: ResetPasswordRequest = await request.json();
    const { email, otp, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Email, OTP, and both password fields are required',
      }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Please provide a valid email address',
      }, { status: 400 });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'New password and confirmation password do not match',
      }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: passwordValidation.message || 'Password does not meet requirements',
      }, { status: 400 });
    }

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid OTP format. OTP should be 6 digits.',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid email address',
      }, { status: 400 });
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(user.email, otp, 'password-reset');
    if (!isValidOTP) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid or expired OTP. Please request a new password reset.',
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json<IApiResponse>({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
      data: {
        email: user.email,
        resetAt: new Date().toISOString()
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'An internal server error occurred while resetting your password',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// PATCH: Resend password reset OTP
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: ResendOTPRequest = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Email address is required',
      }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Please provide a valid email address',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json<IApiResponse>({
        success: true,
        message: 'If an account with this email exists, a new OTP has been sent.',
      }, { status: 200 });
    }

    // Check if user's email is verified
    if (!user.emailVerified) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Please verify your email address first before requesting a password reset.',
      }, { status: 403 });
    }

    // Check if user account is approved
    if (!user.isApproved) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Your account is pending approval. Password reset is not available for pending accounts.',
      }, { status: 403 });
    }

    // Send new password reset OTP
    const otpResult = await sendPasswordResetOTP(user.email, user.role);
    
    if (otpResult.success) {
      return NextResponse.json<IApiResponse>({
        success: true,
        message: `A new password reset OTP has been sent to ${otpResult.recipientEmail}`,
        data: {
          email: user.email,
          otpSentTo: otpResult.recipientEmail,
          expiresIn: '10 minutes'
        },
      }, { status: 200 });
    } else {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Failed to send new password reset OTP. Please try again.',
        error: otpResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to resend password reset OTP',
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

export async function DELETE() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed',
  }, { status: 405 });
}