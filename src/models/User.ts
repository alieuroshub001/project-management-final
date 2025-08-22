// models/User.ts
import mongoose, { Schema, Model, ValidatorProps } from 'mongoose';
import { IUserWithPassword } from '@/types';

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(this: any, v: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) return false;
        
        // Role-based email validation
        if (this.role === 'hr' || this.role === 'employee') {
          return v.endsWith('euroshub@gmail.com');
        }
        return true; // Admin can have any email
      },
      message: (props: ValidatorProps) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.value as string)) {
          return `${props.value} is not a valid email!`;
        }
        return 'HR and Employee emails must end with euroshub@gmail.com';
      }
    }
  },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['admin', 'hr', 'employee'],
    default: 'admin'
  },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function (next: () => void) {
  this.updatedAt = new Date();
  next();
});

// Static method to get OTP recipient email based on role
UserSchema.statics.getOTPRecipientEmail = function(role: string, userEmail: string): string {
  if (role === 'admin') {
    return process.env.ADMIN_EMAIL || userEmail;
  }
  return userEmail;
};

const User: Model<IUserWithPassword> =
  mongoose.models.User || mongoose.model<IUserWithPassword>('User', UserSchema);

export default User;