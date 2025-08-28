// app/api/profile/by-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Import your database connection and model
import connectToDatabase from '@/lib/db';
import EmployeeProfile, { IEmployeeProfileDocument } from '@/models/Profile';

// Import types
import { 
  IEmployeeProfile,
  IProfileApiResponse
} from '@/types/profile';

// Helper function to convert Mongoose document to IEmployeeProfile
function convertToIEmployeeProfile(doc: IEmployeeProfileDocument): IEmployeeProfile | null {
  if (!doc) return null;
  
  return {
    id: (doc._id as any).toString(),
    employeeId: doc.employeeId,
    userId: doc.userId.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    displayName: doc.displayName,
    email: doc.email,
    mobile: doc.mobile,
    dateOfJoining: doc.dateOfJoining,
    dateOfBirth: doc.dateOfBirth,
    designation: doc.designation,
    department: doc.department,
    reportingManager: doc.reportingManager?.toString(),
    reportingManagerName: doc.reportingManagerName,
    workLocation: doc.workLocation,
    employmentType: doc.employmentType as any,
    bio: doc.bio,
    skills: doc.skills || [],
    languages: doc.languages?.map(lang => ({
      language: lang.language,
      proficiency: lang.proficiency as any,
      isPrimary: lang.isPrimary
    })) || [],
    education: doc.education?.map(edu => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      isCurrent: edu.isCurrent,
      grade: edu.grade,
      description: edu.description,
      attachments: edu.attachments || []
    })) || [],
    experience: doc.experience?.map(exp => ({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: exp.isCurrent,
      description: exp.description,
      skillsUsed: exp.skillsUsed || [],
      achievements: exp.achievements || [],
      attachments: exp.attachments || []
    })) || [],
    certifications: doc.certifications?.map(cert => ({
      id: cert.id,
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate,
      doesNotExpire: cert.doesNotExpire,
      credentialId: cert.credentialId,
      credentialUrl: cert.credentialUrl,
      attachments: cert.attachments || []
    })) || [],
    socialLinks: doc.socialLinks?.map(link => ({
      platform: link.platform as any,
      url: link.url,
      isPublic: link.isPublic
    })) || [],
    emergencyContacts: doc.emergencyContacts?.map(contact => ({
      id: contact.id,
      name: contact.name,
      relationship: contact.relationship,
      mobile: contact.mobile,
      email: contact.email,
      address: contact.address,
      isPrimary: contact.isPrimary
    })) || [],
    profileImage: doc.profileImage,
    coverImage: doc.coverImage,
    resume: doc.resume,
    isProfileComplete: doc.isProfileComplete,
    completionPercentage: doc.completionPercentage,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - Retrieve profile by email
export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);
    console.log('Session check for by-email request:', !!session); // Debug log
    
    if (!session?.user?.id) {
      console.log('No session or user ID for by-email request'); // Debug log
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized - Please log in'
      }, { status: 401 });
    }

    // Get email parameter from URL
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    console.log('Searching for profile by email:', email); // Debug log
    
    if (!email) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Email parameter is required'
      }, { status: 400 });
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }

    // Connect to database
    console.log('Connecting to database for by-email request...'); // Debug log
    await connectToDatabase();
    console.log('Database connected for by-email request'); // Debug log

    // Find profile by email (case-insensitive)
    const profile = await EmployeeProfile.findOne({ 
      email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') }
    }).select('displayName firstName lastName profileImage email designation department');
    
    console.log('Profile found by email:', !!profile, 'for email:', email); // Debug log

    if (!profile) {
      console.log('Profile not found for email:', email); // Debug log
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found for the provided email'
      }, { status: 404 });
    }

    // Convert to IEmployeeProfile format (limited fields for team member display)
    const limitedProfileData = {
      id: (profile._id as any).toString(),
      employeeId: profile.employeeId,
      userId: profile.userId?.toString() || '',
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      email: profile.email,
      mobile: profile.mobile || '',
      designation: profile.designation,
      department: profile.department,
      profileImage: profile.profileImage,
      // Set default values for required fields not needed for team display
      dateOfJoining: profile.dateOfJoining,
      dateOfBirth: profile.dateOfBirth,
      reportingManager: profile.reportingManager?.toString(),
      reportingManagerName: profile.reportingManagerName,
      workLocation: profile.workLocation,
      employmentType: profile.employmentType as any || 'full-time',
      bio: profile.bio,
      skills: [],
      languages: [],
      education: [],
      experience: [],
      certifications: [],
      socialLinks: [],
      emergencyContacts: [],
      coverImage: undefined,
      resume: undefined,
      isProfileComplete: false,
      completionPercentage: 0,
      createdAt: profile.createdAt || new Date(),
      updatedAt: profile.updatedAt || new Date()
    };

    console.log('Returning profile data with image:', !!limitedProfileData.profileImage); // Debug log

    return NextResponse.json<IProfileApiResponse<IEmployeeProfile>>({
      success: true,
      message: 'Profile retrieved successfully',
      data: limitedProfileData
    });

  } catch (error) {
    console.error('Get profile by email error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to retrieve profile',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}