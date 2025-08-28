// app/api/projects/templates/[templateId]/route.ts
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

// GET - Get single project template
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;
    const templateId = params.templateId;

    const template = await ProjectTemplate.findById(templateId);

    if (!template) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Template not found'
      }, { status: 404 });
    }

    // Check if user can access this template (public or own template)
    if (!template.isPublic && template.createdBy.toString() !== session.user.id) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    return NextResponse.json<IProjectApiResponse<IProjectTemplate>>({
      success: true,
      message: 'Template retrieved successfully',
      data: convertToIProjectTemplate(template)
    });

  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update project template
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;
    const templateId = params.templateId;

    const template = await ProjectTemplate.findById(templateId);

    if (!template) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Template not found'
      }, { status: 404 });
    }

    // Check if user can edit this template (only creator)
    if (!template.canEdit(session.user.id)) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to edit this template'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      defaultTasks,
      defaultMilestones,
      estimatedDuration,
      isPublic
    } = body;

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (defaultTasks !== undefined) updateData.defaultTasks = defaultTasks;
    if (defaultMilestones !== undefined) updateData.defaultMilestones = defaultMilestones;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // Validate estimated duration if provided
    if (updateData.estimatedDuration !== undefined && updateData.estimatedDuration < 1) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Estimated duration must be at least 1 day'
      }, { status: 400 });
    }

    // Validate default tasks if provided
    if (updateData.defaultTasks && Array.isArray(updateData.defaultTasks)) {
      for (const task of updateData.defaultTasks) {
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
    if (updateData.defaultMilestones && Array.isArray(updateData.defaultMilestones)) {
      for (const milestone of updateData.defaultMilestones) {
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

    const updatedTemplate = await ProjectTemplate.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true }
    );

    if (!updatedTemplate) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Failed to update template'
      }, { status: 500 });
    }

    return NextResponse.json<IProjectApiResponse<IProjectTemplate>>({
      success: true,
      message: 'Template updated successfully',
      data: convertToIProjectTemplate(updatedTemplate)
    });

  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to update template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete project template
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;
    const templateId = params.templateId;

    const template = await ProjectTemplate.findById(templateId);

    if (!template) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Template not found'
      }, { status: 404 });
    }

    // Check if user can delete this template (only creator)
    if (!template.canEdit(session.user.id)) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Insufficient permissions to delete this template'
      }, { status: 403 });
    }

    // Delete the template
    await ProjectTemplate.findByIdAndDelete(templateId);

    return NextResponse.json<IProjectApiResponse>({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to delete template',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Use template (increment usage count)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    // Await params before using them
    const params = await context.params;
    const templateId = params.templateId;

    const template = await ProjectTemplate.findById(templateId);

    if (!template) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Template not found'
      }, { status: 404 });
    }

    // Check if user can access this template (public or own template)
    if (!template.isPublic && template.createdBy.toString() !== session.user.id) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    // Increment usage count
    await template.incrementUsage();

    return NextResponse.json<IProjectApiResponse<IProjectTemplate>>({
      success: true,
      message: 'Template usage recorded',
      data: convertToIProjectTemplate(template)
    });

  } catch (error) {
    console.error('Use template error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to record template usage',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}