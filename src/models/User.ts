import mongoose, { Schema, Model, ValidatorProps, Document, Types } from 'mongoose';
import { IUserWithPassword } from '@/types';

// Define interface for the document - use Omit to remove 'id' from IUserWithPassword
interface IUserDocument extends Omit<IUserWithPassword, 'id'>, Document {
  _id: Types.ObjectId;
  role: 'admin' | 'hr' | 'employee';
  isApproved: boolean;
  accountActivated: boolean;
}

// Email validation function
const validateEmail = (email: string, role: string): boolean => {
  // Basic email format validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return false;
  }
  
  // Domain restriction for hr and employee roles
  if (role === 'hr' || role === 'employee') {
    return email.endsWith('@euroshub.gmail.com');
  }
  
  // Admin can use any valid email
  return true;
};

// Mobile number validation for Pakistan format
const validateMobileNumber = (mobile: string): boolean => {
  // Pakistan mobile number format: +92 followed by 10 digits
  return /^\+92[0-9]{10}$/.test(mobile);
};

const UserSchema: Schema<IUserDocument> = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(this: IUserDocument, v: string) {
        return validateEmail(v, this.role);
      },
      message: function(props: ValidatorProps) {
        return `${props.value} is not a valid email! HR and Employee must use @euroshub.gmail.com email.`;
      }
    }
  },
  password: { 
    type: String, 
    required: true, 
    select: false,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'hr', 'employee'],
    default: 'employee',
    required: true
  },
  mobileNumber: {
    type: String,
    required: true,
    validate: {
      validator: validateMobileNumber,
      message: (props: ValidatorProps) => `${props.value} is not a valid Pakistan mobile number! Use format: +92xxxxxxxxxx`
    }
  },
   employeeId: {
    type: String,
    sparse: true, // Allows null values but ensures uniqueness when present
    validate: {
      validator: function(this: IUserDocument, v: string | null | undefined): boolean {
        // Employee ID is required for hr and employee roles after approval, optional for admin
        if (this.role === 'admin') {
          return true; // Admin doesn't need employee ID
        }
        // For hr/employee, employee ID is required only after approval and activation
        if (this.isApproved && this.accountActivated) {
          return !!v && v.length > 0;
        }
        return true; // Allow empty during signup and before approval
      },
      message: 'Employee ID is required for HR and Employee roles after account activation.'
    }
  } as mongoose.SchemaDefinitionProperty<string>,
  
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  isApproved: {
    type: Boolean,
    default: function(this: IUserDocument) {
      // Admin is auto-approved, others need approval
      return this.role === 'admin';
    }
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function(this: IUserDocument) {
      return this.isApproved && this.role !== 'admin';
    }
  },
  approvedAt: {
    type: Date,
    required: function(this: IUserDocument) {
      return this.isApproved && this.role !== 'admin';
    }
  },
  accountActivated: {
    type: Boolean,
    default: function(this: IUserDocument) {
      // Admin accounts are auto-activated, others need employee ID activation
      return this.role === 'admin';
    }
  },
  verificationToken: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add virtual id field to match IUserWithPassword interface
UserSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    const retObj = ret as any;
    delete retObj._id;
    return retObj;
  }
});

// Pre-save middleware
UserSchema.pre('save', function (this: IUserDocument, next) {
  this.updatedAt = new Date();
  
  // Auto-approve and activate admin accounts
  if (this.role === 'admin') {
    this.isApproved = true;
    this.accountActivated = true;
  }
  
  // Set approval timestamp if being approved
  if (this.isApproved && !this.approvedAt && this.role !== 'admin') {
    this.approvedAt = new Date();
  }
  
  next();
});

// Create indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ employeeId: 1 });
UserSchema.index({ role: 1, isApproved: 1 });
UserSchema.index({ emailVerified: 1 });

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;