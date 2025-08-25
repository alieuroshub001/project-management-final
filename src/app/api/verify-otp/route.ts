// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyOTP, createOTPRecord } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { IApiResponse } from '@/types';

interface VerifyOTPRequest {
  email: string;
  otp: string;
  type: 'verification' | 'password-reset';
}

interface ResendOTPRequest {
  email: string;
  type: 'verification' | 'password-reset';
}

interface VerifyOTPResponse extends IApiResponse {
  data?: {
    email: string;
    type: 'verification' | 'password-reset';
    verifiedAt: string;
    canProceedToReset?: boolean;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      emailVerified?: boolean;
    };
  };
}

interface ResendOTPResponse extends IApiResponse {
  data?: {
    email: string;
    type: 'verification' | 'password-reset';
    otpSentTo: string;
    expiresIn: string;
    resentAt: string;
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

// POST: Verify OTP (for both email verification and password reset)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: VerifyOTPRequest = await request.json();
    const { email, otp, type } = body;

    // Validate required fields
    if (!email || !otp || !type) {
      return NextResponse.json<VerifyOTPResponse>({
        success: false,
        message: 'Email, OTP, and type are required',
      }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json<VerifyOTPResponse>({
        success: false,
        message: 'Please provide a valid email address',
      }, { status: 400 });
    }

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json<VerifyOTPResponse>({
        success: false,
        message: 'Invalid OTP format. OTP should be 6 digits.',
      }, { status: 400 });
    }

    // Validate type
    if (!['verification', 'password-reset'].includes(type)) {
      return NextResponse.json<VerifyOTPResponse>({
        success: false,
        message: 'Invalid OTP type. Must be either "verification" or "password-reset"',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return NextResponse.json<VerifyOTPResponse>({
        success: false,
        message: 'No user found with this email address',
      }, { status: 404 });
    }

    // Additional validations based on OTP type
    if (type === 'verification') {
      if (user.emailVerified) {
        return NextResponse.json<VerifyOTPResponse>({
          success: false,
          message: 'Email is already verified',
        }, { status: 400 });
      }
    } else if (type === 'password-reset') {
      if (!user.emailVerified) {
        return NextResponse.json<VerifyOTPResponse>({
          success: false,
          message: 'Please verify your email address first before resetting password',
        }, { status: 403 });
      }

      if (!user.isApproved) {
        return NextResponse.json<VerifyOTPResponse>({
          success: false,
          message: 'Your account is pending approval. Password reset is not available for pending accounts.',
        }, { status: 403 });
      }
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(user.email, otp, type);
    
    if (!isValidOTP) {
      return NextResponse.json<VerifyOTPResponse>({
        success: false,
        message: 'Invalid or expired OTP. Please request a new OTP.',
      }, { status: 400 });
    }

    // Handle successful verification based on type
    if (type === 'verification') {
      // Mark email as verified
      user.emailVerified = true;
      user.updatedAt = new Date();
      await user.save();

      return NextResponse.json<VerifyOTPResponse>({
        success: true,
        message: 'Email verified successfully! You can now proceed to login.',
        data: {
          email: user.email,
          type: 'verification',
          verifiedAt: new Date().toISOString(),
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: true,
          },
        },
      }, { status: 200 });

    } else if (type === 'password-reset') {
      // OTP verified for password reset - user can now reset password
      return NextResponse.json<VerifyOTPResponse>({
        success: true,
        message: 'OTP verified successfully! You can now reset your password.',
        data: {
          email: user.email,
          type: 'password-reset',
          verifiedAt: new Date().toISOString(),
          canProceedToReset: true,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      }, { status: 200 });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    
    return NextResponse.json<VerifyOTPResponse>({
      success: false,
      message: 'An internal server error occurred while verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// PATCH: Resend OTP (for both email verification and password reset)
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: ResendOTPRequest = await request.json();
    const { email, type } = body;

    // Validate required fields
    if (!email || !type) {
      return NextResponse.json<ResendOTPResponse>({
        success: false,
        message: 'Email and type are required',
      }, { status: 400 });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json<ResendOTPResponse>({
        success: false,
        message: 'Please provide a valid email address',
      }, { status: 400 });
    }

    // Validate type
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
      // For security, don't reveal if email exists or not for password reset
      if (type === 'password-reset') {
        return NextResponse.json<ResendOTPResponse>({
          success: true,
          message: 'If an account with this email exists, a new OTP has been sent.',
        }, { status: 200 });
      } else {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'No user found with this email address',
        }, { status: 404 });
      }
    }

    // Additional validations based on OTP type
    if (type === 'verification') {
      if (user.emailVerified) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Email is already verified',
        }, { status: 400 });
      }
    } else if (type === 'password-reset') {
      if (!user.emailVerified) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Please verify your email address first before requesting password reset',
        }, { status: 403 });
      }

      if (!user.isApproved) {
        return NextResponse.json<ResendOTPResponse>({
          success: false,
          message: 'Your account is pending approval. Password reset is not available for pending accounts.',
        }, { status: 403 });
      }
    }

    // Send new OTP
    const otpResult = await sendOTPByType(user.email, user.role, type);
    
    if (otpResult.success) {
      const typeLabel = type === 'verification' ? 'Email verification' : 'Password reset';
      
      return NextResponse.json<ResendOTPResponse>({
        success: true,
        message: `${typeLabel} OTP has been sent to ${otpResult.recipientEmail}`,
        data: {
          email: user.email,
          type,
          otpSentTo: otpResult.recipientEmail,
          expiresIn: '10 minutes',
          resentAt: new Date().toISOString(),
        },
      }, { status: 200 });
    } else {
      return NextResponse.json<ResendOTPResponse>({
        success: false,
        message: `Failed to send ${type === 'verification' ? 'verification' : 'password reset'} OTP. Please try again.`,
        error: otpResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    
    return NextResponse.json<ResendOTPResponse>({
      success: false,
      message: 'Failed to resend OTP',
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