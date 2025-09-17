import { NextRequest, NextResponse } from 'next/server';
import { 
  ShareSettings, 
  ShareManager, 
  createPermissionChecker,
  Permission
} from '@/lib/permissions';

// Mock share settings storage (in real app, this would be in database)
const SHARE_SETTINGS: Map<string, ShareSettings> = new Map();

// GET /api/reports/share - Get share settings for a report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');
    const shareToken = searchParams.get('shareToken');

    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'reportId parameter is required'
      }, { status: 400 });
    }

    // Find share settings for the report
    const shareSettings = Array.from(SHARE_SETTINGS.values())
      .filter(share => share.reportId === reportId && !ShareManager.isShareExpired(share));

    // If accessing via share token
    if (shareToken) {
      const publicShare = shareSettings.find(share => 
        share.shareToken === shareToken && share.isPublic
      );

      if (!publicShare) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired share token'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          share: publicShare,
          accessType: 'public',
          permissions: publicShare.permissions
        }
      });
    }

    // If accessing as authenticated user
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required for authenticated access'
      }, { status: 400 });
    }

    const permissionChecker = createPermissionChecker(userId);
    if (!permissionChecker) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Filter shares accessible to the user
    const accessibleShares = shareSettings.filter(share => 
      share.sharedBy === userId || 
      ShareManager.canUserAccessSharedReport(share, userId) ||
      permissionChecker.hasPermission('MANAGE_USERS') // Admin can see all shares
    );

    return NextResponse.json({
      success: true,
      data: {
        shares: accessibleShares,
        total: accessibleShares.length,
        canManageShares: permissionChecker.canShareReport()
      }
    });

  } catch (error) {
    console.error('Error fetching share settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch share settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/reports/share - Create share settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reportId, 
      sharedBy, 
      sharedWith, 
      permissions, 
      expiresAt, 
      isPublic,
      description 
    } = body;

    if (!reportId || !sharedBy) {
      return NextResponse.json({
        success: false,
        error: 'reportId and sharedBy are required'
      }, { status: 400 });
    }

    // Check if user has permission to share reports
    const permissionChecker = createPermissionChecker(sharedBy);
    if (!permissionChecker || !permissionChecker.canShareReport()) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to share reports'
      }, { status: 403 });
    }

    // Validate permissions
    const validPermissions: Permission[] = permissions || ['READ_REPORTS'];
    const allowedPermissions: Permission[] = [
      'READ_REPORTS',
      'EXPORT_REPORTS'
    ];

    // Only admin/manager can grant edit permissions
    if (permissionChecker.hasPermission('MANAGE_USERS')) {
      allowedPermissions.push('EDIT_REPORTS', 'CREATE_REPORTS');
    }

    const invalidPermissions = validPermissions.filter(p => !allowedPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`
      }, { status: 400 });
    }

    // Create share settings
    const shareSettings = ShareManager.createShareSettings(reportId, sharedBy, {
      sharedWith: sharedWith || [],
      permissions: validPermissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isPublic: isPublic || false
    });

    // Add description if provided
    if (description) {
      (shareSettings as any).description = description;
    }

    // Store share settings
    SHARE_SETTINGS.set(shareSettings.id, shareSettings);

    return NextResponse.json({
      success: true,
      data: {
        share: shareSettings,
        shareUrl: shareSettings.isPublic 
          ? `/reports/shared/${shareSettings.shareToken}`
          : null
      },
      message: 'Report shared successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating share settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create share settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/reports/share - Update share settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      shareId, 
      userId, 
      sharedWith, 
      permissions, 
      expiresAt, 
      isPublic,
      description 
    } = body;

    if (!shareId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'shareId and userId are required'
      }, { status: 400 });
    }

    const shareSettings = SHARE_SETTINGS.get(shareId);
    if (!shareSettings) {
      return NextResponse.json({
        success: false,
        error: 'Share settings not found'
      }, { status: 404 });
    }

    // Check if share is expired
    if (ShareManager.isShareExpired(shareSettings)) {
      SHARE_SETTINGS.delete(shareId);
      return NextResponse.json({
        success: false,
        error: 'Share settings have expired'
      }, { status: 410 });
    }

    const permissionChecker = createPermissionChecker(userId);
    if (!permissionChecker) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check permissions - only share owner or admin can update
    if (shareSettings.sharedBy !== userId && !permissionChecker.hasPermission('MANAGE_USERS')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update share settings'
      }, { status: 403 });
    }

    // Update share settings
    const updatedShare: ShareSettings = {
      ...shareSettings,
      ...(sharedWith !== undefined && { sharedWith }),
      ...(permissions !== undefined && { permissions }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : undefined }),
      ...(isPublic !== undefined && { isPublic }),
      updatedAt: new Date()
    };

    // Update description if provided
    if (description !== undefined) {
      (updatedShare as any).description = description;
    }

    // If changing to public, generate token if not exists
    if (isPublic && !updatedShare.shareToken) {
      updatedShare.shareToken = ShareManager.generateShareToken();
    }

    // If changing to private, remove token
    if (isPublic === false) {
      updatedShare.shareToken = undefined;
    }

    // Store updated share settings
    SHARE_SETTINGS.set(shareId, updatedShare);

    return NextResponse.json({
      success: true,
      data: {
        share: updatedShare,
        shareUrl: updatedShare.isPublic 
          ? `/reports/shared/${updatedShare.shareToken}`
          : null
      },
      message: 'Share settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating share settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update share settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/reports/share - Delete share settings
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');
    const userId = searchParams.get('userId');

    if (!shareId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'shareId and userId are required'
      }, { status: 400 });
    }

    const shareSettings = SHARE_SETTINGS.get(shareId);
    if (!shareSettings) {
      return NextResponse.json({
        success: false,
        error: 'Share settings not found'
      }, { status: 404 });
    }

    const permissionChecker = createPermissionChecker(userId);
    if (!permissionChecker) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check permissions - only share owner or admin can delete
    if (shareSettings.sharedBy !== userId && !permissionChecker.hasPermission('MANAGE_USERS')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to delete share settings'
      }, { status: 403 });
    }

    // Delete share settings
    SHARE_SETTINGS.delete(shareId);

    return NextResponse.json({
      success: true,
      message: 'Share settings deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting share settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete share settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}