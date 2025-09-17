"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bot, ExternalLink, Settings, Activity, MessageSquare, Users } from "lucide-react"

export default function AdminBotPage() {
  const [botpressStatus, setBotpressStatus] = useState<'loading' | 'online' | 'offline'>('loading')
  const [botpressUrl, setBotpressUrl] = useState('')

  useEffect(() => {
    // Get Botpress URL from environment or default
    const url = process.env.NEXT_PUBLIC_BOTPRESS_URL || 'http://localhost:12001'
    setBotpressUrl(url)
    
    // Check Botpress status
    checkBotpressStatus(url)
  }, [])

  const checkBotpressStatus = async (url: string) => {
    try {
      const response = await fetch(`${url}/api/v1/health`, { 
        method: 'GET',
        mode: 'cors'
      })
      setBotpressStatus(response.ok ? 'online' : 'offline')
    } catch (error) {
      console.log('Botpress status check:', error)
      setBotpressStatus('offline')
    }
  }

  const openBotpress = () => {
    window.open(botpressUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
  }

  const openBotpressAdmin = () => {
    window.open(`${botpressUrl}/admin`, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
  }

  const StatusBadge = () => {
    switch (botpressStatus) {
      case 'loading':
        return <Badge variant="secondary">Đang kiểm tra...</Badge>
      case 'online':
        return <Badge variant="default" className="bg-green-500">Trực tuyến</Badge>
      case 'offline':
        return <Badge variant="destructive">Ngoại tuyến</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AdminBot</h1>
          <p className="text-muted-foreground">
            Quản lý và cấu hình hệ thống Chatbot Botpress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Bot className="w-8 h-8 text-blue-500" />
          <StatusBadge />
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Botpress Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái Botpress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {botpressStatus === 'online' ? 'Hoạt động' : 'Tạm dừng'}
            </div>
            <p className="text-xs text-muted-foreground">
              {botpressStatus === 'online' 
                ? 'Hệ thống chatbot đang hoạt động bình thường'
                : 'Hệ thống chatbot hiện không khả dụng'
              }
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thao tác nhanh</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={openBotpressAdmin} 
              className="w-full" 
              variant="default"
              disabled={botpressStatus !== 'online'}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Mở Admin Panel
            </Button>
            <Button 
              onClick={openBotpress} 
              className="w-full" 
              variant="outline"
              disabled={botpressStatus !== 'online'}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Xem Chatbot
            </Button>
          </CardContent>
        </Card>

        {/* Integration Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thông tin tích hợp</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Botpress V12</div>
            <p className="text-xs text-muted-foreground">
              Tích hợp với DuanHpt9t9 Construction Management
            </p>
            <div className="mt-2 text-xs">
              <div>URL: <code className="text-blue-600">{botpressUrl}</code></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botpress Embedded Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Giao diện Botpress
          </CardTitle>
          <CardDescription>
            Giao diện quản lý Botpress được nhúng trực tiếp vào hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {botpressStatus === 'online' ? (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={`${botpressUrl}/admin`}
                width="100%"
                height="600"
                frameBorder="0"
                title="Botpress Admin Interface"
                className="w-full"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
              <div className="text-center">
                <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Botpress không khả dụng</h3>
                <p className="text-muted-foreground mb-4">
                  Hệ thống Botpress hiện đang ngoại tuyến hoặc chưa được khởi động
                </p>
                <Button onClick={() => checkBotpressStatus(botpressUrl)} variant="outline">
                  Kiểm tra lại
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}