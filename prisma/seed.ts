import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Dự án Xây dựng Cầu Vượt ABC',
      description: 'Dự án xây dựng cầu vượt tại khu vực ABC với tổng chiều dài 500m',
      manager: 'Nguyễn Văn A',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 50000000000, // 50 tỷ VND
      location: 'Quận 1, TP.HCM'
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Dự án Khu Dân Cư XYZ',
      description: 'Dự án phát triển khu dân cư cao cấp với 200 căn hộ',
      manager: 'Trần Thị B',
      status: 'ACTIVE',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-06-30'),
      budget: 120000000000, // 120 tỷ VND
      location: 'Quận 7, TP.HCM'
    }
  })

  console.log('✅ Created projects:', { project1: project1.name, project2: project2.name })

  // Create constructions for project 1
  const construction1 = await prisma.construction.create({
    data: {
      projectId: project1.id,
      name: 'Hạng mục Móng cầu',
      description: 'Thi công móng cầu và trụ cầu chính',
      location: 'Vị trí trụ cầu chính',
      manager: 'Lê Văn C',
      status: 'ACTIVE',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      progressPercentage: 65
    }
  })

  const construction2 = await prisma.construction.create({
    data: {
      projectId: project1.id,
      name: 'Hạng mục Dầm cầu',
      description: 'Lắp đặt dầm cầu và mặt cầu',
      location: 'Toàn bộ nhịp cầu',
      manager: 'Phạm Văn D',
      status: 'ACTIVE',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-10-31'),
      progressPercentage: 30
    }
  })

  // Create constructions for project 2
  const construction3 = await prisma.construction.create({
    data: {
      projectId: project2.id,
      name: 'Hạng mục Hạ tầng kỹ thuật',
      description: 'Xây dựng hệ thống đường, điện, nước',
      location: 'Toàn khu dân cư',
      manager: 'Hoàng Thị E',
      status: 'ACTIVE',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-08-31'),
      progressPercentage: 45
    }
  })

  console.log('✅ Created constructions:', { 
    construction1: construction1.name, 
    construction2: construction2.name,
    construction3: construction3.name 
  })

  // Create categories for construction 1
  const category1 = await prisma.category.create({
    data: {
      constructionId: construction1.id,
      name: 'Gói thầu Đào đất móng',
      description: 'Thi công đào đất và chuẩn bị móng',
      contractor: 'Công ty TNHH Xây dựng ABC',
      contractValue: 5000000000, // 5 tỷ VND
      status: 'ACTIVE',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-31')
    }
  })

  const category2 = await prisma.category.create({
    data: {
      constructionId: construction1.id,
      name: 'Gói thầu Đổ bê tông móng',
      description: 'Thi công đổ bê tông móng và trụ cầu',
      contractor: 'Công ty CP Bê tông XYZ',
      contractValue: 8000000000, // 8 tỷ VND
      status: 'ACTIVE',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-06-30')
    }
  })

  // Create categories for construction 2
  const category3 = await prisma.category.create({
    data: {
      constructionId: construction2.id,
      name: 'Gói thầu Dầm bê tông',
      description: 'Sản xuất và lắp đặt dầm bê tông cầu',
      contractor: 'Công ty TNHH Dầm cầu DEF',
      contractValue: 15000000000, // 15 tỷ VND
      status: 'ACTIVE',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-09-30')
    }
  })

  // Create categories for construction 3
  const category4 = await prisma.category.create({
    data: {
      constructionId: construction3.id,
      name: 'Gói thầu Hệ thống điện',
      description: 'Lắp đặt hệ thống điện khu dân cư',
      contractor: 'Công ty CP Điện lực GHI',
      contractValue: 3000000000, // 3 tỷ VND
      status: 'ACTIVE',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-06-30')
    }
  })

  console.log('✅ Created categories:', { 
    category1: category1.name, 
    category2: category2.name,
    category3: category3.name,
    category4: category4.name
  })

  // Create sample reports
  const report1 = await prisma.report.create({
    data: {
      categoryId: category1.id,
      name: 'Nhật ký thi công ngày 15/01/2024',
      reportDate: new Date('2024-01-15'),
      weather: 'Nắng, nhiệt độ 28°C',
      temperature: '28°C',
      status: 'COMPLETED',
      templateConfig: {
        initial_template_id: 'template_1',
        daily_template_id: 'template_2',
        initial_pages: 3,
        daily_pages: 2,
        total_daily_copies: 1
      },
      imageConfig: {
        template_page: 4,
        images_per_page: 6,
        total_images: 12,
        layout: {
          rows: 3,
          cols: 2,
          cell_width: 200,
          cell_height: 150,
          spacing: 10
        }
      }
    }
  })

  const report2 = await prisma.report.create({
    data: {
      categoryId: category1.id,
      name: 'Nhật ký thi công ngày 16/01/2024',
      reportDate: new Date('2024-01-16'),
      weather: 'Mưa nhỏ, nhiệt độ 25°C',
      temperature: '25°C',
      status: 'DRAFT',
      templateConfig: {
        initial_template_id: 'template_1',
        daily_template_id: 'template_2',
        initial_pages: 3,
        daily_pages: 2,
        total_daily_copies: 1
      },
      imageConfig: {
        template_page: 4,
        images_per_page: 8,
        total_images: 16,
        layout: {
          rows: 4,
          cols: 2,
          cell_width: 200,
          cell_height: 150,
          spacing: 10
        }
      }
    }
  })

  const report3 = await prisma.report.create({
    data: {
      categoryId: category2.id,
      name: 'Nhật ký đổ bê tông móng M1',
      reportDate: new Date('2024-03-05'),
      weather: 'Nắng ráo, nhiệt độ 30°C',
      temperature: '30°C',
      status: 'COMPLETED',
      isShared: true,
      sharedType: 'MEMBERS',
      templateConfig: {
        initial_template_id: 'template_1',
        daily_template_id: 'template_2',
        initial_pages: 3,
        daily_pages: 2,
        total_daily_copies: 2
      },
      imageConfig: {
        template_page: 5,
        images_per_page: 4,
        total_images: 20,
        layout: {
          rows: 2,
          cols: 2,
          cell_width: 250,
          cell_height: 200,
          spacing: 15
        }
      }
    }
  })

  console.log('✅ Created reports:', { 
    report1: report1.name, 
    report2: report2.name,
    report3: report3.name
  })

  // Create sample template files
  const template1 = await prisma.templateFile.create({
    data: {
      name: 'Mẫu nhật ký đầu - Cơ bản',
      fileUrl: '/templates/initial_basic.docx',
      fileType: 'INITIAL',
      pageCount: 3,
      fileSize: 1024000, // 1MB
      isDefault: true
    }
  })

  const template2 = await prisma.templateFile.create({
    data: {
      name: 'Mẫu nhật ký thêm - Hàng ngày',
      fileUrl: '/templates/daily_standard.docx',
      fileType: 'DAILY',
      pageCount: 2,
      fileSize: 512000, // 512KB
      isDefault: true
    }
  })

  const template3 = await prisma.templateFile.create({
    data: {
      name: 'Mẫu nhật ký đầu - Chi tiết',
      fileUrl: '/templates/initial_detailed.docx',
      fileType: 'INITIAL',
      pageCount: 5,
      fileSize: 2048000, // 2MB
      isDefault: false
    }
  })

  console.log('✅ Created template files:', { 
    template1: template1.name, 
    template2: template2.name,
    template3: template3.name
  })

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: '$2b$10$example.hash.here', // In real app, use proper bcrypt hash
      fullName: 'Quản trị viên hệ thống',
      role: 'ADMIN',
      isActive: true
    }
  })

  const user2 = await prisma.user.create({
    data: {
      username: 'manager1',
      email: 'manager1@example.com',
      passwordHash: '$2b$10$example.hash.here',
      fullName: 'Nguyễn Văn A',
      role: 'MANAGER',
      isActive: true
    }
  })

  const user3 = await prisma.user.create({
    data: {
      username: 'editor1',
      email: 'editor1@example.com',
      passwordHash: '$2b$10$example.hash.here',
      fullName: 'Trần Thị B',
      role: 'EDITOR',
      isActive: true
    }
  })

  console.log('✅ Created users:', { 
    user1: user1.username, 
    user2: user2.username,
    user3: user3.username
  })

  // Create sample report pages
  await prisma.reportPage.createMany({
    data: [
      {
        reportId: report1.id,
        pageNumber: 1,
        pageType: 'TEMPLATE_INITIAL',
        content: { type: 'template', template_id: 'template_1', page: 1 },
        isLocked: false
      },
      {
        reportId: report1.id,
        pageNumber: 2,
        pageType: 'TEMPLATE_INITIAL',
        content: { type: 'template', template_id: 'template_1', page: 2 },
        isLocked: false
      },
      {
        reportId: report1.id,
        pageNumber: 3,
        pageType: 'TEMPLATE_INITIAL',
        content: { type: 'template', template_id: 'template_1', page: 3 },
        isLocked: false
      },
      {
        reportId: report1.id,
        pageNumber: 4,
        pageType: 'IMAGE_PAGE',
        content: { type: 'images', layout: { rows: 3, cols: 2 } },
        isLocked: false
      },
      {
        reportId: report1.id,
        pageNumber: 5,
        pageType: 'IMAGE_PAGE',
        content: { type: 'images', layout: { rows: 3, cols: 2 } },
        isLocked: false
      }
    ]
  })

  console.log('✅ Created report pages for report1')

  // Create sample report permissions
  await prisma.reportPermission.createMany({
    data: [
      {
        reportId: report3.id,
        userId: user2.id,
        permissionType: 'ADMIN',
        grantedBy: user1.id
      },
      {
        reportId: report3.id,
        userId: user3.id,
        permissionType: 'EDIT',
        grantedBy: user1.id
      }
    ]
  })

  console.log('✅ Created report permissions')

  // Create sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: user1.id,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: project1.id,
        details: { name: project1.name },
        ipAddress: '192.168.1.100'
      },
      {
        userId: user2.id,
        action: 'CREATE',
        resourceType: 'REPORT',
        resourceId: report1.id,
        details: { name: report1.name, category: category1.name },
        ipAddress: '192.168.1.101'
      },
      {
        userId: user3.id,
        action: 'UPDATE',
        resourceType: 'REPORT',
        resourceId: report2.id,
        details: { field: 'status', old_value: 'DRAFT', new_value: 'COMPLETED' },
        ipAddress: '192.168.1.102'
      }
    ]
  })

  console.log('✅ Created activity logs')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Projects: 2`)
  console.log(`- Constructions: 3`)
  console.log(`- Categories: 4`)
  console.log(`- Reports: 3`)
  console.log(`- Template Files: 3`)
  console.log(`- Users: 3`)
  console.log(`- Report Pages: 5`)
  console.log(`- Report Permissions: 2`)
  console.log(`- Activity Logs: 3`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })