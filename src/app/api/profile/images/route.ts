// app/api/profile/images/route.ts
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

// POST - Update profile image or cover image
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
    const imageType = formData.get('type') as string; // 'profile' or 'cover'
    const removeCurrent = formData.get('removeCurrent') === 'true';

    if (!file && !removeCurrent) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    if (imageType !== 'profile' && imageType !== 'cover') {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Invalid image type. Must be "profile" or "cover"'
      }, { status: 400 });
    }

    // Remove current image if requested
    if (removeCurrent) {
      const currentImage = imageType === 'profile' ? profile.profileImage : profile.coverImage;
      
      if (currentImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(currentImage.public_id);
        } catch (deleteError) {
          console.error('Error deleting current image:', deleteError);
        }
      }

      // Update profile to remove image
      if (imageType === 'profile') {
        profile.profileImage = undefined;
      } else {
        profile.coverImage = undefined;
      }

      await profile.save();

      return NextResponse.json<IProfileApiResponse>({
        success: true,
        message: `${imageType === 'profile' ? 'Profile' : 'Cover'} image removed successfully`
      });
    }

    if (!file) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'File must be an image'
      }, { status: 400 });
    }

    // Validate file size (5MB limit for images)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Image size must be less than 5MB'
      }, { status: 400 });
    }

    // Delete current image if exists
    const currentImage = imageType === 'profile' ? profile.profileImage : profile.coverImage;
    if (currentImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(currentImage.public_id);
      } catch (deleteError) {
        console.error('Error deleting current image:', deleteError);
      }
    }

    // Convert file to buffer and upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await new Promise<any>((resolve, reject) => {
      const transformation = imageType === 'profile' 
        ? { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        : { width: 1200, height: 300, crop: 'fill' };

      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `employee_profiles/${session.user.id}`,
          public_id: `${imageType}_${Date.now()}`,
          transformation,
          use_filename: false,
          unique_filename: true,
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

    // Update profile with new image
    if (imageType === 'profile') {
      profile.profileImage = cloudinaryFile;
    } else {
      profile.coverImage = cloudinaryFile;
    }

    await profile.save();

    return NextResponse.json<IProfileApiResponse<ICloudinaryFile>>({
      success: true,
      message: `${imageType === 'profile' ? 'Profile' : 'Cover'} image updated successfully`,
      data: cloudinaryFile
    });

  } catch (error) {
    console.error('Update image error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to update image',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}