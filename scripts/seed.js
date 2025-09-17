const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting seed process...')

    // Check if sample template file exists
    const templatePath = path.join(process.cwd(), 'templates', 'sample-construction-report.html')
    
    if (!fs.existsSync(templatePath)) {
      console.error('Sample template file not found at:', templatePath)
      return
    }

    // Get file stats
    const stats = fs.statSync(templatePath)
    console.log('Template file found, size:', stats.size, 'bytes')

    // Check if template already exists in database
    const existingTemplate = await prisma.templateFile.findFirst({
      where: { name: 'Sample Construction Report' }
    })

    if (existingTemplate) {
      console.log('Sample template already exists:', existingTemplate.id)
    } else {
      // Create sample template in database
      const template = await prisma.templateFile.create({
        data: {
          name: 'Sample Construction Report',
          fileUrl: '/templates/sample-construction-report.html',
          fileType: 'INITIAL',
          pageCount: 4, // Based on our sample template
          fileSize: stats.size,
          isDefault: true,
          uploadedBy: 'system'
        }
      })
      console.log('Created sample template:', template.id)
    }

    // Create a sample project
    const existingProject = await prisma.project.findFirst({
      where: { name: 'Sample Construction Project' }
    })

    if (existingProject) {
      console.log('Sample project already exists:', existingProject.id)
    } else {
      const project = await prisma.project.create({
        data: {
          name: 'Sample Construction Project',
          description: 'A sample construction project for demonstration',
          location: 'Ho Chi Minh City, Vietnam',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-12-31'),
          budget: 250000000000, // 250 billion VND
          status: 'ACTIVE'
        }
      })
      console.log('Created sample project:', project.id)
    }

    console.log('Seed process completed successfully!')

  } catch (error) {
    console.error('Seed error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()