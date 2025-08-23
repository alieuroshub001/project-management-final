// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyPassword, createOTPRecord } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { IApiResponse } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
  employeeId?: string; // For account activation after approval
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      employeeId?: string;
      isApproved: boolean;
      accountActivated: boolean;
      emailVerified: boolean;
    };
    requiresActivation?: boolean;
    requiresEmailVerification?: boolean;
    requiresApproval?: boolean;
    canProceedToLogin?: boolean;
    otpSentTo?: string;
  };
  error?: string;
}

// Helper function to send verification OTP
const sendVerificationOTP = async (userEmail: string, userRole: string) => {
  try {
    const { otp, recipientEmail } = await createOTPRecord(userEmail, userRole, 'verification');
    await sendOTPEmail(recipientEmail, otp, 'verification');
    return { success: true, recipientEmail };
  } catch (error) {
    console.error('Failed to send verification OTP:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body: LoginRequest = await request.json();
    const { email, password, employeeId } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Email and password are required',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!user) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'No user found with this email address',
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Invalid password',
      }, { status: 401 });
    }

    // Check email verification status
    if (!user.emailVerified) {
      const otpResult = await sendVerificationOTP(user.email, user.role);
      
      if (otpResult.success) {
        return NextResponse.json<LoginResponse>({
          success: false,
          message: 'Please verify your email first. A new verification OTP has been sent.',
          data: {
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              employeeId: user.employeeId,
              isApproved: user.isApproved,
              accountActivated: user.accountActivated,
              emailVerified: user.emailVerified,
            },
            requiresEmailVerification: true,
            canProceedToLogin: false,
            otpSentTo: otpResult.recipientEmail,
          },
        }, { status: 403 });
      } else {
        return NextResponse.json<LoginResponse>({
          success: false,
          message: 'Email verification required. Please try requesting a verification OTP.',
          data: {
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              employeeId: user.employeeId,
              isApproved: user.isApproved,
              accountActivated: user.accountActivated,
              emailVerified: user.emailVerified,
            },
            requiresEmailVerification: true,
            canProceedToLogin: false,
          },
        }, { status: 403 });
      }
    }

    // Check approval status (admin is auto-approved)
    if (!user.isApproved) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval before logging in.',
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            isApproved: user.isApproved,
            accountActivated: user.accountActivated,
            emailVerified: user.emailVerified,
          },
          requiresApproval: true,
          canProceedToLogin: false,
        },
      }, { status: 403 });
    }

    // Check account activation status for HR/Employee roles
    if (!user.accountActivated) {
      // If employee ID is provided, attempt activation
      if (employeeId) {
        // Validate that the provided employee ID matches the one assigned by admin
        if (user.employeeId && user.employeeId === employeeId.trim()) {
          // Activate the account
          user.accountActivated = true;
          user.updatedAt = new Date();
          await user.save();

          return NextResponse.json<LoginResponse>({
            success: true,
            message: 'Account activated successfully! You can now proceed to login.',
            data: {
              user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                isApproved: user.isApproved,
                accountActivated: true,
                emailVerified: user.emailVerified,
              },
              canProceedToLogin: true,
            },
          }, { status: 200 });
        } else {
          return NextResponse.json<LoginResponse>({
            success: false,
            message: 'Invalid employee ID. Please check the employee ID provided by your administrator.',
            data: {
              user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                isApproved: user.isApproved,
                accountActivated: user.accountActivated,
                emailVerified: user.emailVerified,
              },
              requiresActivation: true,
              canProceedToLogin: false,
            },
          }, { status: 400 });
        }
      } else {
        // No employee ID provided, request activation
        return NextResponse.json<LoginResponse>({
          success: false,
          message: 'Please activate your account using the employee ID provided by your administrator.',
          data: {
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              employeeId: user.employeeId,
              isApproved: user.isApproved,
              accountActivated: user.accountActivated,
              emailVerified: user.emailVerified,
            },
            requiresActivation: true,
            canProceedToLogin: false,
          },
        }, { status: 403 });
      }
    }

    // All checks passed - user can proceed with login
    return NextResponse.json<LoginResponse>({
      success: true,
      message: 'Login credentials verified. You can now proceed to login.',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          isApproved: user.isApproved,
          accountActivated: user.accountActivated,
          emailVerified: user.emailVerified,
        },
        canProceedToLogin: true,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        return NextResponse.json<LoginResponse>({
          success: false,
          message: 'Database connection error. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        }, { status: 503 });
      }
    }

    return NextResponse.json<LoginResponse>({
      success: false,
      message: 'An internal server error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
    }, { status: 500 });
  }
}

// Resend verification OTP endpoint
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Email is required',
      }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'No user found with this email address',
      }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Email is already verified',
      }, { status: 400 });
    }

    // Send new verification OTP
    const otpResult = await sendVerificationOTP(user.email, user.role);
    
    if (otpResult.success) {
      return NextResponse.json<IApiResponse>({
        success: true,
        message: `Verification OTP has been sent to ${otpResult.recipientEmail}`,
        data: {
          otpSentTo: otpResult.recipientEmail,
        },
      }, { status: 200 });
    } else {
      return NextResponse.json<IApiResponse>({
        success: false,
        message: 'Failed to send verification OTP. Please try again.',
        error: otpResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json<IApiResponse>({
      success: false,
      message: 'Failed to resend verification OTP',
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