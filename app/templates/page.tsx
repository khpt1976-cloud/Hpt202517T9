'use client'

import { useState } from 'react'
import { TemplateUpload } from '@/components/template-upload'
import { TemplateList } from '@/components/template-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Upload, List, Info } from 'lucide-react'

export default function TemplatesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    // Trigger refresh of template list
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý Template</h1>
        <p className="text-muted-foreground">
          Upload và quản lý các template Word cho nhật ký thi công
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Danh sách Template
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Template
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Hướng dẫn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <TemplateList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="flex justify-center">
            <TemplateUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Loại Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-800">Initial Template</CardTitle>
                      <CardDescription>Mẫu nhật ký đầu</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 text-blue-700">
                        <li>• Thường có 3-5 trang</li>
                        <li>• Chứa thông tin tổng quan dự án</li>
                        <li>• Được sử dụng làm trang đầu của báo cáo</li>
                        <li>• Có thể chứa placeholder cho thông tin cơ bản</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800">Daily Template</CardTitle>
                      <CardDescription>Mẫu nhật ký thêm</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 text-green-700">
                        <li>• Thường có 2 trang</li>
                        <li>• Chứa thông tin chi tiết hàng ngày</li>
                        <li>• Có thể được sao chép nhiều lần</li>
                        <li>• Phù hợp cho nội dung lặp lại</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Placeholder hỗ trợ</CardTitle>
                <CardDescription>
                  Các placeholder này sẽ được thay thế tự động khi tạo báo cáo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Thông tin cơ bản</h4>
                    <div className="space-y-1 text-sm font-mono bg-muted p-3 rounded">
                      <div>{'{{REPORT_NAME}}'} - Tên nhật ký</div>
                      <div>{'{{REPORT_DATE}}'} - Ngày báo cáo</div>
                      <div>{'{{WEATHER}}'} - Thời tiết</div>
                      <div>{'{{TEMPERATURE}}'} - Nhiệt độ</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Thông tin dự án</h4>
                    <div className="space-y-1 text-sm font-mono bg-muted p-3 rounded">
                      <div>{'{{PROJECT_NAME}}'} - Tên dự án</div>
                      <div>{'{{CONSTRUCTION_NAME}}'} - Tên hạng mục</div>
                      <div>{'{{CATEGORY_NAME}}'} - Tên gói thầu</div>
                      <div>{'{{CONTRACTOR}}'} - Nhà thầu</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu file</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Định dạng</h4>
                    <ul className="space-y-1">
                      <li>• Chỉ chấp nhận file .docx</li>
                      <li>• Microsoft Word 2007+</li>
                      <li>• Không hỗ trợ .doc cũ</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Kích thước</h4>
                    <ul className="space-y-1">
                      <li>• Tối đa 10MB</li>
                      <li>• Khuyến nghị dưới 5MB</li>
                      <li>• Tối ưu hóa hình ảnh</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Nội dung</h4>
                    <ul className="space-y-1">
                      <li>• Sử dụng placeholder</li>
                      <li>• Định dạng nhất quán</li>
                      <li>• Tránh font đặc biệt</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quy trình sử dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium">Tạo template Word</h4>
                      <p className="text-sm text-muted-foreground">Thiết kế template với placeholder và định dạng mong muốn</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium">Upload template</h4>
                      <p className="text-sm text-muted-foreground">Upload file .docx và điền thông tin mô tả</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium">Đặt làm mặc định</h4>
                      <p className="text-sm text-muted-foreground">Chọn template mặc định cho từng loại (Initial/Daily)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h4 className="font-medium">Tạo báo cáo</h4>
                      <p className="text-sm text-muted-foreground">Sử dụng template để tạo báo cáo tự động</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}