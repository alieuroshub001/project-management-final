// utils/emailValidation.ts
import { EmailValidationResult } from "@/types";

export function validateEmailForRole(email: string, role: 'admin' | 'hr' | 'employee'): EmailValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (role === 'hr' || role === 'employee') {
    const requiredDomain = 'euroshub@gmail.com';
    if (!email.endsWith(requiredDomain)) {
      return { 
        isValid: false, 
        error: `Email must end with ${requiredDomain} for ${role} role` 
      };
    }
  }

  return { isValid: true };
}

export function getOTPRecipientEmail(role: 'admin' | 'hr' | 'employee', userEmail: string): string {
  if (role === 'admin') {
    return process.env.ADMIN_EMAIL || userEmail;
  }
  return userEmail;
}