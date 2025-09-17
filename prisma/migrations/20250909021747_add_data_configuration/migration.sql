-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "manager" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "budget" REAL,
    "location" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "constructions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "manager" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "constructions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "construction_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contractor" TEXT,
    "contract_value" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "categories_construction_id_fkey" FOREIGN KEY ("construction_id") REFERENCES "constructions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "report_date" DATETIME NOT NULL,
    "weather" TEXT,
    "temperature" TEXT,
    "content" JSONB,
    "template_config" JSONB,
    "image_config" JSONB,
    "document_url" TEXT,
    "pdf_url" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_type" TEXT NOT NULL DEFAULT 'PRIVATE',
    "shared_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "page_type" TEXT NOT NULL,
    "content" JSONB,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "locked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "report_pages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_id" TEXT NOT NULL,
    "page_id" TEXT,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "original_filename" TEXT,
    "file_size" INTEGER,
    "position_index" INTEGER,
    "description" TEXT,
    "uploaded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_images_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_images_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "report_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "template_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "page_count" INTEGER,
    "file_size" INTEGER,
    "uploaded_by" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "report_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_type" TEXT NOT NULL,
    "granted_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_permissions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "start_date" TEXT,
    "end_date" TEXT,
    "user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "report_pages_report_id_page_number_key" ON "report_pages"("report_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "report_permissions_report_id_user_id_key" ON "report_permissions"("report_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "global_settings_key_key" ON "global_settings"("key");
