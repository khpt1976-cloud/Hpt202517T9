// Version history system for reports with diff visualization and restore functionality
import { EditOperation } from './collaborative-editing'

// Version history interfaces
export interface Version {
  id: string
  reportId: string
  templateId: string
  versionNumber: number
  content: string
  title: string
  description?: string
  authorId: string
  authorName: string
  createdAt: Date
  size: number
  checksum: string
  tags: string[]
  metadata: {
    pageCount: number
    wordCount: number
    changes: VersionChange[]
    parentVersionId?: string
    branchName?: string
    isMajor: boolean
    isAutoSave: boolean
  }
}

export interface VersionChange {
  type: 'added' | 'modified' | 'deleted' | 'moved'
  element: string
  description: string
  position?: number
  oldValue?: string
  newValue?: string
}

export interface VersionBranch {
  id: string
  name: string
  description: string
  reportId: string
  createdAt: Date
  createdBy: string
  isActive: boolean
  versions: string[] // Version IDs in this branch
  parentBranchId?: string
  mergedIntoBranchId?: string
  mergedAt?: Date
}

export interface VersionDiff {
  versionA: Version
  versionB: Version
  changes: DiffChange[]
  statistics: {
    additions: number
    deletions: number
    modifications: number
    totalChanges: number
  }
}

export interface DiffChange {
  type: 'insert' | 'delete' | 'replace' | 'move'
  position: number
  length?: number
  oldContent?: string
  newContent?: string
  context: {
    before: string
    after: string
  }
}

export interface RestoreOptions {
  createNewVersion: boolean
  preserveCurrentAsBackup: boolean
  notifyCollaborators: boolean
  reason?: string
}

export interface MergeOptions {
  strategy: 'auto' | 'manual' | 'theirs' | 'ours'
  conflictResolution: 'ask' | 'auto-resolve' | 'mark-conflicts'
  preserveBothBranches: boolean
}

export interface MergeResult {
  success: boolean
  newVersionId?: string
  conflicts: MergeConflict[]
  mergedContent?: string
  error?: string
}

export interface MergeConflict {
  id: string
  type: 'content' | 'structure' | 'metadata'
  position: number
  ourContent: string
  theirContent: string
  description: string
  resolved: boolean
  resolution?: 'ours' | 'theirs' | 'manual'
  manualContent?: string
}

// Version history manager
export class VersionHistoryManager {
  private static instance: VersionHistoryManager
  private versions: Map<string, Version[]> = new Map() // reportId -> versions
  private branches: Map<string, VersionBranch[]> = new Map() // reportId -> branches
  private currentVersions: Map<string, string> = new Map() // reportId -> currentVersionId

  static getInstance(): VersionHistoryManager {
    if (!VersionHistoryManager.instance) {
      VersionHistoryManager.instance = new VersionHistoryManager()
    }
    return VersionHistoryManager.instance
  }

  // Create new version
  createVersion(
    reportId: string,
    templateId: string,
    content: string,
    authorId: string,
    authorName: string,
    options: {
      title?: string
      description?: string
      tags?: string[]
      isMajor?: boolean
      isAutoSave?: boolean
      branchName?: string
    } = {}
  ): Version {
    const versions = this.versions.get(reportId) || []
    const currentVersion = this.getCurrentVersion(reportId)
    
    const versionNumber = versions.length + 1
    const checksum = this.calculateChecksum(content)
    
    // Detect changes from previous version
    const changes: VersionChange[] = []
    if (currentVersion) {
      changes.push(...this.detectChanges(currentVersion.content, content))
    }

    const version: Version = {
      id: `v${versionNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      templateId,
      versionNumber,
      content,
      title: options.title || `Version ${versionNumber}`,
      description: options.description,
      authorId,
      authorName,
      createdAt: new Date(),
      size: content.length,
      checksum,
      tags: options.tags || [],
      metadata: {
        pageCount: this.countPages(content),
        wordCount: this.countWords(content),
        changes,
        parentVersionId: currentVersion?.id,
        branchName: options.branchName || 'main',
        isMajor: options.isMajor || false,
        isAutoSave: options.isAutoSave || false
      }
    }

    // Add to versions list
    versions.push(version)
    this.versions.set(reportId, versions)
    
    // Update current version
    this.currentVersions.set(reportId, version.id)

    // Add to branch
    this.addVersionToBranch(reportId, version.id, options.branchName || 'main')

    return version
  }

  // Get version by ID
  getVersion(reportId: string, versionId: string): Version | null {
    const versions = this.versions.get(reportId) || []
    return versions.find(v => v.id === versionId) || null
  }

  // Get current version
  getCurrentVersion(reportId: string): Version | null {
    const currentVersionId = this.currentVersions.get(reportId)
    if (!currentVersionId) return null
    return this.getVersion(reportId, currentVersionId)
  }

  // Get all versions for report
  getVersions(reportId: string, options: {
    branchName?: string
    limit?: number
    offset?: number
    includeAutoSave?: boolean
  } = {}): Version[] {
    let versions = this.versions.get(reportId) || []

    // Filter by branch
    if (options.branchName) {
      versions = versions.filter(v => v.metadata.branchName === options.branchName)
    }

    // Filter auto-save versions
    if (!options.includeAutoSave) {
      versions = versions.filter(v => !v.metadata.isAutoSave)
    }

    // Sort by creation date (newest first)
    versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply pagination
    if (options.offset) {
      versions = versions.slice(options.offset)
    }
    if (options.limit) {
      versions = versions.slice(0, options.limit)
    }

    return versions
  }

  // Compare two versions
  compareVersions(reportId: string, versionAId: string, versionBId: string): VersionDiff | null {
    const versionA = this.getVersion(reportId, versionAId)
    const versionB = this.getVersion(reportId, versionBId)
    
    if (!versionA || !versionB) return null

    const changes = this.generateDiff(versionA.content, versionB.content)
    const statistics = this.calculateDiffStatistics(changes)

    return {
      versionA,
      versionB,
      changes,
      statistics
    }
  }

  // Restore version
  async restoreVersion(
    reportId: string,
    versionId: string,
    authorId: string,
    authorName: string,
    options: RestoreOptions = {
      createNewVersion: true,
      preserveCurrentAsBackup: true,
      notifyCollaborators: true
    }
  ): Promise<Version | null> {
    const versionToRestore = this.getVersion(reportId, versionId)
    const currentVersion = this.getCurrentVersion(reportId)
    
    if (!versionToRestore) return null

    // Create backup of current version if requested
    if (options.preserveCurrentAsBackup && currentVersion) {
      this.createVersion(
        reportId,
        currentVersion.templateId,
        currentVersion.content,
        currentVersion.authorId,
        currentVersion.authorName,
        {
          title: `Backup before restore to v${versionToRestore.versionNumber}`,
          description: `Automatic backup created before restoring to version ${versionToRestore.versionNumber}`,
          tags: ['backup', 'auto-generated'],
          isAutoSave: true
        }
      )
    }

    // Create new version with restored content
    if (options.createNewVersion) {
      return this.createVersion(
        reportId,
        versionToRestore.templateId,
        versionToRestore.content,
        authorId,
        authorName,
        {
          title: `Restored from v${versionToRestore.versionNumber}`,
          description: options.reason || `Restored from version ${versionToRestore.versionNumber} (${versionToRestore.title})`,
          tags: ['restore'],
          isMajor: true
        }
      )
    } else {
      // Direct restore (update current version)
      this.currentVersions.set(reportId, versionId)
      return versionToRestore
    }
  }

  // Create branch
  createBranch(
    reportId: string,
    name: string,
    description: string,
    createdBy: string,
    fromVersionId?: string
  ): VersionBranch {
    const branches = this.branches.get(reportId) || []
    const fromVersion = fromVersionId ? this.getVersion(reportId, fromVersionId) : this.getCurrentVersion(reportId)
    
    const branch: VersionBranch = {
      id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      reportId,
      createdAt: new Date(),
      createdBy,
      isActive: true,
      versions: fromVersion ? [fromVersion.id] : [],
      parentBranchId: fromVersion?.metadata.branchName === 'main' ? undefined : fromVersion?.metadata.branchName
    }

    branches.push(branch)
    this.branches.set(reportId, branches)

    return branch
  }

  // Get branches
  getBranches(reportId: string): VersionBranch[] {
    return this.branches.get(reportId) || []
  }

  // Merge branches
  async mergeBranches(
    reportId: string,
    sourceBranchName: string,
    targetBranchName: string,
    authorId: string,
    authorName: string,
    options: MergeOptions = {
      strategy: 'auto',
      conflictResolution: 'ask',
      preserveBothBranches: true
    }
  ): Promise<MergeResult> {
    const sourceVersions = this.getVersions(reportId, { branchName: sourceBranchName })
    const targetVersions = this.getVersions(reportId, { branchName: targetBranchName })
    
    if (sourceVersions.length === 0 || targetVersions.length === 0) {
      return {
        success: false,
        conflicts: [],
        error: 'One or both branches are empty'
      }
    }

    const sourceVersion = sourceVersions[0] // Latest version
    const targetVersion = targetVersions[0] // Latest version

    // Generate diff to identify conflicts
    const diff = this.compareVersions(reportId, targetVersion.id, sourceVersion.id)
    if (!diff) {
      return {
        success: false,
        conflicts: [],
        error: 'Failed to compare versions'
      }
    }

    // Identify conflicts
    const conflicts = this.identifyMergeConflicts(diff)

    if (conflicts.length > 0 && options.strategy === 'auto' && options.conflictResolution === 'ask') {
      return {
        success: false,
        conflicts,
        error: 'Manual conflict resolution required'
      }
    }

    // Auto-resolve conflicts if possible
    let mergedContent = targetVersion.content
    if (options.strategy === 'auto' || options.conflictResolution === 'auto-resolve') {
      mergedContent = this.autoMergeContent(targetVersion.content, sourceVersion.content, conflicts)
    } else if (options.strategy === 'theirs') {
      mergedContent = sourceVersion.content
    } else if (options.strategy === 'ours') {
      mergedContent = targetVersion.content
    }

    // Create merge version
    const mergeVersion = this.createVersion(
      reportId,
      targetVersion.templateId,
      mergedContent,
      authorId,
      authorName,
      {
        title: `Merge ${sourceBranchName} into ${targetBranchName}`,
        description: `Merged branch ${sourceBranchName} into ${targetBranchName}`,
        tags: ['merge'],
        isMajor: true,
        branchName: targetBranchName
      }
    )

    // Mark source branch as merged if not preserving
    if (!options.preserveBothBranches) {
      const branches = this.branches.get(reportId) || []
      const sourceBranch = branches.find(b => b.name === sourceBranchName)
      if (sourceBranch) {
        sourceBranch.isActive = false
        sourceBranch.mergedIntoBranchId = targetBranchName
        sourceBranch.mergedAt = new Date()
      }
    }

    return {
      success: true,
      newVersionId: mergeVersion.id,
      conflicts: conflicts.filter(c => !c.resolved),
      mergedContent
    }
  }

  // Tag version
  tagVersion(reportId: string, versionId: string, tags: string[]): boolean {
    const version = this.getVersion(reportId, versionId)
    if (!version) return false

    version.tags = [...new Set([...version.tags, ...tags])]
    return true
  }

  // Search versions
  searchVersions(reportId: string, query: {
    text?: string
    author?: string
    dateFrom?: Date
    dateTo?: Date
    tags?: string[]
    branchName?: string
  }): Version[] {
    let versions = this.versions.get(reportId) || []

    // Filter by text in title or description
    if (query.text) {
      const searchText = query.text.toLowerCase()
      versions = versions.filter(v => 
        v.title.toLowerCase().includes(searchText) ||
        (v.description && v.description.toLowerCase().includes(searchText))
      )
    }

    // Filter by author
    if (query.author) {
      versions = versions.filter(v => 
        v.authorName.toLowerCase().includes(query.author!.toLowerCase()) ||
        v.authorId === query.author
      )
    }

    // Filter by date range
    if (query.dateFrom) {
      versions = versions.filter(v => v.createdAt >= query.dateFrom!)
    }
    if (query.dateTo) {
      versions = versions.filter(v => v.createdAt <= query.dateTo!)
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      versions = versions.filter(v => 
        query.tags!.some(tag => v.tags.includes(tag))
      )
    }

    // Filter by branch
    if (query.branchName) {
      versions = versions.filter(v => v.metadata.branchName === query.branchName)
    }

    return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Private helper methods
  private calculateChecksum(content: string): string {
    // Simple checksum calculation (in production, use crypto.createHash)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  private countPages(content: string): number {
    return (content.match(/<!-- PAGE_BREAK -->/g) || []).length + 1
  }

  private countWords(content: string): number {
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, ' ')
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private detectChanges(oldContent: string, newContent: string): VersionChange[] {
    const changes: VersionChange[] = []
    
    // Simple change detection (in production, use more sophisticated diff algorithm)
    if (oldContent !== newContent) {
      const oldWords = oldContent.split(/\s+/)
      const newWords = newContent.split(/\s+/)
      
      if (newWords.length > oldWords.length) {
        changes.push({
          type: 'added',
          element: 'content',
          description: `Added ${newWords.length - oldWords.length} words`
        })
      } else if (newWords.length < oldWords.length) {
        changes.push({
          type: 'deleted',
          element: 'content',
          description: `Removed ${oldWords.length - newWords.length} words`
        })
      } else {
        changes.push({
          type: 'modified',
          element: 'content',
          description: 'Content modified'
        })
      }
    }

    return changes
  }

  private generateDiff(contentA: string, contentB: string): DiffChange[] {
    const changes: DiffChange[] = []
    
    // Simple diff implementation (in production, use libraries like diff or jsdiff)
    const linesA = contentA.split('\n')
    const linesB = contentB.split('\n')
    
    let positionA = 0
    let positionB = 0
    
    while (positionA < linesA.length || positionB < linesB.length) {
      if (positionA >= linesA.length) {
        // Remaining lines in B are insertions
        changes.push({
          type: 'insert',
          position: positionB,
          newContent: linesB[positionB],
          context: {
            before: linesB[positionB - 1] || '',
            after: linesB[positionB + 1] || ''
          }
        })
        positionB++
      } else if (positionB >= linesB.length) {
        // Remaining lines in A are deletions
        changes.push({
          type: 'delete',
          position: positionA,
          oldContent: linesA[positionA],
          context: {
            before: linesA[positionA - 1] || '',
            after: linesA[positionA + 1] || ''
          }
        })
        positionA++
      } else if (linesA[positionA] === linesB[positionB]) {
        // Lines are the same
        positionA++
        positionB++
      } else {
        // Lines are different - could be replace, insert, or delete
        changes.push({
          type: 'replace',
          position: positionA,
          oldContent: linesA[positionA],
          newContent: linesB[positionB],
          context: {
            before: linesA[positionA - 1] || '',
            after: linesA[positionA + 1] || ''
          }
        })
        positionA++
        positionB++
      }
    }
    
    return changes
  }

  private calculateDiffStatistics(changes: DiffChange[]): VersionDiff['statistics'] {
    const stats = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      totalChanges: changes.length
    }

    changes.forEach(change => {
      switch (change.type) {
        case 'insert':
          stats.additions++
          break
        case 'delete':
          stats.deletions++
          break
        case 'replace':
          stats.modifications++
          break
      }
    })

    return stats
  }

  private addVersionToBranch(reportId: string, versionId: string, branchName: string): void {
    const branches = this.branches.get(reportId) || []
    let branch = branches.find(b => b.name === branchName)
    
    if (!branch) {
      // Create main branch if it doesn't exist
      if (branchName === 'main') {
        branch = {
          id: 'main',
          name: 'main',
          description: 'Main branch',
          reportId,
          createdAt: new Date(),
          createdBy: 'system',
          isActive: true,
          versions: []
        }
        branches.push(branch)
        this.branches.set(reportId, branches)
      } else {
        return // Branch doesn't exist
      }
    }

    if (!branch.versions.includes(versionId)) {
      branch.versions.push(versionId)
    }
  }

  private identifyMergeConflicts(diff: VersionDiff): MergeConflict[] {
    const conflicts: MergeConflict[] = []
    
    diff.changes.forEach((change, index) => {
      // Identify potential conflicts (simplified logic)
      if (change.type === 'replace' && change.oldContent && change.newContent) {
        conflicts.push({
          id: `conflict_${index}`,
          type: 'content',
          position: change.position,
          ourContent: change.oldContent,
          theirContent: change.newContent,
          description: `Conflicting changes at line ${change.position + 1}`,
          resolved: false
        })
      }
    })

    return conflicts
  }

  private autoMergeContent(ourContent: string, theirContent: string, conflicts: MergeConflict[]): string {
    // Simple auto-merge (in production, use more sophisticated merging)
    let merged = ourContent
    
    conflicts.forEach(conflict => {
      if (conflict.type === 'content') {
        // For now, prefer their changes
        merged = merged.replace(conflict.ourContent, conflict.theirContent)
        conflict.resolved = true
        conflict.resolution = 'theirs'
      }
    })

    return merged
  }

  // Get version history statistics
  getStats(reportId?: string): {
    totalVersions: number
    totalBranches: number
    averageVersionSize: number
    mostActiveAuthor: string
    oldestVersion?: Date
    newestVersion?: Date
  } {
    let allVersions: Version[] = []
    let allBranches: VersionBranch[] = []

    if (reportId) {
      allVersions = this.versions.get(reportId) || []
      allBranches = this.branches.get(reportId) || []
    } else {
      this.versions.forEach(versions => allVersions.push(...versions))
      this.branches.forEach(branches => allBranches.push(...branches))
    }

    const authorCounts = new Map<string, number>()
    let totalSize = 0

    allVersions.forEach(version => {
      const count = authorCounts.get(version.authorName) || 0
      authorCounts.set(version.authorName, count + 1)
      totalSize += version.size
    })

    const mostActiveAuthor = Array.from(authorCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown'

    const sortedVersions = allVersions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    return {
      totalVersions: allVersions.length,
      totalBranches: allBranches.length,
      averageVersionSize: allVersions.length > 0 ? Math.round(totalSize / allVersions.length) : 0,
      mostActiveAuthor,
      oldestVersion: sortedVersions[0]?.createdAt,
      newestVersion: sortedVersions[sortedVersions.length - 1]?.createdAt
    }
  }
}

// Export singleton instance
export const versionHistoryManager = VersionHistoryManager.getInstance()

// Export utility functions
export const versionUtils = {
  formatVersionNumber: (version: Version): string => {
    return `v${version.versionNumber}${version.metadata.isMajor ? '' : '-minor'}`
  },

  getVersionAge: (version: Version): string => {
    const now = new Date()
    const diff = now.getTime() - version.createdAt.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  },

  generateVersionSummary: (version: Version): string => {
    const changes = version.metadata.changes
    if (changes.length === 0) return 'No changes'
    
    const summary = changes.map(change => change.description).join(', ')
    return summary.length > 100 ? summary.substring(0, 97) + '...' : summary
  },

  isVersionOutdated: (version: Version, currentVersion: Version): boolean => {
    return version.versionNumber < currentVersion.versionNumber
  }
}

export default VersionHistoryManager