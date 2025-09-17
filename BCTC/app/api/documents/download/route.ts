import { type NextRequest, NextResponse } from "next/server"
import { getProcessedDocument } from "../../../../lib/document-processor"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: "Key parameter is required" }, { status: 400 })
  }

  try {
    // Retrieve the processed document from storage
    const documentBuffer = getProcessedDocument(key)

    if (!documentBuffer) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return new NextResponse(documentBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="bao_cao_thi_cong_${key}.docx"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error serving document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
