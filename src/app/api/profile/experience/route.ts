// app/api/profile/experience/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { IExperience, IProfileApiResponse } from '@/types/profile';

// GET - Get all experience entries for user
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

    return NextResponse.json<IProfileApiResponse<IExperience[]>>({
      success: true,
      message: 'Experience entries retrieved successfully',
      data: profile.experience || []
    });

  } catch (error) {
    console.error('Get experience error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to retrieve experience entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add new experience entry
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

    const experienceData = await request.json();
    
    // Validate required fields
    if (!experienceData.company || !experienceData.position) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Company and position are required'
      }, { status: 400 });
    }

    // Generate unique ID if not provided
    if (!experienceData.id) {
      experienceData.id = `exp_${Date.now()}`;
    }

    // Add experience entry
    profile.experience = profile.experience || [];
    profile.experience.push(experienceData);

    await profile.save();

    return NextResponse.json<IProfileApiResponse<IExperience>>({
      success: true,
      message: 'Experience entry added successfully',
      data: experienceData
    }, { status: 201 });

  } catch (error) {
    console.error('Add experience error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to add experience entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update experience entry
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

    const experienceData = await request.json();
    
    if (!experienceData.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Experience ID is required'
      }, { status: 400 });
    }

    // Find and update experience entry
    const experienceIndex = profile.experience?.findIndex(exp => exp.id === experienceData.id);
    
    if (experienceIndex === -1) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Experience entry not found'
      }, { status: 404 });
    }

    if (profile.experience && experienceIndex !== undefined) {
      profile.experience[experienceIndex] = experienceData;
    }

    await profile.save();

    return NextResponse.json<IProfileApiResponse<IExperience>>({
      success: true,
      message: 'Experience entry updated successfully',
      data: experienceData
    });

  } catch (error) {
    console.error('Update experience error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update experience entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}