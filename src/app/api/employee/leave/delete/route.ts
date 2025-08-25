// app/api/employee/leave/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v2 as cloudinary } from 'cloudinary';
import { IFileDeleteResponse } from '@/types/employee/leave';
import { authOptions } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IFileDeleteResponse>({
          success: false,
          message: 'Unauthorized',
          deletedFiles: []
      }, { status: 401 });
    }

    const { publicIds } = await request.json();

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json<IFileDeleteResponse>({
          success: false,
          message: 'No file IDs provided',
          deletedFiles: []
      }, { status: 400 });
    }

    const deletePromises = publicIds.map((publicId: string) => {
      return cloudinary.uploader.destroy(publicId);
    });

    await Promise.all(deletePromises);

    return NextResponse.json<IFileDeleteResponse>({
      success: true,
      message: 'Files deleted successfully',
      deletedFiles: publicIds
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json<IFileDeleteResponse>({
      success: false,
      message: 'Failed to delete files',
      deletedFiles: []
    }, { status: 500 });
  }
}