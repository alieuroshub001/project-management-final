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

export async function sendVerificationEmail(
  email: string,
  token: string,
  role: string
): Promise<IApiResponse> {
  const subject = 'Email Verification';
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p style="font-size: 16px;">Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
          Verify Email
        </a>
      </div>
      ${role === 'admin' ? '<p style="font-size: 14px; color: #666;"><em>This is an admin account verification.</em></p>' : ''}
      <p style="font-size: 14px; color: #666;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

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

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: 'verification' | 'password-reset',
  role?: string
): Promise<IApiResponse> {
  const subject =
    type === 'verification'
      ? 'Email Verification OTP'
      : 'Password Reset OTP';

  // Get recipient email based on role
  const recipientEmail = role === 'admin' ? (process.env.ADMIN_EMAIL || email) : email;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <h2 style="color: #333;">${subject}</h2>
      ${role === 'admin' ? '<p style="font-size: 14px; color: #666;"><em>This is an admin account request.</em></p>' : ''}
      <p style="font-size: 16px;">Your OTP code is:</p>
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center; font-size: 24px; letter-spacing: 2px;">
        <strong>${otp}</strong>
      </div>
      <p style="font-size: 14px; color: #666;">
        This OTP is valid for 15 minutes. Please do not share it with anyone.
      </p>
      ${
        type === 'password-reset'
          ? '<p style="font-size: 14px; color: #666;">If you didn\'t request this password reset, please ignore this email.</p>'
          : ''
      }
    </div>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}

export function getOTPRecipientEmail(role: string, userEmail: string): string {
  if (role === 'admin') {
    return process.env.ADMIN_EMAIL || userEmail;
  }
  return userEmail;
}