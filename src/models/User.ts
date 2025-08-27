import mongoose, { Schema, Model, ValidatorProps } from 'mongoose';
import { IUserWithPassword } from '@/types';

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => /\S+@\S+\.\S+/.test(v),
      message: (props: ValidatorProps) => `${props.value} is not a valid email!`
    }
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => /^\+92\d{10}$/.test(v),
      message: (props: ValidatorProps) => `${props.value} is not a valid mobile number! Must start with +92 followed by 10 digits.`
    }
  },
  password: { type: String, required: true, select: false },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function(this: any, v: string) {
        return v === this.password;
      },
      message: 'Passwords do not match!'
    }
  },
  role: {
    type: String,
    enum: ['employee'],
    default: 'employee'
  },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const User: Model<IUserWithPassword> =
  mongoose.models.User || mongoose.model<IUserWithPassword>('User', UserSchema);

export default User;