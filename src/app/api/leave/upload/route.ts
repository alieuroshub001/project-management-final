// app/api/employee/leave/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v2 as cloudinary } from 'cloudinary';
import { IFileUploadResponse, ICloudinaryFile } from '@/types/leave';
import { authOptions } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IFileUploadResponse>({
          success: false,
          message: 'Unauthorized',
          files: []
      }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json<IFileUploadResponse>({
          success: false,
          message: 'No files provided',
          files: []
      }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      return new Promise<ICloudinaryFile>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `leave_attachments/${session.user.id}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                original_filename: result.original_filename,
                created_at: result.created_at
              });
            }
          }
        );
        
        uploadStream.end(buffer);
      });
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return NextResponse.json<IFileUploadResponse>({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json<IFileUploadResponse>({
      success: false,
      message: 'Failed to upload files',
      files: []
    }, { status: 500 });
  }
}