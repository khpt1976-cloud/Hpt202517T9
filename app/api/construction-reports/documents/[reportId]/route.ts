import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const { reportId } = params

    // Try to find the generated document first
    const possiblePaths = [
      path.join(process.cwd(), "construction-report-initialized.docx"),
      path.join(process.cwd(), "public", "documents", `${reportId}.docx`),
      path.join(process.cwd(), "public", "documents", `construction-report-${reportId}.docx`),
      path.join(process.cwd(), "public", "templates", "construction-report-template.docx"),
      path.join(process.cwd(), "templates", "initial_1756776687352_Mauchuandautien.docx") // Fallback to existing template
    ]

    let fileBuffer: Buffer | null = null
    let foundPath = ""

    for (const filePath of possiblePaths) {
      try {
        fileBuffer = await fs.readFile(filePath)
        foundPath = filePath
        console.log(`Found document at: ${foundPath}`)
        break
      } catch (error) {
        // Continue to next path
        continue
      }
    }

    if (!fileBuffer) {
      console.log("No document found for reportId:", reportId)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="report-${reportId}.docx"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Error serving document:", error)
    return NextResponse.json({ error: "Failed to serve document" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const { reportId } = params
    const body = await request.json()

    // Handle document updates
    // In a real application, you would save the document to your storage
    console.log(`Updating document for report ${reportId}:`, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}
