import { NextRequest, NextResponse } from 'next/server';
import { 
  PageLock, 
  PageLockManager, 
  createPermissionChecker,
  PageLockStatus
} from '@/lib/permissions';

// Mock page locks storage (in real app, this would be in database)
const PAGE_LOCKS: Map<string, PageLock> = new Map();

// GET /api/pages/locks - Get page locks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');

    let locks: PageLock[] = Array.from(PAGE_LOCKS.values());

    // Filter by pageId
    if (pageId) {
      locks = locks.filter(lock => lock.pageId === pageId);
    }

    // Filter by reportId
    if (reportId) {
      locks = locks.filter(lock => lock.reportId === reportId);
    }

    // Filter by userId
    if (userId) {
      locks = locks.filter(lock => lock.userId === userId);
    }

    // Remove expired locks
    const activeLocks = locks.filter(lock => !PageLockManager.isLockExpired(lock));
    
    // Clean up expired locks from storage
    locks.filter(lock => PageLockManager.isLockExpired(lock))
         .forEach(lock => PAGE_LOCKS.delete(lock.id));

    // Add remaining time information
    const locksWithTimeInfo = activeLocks.map(lock => ({
      ...lock,
      remainingTime: PageLockManager.getRemainingTime(lock),
      remainingTimeFormatted: PageLockManager.formatRemainingTime(lock),
      isExpiringSoon: PageLockManager.isLockExpiringSoon(lock)
    }));

    return NextResponse.json({
      success: true,
      data: {
        locks: locksWithTimeInfo,
        total: locksWithTimeInfo.length
      }
    });

  } catch (error) {
    console.error('Error fetching page locks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch page locks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/pages/locks - Create page lock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, reportId, userId, userName, reason } = body;

    if (!pageId || !reportId || !userId || !userName) {
      return NextResponse.json({
        success: false,
        error: 'pageId, reportId, userId, and userName are required'
      }, { status: 400 });
    }

    // Check if user has permission to lock pages
    const permissionChecker = createPermissionChecker(userId);
    if (!permissionChecker || !permissionChecker.canLockPage()) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to lock pages'
      }, { status: 403 });
    }

    // Check if page is already locked by someone else
    const existingLock = Array.from(PAGE_LOCKS.values())
      .find(lock => lock.pageId === pageId && 
                   lock.userId !== userId && 
                   !PageLockManager.isLockExpired(lock));

    if (existingLock) {
      return NextResponse.json({
        success: false,
        error: 'Page is already locked by another user',
        data: {
          existingLock: {
            ...existingLock,
            remainingTime: PageLockManager.getRemainingTime(existingLock),
            remainingTimeFormatted: PageLockManager.formatRemainingTime(existingLock)
          }
        }
      }, { status: 409 });
    }

    // Create new lock
    const newLock = PageLockManager.createLock(pageId, reportId, userId, userName);
    if (reason) {
      newLock.reason = reason;
    }

    // Store lock
    PAGE_LOCKS.set(newLock.id, newLock);

    return NextResponse.json({
      success: true,
      data: {
        lock: {
          ...newLock,
          remainingTime: PageLockManager.getRemainingTime(newLock),
          remainingTimeFormatted: PageLockManager.formatRemainingTime(newLock)
        }
      },
      message: 'Page locked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating page lock:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create page lock',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/pages/locks - Update page lock (extend or change status)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lockId, userId, action, additionalMinutes } = body;

    if (!lockId || !userId || !action) {
      return NextResponse.json({
        success: false,
        error: 'lockId, userId, and action are required'
      }, { status: 400 });
    }

    const lock = PAGE_LOCKS.get(lockId);
    if (!lock) {
      return NextResponse.json({
        success: false,
        error: 'Lock not found'
      }, { status: 404 });
    }

    // Check if lock is expired
    if (PageLockManager.isLockExpired(lock)) {
      PAGE_LOCKS.delete(lockId);
      return NextResponse.json({
        success: false,
        error: 'Lock has expired'
      }, { status: 410 });
    }

    const permissionChecker = createPermissionChecker(userId);
    if (!permissionChecker) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    let updatedLock: PageLock;

    switch (action) {
      case 'extend':
        // Only lock owner or admin can extend
        if (lock.userId !== userId && !permissionChecker.canUnlockPage()) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions to extend lock'
          }, { status: 403 });
        }
        
        updatedLock = PageLockManager.extendLock(lock, additionalMinutes || 30);
        break;

      case 'release':
        // Only lock owner or admin can release
        if (lock.userId !== userId && !permissionChecker.canUnlockPage(lock.userId)) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions to release lock'
          }, { status: 403 });
        }
        
        PAGE_LOCKS.delete(lockId);
        return NextResponse.json({
          success: true,
          message: 'Lock released successfully'
        });

      case 'force_unlock':
        // Only admin or manager can force unlock
        if (!permissionChecker.canUnlockPage()) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions to force unlock'
          }, { status: 403 });
        }
        
        PAGE_LOCKS.delete(lockId);
        return NextResponse.json({
          success: true,
          message: 'Lock force unlocked successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: extend, release, or force_unlock'
        }, { status: 400 });
    }

    // Update lock in storage
    PAGE_LOCKS.set(lockId, updatedLock);

    return NextResponse.json({
      success: true,
      data: {
        lock: {
          ...updatedLock,
          remainingTime: PageLockManager.getRemainingTime(updatedLock),
          remainingTimeFormatted: PageLockManager.formatRemainingTime(updatedLock)
        }
      },
      message: `Lock ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error updating page lock:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update page lock',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/pages/locks - Delete page lock
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lockId = searchParams.get('lockId');
    const userId = searchParams.get('userId');

    if (!lockId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'lockId and userId are required'
      }, { status: 400 });
    }

    const lock = PAGE_LOCKS.get(lockId);
    if (!lock) {
      return NextResponse.json({
        success: false,
        error: 'Lock not found'
      }, { status: 404 });
    }

    const permissionChecker = createPermissionChecker(userId);
    if (!permissionChecker) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check permissions
    if (lock.userId !== userId && !permissionChecker.canUnlockPage(lock.userId)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to delete lock'
      }, { status: 403 });
    }

    // Delete lock
    PAGE_LOCKS.delete(lockId);

    return NextResponse.json({
      success: true,
      message: 'Lock deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting page lock:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete page lock',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}