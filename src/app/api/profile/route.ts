// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Import your database connection and model
// Make sure these paths are correct for your project structure
import connectToDatabase from '@/lib/db';
import EmployeeProfile, { IEmployeeProfileDocument } from '@/models/Profile';

// Import types
import { 
  IEmployeeProfile,
  IProfileUpdateRequest,
  IProfileApiResponse,
  IProfileWithDetails
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

// GET - Retrieve user's profile
export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug log
    
    if (!session?.user?.id) {
      console.log('No session or user ID'); // Debug log
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized - Please log in'
      }, { status: 401 });
    }

    // Connect to database
    console.log('Connecting to database...'); // Debug log
    await connectToDatabase();
    console.log('Database connected'); // Debug log

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';
    
    console.log('Searching for profile with userId:', session.user.id); // Debug log

    // Try to find profile
    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    console.log('Profile found:', !!profile); // Debug log

    if (!profile) {
      console.log('Profile not found for user:', session.user.id); // Debug log
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found. Please create your profile first.'
      }, { status: 404 });
    }

    const convertedProfile = convertToIEmployeeProfile(profile);
    if (!convertedProfile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Error converting profile data'
      }, { status: 500 });
    }

    let responseData: IEmployeeProfile | IProfileWithDetails = convertedProfile;

    if (includeDetails) {
      console.log('Including additional details'); // Debug log
      
      try {
        // Get additional details with error handling
        const [reportingManagerDetails, teamMembers, upcomingBirthdays] = await Promise.allSettled([
          profile.reportingManager ? 
            EmployeeProfile.findOne({ userId: profile.reportingManager.toString() }) : 
            Promise.resolve(null),
          EmployeeProfile.find({ 
            reportingManager: session.user.id,
            _id: { $ne: profile._id }
          }).limit(10),
          EmployeeProfile.aggregate([
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
                birthMonth: new Date().getMonth() + 1
              }
            },
            { $limit: 10 }
          ])
        ]);

        const profileWithDetails: IProfileWithDetails = {
          ...convertedProfile,
          reportingManagerDetails: reportingManagerDetails.status === 'fulfilled' && reportingManagerDetails.value ? 
            convertToIEmployeeProfile(reportingManagerDetails.value) || undefined : undefined,
          teamMembers: teamMembers.status === 'fulfilled' ? 
            teamMembers.value?.map(convertToIEmployeeProfile).filter((p): p is IEmployeeProfile => p !== null) : [],
          upcomingBirthdays: upcomingBirthdays.status === 'fulfilled' ? 
            upcomingBirthdays.value?.map(convertToIEmployeeProfile).filter((p): p is IEmployeeProfile => p !== null) : [],
          yearsOfService: profile.getYearsOfService ? profile.getYearsOfService() : 0
        };

        responseData = profileWithDetails;
      } catch (detailsError) {
        console.error('Error fetching additional details:', detailsError);
        // Continue with basic profile data
      }
    }

    return NextResponse.json<IProfileApiResponse<typeof responseData>>({
      success: true,
      message: 'Profile retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to retrieve profile',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST - Create new profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Check if profile already exists
    const existingProfile = await EmployeeProfile.findOne({ userId: session.user.id });
    if (existingProfile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile already exists'
      }, { status: 409 });
    }

    const body: IProfileUpdateRequest = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      dateOfJoining,
      dateOfBirth,
      designation,
      department,
      bio,
      skills,
      workLocation,
      employmentType
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'First name and last name are required'
      }, { status: 400 });
    }

    // Generate unique employee ID
    const year = new Date().getFullYear();
    const count = await EmployeeProfile.countDocuments();
    const employeeId = `EMP${year}${(count + 1).toString().padStart(4, '0')}`;

    const profileData = {
      employeeId,
      userId: session.user.id,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`,
      email: session.user.email,
      mobile: session.user.mobile || '',
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      designation,
      department,
      bio,
      skills: skills || [],
      workLocation,
      employmentType: employmentType || 'full-time'
    };

    const profile = await EmployeeProfile.create(profileData);
    const convertedProfile = convertToIEmployeeProfile(profile);
    
    if (!convertedProfile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Error creating profile'
      }, { status: 500 });
    }

    return NextResponse.json<IProfileApiResponse<IEmployeeProfile>>({
      success: true,
      message: 'Profile created successfully',
      data: convertedProfile
    }, { status: 201 });

  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to create profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    if (!profile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found'
      }, { status: 404 });
    }

    const body: IProfileUpdateRequest = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      dateOfJoining,
      dateOfBirth,
      designation,
      department,
      bio,
      skills,
      workLocation,
      employmentType
    } = body;

    // Build update object
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (dateOfJoining !== undefined) updateData.dateOfJoining = dateOfJoining ? new Date(dateOfJoining) : null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (workLocation !== undefined) updateData.workLocation = workLocation;
    if (employmentType !== undefined) updateData.employmentType = employmentType;

    // Update display name if first or last name changed
    if (firstName || lastName) {
      const newFirstName = firstName || profile.firstName;
      const newLastName = lastName || profile.lastName;
      updateData.displayName = displayName || `${newFirstName} ${newLastName}`;
    }

    const updatedProfile = await EmployeeProfile.findByIdAndUpdate(
      profile._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Failed to update profile'
      }, { status: 500 });
    }

    const convertedProfile = convertToIEmployeeProfile(updatedProfile);
    if (!convertedProfile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Error converting updated profile data'
      }, { status: 500 });
    }

    return NextResponse.json<IProfileApiResponse<IEmployeeProfile>>({
      success: true,
      message: 'Profile updated successfully',
      data: convertedProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete profile
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    if (!profile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found'
      }, { status: 404 });
    }

    // Check if user has team members reporting to them
    const teamMembers = await EmployeeProfile.find({ 
      reportingManager: session.user.id 
    });

    if (teamMembers.length > 0) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Cannot delete profile while managing team members. Please reassign team members first.'
      }, { status: 400 });
    }

    // Delete the profile
    await EmployeeProfile.findByIdAndDelete(profile._id);

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to delete profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}