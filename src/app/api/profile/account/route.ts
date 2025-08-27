// app/api/profile/settings/account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import EmployeeProfile from '@/models/Profile';
import { v2 as cloudinary } from 'cloudinary';
import { IProfileApiResponse } from '@/types/profile';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE - Delete user account and all associated data
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

    const { feedback } = await request.json();

    // Get user profile to check for uploaded files
    const profile = await EmployeeProfile.findOne({ userId: session.user.id });
    
    // Collect all Cloudinary public IDs for deletion
    const publicIdsToDelete: string[] = [];
    
    if (profile) {
      // Profile images
      if (profile.profileImage?.public_id) {
        publicIdsToDelete.push(profile.profileImage.public_id);
      }
      if (profile.coverImage?.public_id) {
        publicIdsToDelete.push(profile.coverImage.public_id);
      }
      if (profile.resume?.public_id) {
        publicIdsToDelete.push(profile.resume.public_id);
      }

      // Education attachments
      profile.education?.forEach(edu => {
        edu.attachments?.forEach(att => {
          if (att.public_id) publicIdsToDelete.push(att.public_id);
        });
      });

      // Experience attachments
      profile.experience?.forEach(exp => {
        exp.attachments?.forEach(att => {
          if (att.public_id) publicIdsToDelete.push(att.public_id);
        });
      });

      // Certification attachments
      profile.certifications?.forEach(cert => {
        cert.attachments?.forEach(att => {
          if (att.public_id) publicIdsToDelete.push(att.public_id);
        });
      });
    }

    // Delete all files from Cloudinary
    if (publicIdsToDelete.length > 0) {
      try {
        await cloudinary.api.delete_resources(publicIdsToDelete);
        // Also delete the user's folder
        await cloudinary.api.delete_folder(`employee_profiles/${session.user.id}`);
      } catch (cloudinaryError) {
        console.error('Error deleting Cloudinary files:', cloudinaryError);
        // Continue with account deletion even if file deletion fails
      }
    }

    // Check if user is a reporting manager for others
    const managedEmployees = await EmployeeProfile.find({ 
      reportingManager: session.user.id 
    });

    if (managedEmployees.length > 0) {
      return NextResponse.json<IProfileApiResponse>({
        success: false,
        message: `Cannot delete account. You are currently managing ${managedEmployees.length} employee(s). Please reassign them to another manager first.`
      }, { status: 400 });
    }

    // Log feedback if provided (you might want to store this in a separate collection)
    if (feedback) {
      console.log(`Account deletion feedback from ${session.user.email}: ${feedback}`);
      // TODO: Store feedback in a separate collection for analysis
    }

    // Delete profile first
    if (profile) {
      await EmployeeProfile.findByIdAndDelete(profile._id);
    }

    // Delete user account
    await User.findByIdAndDelete(session.user.id);

    return NextResponse.json<IProfileApiResponse>({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json<IProfileApiResponse>({
      success: false,
      message: 'Failed to delete account',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}