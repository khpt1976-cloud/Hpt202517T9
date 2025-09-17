// Permission system for construction diary management
export type UserRole = 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'VIEWER';

export type Permission = 
  | 'READ_REPORTS'
  | 'CREATE_REPORTS'
  | 'EDIT_REPORTS'
  | 'DELETE_REPORTS'
  | 'MANAGE_TEMPLATES'
  | 'MANAGE_USERS'
  | 'MANAGE_PROJECTS'
  | 'EXPORT_REPORTS'
  | 'APPROVE_REPORTS'
  | 'LOCK_PAGES'
  | 'UNLOCK_PAGES'
  | 'SHARE_REPORTS';

export type PageLockStatus = 'UNLOCKED' | 'LOCKED' | 'EDITING';

export interface UserPermissions {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  projectIds: string[];
  constructionIds: string[];
}

export interface PageLock {
  id: string;
  pageId: string;
  reportId: string;
  userId: string;
  userName: string;
  status: PageLockStatus;
  lockedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

export interface ShareSettings {
  id: string;
  reportId: string;
  sharedBy: string;
  sharedWith: string[];
  permissions: Permission[];
  expiresAt?: Date;
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'READ_REPORTS',
    'CREATE_REPORTS',
    'EDIT_REPORTS',
    'DELETE_REPORTS',
    'MANAGE_TEMPLATES',
    'MANAGE_USERS',
    'MANAGE_PROJECTS',
    'EXPORT_REPORTS',
    'APPROVE_REPORTS',
    'LOCK_PAGES',
    'UNLOCK_PAGES',
    'SHARE_REPORTS'
  ],
  MANAGER: [
    'READ_REPORTS',
    'CREATE_REPORTS',
    'EDIT_REPORTS',
    'MANAGE_TEMPLATES',
    'EXPORT_REPORTS',
    'APPROVE_REPORTS',
    'LOCK_PAGES',
    'UNLOCK_PAGES',
    'SHARE_REPORTS'
  ],
  ENGINEER: [
    'READ_REPORTS',
    'CREATE_REPORTS',
    'EDIT_REPORTS',
    'EXPORT_REPORTS',
    'SHARE_REPORTS'
  ],
  VIEWER: [
    'READ_REPORTS',
    'EXPORT_REPORTS'
  ]
};

// Permission checker utility
export class PermissionChecker {
  private userPermissions: UserPermissions;

  constructor(userPermissions: UserPermissions) {
    this.userPermissions = userPermissions;
  }

  hasPermission(permission: Permission): boolean {
    return this.userPermissions.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  canAccessProject(projectId: string): boolean {
    return this.userPermissions.projectIds.includes(projectId) || 
           this.userPermissions.role === 'ADMIN';
  }

  canAccessConstruction(constructionId: string): boolean {
    return this.userPermissions.constructionIds.includes(constructionId) || 
           this.userPermissions.role === 'ADMIN';
  }

  canEditReport(reportOwnerId: string): boolean {
    return this.hasPermission('EDIT_REPORTS') && 
           (this.userPermissions.userId === reportOwnerId || 
            this.userPermissions.role === 'ADMIN' || 
            this.userPermissions.role === 'MANAGER');
  }

  canDeleteReport(reportOwnerId: string): boolean {
    return this.hasPermission('DELETE_REPORTS') && 
           (this.userPermissions.userId === reportOwnerId || 
            this.userPermissions.role === 'ADMIN');
  }

  canLockPage(): boolean {
    return this.hasPermission('LOCK_PAGES');
  }

  canUnlockPage(lockOwnerId?: string): boolean {
    if (!this.hasPermission('UNLOCK_PAGES')) return false;
    
    // Admin can unlock any page
    if (this.userPermissions.role === 'ADMIN') return true;
    
    // Manager can unlock pages in their projects
    if (this.userPermissions.role === 'MANAGER') return true;
    
    // Users can only unlock their own locks
    return lockOwnerId === this.userPermissions.userId;
  }

  canShareReport(): boolean {
    return this.hasPermission('SHARE_REPORTS');
  }

  canApproveReport(): boolean {
    return this.hasPermission('APPROVE_REPORTS');
  }
}

// Page locking utilities
export class PageLockManager {
  private static readonly LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  static createLock(pageId: string, reportId: string, userId: string, userName: string): PageLock {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_DURATION);

    return {
      id: `lock_${pageId}_${userId}_${Date.now()}`,
      pageId,
      reportId,
      userId,
      userName,
      status: 'LOCKED',
      lockedAt: now,
      expiresAt,
      reason: 'User editing'
    };
  }

  static isLockExpired(lock: PageLock): boolean {
    if (!lock.expiresAt) return false;
    return new Date() > lock.expiresAt;
  }

  static isLockExpiringSoon(lock: PageLock): boolean {
    if (!lock.expiresAt) return false;
    const timeLeft = lock.expiresAt.getTime() - Date.now();
    return timeLeft <= this.WARNING_THRESHOLD && timeLeft > 0;
  }

  static getRemainingTime(lock: PageLock): number {
    if (!lock.expiresAt) return 0;
    return Math.max(0, lock.expiresAt.getTime() - Date.now());
  }

  static formatRemainingTime(lock: PageLock): string {
    const remaining = this.getRemainingTime(lock);
    if (remaining === 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  static extendLock(lock: PageLock, additionalMinutes: number = 30): PageLock {
    const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
    
    return {
      ...lock,
      expiresAt: newExpiresAt
    };
  }
}

// Share utilities
export class ShareManager {
  static generateShareToken(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  static createShareSettings(
    reportId: string,
    sharedBy: string,
    options: {
      sharedWith?: string[];
      permissions?: Permission[];
      expiresAt?: Date;
      isPublic?: boolean;
    } = {}
  ): ShareSettings {
    const now = new Date();
    
    return {
      id: `share_${reportId}_${Date.now()}`,
      reportId,
      sharedBy,
      sharedWith: options.sharedWith || [],
      permissions: options.permissions || ['READ_REPORTS'],
      expiresAt: options.expiresAt,
      isPublic: options.isPublic || false,
      shareToken: options.isPublic ? this.generateShareToken() : undefined,
      createdAt: now,
      updatedAt: now
    };
  }

  static isShareExpired(share: ShareSettings): boolean {
    if (!share.expiresAt) return false;
    return new Date() > share.expiresAt;
  }

  static canUserAccessSharedReport(share: ShareSettings, userId: string): boolean {
    if (this.isShareExpired(share)) return false;
    
    // Public shares are accessible to anyone with the token
    if (share.isPublic) return true;
    
    // Check if user is explicitly shared with
    return share.sharedWith.includes(userId);
  }
}

// Mock user data for testing
export const MOCK_USERS: UserPermissions[] = [
  {
    userId: 'user-admin-1',
    role: 'ADMIN',
    permissions: ROLE_PERMISSIONS.ADMIN,
    projectIds: ['proj-1', 'proj-2', 'proj-3'],
    constructionIds: ['const-1', 'const-2', 'const-3']
  },
  {
    userId: 'user-manager-1',
    role: 'MANAGER',
    permissions: ROLE_PERMISSIONS.MANAGER,
    projectIds: ['proj-1', 'proj-2'],
    constructionIds: ['const-1', 'const-2']
  },
  {
    userId: 'user-engineer-1',
    role: 'ENGINEER',
    permissions: ROLE_PERMISSIONS.ENGINEER,
    projectIds: ['proj-1'],
    constructionIds: ['const-1']
  },
  {
    userId: 'user-viewer-1',
    role: 'VIEWER',
    permissions: ROLE_PERMISSIONS.VIEWER,
    projectIds: ['proj-1'],
    constructionIds: ['const-1']
  }
];

// Helper function to get user permissions
export function getUserPermissions(userId: string): UserPermissions | null {
  return MOCK_USERS.find(user => user.userId === userId) || null;
}

// Helper function to create permission checker
export function createPermissionChecker(userId: string): PermissionChecker | null {
  const userPermissions = getUserPermissions(userId);
  if (!userPermissions) return null;
  
  return new PermissionChecker(userPermissions);
}