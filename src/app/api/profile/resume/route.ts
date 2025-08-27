// app/api/profile/resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import EmployeeProfile from '@/models/Profile';
import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryFile, IProfileApiResponse } from '@/types/profile';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Upload or update resume
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const removeCurrent = formData.get('removeCurrent') === 'true';

    if (!file && !removeCurrent) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    // Remove current resume if requested
    if (removeCurrent) {
      if (profile.resume?.public_id) {
        try {
          await cloudinary.uploader.destroy(profile.resume.public_id);
        } catch (deleteError) {
          console.error('Error deleting current resume:', deleteError);
        }
      }

      profile.resume = undefined;
      await profile.save();

      return NextResponse.json<IProfileApiResponse>({
        success: true,
        message: 'Resume removed successfully'
      });
    }

    if (!file) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type (PDF or Word documents)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Resume must be a PDF or Word document'
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Resume size must be less than 10MB'
      }, { status: 400 });
    }

    // Delete current resume if exists
    if (profile.resume?.public_id) {
      try {
        await cloudinary.uploader.destroy(profile.resume.public_id);
      } catch (deleteError) {
        console.error('Error deleting current resume:', deleteError);
      }
    }

    // Convert file to buffer and upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: `employee_profiles/${session.user.id}`,
          public_id: `resume_${Date.now()}`,
          use_filename: true,
          unique_filename: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Format response to match ICloudinaryFile interface
    const cloudinaryFile: ICloudinaryFile = {
      public_id: uploadResponse.public_id,
      secure_url: uploadResponse.secure_url,
      format: uploadResponse.format,
      resource_type: uploadResponse.resource_type,
      bytes: uploadResponse.bytes,
      width: uploadResponse.width,
      height: uploadResponse.height,
      original_filename: file.name,
      created_at: uploadResponse.created_at
    };

    // Update profile with new resume
    profile.resume = cloudinaryFile;
    await profile.save();

    return NextResponse.json<IProfileApiResponse<ICloudinaryFile>>({
      success: true,
      message: 'Resume uploaded successfully',
      data: cloudinaryFile
    });

  } catch (error) {
    console.error('Upload resume error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to upload resume',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete resume
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

    if (!profile.resume) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'No resume found'
      }, { status: 404 });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(profile.resume.public_id);
    } catch (deleteError) {
      console.error('Error deleting resume from Cloudinary:', deleteError);
    }

    // Remove from profile
    profile.resume = undefined;
    await profile.save();

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to delete resume',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}