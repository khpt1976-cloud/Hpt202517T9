"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Database,
  BarChart3,
  Globe,
  ChevronDown,
  User,
  Gamepad2,
  BookOpen,
  FileText,
  Construction,
  Clock,
  Wrench,
  AlertCircle,
} from "lucide-react"

export default function PlayDemoPage() {
  const { language, setLanguage, t, isHydrated } = useLanguage()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Navigation */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Trang chủ</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/digital-analysis/data-config"
                  className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span>Cấu hình Dữ liệu</span>
                </Link>
                <Link
                  href="/digital-analysis"
                  className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Phân tích cách chơi</span>
                </Link>
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Gamepad2 className="w-4 h-4" />
                  <span>Chơi thử</span>
                </div>
                <Link
                  href="/how-to-play"
                  className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Tìm kiếm cách chơi</span>
                </Link>
                <Link
                  href="/bao-com"
                  className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Bào Com</span>
                </Link>
              </div>
            </div>

            {/* Right side - Language & User */}
            <div className="flex items-center space-x-4">
              {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span>{language === "vi" ? "🇻🇳 VN" : "🇺🇸 EN"}</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem
                    onClick={() => setLanguage("vi")}
                    className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                  >
                    <span>🇻🇳</span>
                    <span>Tiếng Việt</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLanguage("en")}
                    className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                  >
                    <span>🇺🇸</span>
                    <span>English</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              {user ? (
                <UserMenu />
              ) : (
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-cyan-400 hover:bg-slate-800"
                >
                  <User className="w-4 h-4 mr-2" />
                  Đăng nhập
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Under Development Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Construction className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Chơi Thử
            </span>
          </h1>

          {/* Under Development Message */}
          <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center justify-center">
                <Wrench className="w-6 h-6 mr-3 text-yellow-400" />
                Đang Phát Triển
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-slate-300">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-lg">Tính năng này đang được phát triển</span>
              </div>
              
              <p className="text-slate-400 text-lg leading-relaxed">
                Chúng tôi đang xây dựng một môi trường mô phỏng hoàn chỉnh để bạn có thể 
                thực hành các chiến lược cược mà không cần rủi ro tài chính thực tế.
              </p>

              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Gamepad2 className="w-5 h-5 mr-2 text-green-400" />
                  Tính năng sắp có:
                </h3>
                <ul className="text-slate-300 space-y-2 text-left">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Mô phỏng trận đấu thời gian thực
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Thực hành với tiền ảo
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Phân tích kết quả chi tiết
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Bảng xếp hạng người chơi
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/digital-analysis">
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Phân tích cách chơi
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 px-6 py-3">
                    <Home className="w-4 h-4 mr-2" />
                    Về trang chủ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <div className="mt-12">
            <p className="text-slate-400 mb-4">Tiến độ phát triển</p>
            <div className="max-w-md mx-auto bg-slate-700 rounded-full h-3">
              <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full animate-pulse" style={{width: '35%'}}></div>
            </div>
            <p className="text-slate-500 text-sm mt-2">35% hoàn thành</p>
          </div>
        </div>
      </main>
    </div>
  )
}