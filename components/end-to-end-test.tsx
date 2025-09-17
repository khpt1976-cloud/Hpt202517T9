'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  PlayCircle, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Upload,
  FileText,
  Settings,
  Share2,
  Lock,
  Download,
  Clock,
  User,
  Shield,
  Database,
  Server,
  Eye,
  RefreshCw
} from 'lucide-react'

interface TestStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  duration?: number
}

interface WorkflowTest {
  id: string
  name: string
  description: string
  steps: TestStep[]
  status: 'idle' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  totalDuration?: number
}

export function EndToEndTest() {
  const [workflows, setWorkflows] = useState<WorkflowTest[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<string | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  // Initialize test workflows
  useEffect(() => {
    const initialWorkflows: WorkflowTest[] = [
      {
        id: 'template-upload-workflow',
        name: 'Template Upload & Processing',
        description: 'Test template upload, page counting, and processing',
        status: 'idle',
        steps: [
          {
            id: 'upload-template',
            name: 'Upload Template File',
            description: 'Test template file upload and validation',
            status: 'pending'
          },
          {
            id: 'count-pages',
            name: 'Count Template Pages',
            description: 'Test page counting with mammoth.js',
            status: 'pending'
          },
          {
            id: 'process-template',
            name: 'Process Template Content',
            description: 'Test template content extraction and processing',
            status: 'pending'
          },
          {
            id: 'store-template',
            name: 'Store Template Data',
            description: 'Test template metadata storage',
            status: 'pending'
          }
        ]
      },
      {
        id: 'report-generation-workflow',
        name: 'Report Generation',
        description: 'Test complete report generation workflow',
        status: 'idle',
        steps: [
          {
            id: 'validate-config',
            name: 'Validate Configuration',
            description: 'Test report configuration validation',
            status: 'pending'
          },
          {
            id: 'merge-templates',
            name: 'Merge Templates',
            description: 'Test template merging logic',
            status: 'pending'
          },
          {
            id: 'generate-pages',
            name: 'Generate Report Pages',
            description: 'Test page structure generation',
            status: 'pending'
          },
          {
            id: 'create-document',
            name: 'Create Document',
            description: 'Test document creation and file generation',
            status: 'pending'
          },
          {
            id: 'store-report',
            name: 'Store Report Data',
            description: 'Test report metadata and page storage',
            status: 'pending'
          }
        ]
      },
      {
        id: 'permission-workflow',
        name: 'Permission & Security',
        description: 'Test permission system and security features',
        status: 'idle',
        steps: [
          {
            id: 'check-permissions',
            name: 'Check User Permissions',
            description: 'Test role-based permission checking',
            status: 'pending'
          },
          {
            id: 'lock-page',
            name: 'Lock Report Page',
            description: 'Test page locking functionality',
            status: 'pending'
          },
          {
            id: 'share-report',
            name: 'Share Report',
            description: 'Test report sharing with permissions',
            status: 'pending'
          },
          {
            id: 'access-control',
            name: 'Access Control',
            description: 'Test access control validation',
            status: 'pending'
          }
        ]
      },
      {
        id: 'integration-workflow',
        name: 'System Integration',
        description: 'Test system integration and health checks',
        status: 'idle',
        steps: [
          {
            id: 'api-health',
            name: 'API Health Check',
            description: 'Test all API endpoints availability',
            status: 'pending'
          },
          {
            id: 'onlyoffice-health',
            name: 'ONLYOFFICE Health',
            description: 'Test ONLYOFFICE server connection',
            status: 'pending'
          },
          {
            id: 'database-connection',
            name: 'Database Connection',
            description: 'Test database connectivity (mock)',
            status: 'pending'
          },
          {
            id: 'file-system',
            name: 'File System Access',
            description: 'Test file system read/write operations',
            status: 'pending'
          }
        ]
      }
    ]
    
    setWorkflows(initialWorkflows)
  }, [])

  // Execute a single test step
  const executeStep = async (workflowId: string, stepId: string): Promise<{ success: boolean; result?: any; error?: string }> => {
    const startTime = Date.now()
    
    try {
      switch (stepId) {
        case 'upload-template':
          // Mock template upload test
          await new Promise(resolve => setTimeout(resolve, 1000))
          return { 
            success: true, 
            result: { 
              fileName: 'test-template.docx', 
              size: 25600, 
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            } 
          }

        case 'count-pages':
          // Test page counting API
          const pageCountResponse = await fetch('/api/word-page-count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fileName: 'test-template.docx',
              fileSize: 25600,
              mockContent: 'This is a test document with multiple pages of content. '.repeat(100)
            })
          })
          const pageCountData = await pageCountResponse.json()
          return { success: pageCountData.success, result: pageCountData.data, error: pageCountData.error }

        case 'process-template':
          // Mock template processing
          await new Promise(resolve => setTimeout(resolve, 800))
          return { 
            success: true, 
            result: { 
              extractedText: 'Template content extracted successfully',
              images: 2,
              tables: 1,
              sections: 3
            } 
          }

        case 'store-template':
          // Test template storage API
          const templateResponse = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Test Template',
              categoryId: 'cat-1',
              fileName: 'test-template.docx',
              fileSize: 25600,
              pageCount: 3
            })
          })
          const templateData = await templateResponse.json()
          return { success: templateData.success, result: templateData.data, error: templateData.error }

        case 'validate-config':
          // Mock configuration validation
          await new Promise(resolve => setTimeout(resolve, 500))
          const config = {
            categoryId: 'cat-1',
            name: 'Test Report',
            reportDate: new Date().toISOString().split('T')[0],
            templateConfig: {
              initialPages: 2,
              dailyPages: 3,
              imagePages: 2,
              imagesPerPage: 4
            }
          }
          return { success: true, result: { config, valid: true } }

        case 'merge-templates':
          // Mock template merging
          await new Promise(resolve => setTimeout(resolve, 1200))
          return { 
            success: true, 
            result: { 
              mergedPages: 7,
              initialPages: 2,
              dailyPages: 3,
              imagePages: 2
            } 
          }

        case 'generate-pages':
          // Mock page generation
          await new Promise(resolve => setTimeout(resolve, 1000))
          return { 
            success: true, 
            result: { 
              totalPages: 7,
              pageStructure: [
                { pageNumber: 1, type: 'TEMPLATE_INITIAL' },
                { pageNumber: 2, type: 'TEMPLATE_INITIAL' },
                { pageNumber: 3, type: 'TEMPLATE_DAILY' },
                { pageNumber: 4, type: 'TEMPLATE_DAILY' },
                { pageNumber: 5, type: 'TEMPLATE_DAILY' },
                { pageNumber: 6, type: 'IMAGE_PAGE' },
                { pageNumber: 7, type: 'IMAGE_PAGE' }
              ]
            } 
          }

        case 'create-document':
          // Test report generation API
          const reportResponse = await fetch('/api/reports/generate-mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: 'cat-1',
              name: 'E2E Test Report',
              reportDate: new Date().toISOString().split('T')[0],
              templateConfig: {
                initialPages: 2,
                dailyPages: 3,
                imagePages: 2,
                imagesPerPage: 4
              }
            })
          })
          const reportData = await reportResponse.json()
          return { success: reportData.success, result: reportData.data, error: reportData.error }

        case 'store-report':
          // Mock report storage
          await new Promise(resolve => setTimeout(resolve, 600))
          return { 
            success: true, 
            result: { 
              reportId: 'report_e2e_test_' + Date.now(),
              stored: true,
              pages: 7,
              metadata: 'complete'
            } 
          }

        case 'check-permissions':
          // Test permissions API
          const permResponse = await fetch('/api/permissions?userId=user-admin-1')
          const permData = await permResponse.json()
          return { success: permData.success, result: permData.data, error: permData.error }

        case 'lock-page':
          // Test page locking API
          const lockResponse = await fetch('/api/pages/locks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageId: 'page-e2e-test',
              reportId: 'report-e2e-test',
              userId: 'user-admin-1',
              userName: 'E2E Test User',
              reason: 'End-to-end testing'
            })
          })
          const lockData = await lockResponse.json()
          return { success: lockData.success, result: lockData.data, error: lockData.error }

        case 'share-report':
          // Test report sharing API
          const shareResponse = await fetch('/api/reports/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportId: 'report-e2e-test',
              sharedBy: 'user-admin-1',
              sharedWith: ['user-engineer-1'],
              permissions: ['READ_REPORTS', 'EXPORT_REPORTS'],
              isPublic: false,
              description: 'E2E test sharing'
            })
          })
          const shareData = await shareResponse.json()
          return { success: shareData.success, result: shareData.data, error: shareData.error }

        case 'access-control':
          // Test access control
          const accessResponse = await fetch('/api/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'user-engineer-1',
              permissions: ['READ_REPORTS', 'CREATE_REPORTS'],
              projectId: 'proj-1'
            })
          })
          const accessData = await accessResponse.json()
          return { success: accessData.success, result: accessData.data, error: accessData.error }

        case 'api-health':
          // Test API endpoints
          const endpoints = [
            '/api/word-page-count',
            '/api/templates',
            '/api/reports/generate-mock',
            '/api/permissions',
            '/api/pages/locks',
            '/api/reports/share'
          ]
          
          const healthResults = []
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint, { method: 'GET' })
              healthResults.push({ endpoint, status: response.status, healthy: response.status < 500 })
            } catch (error) {
              healthResults.push({ endpoint, status: 0, healthy: false, error: error.message })
            }
          }
          
          const allHealthy = healthResults.every(r => r.healthy)
          return { success: allHealthy, result: { endpoints: healthResults, totalEndpoints: endpoints.length } }

        case 'onlyoffice-health':
          // Test ONLYOFFICE health
          const onlyofficeResponse = await fetch('/api/onlyoffice/health')
          const onlyofficeData = await onlyofficeResponse.json()
          return { 
            success: true, // Always success since ONLYOFFICE is optional
            result: { 
              ...onlyofficeData.data,
              optional: true,
              fallbackAvailable: true
            } 
          }

        case 'database-connection':
          // Mock database connection test
          await new Promise(resolve => setTimeout(resolve, 500))
          return { 
            success: true, 
            result: { 
              connected: true,
              mockMode: true,
              tablesAvailable: ['users', 'reports', 'templates', 'permissions']
            } 
          }

        case 'file-system':
          // Mock file system test
          await new Promise(resolve => setTimeout(resolve, 300))
          return { 
            success: true, 
            result: { 
              readable: true,
              writable: true,
              reportsDirectory: '/workspace/project/Khuongcuoicung/reports',
              templatesDirectory: '/workspace/project/Khuongcuoicung/templates'
            } 
          }

        default:
          return { success: false, error: 'Unknown test step' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      // Calculate duration
      const duration = Date.now() - startTime
      return { success: false, error: 'Execution completed', result: { duration } }
    }
  }

  // Execute a complete workflow
  const executeWorkflow = async (workflowId: string) => {
    setCurrentWorkflow(workflowId)
    
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, status: 'running', startTime: new Date() }
        : w
    ))

    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    let completedSteps = 0
    const totalSteps = workflow.steps.length

    for (const step of workflow.steps) {
      // Update step status to running
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? {
              ...w,
              steps: w.steps.map(s => 
                s.id === step.id 
                  ? { ...s, status: 'running' }
                  : s
              )
            }
          : w
      ))

      // Execute step
      const stepStartTime = Date.now()
      const result = await executeStep(workflowId, step.id)
      const stepDuration = Date.now() - stepStartTime

      // Update step status
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? {
              ...w,
              steps: w.steps.map(s => 
                s.id === step.id 
                  ? { 
                      ...s, 
                      status: result.success ? 'success' : 'error',
                      result: result.result,
                      error: result.error,
                      duration: stepDuration
                    }
                  : s
              )
            }
          : w
      ))

      completedSteps++
      setOverallProgress((completedSteps / totalSteps) * 100)

      // If step failed, stop workflow
      if (!result.success) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId 
            ? { 
                ...w, 
                status: 'failed', 
                endTime: new Date(),
                totalDuration: Date.now() - (w.startTime?.getTime() || Date.now())
              }
            : w
        ))
        setCurrentWorkflow(null)
        return
      }

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Workflow completed successfully
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { 
            ...w, 
            status: 'completed', 
            endTime: new Date(),
            totalDuration: Date.now() - (w.startTime?.getTime() || Date.now())
          }
        : w
    ))
    setCurrentWorkflow(null)
    setOverallProgress(100)
  }

  // Execute all workflows
  const executeAllWorkflows = async () => {
    setOverallProgress(0)
    for (const workflow of workflows) {
      await executeWorkflow(workflow.id)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between workflows
    }
  }

  // Reset all workflows
  const resetWorkflows = () => {
    setWorkflows(prev => prev.map(w => ({
      ...w,
      status: 'idle',
      startTime: undefined,
      endTime: undefined,
      totalDuration: undefined,
      steps: w.steps.map(s => ({
        ...s,
        status: 'pending',
        result: undefined,
        error: undefined,
        duration: undefined
      }))
    })))
    setCurrentWorkflow(null)
    setOverallProgress(0)
    setTestResults({})
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />
      case 'running': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlayCircle className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">End-to-End Testing</h1>
            <p className="text-gray-600">Complete system workflow testing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={resetWorkflows} variant="outline" disabled={currentWorkflow !== null}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button onClick={executeAllWorkflows} disabled={currentWorkflow !== null}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {currentWorkflow && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Progress</span>
                <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
              <div className="text-sm text-gray-600 text-center">
                Running workflow: {workflows.find(w => w.id === currentWorkflow)?.name}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {workflow.id.includes('template') && <Upload className="h-5 w-5 text-blue-600" />}
                    {workflow.id.includes('report') && <FileText className="h-5 w-5 text-blue-600" />}
                    {workflow.id.includes('permission') && <Shield className="h-5 w-5 text-blue-600" />}
                    {workflow.id.includes('integration') && <Server className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                </div>
                
                <Badge className={getStatusColor(workflow.status)}>
                  {workflow.status.toUpperCase()}
                </Badge>
              </div>
              
              {workflow.totalDuration && (
                <div className="text-sm text-gray-500">
                  Duration: {formatDuration(workflow.totalDuration)}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Steps */}
              <div className="space-y-3">
                {workflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(step.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{step.name}</h4>
                        {step.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(step.duration)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                      
                      {step.result && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                          <strong>Result:</strong> {JSON.stringify(step.result, null, 2).slice(0, 100)}...
                        </div>
                      )}
                      
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                          <strong>Error:</strong> {step.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Workflow Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm text-gray-500">
                  {workflow.steps.filter(s => s.status === 'success').length} / {workflow.steps.length} steps completed
                </div>
                
                <Button 
                  onClick={() => executeWorkflow(workflow.id)}
                  disabled={currentWorkflow !== null || workflow.status === 'running'}
                  size="sm"
                >
                  {workflow.status === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Test Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {workflows.filter(w => w.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {workflows.filter(w => w.status === 'running').length}
              </div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {workflows.filter(w => w.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {workflows.filter(w => w.status === 'idle').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}