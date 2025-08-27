// app/api/profile/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IProfileApiResponse } from '@/types/profile';

// GET - Export user profile data
export async function GET(request: NextRequest) {
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

    // Prepare export data (exclude sensitive information)
    const exportData = {
      profile: {
        employeeId: profile.employeeId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        email: profile.email,
        mobile: profile.mobile,
        dateOfJoining: profile.dateOfJoining,
        dateOfBirth: profile.dateOfBirth,
        designation: profile.designation,
        department: profile.department,
        workLocation: profile.workLocation,
        employmentType: profile.employmentType,
        bio: profile.bio,
        skills: profile.skills,
        isProfileComplete: profile.isProfileComplete,
        completionPercentage: profile.completionPercentage,
      },
      education: profile.education?.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        isCurrent: edu.isCurrent,
        grade: edu.grade,
        description: edu.description,
      })),
      experience: profile.experience?.map(exp => ({
        company: exp.company,
        position: exp.position,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
        skillsUsed: exp.skillsUsed,
        achievements: exp.achievements,
      })),
      certifications: profile.certifications?.map(cert => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        issueDate: cert.issueDate,
        expirationDate: cert.expirationDate,
        doesNotExpire: cert.doesNotExpire,
        credentialId: cert.credentialId,
        credentialUrl: cert.credentialUrl,
      })),
      languages: profile.languages,
      socialLinks: profile.socialLinks,
      emergencyContacts: profile.emergencyContacts,
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.email
    };

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Profile data exported successfully',
      data: exportData
    });

  } catch (error) {
    console.error('Export profile error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to export profile data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}