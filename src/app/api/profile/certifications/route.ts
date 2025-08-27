// app/api/profile/certifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { ICertification, IProfileApiResponse } from '@/types/profile';

// GET - Get all certifications for user
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

    return NextResponse.json<IProfileApiResponse<ICertification[]>>({
      success: true,
      message: 'Certifications retrieved successfully',
      data: profile.certifications || []
    });

  } catch (error) {
    console.error('Get certifications error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to retrieve certifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add new certification
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

    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    if (!profile) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Profile not found'
      }, { status: 404 });
    }

    const certificationData = await request.json();
    
    // Validate required fields
    if (!certificationData.name || !certificationData.issuingOrganization) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Certification name and issuing organization are required'
      }, { status: 400 });
    }

    // Generate unique ID if not provided
    if (!certificationData.id) {
      certificationData.id = `cert_${Date.now()}`;
    }

    // Add certification
    profile.certifications = profile.certifications || [];
    profile.certifications.push(certificationData);

    await profile.save();

    return NextResponse.json<IProfileApiResponse<ICertification>>({
      success: true,
      message: 'Certification added successfully',
      data: certificationData
    }, { status: 201 });

  } catch (error) {
    console.error('Add certification error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to add certification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update certification
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

    const certificationData = await request.json();
    
    if (!certificationData.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Certification ID is required'
      }, { status: 400 });
    }

    // Find and update certification
    const certificationIndex = profile.certifications?.findIndex(cert => cert.id === certificationData.id);
    
    if (certificationIndex === -1) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Certification not found'
      }, { status: 404 });
    }

    if (profile.certifications && certificationIndex !== undefined) {
      profile.certifications[certificationIndex] = certificationData;
    }

    await profile.save();

    return NextResponse.json<IProfileApiResponse<ICertification>>({
      success: true,
      message: 'Certification updated successfully',
      data: certificationData
    });

  } catch (error) {
    console.error('Update certification error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update certification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}