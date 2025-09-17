// Collaborative editing system with real-time synchronization
import { EventEmitter } from 'events'

// Collaborative editing interfaces
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
  role: 'viewer' | 'editor' | 'admin'
  isOnline: boolean
  lastSeen: Date
  cursor?: {
    position: number
    selection?: { start: number; end: number }
  }
}

export interface EditOperation {
  id: string
  type: 'insert' | 'delete' | 'replace' | 'format'
  userId: string
  timestamp: Date
  position: number
  content?: string
  length?: number
  attributes?: Record<string, any>
  metadata?: {
    pageNumber?: number
    elementId?: string
    reason?: string
  }
}

export interface Comment {
  id: string
  userId: string
  content: string
  position: number
  pageNumber?: number
  elementId?: string
  timestamp: Date
  resolved: boolean
  replies: CommentReply[]
  mentions: string[] // User IDs mentioned in comment
}

export interface CommentReply {
  id: string
  userId: string
  content: string
  timestamp: Date
}

export interface CollaborationSession {
  id: string
  reportId: string
  templateId: string
  participants: User[]
  operations: EditOperation[]
  comments: Comment[]
  createdAt: Date
  lastActivity: Date
  isActive: boolean
  settings: {
    allowAnonymous: boolean
    maxParticipants: number
    autoSave: boolean
    conflictResolution: 'last-write-wins' | 'operational-transform'
  }
}

export interface ConflictResolution {
  operationId: string
  conflictType: 'concurrent-edit' | 'version-mismatch' | 'permission-denied'
  resolution: 'accept' | 'reject' | 'merge'
  mergedOperation?: EditOperation
}

// Operational Transform for conflict resolution
export class OperationalTransform {
  // Transform operation against another operation
  static transform(op1: EditOperation, op2: EditOperation): {
    op1Prime: EditOperation
    op2Prime: EditOperation
  } {
    const op1Prime = { ...op1 }
    const op2Prime = { ...op2 }

    // Handle concurrent insertions
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        op2Prime.position += op1.content?.length || 0
      } else {
        op1Prime.position += op2.content?.length || 0
      }
    }
    
    // Handle insertion vs deletion
    else if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        op2Prime.position += op1.content?.length || 0
      } else if (op1.position <= op2.position + (op2.length || 0)) {
        // Insert is within deleted range
        op2Prime.length = (op2.length || 0) + (op1.content?.length || 0)
      }
    }
    
    // Handle deletion vs insertion
    else if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        op1Prime.position += op2.content?.length || 0
      } else if (op2.position <= op1.position + (op1.length || 0)) {
        // Insert is within deleted range - split deletion
        const beforeLength = op2.position - op1.position
        op1Prime.length = beforeLength
        
        // Create additional operation for after insertion
        // This would need to be handled by the calling code
      }
    }
    
    // Handle concurrent deletions
    else if (op1.type === 'delete' && op2.type === 'delete') {
      const op1End = op1.position + (op1.length || 0)
      const op2End = op2.position + (op2.length || 0)
      
      if (op1End <= op2.position) {
        // No overlap
        op2Prime.position -= op1.length || 0
      } else if (op2End <= op1.position) {
        // No overlap
        op1Prime.position -= op2.length || 0
      } else {
        // Overlapping deletions - merge them
        const startPos = Math.min(op1.position, op2.position)
        const endPos = Math.max(op1End, op2End)
        
        op1Prime.position = startPos
        op1Prime.length = endPos - startPos
        op2Prime.length = 0 // Second operation becomes no-op
      }
    }

    return { op1Prime, op2Prime }
  }

  // Apply operation to text content
  static applyOperation(content: string, operation: EditOperation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position)
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0))
      
      case 'replace':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position + (operation.length || 0))
      
      default:
        return content
    }
  }
}

// Real-time collaboration manager
export class CollaborationManager extends EventEmitter {
  private static instance: CollaborationManager
  private sessions: Map<string, CollaborationSession> = new Map()
  private userSessions: Map<string, string[]> = new Map() // userId -> sessionIds
  private websockets: Map<string, WebSocket> = new Map() // sessionId -> WebSocket
  private operationQueue: Map<string, EditOperation[]> = new Map() // sessionId -> operations

  static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager()
    }
    return CollaborationManager.instance
  }

  // Create collaboration session
  createSession(
    reportId: string,
    templateId: string,
    creator: User,
    settings?: Partial<CollaborationSession['settings']>
  ): CollaborationSession {
    const sessionId = `session_${reportId}_${Date.now()}`
    
    const session: CollaborationSession = {
      id: sessionId,
      reportId,
      templateId,
      participants: [creator],
      operations: [],
      comments: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      settings: {
        allowAnonymous: false,
        maxParticipants: 10,
        autoSave: true,
        conflictResolution: 'operational-transform',
        ...settings
      }
    }

    this.sessions.set(sessionId, session)
    this.addUserToSession(creator.id, sessionId)
    
    this.emit('sessionCreated', session)
    return session
  }

  // Join collaboration session
  joinSession(sessionId: string, user: User): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      return false
    }

    // Check if user already in session
    const existingUser = session.participants.find(p => p.id === user.id)
    if (existingUser) {
      existingUser.isOnline = true
      existingUser.lastSeen = new Date()
    } else {
      // Check participant limit
      if (session.participants.length >= session.settings.maxParticipants) {
        return false
      }

      session.participants.push(user)
    }

    session.lastActivity = new Date()
    this.addUserToSession(user.id, sessionId)
    
    this.emit('userJoined', { sessionId, user })
    this.broadcastToSession(sessionId, {
      type: 'userJoined',
      user,
      participants: session.participants
    })

    return true
  }

  // Leave collaboration session
  leaveSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.participants.find(p => p.id === userId)
    if (user) {
      user.isOnline = false
      user.lastSeen = new Date()
    }

    this.removeUserFromSession(userId, sessionId)
    
    this.emit('userLeft', { sessionId, userId })
    this.broadcastToSession(sessionId, {
      type: 'userLeft',
      userId,
      participants: session.participants
    })

    // Close session if no active participants
    const activeParticipants = session.participants.filter(p => p.isOnline)
    if (activeParticipants.length === 0) {
      this.closeSession(sessionId)
    }
  }

  // Apply edit operation
  applyOperation(sessionId: string, operation: EditOperation): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    // Check user permissions
    const user = session.participants.find(p => p.id === operation.userId)
    if (!user || user.role === 'viewer') {
      return false
    }

    // Transform operation against pending operations
    const pendingOps = this.operationQueue.get(sessionId) || []
    let transformedOp = operation

    if (session.settings.conflictResolution === 'operational-transform') {
      for (const pendingOp of pendingOps) {
        const { op1Prime } = OperationalTransform.transform(transformedOp, pendingOp)
        transformedOp = op1Prime
      }
    }

    // Add to session operations
    session.operations.push(transformedOp)
    session.lastActivity = new Date()

    // Add to operation queue for real-time sync
    if (!this.operationQueue.has(sessionId)) {
      this.operationQueue.set(sessionId, [])
    }
    this.operationQueue.get(sessionId)!.push(transformedOp)

    this.emit('operationApplied', { sessionId, operation: transformedOp })
    
    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: 'operation',
      operation: transformedOp
    })

    // Auto-save if enabled
    if (session.settings.autoSave) {
      this.scheduleAutoSave(sessionId)
    }

    return true
  }

  // Add comment
  addComment(sessionId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'replies'>): Comment | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const fullComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      replies: []
    }

    session.comments.push(fullComment)
    session.lastActivity = new Date()

    this.emit('commentAdded', { sessionId, comment: fullComment })
    this.broadcastToSession(sessionId, {
      type: 'commentAdded',
      comment: fullComment
    })

    // Notify mentioned users
    if (fullComment.mentions.length > 0) {
      this.notifyMentionedUsers(sessionId, fullComment)
    }

    return fullComment
  }

  // Reply to comment
  replyToComment(sessionId: string, commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const comment = session.comments.find(c => c.id === commentId)
    if (!comment) return false

    const fullReply: CommentReply = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    comment.replies.push(fullReply)
    session.lastActivity = new Date()

    this.emit('commentReply', { sessionId, commentId, reply: fullReply })
    this.broadcastToSession(sessionId, {
      type: 'commentReply',
      commentId,
      reply: fullReply
    })

    return true
  }

  // Resolve comment
  resolveComment(sessionId: string, commentId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const comment = session.comments.find(c => c.id === commentId)
    if (!comment) return false

    // Check permissions
    const user = session.participants.find(p => p.id === userId)
    if (!user || (user.role === 'viewer' && comment.userId !== userId)) {
      return false
    }

    comment.resolved = true
    session.lastActivity = new Date()

    this.emit('commentResolved', { sessionId, commentId })
    this.broadcastToSession(sessionId, {
      type: 'commentResolved',
      commentId
    })

    return true
  }

  // Update user cursor position
  updateCursor(sessionId: string, userId: string, cursor: User['cursor']): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.participants.find(p => p.id === userId)
    if (!user) return

    user.cursor = cursor
    user.lastSeen = new Date()

    this.broadcastToSession(sessionId, {
      type: 'cursorUpdate',
      userId,
      cursor
    }, userId) // Exclude sender
  }

  // Get session state
  getSession(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null
  }

  // Get user sessions
  getUserSessions(userId: string): CollaborationSession[] {
    const sessionIds = this.userSessions.get(userId) || []
    return sessionIds.map(id => this.sessions.get(id)).filter(Boolean) as CollaborationSession[]
  }

  // Close session
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.isActive = false
    
    // Notify all participants
    this.broadcastToSession(sessionId, {
      type: 'sessionClosed',
      sessionId
    })

    // Clean up
    session.participants.forEach(user => {
      this.removeUserFromSession(user.id, sessionId)
    })

    this.operationQueue.delete(sessionId)
    this.websockets.delete(sessionId)
    
    this.emit('sessionClosed', { sessionId })
  }

  // Private helper methods
  private addUserToSession(userId: string, sessionId: string): void {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, [])
    }
    const sessions = this.userSessions.get(userId)!
    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId)
    }
  }

  private removeUserFromSession(userId: string, sessionId: string): void {
    const sessions = this.userSessions.get(userId) || []
    const index = sessions.indexOf(sessionId)
    if (index > -1) {
      sessions.splice(index, 1)
    }
    if (sessions.length === 0) {
      this.userSessions.delete(userId)
    }
  }

  private broadcastToSession(sessionId: string, message: any, excludeUserId?: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.participants.forEach(user => {
      if (user.isOnline && user.id !== excludeUserId) {
        // In a real implementation, you'd send via WebSocket
        this.emit('broadcast', {
          userId: user.id,
          sessionId,
          message
        })
      }
    })
  }

  private notifyMentionedUsers(sessionId: string, comment: Comment): void {
    comment.mentions.forEach(userId => {
      this.emit('userMentioned', {
        sessionId,
        userId,
        comment
      })
    })
  }

  private scheduleAutoSave(sessionId: string): void {
    // Debounced auto-save
    setTimeout(() => {
      this.emit('autoSave', { sessionId })
    }, 2000)
  }

  // Get collaboration statistics
  getStats(): {
    activeSessions: number
    totalParticipants: number
    totalOperations: number
    totalComments: number
  } {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive)
    
    return {
      activeSessions: activeSessions.length,
      totalParticipants: activeSessions.reduce((sum, s) => sum + s.participants.length, 0),
      totalOperations: activeSessions.reduce((sum, s) => sum + s.operations.length, 0),
      totalComments: activeSessions.reduce((sum, s) => sum + s.comments.length, 0)
    }
  }
}

// Presence manager for user awareness
export class PresenceManager {
  private static instance: PresenceManager
  private userPresence: Map<string, {
    sessionId: string
    lastActivity: Date
    status: 'active' | 'idle' | 'away'
  }> = new Map()

  static getInstance(): PresenceManager {
    if (!PresenceManager.instance) {
      PresenceManager.instance = new PresenceManager()
    }
    return PresenceManager.instance
  }

  // Update user presence
  updatePresence(userId: string, sessionId: string, status: 'active' | 'idle' | 'away' = 'active'): void {
    this.userPresence.set(userId, {
      sessionId,
      lastActivity: new Date(),
      status
    })

    // Auto-cleanup old presence data
    this.cleanupOldPresence()
  }

  // Get user presence
  getUserPresence(userId: string): { sessionId: string; lastActivity: Date; status: string } | null {
    return this.userPresence.get(userId) || null
  }

  // Get all users in session
  getSessionUsers(sessionId: string): string[] {
    const users: string[] = []
    this.userPresence.forEach((presence, userId) => {
      if (presence.sessionId === sessionId) {
        users.push(userId)
      }
    })
    return users
  }

  // Clean up old presence data
  private cleanupOldPresence(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    this.userPresence.forEach((presence, userId) => {
      if (presence.lastActivity < fiveMinutesAgo) {
        this.userPresence.delete(userId)
      }
    })
  }
}

// Export singleton instances
export const collaborationManager = CollaborationManager.getInstance()
export const presenceManager = PresenceManager.getInstance()

// Export utility functions
export const collaborationUtils = {
  generateUserId: (): string => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  generateUserColor: (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  },

  validateOperation: (operation: EditOperation): boolean => {
    return !!(
      operation.id &&
      operation.type &&
      operation.userId &&
      operation.timestamp &&
      typeof operation.position === 'number'
    )
  },

  mergeOperations: (ops: EditOperation[]): EditOperation[] => {
    // Simple merge logic - in production, use more sophisticated merging
    const merged: EditOperation[] = []
    let current: EditOperation | null = null

    for (const op of ops) {
      if (!current) {
        current = op
        continue
      }

      // Try to merge consecutive operations from same user
      if (
        current.userId === op.userId &&
        current.type === op.type &&
        current.type === 'insert' &&
        current.position + (current.content?.length || 0) === op.position
      ) {
        current.content = (current.content || '') + (op.content || '')
      } else {
        merged.push(current)
        current = op
      }
    }

    if (current) {
      merged.push(current)
    }

    return merged
  }
}

export default CollaborationManager