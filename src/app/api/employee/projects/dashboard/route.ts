// app/api/employee/projects/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Project from '@/models/employee/Project/Project';
import { Task } from '@/models/employee/Project/Task';
import { TeamMember } from '@/models/employee/Project/TeamMember';
import { ProjectActivity } from '@/models/employee/Project/ProjectActivity';
import { Milestone } from '@/models/employee/Project/MileStone';
import { TimeEntry } from '@/models/employee/Project/TimeEntry';
import { 
  IProjectApiResponse, 
  IProjectDashboard,
  IProjectStatistics
} from '@/types/employee/projectmanagement';
import { authOptions } from '@/lib/auth';

// GET - Get dashboard data
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
    const type = searchParams.get('type') || 'dashboard'; // 'dashboard' or 'statistics'

    // Get user's accessible projects
    const userProjects = await TeamMember.find({
      employeeId: session.user.id,
      isActive: true
    }).select('projectId');
    
    const projectIds = userProjects.map(tm => tm.projectId);
    const userProjectsFilter = {
      $or: [
        { _id: { $in: projectIds } },
        { createdBy: session.user.id },
        { projectManager: session.user.id }
      ],
      isArchived: false
    };

    if (type === 'statistics') {
      // Get detailed statistics
      const [
        allProjects,
        allTasks,
        allTimeEntries,
        allActivities
      ] = await Promise.all([
        Project.find(userProjectsFilter),
        Task.find({ projectId: { $in: [...projectIds, ...await Project.find({ 
          $or: [{ createdBy: session.user.id }, { projectManager: session.user.id }] 
        }).select('_id').then(projects => projects.map(p => p._id))] } }),
        TimeEntry.find({ projectId: { $in: [...projectIds, ...await Project.find({ 
          $or: [{ createdBy: session.user.id }, { projectManager: session.user.id }] 
        }).select('_id').then(projects => projects.map(p => p._id))] } }),
        ProjectActivity.find({ projectId: { $in: [...projectIds, ...await Project.find({ 
          $or: [{ createdBy: session.user.id }, { projectManager: session.user.id }] 
        }).select('_id').then(projects => projects.map(p => p._id))] } }).limit(100)
      ]);

      // Calculate statistics
      const projectsByStatus: Record<string, number> = {};
      const projectsByCategory: Record<string, number> = {};
      const tasksByStatus: Record<string, number> = {};
      const tasksByPriority: Record<string, number> = {};

      allProjects.forEach(project => {
        projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
        projectsByCategory[project.category] = (projectsByCategory[project.category] || 0) + 1;
      });

      allTasks.forEach(task => {
        tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
        tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
      });

      // Calculate averages
      const completedProjects = allProjects.filter(p => p.status === 'completed');
      const completedTasks = allTasks.filter(t => t.status === 'completed');

      const averageProjectDuration = completedProjects.length > 0 
        ? completedProjects.reduce((sum, p) => {
            const duration = (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24);
            return sum + duration;
          }, 0) / completedProjects.length
        : 0;

      const averageTaskCompletionTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => {
            if (t.completedAt && t.createdAt) {
              const duration = (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + duration;
            }
            return sum;
          }, 0) / completedTasks.length
        : 0;

      // Most active users
      const userActivities: Record<string, { count: number; name: string; timeLogged: number }> = {};
      allActivities.forEach(activity => {
        if (!userActivities[activity.performedBy.toString()]) {
          userActivities[activity.performedBy.toString()] = {
            count: 0,
            name: activity.performedByName,
            timeLogged: 0
          };
        }
        userActivities[activity.performedBy.toString()].count++;
      });

      // Add time logged data
      allTimeEntries.forEach(entry => {
        const userId = entry.employeeId.toString();
        if (userActivities[userId]) {
          userActivities[userId].timeLogged += entry.duration;
        }
      });

      const mostActiveUsers = Object.entries(userActivities)
        .map(([userId, data]) => ({
          userId,
          userName: data.name,
          activitiesCount: data.count,
          timeLogged: data.timeLogged
        }))
        .sort((a, b) => b.activitiesCount - a.activitiesCount)
        .slice(0, 10);

      // Monthly progress (last 6 months)
      const monthlyProgress = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthProjects = completedProjects.filter(p => 
          p.updatedAt >= monthStart && p.updatedAt <= monthEnd
        ).length;

        const monthTasks = completedTasks.filter(t => 
          t.completedAt && t.completedAt >= monthStart && t.completedAt <= monthEnd
        ).length;

        const monthHours = allTimeEntries.filter(entry =>
          entry.createdAt >= monthStart && entry.createdAt <= monthEnd
        ).reduce((sum, entry) => sum + entry.duration, 0);

        monthlyProgress.push({
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          projectsCompleted: monthProjects,
          tasksCompleted: monthTasks,
          hoursLogged: Math.round(monthHours / 60) // Convert minutes to hours
        });
      }

      const statistics: IProjectStatistics = {
        projectsByStatus: projectsByStatus as any,
        projectsByCategory: projectsByCategory as any,
        tasksByStatus: tasksByStatus as any,
        tasksByPriority: tasksByPriority as any,
        averageProjectDuration: Math.round(averageProjectDuration),
        averageTaskCompletionTime: Math.round(averageTaskCompletionTime * 10) / 10,
        mostActiveUsers,
        monthlyProgress
      };

      return NextResponse.json<IProjectApiResponse<IProjectStatistics>>({
        success: true,
        message: 'Statistics retrieved successfully',
        data: statistics
      });

    } else {
      // Get dashboard data
      const [
        allProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        allTasks,
        completedTasks,
        overdueTasks,
        totalTimeLogged,
        recentActivity,
        upcomingMilestones,
        upcomingTaskDeadlines
      ] = await Promise.all([
        Project.countDocuments(userProjectsFilter),
        Project.countDocuments({ ...userProjectsFilter, status: { $in: ['planning', 'in-progress'] } }),
        Project.countDocuments({ ...userProjectsFilter, status: 'completed' }),
        Project.countDocuments({ 
          ...userProjectsFilter, 
          endDate: { $lt: new Date() }, 
          status: { $nin: ['completed', 'cancelled'] } 
        }),
        Task.countDocuments({ projectId: { $in: projectIds } }),
        Task.countDocuments({ projectId: { $in: projectIds }, status: 'completed' }),
        Task.countDocuments({ 
          projectId: { $in: projectIds }, 
          dueDate: { $lt: new Date() }, 
          status: { $nin: ['completed', 'cancelled'] } 
        }),
        TimeEntry.aggregate([
          { $match: { projectId: { $in: projectIds } } },
          { $group: { _id: null, total: { $sum: '$duration' } } }
        ]),
        ProjectActivity.find({ projectId: { $in: projectIds } })
          .sort({ createdAt: -1 })
          .limit(10),
        Milestone.find({ 
          projectId: { $in: projectIds },
          dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          status: { $nin: ['completed', 'cancelled'] }
        }).sort({ dueDate: 1 }).limit(5),
        Task.find({ 
          projectId: { $in: projectIds },
          dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          status: { $nin: ['completed', 'cancelled'] }
        }).sort({ dueDate: 1 }).limit(5)
      ]);

      const upcomingDeadlines = [
        ...upcomingMilestones.map(milestone => ({
          type: 'milestone' as const,
          id: milestone._id.toString(),
          title: milestone.title,
          dueDate: milestone.dueDate,
          status: milestone.status
        })),
        ...upcomingTaskDeadlines.map(task => ({
          type: 'task' as const,
          id: task._id.toString(),
          title: task.title,
          dueDate: task.dueDate!,
          status: task.status
        }))
      ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 10);

      const dashboard: IProjectDashboard = {
        totalProjects: allProjects,
        activeProjects: activeProjects,
        completedProjects: completedProjects,
        overdueProjects: overdueProjects,
        totalTasks: allTasks,
        completedTasks: completedTasks,
        overdueTasks: overdueTasks,
        totalTimeLogged: totalTimeLogged[0]?.total || 0,
        recentActivity: recentActivity.map(activity => ({
          id: activity._id.toString(),
          projectId: activity.projectId.toString(),
          activityType: activity.activityType as any,
          description: activity.description,
          performedBy: activity.performedBy.toString(),
          performedByName: activity.performedByName,
          entityType: activity.entityType as any,
          entityId: activity.entityId,
          metadata: activity.metadata,
          createdAt: activity.createdAt
        })),
        upcomingDeadlines
      };

      return NextResponse.json<IProjectApiResponse<IProjectDashboard>>({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboard
      });
    }

  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json<IProjectApiResponse>({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}