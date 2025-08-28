// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Project, { IProjectDocument } from '@/models/Project/Project';
import { TeamMember } from '@/models/Project/TeamMember';
import { ProjectActivity } from '@/models/Project/ProjectActivity';
import { 
  IProjectCreateRequest, 
  IProjectApiResponse, 
  IProject,
  IProjectSearch,
  IProjectFilter
} from '@/types/projectmanagement';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IProject
function convertToIProject(doc: IProjectDocument): IProject {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    name: doc.name,
    description: doc.description,
    status: doc.status as any,
    priority: doc.priority as any,
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    createdByEmail: doc.createdByEmail,
    projectManager: doc.projectManager.toString(),
    projectManagerName: doc.projectManagerName,
    projectManagerEmail: doc.projectManagerEmail,
    startDate: doc.startDate,
    endDate: doc.endDate,
    estimatedHours: doc.estimatedHours,
    actualHours: doc.actualHours,
    budget: doc.budget,
    actualCost: doc.actualCost,
    progress: doc.progress,
    category: doc.category as any,
    tags: doc.tags,
    isArchived: doc.isArchived,
    attachments: doc.attachments,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - List projects with filters and pagination
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
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
    const status = searchParams.get('status')?.split(',') || [];
    const priority = searchParams.get('priority')?.split(',') || [];
    const category = searchParams.get('category')?.split(',') || [];
    const createdBy = searchParams.get('createdBy');
    const projectManager = searchParams.get('projectManager');
    const isArchived = searchParams.get('isArchived');
    const tags = searchParams.get('tags')?.split(',') || [];

    // Build filter object
    const filter: any = {};
    
    // User can only see projects they're involved in
    const userProjects = await TeamMember.find({
      employeeId: session.user.id,
      isActive: true
    }).select('projectId');
    
    const projectIds = userProjects.map(tm => tm.projectId);
    filter.$or = [
      { _id: { $in: projectIds } },
      { createdBy: session.user.id },
      { projectManager: session.user.id }
    ];

    if (status.length > 0) filter.status = { $in: status };
    if (priority.length > 0) filter.priority = { $in: priority };
    if (category.length > 0) filter.category = { $in: category };
    if (createdBy) filter.createdBy = createdBy;
    if (projectManager) filter.projectManager = projectManager;
    if (isArchived !== null) filter.isArchived = isArchived === 'true';
    if (tags.length > 0) filter.tags = { $in: tags };

    // Add text search if query provided
    if (query) {
      filter.$text = { $search: query };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() as Promise<IProjectDocument[]>,
      Project.countDocuments(filter)
    ]);

    const convertedProjects = projects.map(convertToIProject);

    return NextResponse.json<IProjectApiResponse<{
      projects: IProject[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects: convertedProjects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new project
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

    const body: IProjectCreateRequest = await request.json();
    const {
      name,
      description,
      status = 'planning',
      priority = 'medium',
      projectManager,
      startDate,
      endDate,
      estimatedHours,
      budget,
      category,
      tags,
      cloudinaryAttachments,
      templateId
    } = body;

    // Validate required fields
    if (!name || !description || !startDate || !endDate || !estimatedHours || !category) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate date range
    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json<IProjectApiResponse>({
        success: false,
        message: 'End date must be after start date'
      }, { status: 400 });
    }

    // Set project manager (default to creator if not specified)
    let managerId = projectManager || session.user.id;
    let managerName = session.user.name;
    let managerEmail = session.user.email;

    // If a different project manager is specified, fetch their details
    if (projectManager && projectManager !== session.user.id) {
      try {
        const User = (await import('@/models/User')).default;
        const manager = await User.findById(projectManager).lean();
        if (manager) {
          managerName = manager.name;
          managerEmail = manager.email;
        } else {
          return NextResponse.json<IProjectApiResponse>({
            success: false,
            message: 'Project manager not found'
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error fetching project manager:', error);
        // Fall back to session user
        managerId = session.user.id;
        managerName = session.user.name;
        managerEmail = session.user.email;
      }
    }

    const projectData = {
      name,
      description,
      status,
      priority,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdByEmail: session.user.email,
      projectManager: managerId,
      projectManagerName: managerName,
      projectManagerEmail: managerEmail,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      estimatedHours,
      budget,
      category,
      tags: tags || [],
      attachments: cloudinaryAttachments || []
    };

    const project = await Project.create(projectData) as IProjectDocument;

    // Add creator as team member with full permissions
    await TeamMember.create({
      projectId: project._id,
      employeeId: session.user.id,
      employeeName: session.user.name,
      employeeEmail: session.user.email,
      employeeMobile: session.user.mobile || '',
      role: 'project-manager',
      permissions: [
        'view-project', 'edit-project', 'delete-project', 'manage-team',
        'create-tasks', 'edit-tasks', 'delete-tasks', 'assign-tasks',
        'comment', 'upload-files', 'track-time', 'view-reports'
      ]
    });

    // Add project manager as team member if different from creator
    if (managerId !== session.user.id) {
      await TeamMember.create({
        projectId: project._id,
        employeeId: managerId,
        employeeName: managerName,
        employeeEmail: managerEmail,
        employeeMobile: '', // This should be fetched from user profile
        role: 'project-manager',
        permissions: [
          'view-project', 'edit-project', 'manage-team',
          'create-tasks', 'edit-tasks', 'assign-tasks',
          'comment', 'upload-files', 'track-time', 'view-reports'
        ]
      });
    }

    // Create project activity
    await ProjectActivity.create({
      projectId: project._id,
      activityType: 'project-created',
      description: `Project "${name}" was created`,
      performedBy: session.user.id,
      performedByName: session.user.name,
      entityType: 'project',
      entityId: (project._id as any).toString()
    });

    // TODO: If templateId provided, create tasks and milestones from template

    return NextResponse.json<IProjectApiResponse<IProject>>({
      success: true,
      message: 'Project created successfully',
      data: convertToIProject(project)
    }, { status: 201 });

  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}