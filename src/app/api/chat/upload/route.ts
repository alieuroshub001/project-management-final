// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryFile } from '@/types/chat';
import { authOptions } from '@/lib/auth';

// Define file upload response interface locally since it's not in chat types
interface IFileUploadResponse {
  success: boolean;
  message: string;
  files: ICloudinaryFile[];
}

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
    const uploadType = formData.get('uploadType') as string || 'message'; // 'message', 'announcement', 'avatar'

    if (!files || files.length === 0) {
      return NextResponse.json<IFileUploadResponse>({
        success: false,
        message: 'No files provided',
        files: []
      }, { status: 400 });
    }

    // Validate file types and sizes based on upload type
    let maxFileSize: number;
    let allowedTypes: string[];

    if (uploadType === 'avatar') {
      maxFileSize = 5 * 1024 * 1024; // 5MB for avatars
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ];
    } else {
      maxFileSize = 50 * 1024 * 1024; // 50MB for messages/announcements
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
        'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac',
        'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'
      ];
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        const maxSizeMB = maxFileSize / (1024 * 1024);
        return NextResponse.json<IFileUploadResponse>({
          success: false,
          message: `File ${file.name} exceeds maximum size of ${maxSizeMB}MB`,
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
      let folder = `chat_system/${session.user.id}`;
      if (uploadType === 'avatar') {
        folder = `chat_system/avatars/${session.user.id}`;
      } else if (chatId) {
        if (messageId) {
          folder = `chat_system/${chatId}/messages/${messageId}`;
        } else {
          folder = `chat_system/${chatId}`;
        }
      }

      // Determine resource type
      let resourceType: 'image' | 'video' | 'audio' | 'raw' = 'raw';
      if (file.type.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.type.startsWith('video/')) {
        resourceType = 'video';
      } else if (file.type.startsWith('audio/')) {
        resourceType = 'video'; // Cloudinary treats audio as video
      }

      return new Promise<ICloudinaryFile>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
            // For images, add transformations
            ...(resourceType === 'image' && uploadType === 'avatar' && {
              transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
              ]
            }),
            ...(resourceType === 'image' && uploadType === 'message' && {
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
              ]
            })
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
    const { publicIds } = body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No file IDs provided'
      }, { status: 400 });
    }

    // Validate that user owns these files (basic security check)
    const userPrefix = `chat_system/${session.user.id}`;
    const invalidFiles = publicIds.filter((publicId: string) => 
      !publicId.startsWith(userPrefix) && !publicId.includes(`/${session.user.id}/`)
    );

    if (invalidFiles.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'You can only delete your own files'
      }, { status: 403 });
    }

    const deletePromises = publicIds.map((publicId: string) => {
      // Determine resource type from public_id structure
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (publicId.includes('/avatars/') || publicId.includes('image')) {
        resourceType = 'image';
      } else if (publicId.includes('video') || publicId.includes('audio')) {
        resourceType = 'video';
      }

      return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    });

    const results = await Promise.all(deletePromises);
    const deletedFiles = results
      .map((result, index) => ({ result, publicId: publicIds[index] }))
      .filter(({ result }) => result.result === 'ok' || result.result === 'not found')
      .map(({ publicId }) => publicId);

    const failedDeletions = results.filter(result => 
      result.result !== 'ok' && result.result !== 'not found'
    );

    return NextResponse.json({
      success: failedDeletions.length === 0,
      message: failedDeletions.length > 0 
        ? `${deletedFiles.length} files deleted, ${failedDeletions.length} failed`
        : 'Files deleted successfully',
      deletedFiles,
      failedCount: failedDeletions.length
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