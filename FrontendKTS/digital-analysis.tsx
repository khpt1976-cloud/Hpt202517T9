"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
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
  TrendingUp,
  FileText,
  Settings,
} from "lucide-react"

export default function DigitalAnalysisPage() {
  const { language, setLanguage, t, isHydrated } = useLanguage()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Back to Home */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">
                  {isHydrated ? t("common.back_home") : "Trang chủ"}
                </span>
              </Link>
            </div>

            {/* Center - Navigation Menu */}
            <div className="flex items-center space-x-8">
              <Link 
                href="/digital-analysis/data-config"
                className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>{isHydrated ? t("digital_analysis.data_config") : "Cấu hình Dữ liệu"}</span>
              </Link>
              
              <Link 
                href="/digital-analysis"
                className="flex items-center space-x-2 text-cyan-400 font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{isHydrated ? t("digital_analysis.analysis") : "Phân tích cách chơi"}</span>
              </Link>
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
                  {isHydrated ? t("header.login") : "Đăng nhập"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {isHydrated ? t("digital_analysis.title") : "Phân tích cách chơi"}
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            {isHydrated ? t("digital_analysis.subtitle") : "Công cụ phân tích dữ liệu xây dựng thông minh với AI"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Dự án đang theo dõi</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <div className="bg-cyan-500/20 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Điểm dữ liệu</p>
                <p className="text-2xl font-bold text-white">1,247</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Báo cáo tạo ra</p>
                <p className="text-2xl font-bold text-white">34</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Hiệu suất</p>
                <p className="text-2xl font-bold text-white">98.5%</p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Analysis Tools */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                Công cụ phân tích
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-20 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white flex flex-col items-center justify-center">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Phân tích xu hướng
                </Button>
                
                <Button variant="outline" className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex flex-col items-center justify-center">
                  <FileText className="w-6 h-6 mb-2" />
                  Báo cáo tùy chỉnh
                </Button>
                
                <Button variant="outline" className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex flex-col items-center justify-center">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  Dự đoán AI
                </Button>
                
                <Button variant="outline" className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex flex-col items-center justify-center">
                  <Settings className="w-6 h-6 mb-2" />
                  Cài đặt nâng cao
                </Button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                Biểu đồ phân tích chính
              </h3>
              <div className="h-80 bg-slate-900/50 rounded-lg border border-slate-600 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">
                    Biểu đồ sẽ hiển thị ở đây sau khi cấu hình dữ liệu
                  </p>
                  <Link href="/digital-analysis/data-config">
                    <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                      <Database className="w-4 h-4 mr-2" />
                      Cấu hình dữ liệu
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-green-400" />
                Thao tác nhanh
              </h3>
              <div className="space-y-3">
                <Link href="/digital-analysis/data-config">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Cấu hình dữ liệu
                  </Button>
                </Link>
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Xuất báo cáo
                </Button>
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Chia sẻ kết quả
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Hoạt động gần đây
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">Cập nhật dữ liệu dự án A</p>
                    <p className="text-xs text-slate-500">2 phút trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">Tạo báo cáo tuần</p>
                    <p className="text-xs text-slate-500">15 phút trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">Phân tích hoàn thành</p>
                    <p className="text-xs text-slate-500">1 giờ trước</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}