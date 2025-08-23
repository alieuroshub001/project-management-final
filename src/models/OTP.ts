import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { IOTP } from '@/types';

// Interface for OTP document - use _id instead of id to match Mongoose
interface IOTPDocument extends Omit<IOTP, 'id'>, Document {
  _id: Types.ObjectId;
}

// Interface for OTP static methods
interface IOTPModel extends Model<IOTPDocument> {
  generateOTP(): string;
  getOTPRecipientEmail(userEmail: string, userRole: string): string;
  createOTP(userEmail: string, userRole: string, type: 'verification' | 'password-reset'): Promise<{ otp: string; recipientEmail: string }>;
  verifyOTP(userEmail: string, otp: string, type: 'verification' | 'password-reset'): Promise<boolean>;
  cleanupExpiredOTPs(): Promise<void>;
}

const OTPSchema: Schema<IOTPDocument> = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['verification', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // OTP expires in 10 minutes
      return new Date(Date.now() + 10 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create TTL index for automatic document deletion
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create compound index for faster queries
OTPSchema.index({ email: 1, type: 1 });

// Static method to generate OTP
OTPSchema.statics.generateOTP = function(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to get the correct email address for OTP sending
OTPSchema.statics.getOTPRecipientEmail = function(userEmail: string, userRole: string): string {
  // For admin role, send OTP to admin email from environment variable
  if (userRole === 'admin') {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL not configured in environment variables');
    }
    return adminEmail;
  }
  
  // For hr and employee roles, send to their own email
  return userEmail;
};

// Static method to create and save OTP
OTPSchema.statics.createOTP = async function(
  userEmail: string, 
  userRole: string, 
  type: 'verification' | 'password-reset'
): Promise<{ otp: string; recipientEmail: string }> {
  const OTPModel = this as IOTPModel;
  const otp = OTPModel.generateOTP();
  const recipientEmail = OTPModel.getOTPRecipientEmail(userEmail, userRole);
  
  // Delete any existing OTP for this email and type
  await OTPModel.deleteMany({ email: userEmail, type });
  
  // Create new OTP record (stored with user's email, but sent to recipient email)
  await OTPModel.create({
    email: userEmail, // Store with user's email for verification
    otp,
    type,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
  
  return { otp, recipientEmail };
};

// Static method to verify OTP
OTPSchema.statics.verifyOTP = async function(
  userEmail: string, 
  otp: string, 
  type: 'verification' | 'password-reset'
): Promise<boolean> {
  const OTPModel = this as IOTPModel;
  const otpRecord = await OTPModel.findOne({
    email: userEmail,
    otp,
    type,
    expiresAt: { $gt: new Date() }
  });
  
  if (otpRecord) {
    // Delete the used OTP
    await OTPModel.deleteOne({ _id: otpRecord._id });
    return true;
  }
  
  return false;
};

// Static method to cleanup expired OTPs (optional - TTL index handles this automatically)
OTPSchema.statics.cleanupExpiredOTPs = async function(): Promise<void> {
  const OTPModel = this as IOTPModel;
  await OTPModel.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Add a virtual 'id' field to match IOTP interface
OTPSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtual fields are serialized
OTPSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret.id;
  }
});

const OTP: IOTPModel = 
  (mongoose.models.OTP as IOTPModel) || mongoose.model<IOTPDocument, IOTPModel>('OTP', OTPSchema);

export default OTP;