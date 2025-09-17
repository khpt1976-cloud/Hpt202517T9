'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Users, 
  Lock, 
  Unlock,
  Share2,
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Clock,
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  UserCheck,
  UserX,
  Timer
} from 'lucide-react'

interface UserPermissions {
  userId: string
  role: 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'VIEWER'
  permissions: string[]
  projectIds: string[]
  constructionIds: string[]
}

interface PageLock {
  id: string
  pageId: string
  reportId: string
  userId: string
  userName: string
  status: 'UNLOCKED' | 'LOCKED' | 'EDITING'
  lockedAt: string
  expiresAt?: string
  remainingTime?: number
  remainingTimeFormatted?: string
  isExpiringSoon?: boolean
  reason?: string
}

interface ShareSettings {
  id: string
  reportId: string
  sharedBy: string
  sharedWith: string[]
  permissions: string[]
  expiresAt?: string
  isPublic: boolean
  shareToken?: string
  createdAt: string
  updatedAt: string
  description?: string
}

export function PermissionManager() {
  const [currentUser, setCurrentUser] = useState('user-admin-1')
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [pageLocks, setPageLocks] = useState<PageLock[]>([])
  const [shareSettings, setShareSettings] = useState<ShareSettings[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user permissions
  const loadUserPermissions = async (userId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/permissions?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setUserPermissions(data.data.user)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load user permissions')
    } finally {
      setLoading(false)
    }
  }

  // Load page locks
  const loadPageLocks = async () => {
    try {
      const response = await fetch('/api/pages/locks')
      const data = await response.json()
      
      if (data.success) {
        setPageLocks(data.data.locks)
      }
    } catch (err) {
      console.error('Failed to load page locks:', err)
    }
  }

  // Load share settings
  const loadShareSettings = async () => {
    try {
      const response = await fetch(`/api/reports/share?reportId=report-1&userId=${currentUser}`)
      const data = await response.json()
      
      if (data.success) {
        setShareSettings(data.data.shares || [])
      }
    } catch (err) {
      console.error('Failed to load share settings:', err)
    }
  }

  // Create page lock
  const createPageLock = async (pageId: string, reportId: string, reason?: string) => {
    try {
      const response = await fetch('/api/pages/locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          reportId,
          userId: currentUser,
          userName: `User ${currentUser.split('-')[2]}`,
          reason
        })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadPageLocks()
        return data.data.lock
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to create page lock')
    }
  }

  // Release page lock
  const releasePageLock = async (lockId: string) => {
    try {
      const response = await fetch('/api/pages/locks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockId,
          userId: currentUser,
          action: 'release'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadPageLocks()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to release page lock')
    }
  }

  // Create share
  const createShare = async (reportId: string, isPublic: boolean, sharedWith: string[] = []) => {
    try {
      const response = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          sharedBy: currentUser,
          sharedWith,
          permissions: ['READ_REPORTS', 'EXPORT_REPORTS'],
          isPublic,
          description: `Shared by ${currentUser}`
        })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadShareSettings()
        return data.data.share
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to create share')
    }
  }

  // Delete share
  const deleteShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/reports/share?shareId=${shareId}&userId=${currentUser}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        await loadShareSettings()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to delete share')
    }
  }

  useEffect(() => {
    loadUserPermissions(currentUser)
    loadPageLocks()
    loadShareSettings()
  }, [currentUser])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'ENGINEER': return 'bg-green-100 text-green-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'READ_REPORTS': return <Eye className="h-3 w-3" />
      case 'CREATE_REPORTS': 
      case 'EDIT_REPORTS': return <Edit className="h-3 w-3" />
      case 'DELETE_REPORTS': return <Trash2 className="h-3 w-3" />
      case 'EXPORT_REPORTS': return <Download className="h-3 w-3" />
      case 'LOCK_PAGES': return <Lock className="h-3 w-3" />
      case 'UNLOCK_PAGES': return <Unlock className="h-3 w-3" />
      case 'SHARE_REPORTS': return <Share2 className="h-3 w-3" />
      case 'MANAGE_USERS': return <Users className="h-3 w-3" />
      default: return <Settings className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Permission Manager</h1>
            <p className="text-gray-600">Manage user permissions, page locks, and sharing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Label htmlFor="currentUser">Current User:</Label>
          <Select value={currentUser} onValueChange={setCurrentUser}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user-admin-1">Admin User</SelectItem>
              <SelectItem value="user-manager-1">Manager User</SelectItem>
              <SelectItem value="user-engineer-1">Engineer User</SelectItem>
              <SelectItem value="user-viewer-1">Viewer User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">User Permissions</TabsTrigger>
          <TabsTrigger value="locks">Page Locks</TabsTrigger>
          <TabsTrigger value="sharing">Report Sharing</TabsTrigger>
        </TabsList>

        {/* User Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Permissions
              </CardTitle>
              <CardDescription>
                View and manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading permissions...</span>
                </div>
              ) : userPermissions ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">{userPermissions.userId}</span>
                    </div>
                    <Badge className={getRoleColor(userPermissions.role)}>
                      {userPermissions.role}
                    </Badge>
                  </div>

                  {/* Permissions Grid */}
                  <div>
                    <h3 className="font-semibold mb-3">Permissions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {userPermissions.permissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                          {getPermissionIcon(permission)}
                          <span className="text-sm text-green-800">{permission.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Access Scope */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Project Access</h3>
                      <div className="space-y-2">
                        {userPermissions.projectIds.map((projectId) => (
                          <Badge key={projectId} variant="outline">
                            {projectId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Construction Access</h3>
                      <div className="space-y-2">
                        {userPermissions.constructionIds.map((constructionId) => (
                          <Badge key={constructionId} variant="outline">
                            {constructionId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No permission data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Locks Tab */}
        <TabsContent value="locks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Page Locks
              </CardTitle>
              <CardDescription>
                Manage page locking for collaborative editing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Lock Test */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium mb-3">Test Page Locking</h3>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => createPageLock('page-1', 'report-1', 'Testing lock functionality')}
                    size="sm"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Page 1
                  </Button>
                  <Button 
                    onClick={() => createPageLock('page-2', 'report-1', 'Testing another lock')}
                    size="sm"
                    variant="outline"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Page 2
                  </Button>
                </div>
              </div>

              {/* Active Locks */}
              <div>
                <h3 className="font-semibold mb-3">Active Locks ({pageLocks.length})</h3>
                {pageLocks.length > 0 ? (
                  <div className="space-y-3">
                    {pageLocks.map((lock) => (
                      <div key={lock.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">Page {lock.pageId}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{lock.userName}</span>
                          </div>
                          
                          {lock.remainingTimeFormatted && (
                            <div className={`flex items-center gap-1 ${lock.isExpiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
                              <Timer className="h-4 w-4" />
                              <span className="text-sm">{lock.remainingTimeFormatted}</span>
                            </div>
                          )}
                          
                          {lock.reason && (
                            <span className="text-sm text-gray-500 italic">"{lock.reason}"</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={lock.isExpiringSoon ? 'destructive' : 'secondary'}>
                            {lock.status}
                          </Badge>
                          
                          {(lock.userId === currentUser || userPermissions?.role === 'ADMIN') && (
                            <Button
                              onClick={() => releasePageLock(lock.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Release
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No active page locks
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Sharing Tab */}
        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Report Sharing
              </CardTitle>
              <CardDescription>
                Manage report sharing and access permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Share Test */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium mb-3">Test Report Sharing</h3>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => createShare('report-1', false, ['user-engineer-1'])}
                    size="sm"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Share Privately
                  </Button>
                  <Button 
                    onClick={() => createShare('report-1', true)}
                    size="sm"
                    variant="outline"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Publicly
                  </Button>
                </div>
              </div>

              {/* Active Shares */}
              <div>
                <h3 className="font-semibold mb-3">Active Shares ({shareSettings.length})</h3>
                {shareSettings.length > 0 ? (
                  <div className="space-y-3">
                    {shareSettings.map((share) => (
                      <div key={share.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Share2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Report {share.reportId}</span>
                            <Badge variant={share.isPublic ? 'default' : 'secondary'}>
                              {share.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          
                          <Button
                            onClick={() => deleteShare(share.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Shared by:</span>
                            <div className="font-medium">{share.sharedBy}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Permissions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {share.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <div className="font-medium">
                              {new Date(share.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {share.isPublic && share.shareToken && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                            <span className="text-gray-500">Share URL:</span>
                            <code className="ml-2 font-mono">/reports/shared/{share.shareToken}</code>
                          </div>
                        )}
                        
                        {!share.isPublic && share.sharedWith.length > 0 && (
                          <div className="mt-3">
                            <span className="text-gray-500 text-sm">Shared with:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {share.sharedWith.map((userId) => (
                                <Badge key={userId} variant="outline" className="text-xs">
                                  {userId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No active shares
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}