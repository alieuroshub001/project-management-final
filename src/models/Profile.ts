// models/Profile.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Profile Settings Interface
interface IProfileSettings {
  // Notification settings
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  profileUpdates?: boolean;
  teamAnnouncements?: boolean;
  birthdayReminders?: boolean;
  workAnniversaries?: boolean;
  
  // Privacy settings - Only public and private
  profileVisibility?: 'public' | 'private';
  showEmail?: boolean;
  showMobile?: boolean;
  showBirthday?: boolean;
  showWorkAnniversary?: boolean;
  
  // Security settings
  twoFactorEnabled?: boolean;
}

// Define the document interface that extends mongoose Document
export interface IEmployeeProfileDocument extends Document {
  employeeId: string;
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  mobile: string;
  dateOfJoining?: Date;
  dateOfBirth?: Date;
  designation?: string;
  department?: string;
  reportingManager?: mongoose.Types.ObjectId;
  reportingManagerName?: string;
  workLocation?: string;
  employmentType: string;
  bio?: string;
  skills?: string[];
  languages?: Array<{
    language: string;
    proficiency: string;
    isPrimary: boolean;
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    grade?: string;
    description?: string;
    attachments?: Array<{
      public_id: string;
      secure_url: string;
      format: string;
      resource_type: string;
      bytes: number;
      width?: number;
      height?: number;
      original_filename: string;
      created_at: string;
    }>;
  }>;
  experience?: Array<{
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
    skillsUsed?: string[];
    achievements?: string[];
    attachments?: Array<{
      public_id: string;
      secure_url: string;
      format: string;
      resource_type: string;
      bytes: number;
      width?: number;
      height?: number;
      original_filename: string;
      created_at: string;
    }>;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    doesNotExpire: boolean;
    credentialId?: string;
    credentialUrl?: string;
    attachments?: Array<{
      public_id: string;
      secure_url: string;
      format: string;
      resource_type: string;
      bytes: number;
      width?: number;
      height?: number;
      original_filename: string;
      created_at: string;
    }>;
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
    isPublic: boolean;
  }>;
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    mobile: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
  }>;
  profileImage?: {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  };
  coverImage?: {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  };
  resume?: {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  };
  settings?: IProfileSettings;
  isProfileComplete: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateCompletionPercentage(): number;
  getFullName(): string;
  getYearsOfService(): number;
  isWorkAnniversary(): boolean;
  isBirthdayToday(): boolean;
  updateCompletionStatus(): void;
}

// Define static methods interface
interface IEmployeeProfileModel extends Model<IEmployeeProfileDocument> {
  findByUserId(userId: string): Promise<IEmployeeProfileDocument | null>;
  findByEmployeeId(employeeId: string): Promise<IEmployeeProfileDocument | null>;
  findByDepartment(department: string): Promise<IEmployeeProfileDocument[]>;
  findBirthdaysThisMonth(): Promise<IEmployeeProfileDocument[]>;
  findWorkAnniversariesThisMonth(): Promise<IEmployeeProfileDocument[]>;
  findIncompleteProfiles(): Promise<IEmployeeProfileDocument[]>;
  searchProfiles(query: string): Promise<IEmployeeProfileDocument[]>;
}

const EmployeeProfileSchema: Schema<IEmployeeProfileDocument> = new Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v: string) => /\S+@\S+\.\S+/.test(v),
      message: 'Email must be valid'
    }
  },
  mobile: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^\+92\d{10}$/.test(v),
      message: 'Mobile number must be valid Pakistani format (+92xxxxxxxxxx)'
    }
  },
  dateOfJoining: {
    type: Date
  },
  dateOfBirth: {
    type: Date
  },
  designation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  reportingManager: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reportingManagerName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  workLocation: {
    type: String,
    trim: true,
    maxlength: 200
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary'],
    default: 'full-time'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'native'],
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  education: [{
    id: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    degree: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    fieldOfStudy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    isCurrent: {
      type: Boolean,
      default: false
    },
    grade: {
      type: String,
      trim: true,
      maxlength: 20
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    attachments: [{
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
      format: { type: String, required: true },
      resource_type: { type: String, required: true },
      bytes: { type: Number, required: true },
      width: { type: Number },
      height: { type: Number },
      original_filename: { type: String, required: true },
      created_at: { type: String, required: true }
    }]
  }],
  experience: [{
    id: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    isCurrent: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    skillsUsed: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    achievements: [{
      type: String,
      trim: true,
      maxlength: 500
    }],
    attachments: [{
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
      format: { type: String, required: true },
      resource_type: { type: String, required: true },
      bytes: { type: Number, required: true },
      width: { type: Number },
      height: { type: Number },
      original_filename: { type: String, required: true },
      created_at: { type: String, required: true }
    }]
  }],
  certifications: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    issuingOrganization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    issueDate: {
      type: Date,
      required: true
    },
    expirationDate: {
      type: Date
    },
    doesNotExpire: {
      type: Boolean,
      default: false
    },
    credentialId: {
      type: String,
      trim: true,
      maxlength: 100
    },
    credentialUrl: {
      type: String,
      trim: true,
      maxlength: 500
    },
    attachments: [{
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
      format: { type: String, required: true },
      resource_type: { type: String, required: true },
      bytes: { type: Number, required: true },
      width: { type: Number },
      height: { type: Number },
      original_filename: { type: String, required: true },
      created_at: { type: String, required: true }
    }]
  }],
  socialLinks: [{
    platform: {
      type: String,
      enum: [
        'linkedin', 'twitter', 'github', 'gitlab', 'facebook',
        'instagram', 'behance', 'dribbble', 'portfolio', 'website', 'other'
      ],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  emergencyContacts: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    mobile: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\+92\d{10}$/.test(v),
        message: 'Emergency contact mobile must be valid Pakistani format'
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /\S+@\S+\.\S+/.test(v);
        },
        message: 'Emergency contact email must be valid'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  profileImage: {
    public_id: { type: String },
    secure_url: { type: String },
    format: { type: String },
    resource_type: { type: String },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String },
    created_at: { type: String }
  },
  coverImage: {
    public_id: { type: String },
    secure_url: { type: String },
    format: { type: String },
    resource_type: { type: String },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String },
    created_at: { type: String }
  },
  resume: {
    public_id: { type: String },
    secure_url: { type: String },
    format: { type: String },
    resource_type: { type: String },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String },
    created_at: { type: String }
  },
  // Settings field with only public/private visibility
  settings: {
    // Notification settings
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    profileUpdates: { type: Boolean, default: true },
    teamAnnouncements: { type: Boolean, default: true },
    birthdayReminders: { type: Boolean, default: true },
    workAnniversaries: { type: Boolean, default: true },
    
    // Privacy settings - Only public and private
    profileVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    showEmail: { type: Boolean, default: true },
    showMobile: { type: Boolean, default: false },
    showBirthday: { type: Boolean, default: true },
    showWorkAnniversary: { type: Boolean, default: true },
    
    // Security settings
    twoFactorEnabled: { type: Boolean, default: false }
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

// Indexes for better performance
EmployeeProfileSchema.index({ userId: 1 });
EmployeeProfileSchema.index({ employeeId: 1 });
EmployeeProfileSchema.index({ email: 1 });
EmployeeProfileSchema.index({ department: 1 });
EmployeeProfileSchema.index({ reportingManager: 1 });
EmployeeProfileSchema.index({ dateOfBirth: 1 });
EmployeeProfileSchema.index({ dateOfJoining: 1 });
EmployeeProfileSchema.index({ isProfileComplete: 1 });
EmployeeProfileSchema.index({ completionPercentage: 1 });
EmployeeProfileSchema.index({ skills: 1 });

// Text index for search functionality
EmployeeProfileSchema.index({
  firstName: 'text',
  lastName: 'text',
  displayName: 'text',
  designation: 'text',
  department: 'text',
  skills: 'text',
  bio: 'text'
});

// Pre-save middleware
EmployeeProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate employeeId if not provided
  if (!this.employeeId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.employeeId = `EMP${year}${random}`;
  }
  
  // Update display name if not provided
  if (!this.displayName) {
    this.displayName = `${this.firstName} ${this.lastName}`;
  }
  
  // Calculate completion percentage
  this.completionPercentage = this.calculateCompletionPercentage();
  this.isProfileComplete = this.completionPercentage >= 80;
  
  // Ensure only one primary language and emergency contact
  if (this.languages && this.languages.length > 0) {
    const primaryCount = this.languages.filter(lang => lang.isPrimary).length;
    if (primaryCount > 1) {
      this.languages.forEach((lang, index) => {
        if (index > 0) lang.isPrimary = false;
      });
    }
  }
  
  if (this.emergencyContacts && this.emergencyContacts.length > 0) {
    const primaryCount = this.emergencyContacts.filter(contact => contact.isPrimary).length;
    if (primaryCount > 1) {
      this.emergencyContacts.forEach((contact, index) => {
        if (index > 0) contact.isPrimary = false;
      });
    }
  }
  
  next();
});

// Instance Methods
EmployeeProfileSchema.methods.calculateCompletionPercentage = function(): number {
  let completed = 0;
  const totalFields = 14;
  
  // Basic Information (4 fields)
  if (this.firstName) completed++;
  if (this.lastName) completed++;
  if (this.email) completed++;
  if (this.mobile) completed++;
  
  // Professional Information (4 fields)
  if (this.dateOfJoining) completed++;
  if (this.designation) completed++;
  if (this.department) completed++;
  if (this.employmentType) completed++;
  
  // Personal Information (2 fields)
  if (this.dateOfBirth) completed++;
  if (this.bio) completed++;
  
  // Skills and Languages (2 fields)
  if (this.skills && this.skills.length > 0) completed++;
  if (this.languages && this.languages.length > 0) completed++;
  
  // Emergency Contact (1 field)
  if (this.emergencyContacts && this.emergencyContacts.length > 0) completed++;
  
  // Profile Image (1 field)
  if (this.profileImage && this.profileImage.secure_url) completed++;
  
  return Math.round((completed / totalFields) * 100);
};

EmployeeProfileSchema.methods.getFullName = function(): string {
  return this.displayName || `${this.firstName} ${this.lastName}`;
};

EmployeeProfileSchema.methods.getYearsOfService = function(): number {
  if (!this.dateOfJoining) return 0;
  const today = new Date();
  const joinDate = new Date(this.dateOfJoining);
  return Math.floor((today.getTime() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

EmployeeProfileSchema.methods.isWorkAnniversary = function(): boolean {
  if (!this.dateOfJoining) return false;
  const today = new Date();
  const joinDate = new Date(this.dateOfJoining);
  return (today.getMonth() === joinDate.getMonth() && today.getDate() === joinDate.getDate());
};

EmployeeProfileSchema.methods.isBirthdayToday = function(): boolean {
  if (!this.dateOfBirth) return false;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  return (today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate());
};

EmployeeProfileSchema.methods.updateCompletionStatus = function(): void {
  this.completionPercentage = this.calculateCompletionPercentage();
  this.isProfileComplete = this.completionPercentage >= 80;
};

// Static Methods
EmployeeProfileSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

EmployeeProfileSchema.statics.findByEmployeeId = function(employeeId: string) {
  return this.findOne({ employeeId });
};

EmployeeProfileSchema.statics.findByDepartment = function(department: string) {
  return this.find({ department }).sort({ firstName: 1 });
};

EmployeeProfileSchema.statics.findBirthdaysThisMonth = function() {
  const today = new Date();
  const currentMonth = today.getMonth();
  
  return this.aggregate([
    {
      $match: {
        dateOfBirth: { $exists: true, $ne: null }
      }
    },
    {
      $addFields: {
        birthMonth: { $month: '$dateOfBirth' }
      }
    },
    {
      $match: {
        birthMonth: currentMonth + 1 // MongoDB months are 1-indexed
      }
    },
    {
      $sort: { dateOfBirth: 1 }
    }
  ]);
};

EmployeeProfileSchema.statics.findWorkAnniversariesThisMonth = function() {
  const today = new Date();
  const currentMonth = today.getMonth();
  
  return this.aggregate([
    {
      $match: {
        dateOfJoining: { $exists: true, $ne: null }
      }
    },
    {
      $addFields: {
        joinMonth: { $month: '$dateOfJoining' }
      }
    },
    {
      $match: {
        joinMonth: currentMonth + 1 // MongoDB months are 1-indexed
      }
    },
    {
      $sort: { dateOfJoining: 1 }
    }
  ]);
};

EmployeeProfileSchema.statics.findIncompleteProfiles = function() {
  return this.find({ 
    $or: [
      { isProfileComplete: false },
      { completionPercentage: { $lt: 80 } }
    ]
  }).sort({ completionPercentage: 1 });
};

EmployeeProfileSchema.statics.searchProfiles = function(query: string) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

const EmployeeProfile: IEmployeeProfileModel = 
  (mongoose.models.EmployeeProfile as IEmployeeProfileModel) || 
  mongoose.model<IEmployeeProfileDocument, IEmployeeProfileModel>('EmployeeProfile', EmployeeProfileSchema);

export default EmployeeProfile;