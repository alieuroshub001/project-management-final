// utils/otpUtils.ts
import OTP from '@/models/OTP';
import { sendEmail } from '@/lib/email';

export async function sendOTP(email: string, otp: string, type: 'verification' | 'password-reset', role: string) {
  // Get the actual recipient email based on role
  let recipientEmail = email;
  if (role === 'admin') {
    recipientEmail = process.env.ADMIN_EMAIL || email;
  }

  // Save OTP to database with role information
  await OTP.create({
    email,
    otp,
    type,
    role,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });

  // Send email to the recipient
  const subject = type === 'verification' ? 'Your Verification OTP' : 'Password Reset OTP';
  const html = `
    <div>
      <h2>${subject}</h2>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in 15 minutes.</p>
      ${role === 'admin' ? `<p><em>Note: This OTP was sent to the admin email address.</em></p>` : ''}
    </div>
  `;

  await sendEmail({ to: recipientEmail, subject, html });
}

export async function verifyOTP(email: string, otp: string, type: 'verification' | 'password-reset') {
  const otpRecord = await OTP.findOne({
    email,
    otp,
    type,
    expiresAt: { $gt: new Date() }
  });

  return !!otpRecord;
}