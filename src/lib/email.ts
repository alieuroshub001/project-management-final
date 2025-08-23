// lib/email.ts
import nodemailer from 'nodemailer';
import { IApiResponse } from '@/types';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the configured transporter
 */
export async function sendEmail(options: EmailOptions): Promise<IApiResponse> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      ...options,
    };

    await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends email verification with token
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<IApiResponse> {
  const subject = 'Email Verification';
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2563eb; margin: 0;">EurosHub</h2>
        <p style="color: #666; font-size: 14px;">Project Management System</p>
      </div>
      
      <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
      
      <p style="font-size: 16px; line-height: 1.6;">
        Thank you for registering with EurosHub! Please click the button below to verify your email address and activate your account.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center;">
        Or copy and paste this link in your browser:<br>
        <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        If you didn't create an account with EurosHub, you can safely ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends OTP email for verification or password reset
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  type: 'verification' | 'password-reset'
): Promise<IApiResponse> {
  const subject = type === 'verification' 
    ? 'EurosHub - Email Verification OTP' 
    : 'EurosHub - Password Reset OTP';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2563eb; margin: 0;">EurosHub</h2>
        <p style="color: #666; font-size: 14px;">Project Management System</p>
      </div>
      
      <h2 style="color: #333; text-align: center;">
        ${type === 'verification' ? 'Email Verification' : 'Password Reset'} Code
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; text-align: center;">
        ${type === 'verification' 
          ? 'Please use the following OTP to verify your email address:' 
          : 'Please use the following OTP to reset your password:'}
      </p>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px; border: 2px dashed #2563eb;">
        <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
        <div style="font-size: 32px; font-weight: 700; color: #2563eb; letter-spacing: 4px; margin: 10px 0;">
          ${otp}
        </div>
        <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>Security Notice:</strong> This OTP is confidential. Please do not share it with anyone.
        </p>
      </div>
      
      ${type === 'password-reset' ? `
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            If you didn't request this password reset, please ignore this email and consider changing your password.
          </p>
        </div>
      ` : ''}
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        This is an automated message from EurosHub Project Management System.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends employee ID assignment email after admin approval
 */
export async function sendEmployeeIdEmail(
  email: string,
  employeeName: string,
  employeeId: string,
  role: 'hr' | 'employee',
  approvedBy: string
): Promise<IApiResponse> {
  const subject = 'EurosHub - Account Approved & Employee ID Assigned';
  const roleTitle = role === 'hr' ? 'HR' : 'Employee';
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2563eb; margin: 0;">EurosHub</h2>
        <p style="color: #666; font-size: 14px;">Project Management System</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; font-size: 24px;">🎉 Account Approved!</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been successfully approved by the administrator</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-top: 0;">Account Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Name:</td>
            <td style="padding: 8px 0; color: #1f2937;">${employeeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Role:</td>
            <td style="padding: 8px 0; color: #1f2937;">${roleTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Approved By:</td>
            <td style="padding: 8px 0; color: #1f2937;">${approvedBy}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px;">Your Employee ID</h3>
        <div style="background: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 6px; margin: 15px 0;">
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 2px; margin-bottom: 5px;">
            ${employeeId}
          </div>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Keep this ID secure - you'll need it for account activation</p>
        </div>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Next Steps - Account Activation</h4>
        <ol style="margin: 0; padding-left: 20px; color: #92400e;">
          <li style="margin-bottom: 8px;">Visit the login page using the button below</li>
          <li style="margin-bottom: 8px;">Enter your email and password</li>
          <li style="margin-bottom: 8px;">When prompted, enter your Employee ID: <strong>${employeeId}</strong></li>
          <li>Your account will be fully activated and ready to use!</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
          Login to Your Account
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">
        Or copy and paste this link in your browser:<br>
        <a href="${loginUrl}" style="color: #2563eb; word-break: break-all;">${loginUrl}</a>
      </p>
      
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          <strong>Important:</strong> Please keep your Employee ID confidential. You will need it to activate your account on first login.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        Welcome to EurosHub Project Management System! If you have any questions, please contact your administrator.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends account rejection email
 */
export async function sendAccountRejectionEmail(
  email: string,
  employeeName: string,
  role: 'hr' | 'employee',
  rejectedBy: string,
  reason?: string
): Promise<IApiResponse> {
  const subject = 'EurosHub - Account Application Update';
  const roleTitle = role === 'hr' ? 'HR' : 'Employee';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2563eb; margin: 0;">EurosHub</h2>
        <p style="color: #666; font-size: 14px;">Project Management System</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; font-size: 24px;">Account Application Status</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">We have an update regarding your account application</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-top: 0;">Application Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Name:</td>
            <td style="padding: 8px 0; color: #1f2937;">${employeeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Applied Role:</td>
            <td style="padding: 8px 0; color: #1f2937;">${roleTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Reviewed By:</td>
            <td style="padding: 8px 0; color: #1f2937;">${rejectedBy}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 30px;">
        <h4 style="margin: 0 0 15px 0; color: #991b1b;">Application Status: Not Approved</h4>
        <p style="margin: 0 0 10px 0; color: #991b1b;">
          Unfortunately, your account application was not approved at this time.
        </p>
        ${reason ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">Reason:</p>
            <p style="margin: 5px 0 0 0; color: #991b1b;">${reason}</p>
          </div>
        ` : ''}
      </div>
      
      <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px;">
        <p style="margin: 0; color: #1e40af;">
          <strong>What's Next?</strong> If you believe this decision was made in error or if you have additional information to provide, 
          please contact your administrator or HR department for further assistance.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        This is an automated message from EurosHub Project Management System. 
        For questions, please contact your administrator.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}