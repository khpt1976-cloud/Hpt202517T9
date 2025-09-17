-- =====================================================
-- DATABASE SCHEMA FOR CONSTRUCTION DIARY MANAGEMENT
-- Structure: Projects → Constructions → Categories → Reports
-- =====================================================

-- Projects (Dự án)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  location VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constructions (Hạng mục)
CREATE TABLE constructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  manager VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories (Gói thầu)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  construction_id UUID NOT NULL REFERENCES constructions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contractor VARCHAR(255),
  contract_value DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports (Nhật ký)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  report_date DATE NOT NULL,
  weather VARCHAR(100),
  temperature VARCHAR(50),
  content JSONB, -- Lưu nội dung document
  template_config JSONB, -- Cấu hình template
  image_config JSONB, -- Cấu hình ảnh (số trang, số ảnh/trang)
  document_url VARCHAR(500), -- URL file document
  pdf_url VARCHAR(500), -- URL file PDF
  is_shared BOOLEAN DEFAULT false,
  shared_type VARCHAR(20) DEFAULT 'private' CHECK (shared_type IN ('private', 'members', 'public')),
  shared_url VARCHAR(500), -- Public sharing URL
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  created_by UUID, -- User ID who created
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Pages (Trang báo cáo)
CREATE TABLE report_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  page_type VARCHAR(30) NOT NULL CHECK (page_type IN ('template_initial', 'template_daily', 'image_page', 'custom')),
  content JSONB, -- Nội dung trang
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID, -- User ID who locked
  locked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, page_number)
);

-- Report Images (Ảnh trong báo cáo)
CREATE TABLE report_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  page_id UUID REFERENCES report_pages(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  original_filename VARCHAR(255),
  file_size INTEGER,
  position_index INTEGER, -- Vị trí trong grid
  description TEXT,
  uploaded_by UUID, -- User ID who uploaded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template Files (File mẫu)
CREATE TABLE template_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('initial', 'daily')), -- 'initial' cho mẫu đầu, 'daily' cho mẫu thêm
  page_count INTEGER,
  file_size INTEGER,
  uploaded_by UUID,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'manager', 'editor', 'viewer')),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Permissions (Quyền trên báo cáo)
CREATE TABLE report_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, user_id)
);

-- Activity Logs (Nhật ký hoạt động)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'share', 'lock', 'unlock'
  resource_type VARCHAR(30) NOT NULL, -- 'project', 'construction', 'category', 'report', 'page'
  resource_id UUID NOT NULL,
  details JSONB, -- Chi tiết thay đổi
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary relationships
CREATE INDEX idx_constructions_project_id ON constructions(project_id);
CREATE INDEX idx_categories_construction_id ON categories(construction_id);
CREATE INDEX idx_reports_category_id ON reports(category_id);
CREATE INDEX idx_report_pages_report_id ON report_pages(report_id);
CREATE INDEX idx_report_images_report_id ON report_images(report_id);
CREATE INDEX idx_report_images_page_id ON report_images(page_id);

-- Search and filtering
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_constructions_status ON constructions(status);
CREATE INDEX idx_categories_status ON categories(status);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_date ON reports(report_date);
CREATE INDEX idx_reports_shared ON reports(is_shared, shared_type);

-- Permissions and users
CREATE INDEX idx_report_permissions_report_id ON report_permissions(report_id);
CREATE INDEX idx_report_permissions_user_id ON report_permissions(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Activity logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_constructions_updated_at BEFORE UPDATE ON constructions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_pages_updated_at BEFORE UPDATE ON report_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();