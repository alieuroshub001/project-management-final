// app/api/projects/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { ProjectTemplate } from '@/models/Project/ProjectTemplate';
import { IProjectApiResponse, IProjectTemplate } from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IProjectTemplate
function convertToIProjectTemplate(doc: any): IProjectTemplate {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    defaultTasks: doc.defaultTasks || [],
    defaultMilestones: doc.defaultMilestones || [],
    estimatedDuration: doc.estimatedDuration,
    isPublic: doc.isPublic,
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    usageCount: doc.usageCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - List project templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public');
    const myTemplates = searchParams.get('myTemplates') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter object
    const filter: any = {};
    
    if (myTemplates) {
      // Show user's own templates (both public and private)
      filter.createdBy = session.user.id;
    } else {
      // Show only public templates or user's own templates
      filter.$or = [
        { isPublic: true },
        { createdBy: session.user.id }
      ];
    }
    
    if (category) filter.category = category;
    if (isPublic !== null && isPublic !== undefined) {
      filter.isPublic = isPublic === 'true';
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      ProjectTemplate.find(filter)
        .sort({ usageCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProjectTemplate.countDocuments(filter)
    ]);

    const convertedTemplates = templates.map(convertToIProjectTemplate);

    return NextResponse.json<IProjectApiResponse<{
      templates: IProjectTemplate[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Templates retrieved successfully',
      data: {
        templates: convertedTemplates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new project template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      description,
      category,
      defaultTasks,
      defaultMilestones,
      estimatedDuration,
      isPublic = false
    } = body;

    // Validate required fields
    if (!name || !description || !category || !estimatedDuration) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields: name, description, category, estimatedDuration'
      }, { status: 400 });
    }

    // Validate estimated duration
    if (estimatedDuration < 1) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Estimated duration must be at least 1 day'
      }, { status: 400 });
    }

    // Validate default tasks if provided
    if (defaultTasks && Array.isArray(defaultTasks)) {
      for (const task of defaultTasks) {
        if (!task.title || !task.description || !task.estimatedHours) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'All default tasks must have title, description, and estimatedHours'
          }, { status: 400 });
        }
        if (task.estimatedHours < 0.5) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Task estimated hours must be at least 0.5'
          }, { status: 400 });
        }
      }
    }

    // Validate default milestones if provided
    if (defaultMilestones && Array.isArray(defaultMilestones)) {
      for (const milestone of defaultMilestones) {
        if (!milestone.title || !milestone.description || milestone.dayOffset === undefined) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'All default milestones must have title, description, and dayOffset'
          }, { status: 400 });
        }
        if (milestone.dayOffset < 0) {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Milestone day offset must be non-negative'
          }, { status: 400 });
        }
      }
    }

    const templateData = {
      name,
      description,
      category,
      defaultTasks: defaultTasks || [],
      defaultMilestones: defaultMilestones || [],
      estimatedDuration,
      isPublic,
      createdBy: session.user.id,
      createdByName: session.user.name
    };

    const template = await ProjectTemplate.create(templateData);

    return NextResponse.json<IProjectApiResponse<IProjectTemplate>>({
      success: true,
      message: 'Template created successfully',
      data: convertToIProjectTemplate(template)
    }, { status: 201 });

  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to create template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}