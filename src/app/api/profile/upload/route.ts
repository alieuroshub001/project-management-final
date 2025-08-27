// app/api/profile/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryFile, IFileUploadResponse, IFileDeleteResponse, IProfileApiResponse } from '@/types/profile';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Upload files to Cloudinary
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json<IFileUploadResponse>({
        success: false,
        files: [],
        message: 'No files provided'
      }, { status: 400 });
    }

    const uploadedFiles: ICloudinaryFile[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit

    for (const file of files) {
      // Validate file size
      if (file.size > maxFileSize) {
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          files: [],
          message: `File ${file.name} is too large. Maximum size is 10MB.`
        }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          files: [],
          message: `File type ${file.type} is not allowed`
        }, { status: 400 });
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResponse = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: file.type.startsWith('image/') ? 'image' : 'raw',
              folder: `employee_profiles/${session.user.id}`,
              public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
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

        uploadedFiles.push(cloudinaryFile);

      } catch (uploadError) {
        console.error('Upload error for file:', file.name, uploadError);
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          files: [],
          message: `Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    return NextResponse.json<IFileUploadResponse>({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json<IFileUploadResponse>({
      success: false,
      files: [],
      message: 'Failed to upload files',
    }, { status: 500 });
  }
}

// DELETE - Delete files from Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { publicIds } = await request.json();

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json<IFileDeleteResponse>({
        success: false,
        deletedFiles: [],
        message: 'No public IDs provided'
      }, { status: 400 });
    }

    const deletedFiles: string[] = [];

    for (const publicId of publicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
        deletedFiles.push(publicId);
      } catch (deleteError) {
        console.error('Delete error for public_id:', publicId, deleteError);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json<IFileDeleteResponse>({
      success: true,
      deletedFiles,
      message: `Successfully deleted ${deletedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json<IFileDeleteResponse>({
      success: false,
      deletedFiles: [],
      message: 'Failed to delete files'
    }, { status: 500 });
  }
}