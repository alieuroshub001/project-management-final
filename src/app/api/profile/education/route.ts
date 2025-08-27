// app/api/profile/education/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IEducation, IProfileApiResponse } from '@/types/profile';

// GET - Get all education entries for user
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

    return NextResponse.json<IProfileApiResponse<IEducation[]>>({
      success: true,
      message: 'Education entries retrieved successfully',
      data: profile.education || []
    });

  } catch (error) {
    console.error('Get education error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to retrieve education entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add new education entry
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

    const educationData = await request.json();
    
    // Validate required fields
    if (!educationData.institution || !educationData.degree || !educationData.fieldOfStudy) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Institution, degree, and field of study are required'
      }, { status: 400 });
    }

    // Generate unique ID if not provided
    if (!educationData.id) {
      educationData.id = `edu_${Date.now()}`;
    }

    // Add education entry
    profile.education = profile.education || [];
    profile.education.push(educationData);

    await profile.save();

    return NextResponse.json<IProfileApiResponse<IEducation>>({
      success: true,
      message: 'Education entry added successfully',
      data: educationData
    }, { status: 201 });

  } catch (error) {
    console.error('Add education error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to add education entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update education entry
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

    const educationData = await request.json();
    
    if (!educationData.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Education ID is required'
      }, { status: 400 });
    }

    // Find and update education entry
    const educationIndex = profile.education?.findIndex(edu => edu.id === educationData.id);
    
    if (educationIndex === -1) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Education entry not found'
      }, { status: 404 });
    }

    if (profile.education && educationIndex !== undefined) {
      profile.education[educationIndex] = educationData;
    }

    await profile.save();

    return NextResponse.json<IProfileApiResponse<IEducation>>({
      success: true,
      message: 'Education entry updated successfully',
      data: educationData
    });

  } catch (error) {
    console.error('Update education error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update education entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}