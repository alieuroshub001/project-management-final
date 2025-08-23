// app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createOTPRecord } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { IApiResponse } from '@/types';

interface ResendOTPRequest {
  email: string;
  type: 'verification' | 'password-reset';
}

interface ResendOTPResponse extends IApiResponse {
  data?: {
    email: string;
    type: 'verification' | 'password-reset';
    otpSentTo: string;
    expiresIn: string;
    resentAt: string;
    userRole?: string;
  };
}

// Helper function to send OTP based on type
const sendOTPByType = async (userEmail: string, userRole: string, type: 'verification' | 'password-reset') => {
  try {
    const { otp, recipientEmail } = await createOTPRecord(userEmail, userRole, type);
    await sendOTPEmail(recipientEmail, otp, type);
    return { success: true, recipientEmail };
  } catch (error) {
    console.error(`Failed to send ${type} OTP:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// POST: Resend OTP for email verification or password reset
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: ResendOTPRequest = await request.json();
    const { email, type } = body;

    // Validate required fields
    if (!email || !type) {
      return NextResponse.json<ResendOTPResponse>({
        success: false,
        message: 'Email and OTP type are required',
      }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json<ResendOTPResponse>({
        success: false,
        message: 'Please provide a valid email address',
      }, { status: 400 });
    }

    // Validate OTP type
    if (!['verification', 'password-reset'].includes(type)) {
      return NextResponse.json<ResendOTPResponse>({
        success: false,
        message: 'Invalid OTP type. Must be either "verification" or "password-reset"',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      // For security reasons, handle differently based on OTP type
      if (type === 'password-reset') {
        // Don't reveal if email exists for password reset
        return NextResponse.json<ResendOTPResponse>({
          success: true,
          message: 'If an account with this email exists, a new password reset OTP has been sent.',
        }, { status: 200 });
      } else {
        // For verification, we can be more specific
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'No user found with this email address',
        }, { status: 404 });
      }
    }

    // Type-specific validations and logic
    if (type === 'verification') {
      // Email verification OTP
      if (user.emailVerified) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Email is already verified. No need to resend verification OTP.',
        }, { status: 400 });
      }

      // Send verification OTP
      const otpResult = await sendOTPByType(user.email, user.role, 'verification');
      
      if (otpResult.success) {
        return NextResponse.json<ResendOTPResponse>({
          success: true,
          message: `Email verification OTP has been resent to ${otpResult.recipientEmail}`,
          data: {
            email: user.email,
            type: 'verification',
            otpSentTo: otpResult.recipientEmail,
            expiresIn: '10 minutes',
            resentAt: new Date().toISOString(),
            userRole: user.role,
          },
        }, { status: 200 });
      } else {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Failed to send email verification OTP. Please try again later.',
          error: otpResult.error,
        }, { status: 500 });
      }
    } 
    
    else if (type === 'password-reset') {
      // Password reset OTP
      if (!user.emailVerified) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Please verify your email address first before requesting password reset OTP.',
        }, { status: 403 });
      }

      if (!user.isApproved) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Your account is pending admin approval. Password reset is not available for pending accounts.',
        }, { status: 403 });
      }

      // Send password reset OTP
      const otpResult = await sendOTPByType(user.email, user.role, 'password-reset');
      
      if (otpResult.success) {
        return NextResponse.json<ResendOTPResponse>({
          success: true,
          message: `Password reset OTP has been resent to ${otpResult.recipientEmail}`,
          data: {
            email: user.email,
            type: 'password-reset',
            otpSentTo: otpResult.recipientEmail,
            expiresIn: '10 minutes',
            resentAt: new Date().toISOString(),
            userRole: user.role,
          },
        }, { status: 200 });
      } else {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Failed to send password reset OTP. Please try again later.',
          error: otpResult.error,
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Database connection error. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        }, { status: 503 });
      }
    }

    return NextResponse.json<ResendOTPResponse>({
      success: false,
      message: 'An internal server error occurred while resending OTP',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// GET: Check OTP resend eligibility (optional feature)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type') as 'verification' | 'password-reset' | null;

    if (!email || !type) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Email and type parameters are required',
      }, { status: 400 });
    }

    if (!['verification', 'password-reset'].includes(type)) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Invalid type parameter',
      }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'User not found',
      }, { status: 404 });
    }

    let canResend = false;
    let reason = '';

    if (type === 'verification') {
      if (user.emailVerified) {
        reason = 'Email is already verified';
      } else {
        canResend = true;
      }
    } else if (type === 'password-reset') {
      if (!user.emailVerified) {
        reason = 'Email must be verified first';
      } else if (!user.isApproved) {
        reason = 'Account is pending approval';
      } else {
        canResend = true;
      }
    }

    return NextResponse.json<IApiResponse>({
      success: true,
      message: canResend ? 'OTP can be resent' : 'OTP cannot be resent',
      data: {
        canResend,
        reason: canResend ? undefined : reason,
        email: user.email,
        type,
        userRole: user.role,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Check resend eligibility error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to check OTP resend eligibility',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed. Use POST to resend OTP.',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed. Use POST to resend OTP.',
  }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json<IApiResponse>({
    success: false,
    message: 'Method not allowed. Use POST to resend OTP.',
  }, { status: 405 });
}