// Document processing utilities for construction reports
export interface ImagePlaceholder {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  description: string
}

export interface DocumentTemplate {
  id: string
  name: string
  totalPages: number
  imagePlaceholders: ImagePlaceholder[]
  duplicatePages: number[] // Pages to duplicate for "Thêm Báo Cáo"
}

export class DocumentProcessor {
  private static readonly DEFAULT_TEMPLATE: DocumentTemplate = {
    id: "construction-report-template",
    name: "Báo cáo thi công chuẩn",
    totalPages: 10, // FIXED: 8 content pages + 2 image pages = 10 total pages
    imagePlaceholders: [
      // Page 9 - First image page (4 images)
      {
        id: "img1_page9",
        position: { x: 50, y: 100 },
        size: { width: 200, height: 150 },
        description: "Ảnh hiện trạng hạng mục - Trang 9",
      },
      {
        id: "img2_page9",
        position: { x: 300, y: 100 },
        size: { width: 200, height: 150 },
        description: "Ảnh tiến độ thi công - Trang 9",
      },
      {
        id: "img3_page9",
        position: { x: 50, y: 300 },
        size: { width: 200, height: 150 },
        description: "Ảnh chất lượng công việc - Trang 9",
      },
      {
        id: "img4_page9",
        position: { x: 300, y: 300 },
        size: { width: 200, height: 150 },
        description: "Ảnh an toàn lao động - Trang 9",
      },
      // Page 10 - Second image page (4 images)
      {
        id: "img1_page10",
        position: { x: 50, y: 100 },
        size: { width: 200, height: 150 },
        description: "Ảnh bổ sung 1 - Trang 10",
      },
      {
        id: "img2_page10",
        position: { x: 300, y: 100 },
        size: { width: 200, height: 150 },
        description: "Ảnh bổ sung 2 - Trang 10",
      },
      {
        id: "img3_page10",
        position: { x: 50, y: 300 },
        size: { width: 200, height: 150 },
        description: "Ảnh bổ sung 3 - Trang 10",
      },
      {
        id: "img4_page10",
        position: { x: 300, y: 300 },
        size: { width: 200, height: 150 },
        description: "Ảnh bổ sung 4 - Trang 10",
      },
    ],
    duplicatePages: [9, 10], // FIXED: Pages 9 and 10 (image pages) will be duplicated
  }

  /**
   * Generate ONLYOFFICE Document Builder script for initializing report
   */
  static generateInitializationScript(templateId: string): string {
    const template = this.DEFAULT_TEMPLATE

    return `
      builder.CreateFile("docx");
      var oDocument = Api.GetDocument();
      
      // Set document properties
      oDocument.SetTitle("${template.name}");
      
      // Create 10 pages with basic structure (8 content + 2 image pages)
      ${this.generatePagesStructure(template)}
      
      // Add image placeholders to pages 9 and 10
      ${this.generateImagePlaceholders(template)}
      
      // Save backup of pages 7-8 for duplication
      ${this.generatePageBackup(template)}
      
      builder.SaveFile("docx", "construction-report-initialized.docx");
      builder.CloseFile();
    `
  }

  /**
   * Generate script for adding image placeholders to pages 9 and 10
   * FIXED: Create 2 image pages with 4 placeholders each
   */
  private static generateImagePlaceholders(template: DocumentTemplate): string {
    // Split placeholders into two pages (4 each)
    const page9Placeholders = template.imagePlaceholders.slice(0, 4);
    const page10Placeholders = template.imagePlaceholders.slice(4, 8);
    
    return `
      // Navigate to page 9 (first image page)
      var oPage9 = oDocument.GetElement(8); // 0-indexed (page 9)
      
      // Create image container for page 9
      var oImageContainer9 = Api.CreateParagraph();
      oImageContainer9.AddText("=== HÌNH ẢNH BÁO CÁO - TRANG 1 ===");
      oImageContainer9.SetJc("center");
      oImageContainer9.SetBold(true);
      oPage9.Push(oImageContainer9);
      
      // Add 4 image placeholders to page 9 in 2x2 grid
      ${page9Placeholders
        .map(
          (placeholder, index) => `
        // Image placeholder ${index + 1} on page 9: ${placeholder.description}
        var oImagePlaceholder9_${index + 1} = Api.CreateParagraph();
        var oImageFrame9_${index + 1} = Api.CreateTextForm({
          "key": "${placeholder.id}",
          "tip": "${placeholder.description}",
          "required": false,
          "placeholder": "Nhấp để chèn ${placeholder.description.toLowerCase()}",
          "comb": false,
          "maxCharacters": 0,
          "cellWidth": ${placeholder.size.width},
          "multiLine": true,
          "autoFit": false
        });
        
        // Style the placeholder
        oImageFrame9_${index + 1}.SetBorderColor(0, 150, 255); // Blue border
        oImageFrame9_${index + 1}.SetBackgroundColor(240, 248, 255); // Light blue background
        
        oImagePlaceholder9_${index + 1}.AddElement(oImageFrame9_${index + 1});
        oPage9.Push(oImagePlaceholder9_${index + 1});
        
        // Add spacing
        var oSpacing9_${index + 1} = Api.CreateParagraph();
        oSpacing9_${index + 1}.AddText(" ");
        oPage9.Push(oSpacing9_${index + 1});
      `,
        )
        .join("\n")}
      
      // Navigate to page 10 (second image page)
      var oPage10 = oDocument.GetElement(9); // 0-indexed (page 10)
      
      // Create image container for page 10
      var oImageContainer10 = Api.CreateParagraph();
      oImageContainer10.AddText("=== HÌNH ẢNH BÁO CÁO - TRANG 2 ===");
      oImageContainer10.SetJc("center");
      oImageContainer10.SetBold(true);
      oPage10.Push(oImageContainer10);
      
      // Add 4 image placeholders to page 10 in 2x2 grid
      ${page10Placeholders
        .map(
          (placeholder, index) => `
        // Image placeholder ${index + 1} on page 10: ${placeholder.description}
        var oImagePlaceholder10_${index + 1} = Api.CreateParagraph();
        var oImageFrame10_${index + 1} = Api.CreateTextForm({
          "key": "${placeholder.id}",
          "tip": "${placeholder.description}",
          "required": false,
          "placeholder": "Nhấp để chèn ${placeholder.description.toLowerCase()}",
          "comb": false,
          "maxCharacters": 0,
          "cellWidth": ${placeholder.size.width},
          "multiLine": true,
          "autoFit": false
        });
        
        // Style the placeholder
        oImageFrame10_${index + 1}.SetBorderColor(0, 150, 255); // Blue border
        oImageFrame10_${index + 1}.SetBackgroundColor(240, 248, 255); // Light blue background
        
        oImagePlaceholder10_${index + 1}.AddElement(oImageFrame10_${index + 1});
        oPage10.Push(oImagePlaceholder10_${index + 1});
        
        // Add spacing
        var oSpacing10_${index + 1} = Api.CreateParagraph();
        oSpacing10_${index + 1}.AddText(" ");
        oPage10.Push(oSpacing10_${index + 1});
      `,
        )
        .join("\n")}
    `
  }

  /**
   * Generate basic page structure
   */
  private static generatePagesStructure(template: DocumentTemplate): string {
    return `
      // Create ${template.totalPages} pages with basic structure
      ${Array.from({ length: template.totalPages }, (_, i) => i + 1)
        .map(
          (pageNum) => `
        // Page ${pageNum}
        var oPage${pageNum} = Api.CreateParagraph();
        oPage${pageNum}.AddText("TRANG ${pageNum}");
        oPage${pageNum}.SetJc("center");
        oPage${pageNum}.SetBold(true);
        oDocument.Push(oPage${pageNum});
        
        // Add page content based on page number
        ${this.generatePageContent(pageNum)}
        
        // Add page break (except for last page)
        ${pageNum < template.totalPages ? `oDocument.Push(Api.CreatePageBreak());` : ""}
      `,
        )
        .join("\n")}
    `
  }

  /**
   * Generate content for specific page
   */
  private static generatePageContent(pageNum: number): string {
    const pageContents: Record<number, string> = {
      1: `
        var oTitle = Api.CreateParagraph();
        oTitle.AddText("BÁO CÁO THI CÔNG HÀNG NGÀY");
        oTitle.SetJc("center");
        oTitle.SetFontSize(16);
        oTitle.SetBold(true);
        oDocument.Push(oTitle);
        
        var oInfo = Api.CreateParagraph();
        oInfo.AddText("Ngày báo cáo: _______________");
        oDocument.Push(oInfo);
        
        var oProject = Api.CreateParagraph();
        oProject.AddText("Tên hạng mục: _______________");
        oDocument.Push(oProject);
      `,
      2: `
        var oSection2 = Api.CreateParagraph();
        oSection2.AddText("1. THÔNG TIN CHUNG");
        oSection2.SetBold(true);
        oDocument.Push(oSection2);
        
        var oContent2 = Api.CreateParagraph();
        oContent2.AddText("- Thời tiết: _______________\\n- Số lượng công nhân: _______________\\n- Ca làm việc: _______________");
        oDocument.Push(oContent2);
      `,
      3: `
        var oSection3 = Api.CreateParagraph();
        oSection3.AddText("2. TIẾN ĐỘ THI CÔNG");
        oSection3.SetBold(true);
        oDocument.Push(oSection3);
        
        var oContent3 = Api.CreateParagraph();
        oContent3.AddText("- Công việc đã hoàn thành: _______________\\n- Công việc đang thực hiện: _______________\\n- Kế hoạch ngày mai: _______________");
        oDocument.Push(oContent3);
      `,
      4: `
        var oSection4 = Api.CreateParagraph();
        oSection4.AddText("3. CHẤT LƯỢNG CÔNG VIỆC");
        oSection4.SetBold(true);
        oDocument.Push(oSection4);
        
        var oContent4 = Api.CreateParagraph();
        oContent4.AddText("- Đánh giá chất lượng: _______________\\n- Vấn đề phát sinh: _______________\\n- Biện pháp khắc phục: _______________");
        oDocument.Push(oContent4);
      `,
      5: `
        var oSection5 = Api.CreateParagraph();
        oSection5.AddText("4. AN TOÀN LAO ĐỘNG");
        oSection5.SetBold(true);
        oDocument.Push(oSection5);
        
        var oContent5 = Api.CreateParagraph();
        oContent5.AddText("- Tình hình an toàn: _______________\\n- Sự cố (nếu có): _______________\\n- Biện pháp phòng ngừa: _______________");
        oDocument.Push(oContent5);
      `,
      6: `
        var oSection6 = Api.CreateParagraph();
        oSection6.AddText("5. VẬT TƯ - THIẾT BỊ");
        oSection6.SetBold(true);
        oDocument.Push(oSection6);
        
        var oContent6 = Api.CreateParagraph();
        oContent6.AddText("- Vật tư sử dụng: _______________\\n- Thiết bị vận hành: _______________\\n- Nhu cầu bổ sung: _______________");
        oDocument.Push(oContent6);
      `,
      7: `
        var oSection7 = Api.CreateParagraph();
        oSection7.AddText("6. GHI CHÚ VÀ KIẾN NGHỊ");
        oSection7.SetBold(true);
        oDocument.Push(oSection7);
        
        var oContent7 = Api.CreateParagraph();
        oContent7.AddText("- Ghi chú: _______________\\n- Kiến nghị: _______________\\n- Đề xuất: _______________");
        oDocument.Push(oContent7);
      `,
      8: `
        var oSection8 = Api.CreateParagraph();
        oSection8.AddText("7. KẾT LUẬN VÀ KIẾN NGHỊ");
        oSection8.SetBold(true);
        oDocument.Push(oSection8);
        
        var oContent8 = Api.CreateParagraph();
        oContent8.AddText("- Kết luận: _______________\\n- Kiến nghị: _______________\\n- Đề xuất cải tiến: _______________");
        oDocument.Push(oContent8);
      `,
      9: `
        var oSection9 = Api.CreateParagraph();
        oSection9.AddText("8. HÌNH ẢNH MINH HỌA - TRANG 1");
        oSection9.SetBold(true);
        oSection9.SetJc("center");
        oDocument.Push(oSection9);
        
        // Image placeholders for page 9 will be added by generateImagePlaceholders()
      `,
      10: `
        var oSection10 = Api.CreateParagraph();
        oSection10.AddText("8. HÌNH ẢNH MINH HỌA - TRANG 2");
        oSection10.SetBold(true);
        oSection10.SetJc("center");
        oDocument.Push(oSection10);
        
        // Image placeholders for page 10 will be added by generateImagePlaceholders()
      `,
    }

    return pageContents[pageNum] || ""
  }

  /**
   * Generate script for backing up pages 7-8
   */
  private static generatePageBackup(template: DocumentTemplate): string {
    return `
      // Create backup of pages 7-8 for duplication
      var oBackupStorage = {};
      
      ${template.duplicatePages
        .map(
          (pageNum) => `
        // Backup page ${pageNum}
        var oPage${pageNum}Range = oDocument.GetRange(${pageNum - 1}, ${pageNum - 1});
        oBackupStorage.page${pageNum} = oPage${pageNum}Range.GetText();
      `,
        )
        .join("\n")}
      
      // Store backup in document properties for later use
      oDocument.SetProperty("pageBackup", JSON.stringify(oBackupStorage));
    `
  }

  /**
   * Generate script for duplicating pages (Thêm Báo Cáo functionality)
   */
  static generateDuplicationScript(): string {
    return `
      builder.OpenFile("docx", "current-report.docx");
      var oDocument = Api.GetDocument();
      
      // Retrieve backup from document properties
      var backupData = JSON.parse(oDocument.GetProperty("pageBackup") || "{}");
      
      if (backupData.page7 && backupData.page8) {
        // Add page break
        oDocument.Push(Api.CreatePageBreak());
        
        // Duplicate page 7
        var oNewPage7 = Api.CreateParagraph();
        oNewPage7.AddText("TRANG " + (oDocument.GetElementsCount() + 1));
        oNewPage7.SetJc("center");
        oNewPage7.SetBold(true);
        oDocument.Push(oNewPage7);
        
        // Add page 7 content
        var oPage7Content = Api.CreateParagraph();
        oPage7Content.AddText(backupData.page7);
        oDocument.Push(oPage7Content);
        
        // Add page break
        oDocument.Push(Api.CreatePageBreak());
        
        // Duplicate page 8
        var oNewPage8 = Api.CreateParagraph();
        oNewPage8.AddText("TRANG " + (oDocument.GetElementsCount() + 1));
        oNewPage8.SetJc("center");
        oNewPage8.SetBold(true);
        oDocument.Push(oNewPage8);
        
        // Add page 8 content with new image placeholders
        var oPage8Content = Api.CreateParagraph();
        oPage8Content.AddText(backupData.page8);
        oDocument.Push(oPage8Content);
        
        // Add new image placeholders for the duplicated page 8
        ${this.generateImagePlaceholders(this.DEFAULT_TEMPLATE)}
      }
      
      builder.SaveFile("docx", "report-with-added-pages.docx");
      builder.CloseFile();
    `
  }

  /**
   * Generate script for inserting images into placeholders
   */
  static generateImageInsertionScript(images: { placeholderId: string; imageUrl: string }[]): string {
    return `
      builder.OpenFile("docx", "current-report.docx");
      var oDocument = Api.GetDocument();
      
      ${images
        .map(
          (img) => `
        // Insert image for placeholder ${img.placeholderId}
        try {
          var oImage${img.placeholderId} = Api.CreateImage("${img.imageUrl}", 200 * 36000, 150 * 36000);
          
          // Find and replace the placeholder
          var aForms = oDocument.GetAllForms();
          for (var i = 0; i < aForms.length; i++) {
            var oForm = aForms[i];
            if (oForm.GetFormKey() === "${img.placeholderId}") {
              // Replace form with image
              var oParagraph = oForm.GetParent();
              oParagraph.RemoveElement(oForm);
              oParagraph.AddElement(oImage${img.placeholderId});
              break;
            }
          }
        } catch (error) {
          console.log("Error inserting image for ${img.placeholderId}:", error);
        }
      `,
        )
        .join("\n")}
      
      builder.SaveFile("docx", "report-with-images.docx");
      builder.CloseFile();
    `
  }

  /**
   * Validate document template
   */
  static validateTemplate(template: DocumentTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.id || template.id.trim() === "") {
      errors.push("Template ID is required")
    }

    if (!template.name || template.name.trim() === "") {
      errors.push("Template name is required")
    }

    if (template.totalPages < 1) {
      errors.push("Template must have at least 1 page")
    }

    if (template.imagePlaceholders.length === 0) {
      errors.push("Template must have at least 1 image placeholder")
    }

    template.imagePlaceholders.forEach((placeholder, index) => {
      if (!placeholder.id || placeholder.id.trim() === "") {
        errors.push(`Image placeholder ${index + 1} must have an ID`)
      }
      if (!placeholder.description || placeholder.description.trim() === "") {
        errors.push(`Image placeholder ${index + 1} must have a description`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
