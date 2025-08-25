//models/OTP.ts
import mongoose, { Schema, Model } from 'mongoose';
import { IOTP } from '@/types/employee';

const OTPSchema: Schema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['verification', 'password-reset'], 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  createdAt: { type: Date, default: Date.now }
});

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP: Model<IOTP> = 
  mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;