"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  TrendingDown,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface BetResult {
  id: string
  match: string
  date: string
  market: string
  selection: string
  odds: number
  stake: number
  result: 'WIN' | 'LOSE' | 'VOID'
  profit: number
}

export default function BacktestingResultsPage() {
  const { language, setLanguage, t, isHydrated } = useLanguage()
  const { user } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof BetResult>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Mock data for demonstration
  const mockResults: BetResult[] = [
    {
      id: "1",
      match: "Manchester United vs Liverpool",
      date: "2024-01-15",
      market: "Tài/Xỉu",
      selection: "Tài 2.5",
      odds: 1.95,
      stake: 100,
      result: "WIN",
      profit: 95
    },
    {
      id: "2",
      match: "Barcelona vs Real Madrid",
      date: "2024-01-14",
      market: "1X2",
      selection: "Barcelona",
      odds: 2.10,
      stake: 100,
      result: "LOSE",
      profit: -100
    },
    {
      id: "3",
      match: "Bayern Munich vs Dortmund",
      date: "2024-01-13",
      market: "Handicap",
      selection: "Bayern -1",
      odds: 1.85,
      stake: 100,
      result: "WIN",
      profit: 85
    },
    {
      id: "4",
      match: "PSG vs Marseille",
      date: "2024-01-12",
      market: "Tài/Xỉu",
      selection: "Xỉu 3.5",
      odds: 2.05,
      stake: 100,
      result: "VOID",
      profit: 0
    },
    {
      id: "5",
      match: "Chelsea vs Arsenal",
      date: "2024-01-11",
      market: "1X2",
      selection: "Hòa",
      odds: 3.20,
      stake: 100,
      result: "WIN",
      profit: 220
    }
  ]

  const totalBets = mockResults.length
  const winningBets = mockResults.filter(r => r.result === 'WIN').length
  const winRate = ((winningBets / totalBets) * 100).toFixed(1)
  const totalProfit = mockResults.reduce((sum, r) => sum + r.profit, 0)
  const roi = ((totalProfit / (totalBets * 100)) * 100).toFixed(1)

  const filteredResults = mockResults.filter(result =>
    result.match.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.selection.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSort = (field: keyof BetResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

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
                <span className="font-medium">Quay về trang chủ</span>
              </Link>
            </div>

            {/* Center - Navigation Menu */}
            <div className="flex items-center space-x-8">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Kết quả Kiểm thử Chiến lược
            </span>
          </h1>
          <p className="text-slate-300">
            Kết quả chi tiết của chiến lược đã kiểm thử
          </p>
        </div>

        {/* Strategy Summary */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tóm tắt Chiến lược</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <span className="font-medium">Thời gian:</span> 01/01/2024 - 31/01/2024
            </div>
            <div>
              <span className="font-medium">Giải đấu:</span> Premier League, La Liga
            </div>
            <div>
              <span className="font-medium">Điều kiện:</span> Tài/Xỉu >= 1.90 VÀ Handicap <= 2.0
            </div>
            <div>
              <span className="font-medium">Hành động:</span> Đặt cược Tài với tỷ lệ >= 1.90
            </div>
          </div>
        </div>

        {/* Results Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Tỷ lệ thắng</p>
                <p className="text-2xl font-bold text-white">{winRate}%</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">ROI</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {roi}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${totalProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {totalProfit >= 0 ? 
                  <TrendingUp className="w-6 h-6 text-green-400" /> : 
                  <TrendingDown className="w-6 h-6 text-red-400" />
                }
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Tổng số cược</p>
                <p className="text-2xl font-bold text-white">{totalBets}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Lợi nhuận</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${totalProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {totalProfit >= 0 ? 
                  <TrendingUp className="w-6 h-6 text-green-400" /> : 
                  <TrendingDown className="w-6 h-6 text-red-400" />
                }
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Biểu đồ Lợi nhuận theo Thời gian</h3>
          <div className="h-64 bg-slate-900/50 rounded-lg border border-slate-600 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                Biểu đồ đường thể hiện sự biến động lợi nhuận theo thời gian
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Bảng Dữ liệu Chi tiết</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-cyan-400"
                    onClick={() => handleSort('match')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Trận đấu</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-cyan-400"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ngày</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">Thị trường</TableHead>
                  <TableHead className="text-slate-300">Lựa chọn</TableHead>
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-cyan-400"
                    onClick={() => handleSort('odds')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tỷ lệ</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-300">Tiền cược</TableHead>
                  <TableHead className="text-slate-300">Kết quả</TableHead>
                  <TableHead 
                    className="text-slate-300 cursor-pointer hover:text-cyan-400"
                    onClick={() => handleSort('profit')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Lợi nhuận</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-slate-300">{result.match}</TableCell>
                    <TableCell className="text-slate-300">{result.date}</TableCell>
                    <TableCell className="text-slate-300">{result.market}</TableCell>
                    <TableCell className="text-slate-300">{result.selection}</TableCell>
                    <TableCell className="text-slate-300">{result.odds}</TableCell>
                    <TableCell className="text-slate-300">{result.stake}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.result === 'WIN' ? 'bg-green-900/50 text-green-400' :
                        result.result === 'LOSE' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {result.result}
                      </span>
                    </TableCell>
                    <TableCell className={`font-medium ${
                      result.profit > 0 ? 'text-green-400' :
                      result.profit < 0 ? 'text-red-400' :
                      'text-slate-300'
                    }`}>
                      {result.profit > 0 ? '+' : ''}{result.profit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-400">
              Hiển thị {filteredResults.length} kết quả
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Trước
              </Button>
              <span className="text-slate-300 px-4">Trang {currentPage}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Sau
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}