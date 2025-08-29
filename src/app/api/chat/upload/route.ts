// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v2 as cloudinary } from 'cloudinary';
import { IFileUploadResponse, ICloudinaryFile } from '@/types/chat';
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
    const chatId = formData.get('chatId') as string;
    const messageId = formData.get('messageId') as string;
    const uploadType = formData.get('uploadType') as string || 'message'; // 'message', 'avatar', 'attachment'

    if (!files || files.length === 0) {
      return NextResponse.json<IFileUploadResponse>({
        success: false,
        message: 'No files provided',
        files: []
      }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json<IFileUploadResponse>({
        success: false,
        message: 'Chat ID is required',
        files: []
      }, { status: 400 });
    }

    // Validate file types and sizes based on upload type
    let maxFileSize = 50 * 1024 * 1024; // 50MB default
    let allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'
    ];

    if (uploadType === 'avatar') {
      // Stricter rules for avatars
      maxFileSize = 5 * 1024 * 1024; // 5MB
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
      ];
    }

    // Validate each file
    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          message: `File ${file.name} exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`,
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

      // Determine upload folder based on type and chat
      let folder = `chat/${chatId}/${session.user.id}`;
      if (uploadType === 'avatar') {
        folder = `chat/${chatId}/avatars`;
      } else if (messageId) {
        folder = `chat/${chatId}/messages/${messageId}`;
      }

      // Generate appropriate public_id
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const publicId = `${folder}/${timestamp}_${sanitizedFileName}`;

      return new Promise<ICloudinaryFile>((resolve, reject) => {
        const uploadOptions: any = {
          folder,
          resource_type: 'auto',
          public_id: publicId,
        };

        // Add transformations for images
        if (file.type.startsWith('image/')) {
          uploadOptions.transformation = [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ];

          // Special handling for avatars
          if (uploadType === 'avatar') {
            uploadOptions.transformation.push(
              { width: 200, height: 200, crop: 'fill', gravity: 'face' }
            );
          }
        }

        // Add video optimization
        if (file.type.startsWith('video/')) {
          uploadOptions.transformation = [
            { quality: 'auto:good' },
            { format: 'mp4' }
          ];
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
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
            } else {
              reject(new Error('Upload failed - no result'));
            }
          }
        );
        
        uploadStream.end(buffer);
      });
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);

      return NextResponse.json<IFileUploadResponse>({
        success: true,
        message: 'Files uploaded successfully',
        files: uploadedFiles
      });

    } catch (uploadError) {
      console.error('File upload failed:', uploadError);
      return NextResponse.json<IFileUploadResponse>({
        success: false,
        message: 'One or more files failed to upload',
        files: []
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Chat file upload error:', error);
    return NextResponse.json<IFileUploadResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload files',
      files: []
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
    const { publicIds, chatId } = body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No file IDs provided'
      }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({
        success: false,
        message: 'Chat ID is required'
      }, { status: 400 });
    }

    // Validate that user has access to delete these files
    // In a real implementation, you'd check if the user has permission
    // to delete files in this chat or if they uploaded the files

    const deletePromises = publicIds.map(async (publicId: string) => {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        return { publicId, result: result.result, success: result.result === 'ok' };
      } catch (error) {
        console.error(`Failed to delete ${publicId}:`, error);
        return { publicId, result: 'error', success: false };
      }
    });

    const results = await Promise.all(deletePromises);
    const deletedFiles = results
      .filter(result => result.success)
      .map(result => result.publicId);

    const failedFiles = results
      .filter(result => !result.success)
      .map(result => result.publicId);

    return NextResponse.json({
      success: deletedFiles.length > 0,
      message: deletedFiles.length === publicIds.length 
        ? 'All files deleted successfully'
        : `${deletedFiles.length}/${publicIds.length} files deleted successfully`,
      deletedFiles,
      failedFiles: failedFiles.length > 0 ? failedFiles : undefined
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