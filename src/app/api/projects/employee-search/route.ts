// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { TeamMember } from '@/models/Project/TeamMember';
import { authOptions } from '@/lib/auth';
import { IApiResponse } from '@/types';

interface IEmployee {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isAvailable: boolean;
}

interface IEmployeeSearchResponse extends IApiResponse<{ employees: IEmployee[] }> {}

// GET - Search employees for project team
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IEmployeeSearchResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const projectId = searchParams.get('projectId');

    if (!query.trim()) {
      return NextResponse.json<IEmployeeSearchResponse>({
        success: true,
        message: 'No search query provided',
        data: { employees: [] }
      });
    }

    if (query.length < 2) {
      return NextResponse.json<IEmployeeSearchResponse>({
        success: false,
        message: 'Search query must be at least 2 characters'
      }, { status: 400 });
    }

    // Get existing team members for this project
    let existingMembers: string[] = [];
    if (projectId) {
      const teamMembers = await TeamMember.find({
        projectId,
        isActive: true
      }).select('employeeId');
      existingMembers = teamMembers.map(tm => tm.employeeId.toString());
    }

    // Search employees using your existing User model
    const searchRegex = new RegExp(query, 'i');
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { mobile: searchRegex }
          ]
        },
        // Exclude current user
        { _id: { $ne: session.user.id } },
        // Only verified users
        { emailVerified: true }
      ]
    }).limit(20).select('name email mobile role');

    const employees: IEmployee[] = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role || 'Employee',
      isAvailable: !existingMembers.includes(user._id.toString())
    }));

    return NextResponse.json<IEmployeeSearchResponse>({
      success: true,
      message: 'Employees found successfully',
      data: { employees }
    });

  } catch (error) {
    console.error('Employee search error:', error);
    return NextResponse.json<IEmployeeSearchResponse>({
      success: false,
      message: 'Failed to search employees',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}