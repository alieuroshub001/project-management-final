// app/api/projects/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v2 as cloudinary } from 'cloudinary';
import { IFileUploadResponse, ICloudinaryFile } from '@/types/projectmanagement';
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
    const projectId = formData.get('projectId') as string;
    const taskId = formData.get('taskId') as string;
    const uploadType = formData.get('uploadType') as string || 'general'; // 'project', 'task', 'comment', 'general'

    if (!files || files.length === 0) {
      return NextResponse.json<IFileUploadResponse>({
        success: false,
        message: 'No files provided',
        files: []
      }, { status: 400 });
    }

    // Validate file types and sizes
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed'
    ];

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          message: `File ${file.name} exceeds maximum size of 10MB`,
          files: []
        }, { status: 400 });
      }

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          message: `File type ${file.type} is not allowed`,
          files: []
        }, { status: 400 });
      }
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine upload folder based on type
      let folder = `project_management/${session.user.id}`;
      if (projectId && taskId) {
        folder = `project_management/${projectId}/tasks/${taskId}`;
      } else if (projectId) {
        folder = `project_management/${projectId}`;
      }

      return new Promise<ICloudinaryFile>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
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
                original_filename: result.original_filename || file.name,
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
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete files from Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await request.json();
    const { publicIds } = body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No file IDs provided'
      }, { status: 400 });
    }

    const deletePromises = publicIds.map((publicId: string) => 
      cloudinary.uploader.destroy(publicId)
    );

    const results = await Promise.all(deletePromises);
    const deletedFiles = results
      .filter(result => result.result === 'ok')
      .map((_, index) => publicIds[index]);

    return NextResponse.json({
      success: true,
      message: 'Files deleted successfully',
      deletedFiles
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete files',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}