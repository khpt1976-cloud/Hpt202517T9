// =====================================================
// TYPESCRIPT INTERFACES FOR DATABASE SCHEMA
// Structure: Projects → Constructions → Categories → Reports
// =====================================================

// Base types
export type Status = 'active' | 'completed' | 'paused'
export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer'
export type SharedType = 'private' | 'members' | 'public'
export type ReportStatus = 'draft' | 'completed' | 'archived'
export type PageType = 'template_initial' | 'template_daily' | 'image_page' | 'custom'
export type TemplateType = 'initial' | 'daily'
export type PermissionType = 'view' | 'edit' | 'admin'
export type ActionType = 'create' | 'update' | 'delete' | 'share' | 'lock' | 'unlock'
export type ResourceType = 'project' | 'construction' | 'category' | 'report' | 'page'

// =====================================================
// MAIN ENTITIES
// =====================================================

export interface Project {
  id: string
  name: string
  description?: string
  manager?: string
  status: Status
  start_date?: Date
  end_date?: Date
  budget?: number
  location?: string
  created_at: Date
  updated_at: Date
}

export interface Construction {
  id: string
  project_id: string
  name: string
  description?: string
  location?: string
  manager?: string
  status: Status
  start_date?: Date
  end_date?: Date
  progress_percentage: number
  created_at: Date
  updated_at: Date
  
  // Relations
  project?: Project
  categories?: Category[]
}

export interface Category {
  id: string
  construction_id: string
  name: string
  description?: string
  contractor?: string
  contract_value?: number
  status: Status
  start_date?: Date
  end_date?: Date
  created_at: Date
  updated_at: Date
  
  // Relations
  construction?: Construction
  reports?: Report[]
}

export interface Report {
  id: string
  category_id: string
  name: string
  report_date: Date
  weather?: string
  temperature?: string
  content?: any // JSONB
  template_config?: TemplateConfig
  image_config?: ImageConfig
  document_url?: string
  pdf_url?: string
  is_shared: boolean
  shared_type: SharedType
  shared_url?: string
  status: ReportStatus
  created_by?: string
  created_at: Date
  updated_at: Date
  
  // Relations
  category?: Category
  pages?: ReportPage[]
  images?: ReportImage[]
  permissions?: ReportPermission[]
}

export interface ReportPage {
  id: string
  report_id: string
  page_number: number
  page_type: PageType
  content?: any // JSONB
  is_locked: boolean
  locked_by?: string
  locked_at?: Date
  created_at: Date
  updated_at: Date
  
  // Relations
  report?: Report
  images?: ReportImage[]
}

export interface ReportImage {
  id: string
  report_id: string
  page_id?: string
  image_url: string
  thumbnail_url?: string
  original_filename?: string
  file_size?: number
  position_index?: number
  description?: string
  uploaded_by?: string
  created_at: Date
  
  // Relations
  report?: Report
  page?: ReportPage
}

export interface TemplateFile {
  id: string
  name: string
  file_url: string
  file_type: TemplateType
  page_count?: number
  file_size?: number
  uploaded_by?: string
  is_default: boolean
  created_at: Date
}

export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  full_name?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
}

export interface ReportPermission {
  id: string
  report_id: string
  user_id: string
  permission_type: PermissionType
  granted_by?: string
  created_at: Date
  
  // Relations
  report?: Report
  user?: User
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: ActionType
  resource_type: ResourceType
  resource_id: string
  details?: any // JSONB
  ip_address?: string
  user_agent?: string
  created_at: Date
  
  // Relations
  user?: User
}

// =====================================================
// CONFIGURATION TYPES
// =====================================================

export interface TemplateConfig {
  initial_template_id?: string
  daily_template_id?: string
  initial_pages: number
  daily_pages: number
  total_daily_copies: number // Số lần copy template daily
}

export interface ImageConfig {
  template_page: number // Trang bắt đầu chèn ảnh
  images_per_page: number // Số ảnh mỗi trang
  total_images: number // Tổng số ảnh
  layout: ImageLayout
}

export interface ImageLayout {
  rows: number
  cols: number
  cell_width: number
  cell_height: number
  spacing: number
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

// Create requests
export interface CreateProjectRequest {
  name: string
  description?: string
  manager?: string
  start_date?: Date
  end_date?: Date
  budget?: number
  location?: string
}

export interface CreateConstructionRequest {
  project_id: string
  name: string
  description?: string
  location?: string
  manager?: string
  start_date?: Date
  end_date?: Date
}

export interface CreateCategoryRequest {
  construction_id: string
  name: string
  description?: string
  contractor?: string
  contract_value?: number
  start_date?: Date
  end_date?: Date
}

export interface CreateReportRequest {
  category_id: string
  name: string
  report_date: Date
  weather?: string
  temperature?: string
  template_config: TemplateConfig
  image_config: ImageConfig
}

// Update requests
export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: Status
}

export interface UpdateConstructionRequest extends Partial<CreateConstructionRequest> {
  status?: Status
  progress_percentage?: number
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  status?: Status
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  status?: ReportStatus
  is_shared?: boolean
  shared_type?: SharedType
}

// Response types with relations
export interface ProjectWithRelations extends Project {
  constructions: Construction[]
  _count: {
    constructions: number
  }
}

export interface ConstructionWithRelations extends Construction {
  project: Project
  categories: Category[]
  _count: {
    categories: number
  }
}

export interface CategoryWithRelations extends Category {
  construction: Construction & { project: Project }
  reports: Report[]
  _count: {
    reports: number
  }
}

export interface ReportWithRelations extends Report {
  category: Category & { 
    construction: Construction & { 
      project: Project 
    } 
  }
  pages: ReportPage[]
  images: ReportImage[]
  permissions: (ReportPermission & { user: User })[]
  _count: {
    pages: number
    images: number
  }
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Search and filter types
export interface ProjectFilters {
  status?: Status
  manager?: string
  start_date_from?: Date
  start_date_to?: Date
  search?: string
}

export interface ConstructionFilters {
  project_id?: string
  status?: Status
  manager?: string
  progress_min?: number
  progress_max?: number
  search?: string
}

export interface CategoryFilters {
  construction_id?: string
  status?: Status
  contractor?: string
  search?: string
}

export interface ReportFilters {
  category_id?: string
  status?: ReportStatus
  is_shared?: boolean
  shared_type?: SharedType
  report_date_from?: Date
  report_date_to?: Date
  created_by?: string
  search?: string
}

// =====================================================
// FORM VALIDATION SCHEMAS (for use with Zod)
// =====================================================

export interface ValidationError {
  field: string
  message: string
}

export interface FormErrors {
  [key: string]: string[]
}