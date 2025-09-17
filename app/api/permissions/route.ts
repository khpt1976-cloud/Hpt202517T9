import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserPermissions, 
  createPermissionChecker,
  MOCK_USERS,
  UserRole,
  Permission
} from '@/lib/permissions';

// GET /api/permissions - Get user permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    const userPermissions = getUserPermissions(userId);
    
    if (!userPermissions) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const permissionChecker = createPermissionChecker(userId);

    return NextResponse.json({
      success: true,
      data: {
        user: userPermissions,
        capabilities: {
          canCreateReports: permissionChecker?.hasPermission('CREATE_REPORTS') || false,
          canEditReports: permissionChecker?.hasPermission('EDIT_REPORTS') || false,
          canDeleteReports: permissionChecker?.hasPermission('DELETE_REPORTS') || false,
          canManageTemplates: permissionChecker?.hasPermission('MANAGE_TEMPLATES') || false,
          canManageUsers: permissionChecker?.hasPermission('MANAGE_USERS') || false,
          canApproveReports: permissionChecker?.hasPermission('APPROVE_REPORTS') || false,
          canLockPages: permissionChecker?.hasPermission('LOCK_PAGES') || false,
          canUnlockPages: permissionChecker?.hasPermission('UNLOCK_PAGES') || false,
          canShareReports: permissionChecker?.hasPermission('SHARE_REPORTS') || false,
          canExportReports: permissionChecker?.hasPermission('EXPORT_REPORTS') || false
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user permissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/permissions - Check specific permissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, permissions, reportId, projectId, constructionId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    const permissionChecker = createPermissionChecker(userId);
    
    if (!permissionChecker) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const results: Record<string, boolean> = {};

    // Check individual permissions
    if (permissions && Array.isArray(permissions)) {
      for (const permission of permissions) {
        results[permission] = permissionChecker.hasPermission(permission as Permission);
      }
    }

    // Check project access
    if (projectId) {
      results.canAccessProject = permissionChecker.canAccessProject(projectId);
    }

    // Check construction access
    if (constructionId) {
      results.canAccessConstruction = permissionChecker.canAccessConstruction(constructionId);
    }

    // Check report-specific permissions
    if (reportId) {
      // Mock report owner for testing
      const mockReportOwnerId = 'user-engineer-1';
      results.canEditReport = permissionChecker.canEditReport(mockReportOwnerId);
      results.canDeleteReport = permissionChecker.canDeleteReport(mockReportOwnerId);
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        permissions: results,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check permissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/permissions - Update user permissions (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, targetUserId, role, permissions, projectIds, constructionIds } = body;

    if (!adminUserId || !targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'adminUserId and targetUserId are required'
      }, { status: 400 });
    }

    // Check if admin has permission to manage users
    const adminChecker = createPermissionChecker(adminUserId);
    if (!adminChecker || !adminChecker.hasPermission('MANAGE_USERS')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to manage users'
      }, { status: 403 });
    }

    // Find target user
    const targetUserIndex = MOCK_USERS.findIndex(user => user.userId === targetUserId);
    if (targetUserIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Target user not found'
      }, { status: 404 });
    }

    // Update user permissions (in real app, this would update database)
    const updatedUser = {
      ...MOCK_USERS[targetUserIndex],
      ...(role && { role: role as UserRole }),
      ...(permissions && { permissions: permissions as Permission[] }),
      ...(projectIds && { projectIds }),
      ...(constructionIds && { constructionIds })
    };

    // In real app: await prisma.user.update(...)
    MOCK_USERS[targetUserIndex] = updatedUser;

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        updatedBy: adminUserId,
        updatedAt: new Date().toISOString()
      },
      message: 'User permissions updated successfully'
    });

  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update user permissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}