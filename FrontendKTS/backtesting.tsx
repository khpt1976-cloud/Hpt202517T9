"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Home,
  Database,
  BarChart3,
  Globe,
  ChevronDown,
  User,
  Plus,
  Calendar,
  Filter,
  Play,
  Trash2,
} from "lucide-react"

interface FilterCondition {
  id: string
  market: string
  operator: string
  value: string
  logic: 'AND' | 'OR'
}

export default function BacktestingPage() {
  const { language, setLanguage, t, isHydrated } = useLanguage()
  const { user } = useAuth()
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedLeague, setSelectedLeague] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [showLeagueDialog, setShowLeagueDialog] = useState(false)
  const [showDateDialog, setShowDateDialog] = useState(false)

  // Region data
  const regions = [
    { value: "all", label: "Tất cả" },
    { value: "featured", label: "Nổi bật" },
    { value: "international", label: "Quốc tế" },
    { value: "europe", label: "Châu Âu" },
    { value: "asia", label: "Châu Á" },
    { value: "america", label: "Châu Mỹ" },
    { value: "africa", label: "Châu Phi" }
  ]

  const countries = {
    europe: [
      { value: "england", label: "Anh" },
      { value: "spain", label: "Tây Ban Nha" },
      { value: "germany", label: "Đức" },
      { value: "italy", label: "Ý" },
      { value: "france", label: "Pháp" }
    ],
    asia: [
      { value: "vietnam", label: "Việt Nam" },
      { value: "japan", label: "Nhật Bản" },
      { value: "korea", label: "Hàn Quốc" },
      { value: "china", label: "Trung Quốc" }
    ]
  }

  const leagues = {
    england: [
      { value: "premier-league", label: "Premier League" },
      { value: "championship", label: "Championship" }
    ],
    spain: [
      { value: "la-liga", label: "La Liga" },
      { value: "segunda", label: "Segunda División" }
    ],
    vietnam: [
      { value: "v-league", label: "V-League" },
      { value: "v-league-2", label: "V-League 2" }
    ]
  }

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      market: "",
      operator: "",
      value: "",
      logic: "AND"
    }
    setConditions([...conditions, newCondition])
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id))
  }

  const updateCondition = (id: string, field: keyof FilterCondition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const isCountryEnabled = selectedRegion && !["all", "featured", "international"].includes(selectedRegion)
  const isLeagueEnabled = selectedRegion === "featured" || selectedRegion === "international" || (selectedCountry && selectedCountry !== "")

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
              Kiểm thử Chiến lược
            </span>
          </h1>
          <p className="text-slate-300">
            Định nghĩa và kiểm thử các chiến lược dựa trên dữ liệu lịch sử
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
          <form className="space-y-8">
            {/* Section 1: Phạm vi Kiểm thử */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                1. Phạm vi Kiểm thử
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date Range */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fromDate" className="text-slate-300">Từ ngày *</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDate" className="text-slate-300">Đến ngày *</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                </div>

                {/* League Filters */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Khu vực</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Chọn khu vực" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value} className="text-slate-300">
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Quốc gia</Label>
                    <Select 
                      value={selectedCountry} 
                      onValueChange={setSelectedCountry}
                      disabled={!isCountryEnabled}
                    >
                      <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${!isCountryEnabled ? 'opacity-50' : ''}`}>
                        <SelectValue placeholder="Chọn quốc gia" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {selectedRegion && countries[selectedRegion as keyof typeof countries]?.map((country) => (
                          <SelectItem key={country.value} value={country.value} className="text-slate-300">
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Giải đấu</Label>
                    <Select 
                      value={selectedLeague} 
                      onValueChange={setSelectedLeague}
                      disabled={!isLeagueEnabled}
                    >
                      <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${!isLeagueEnabled ? 'opacity-50' : ''}`}>
                        <SelectValue placeholder="Chọn giải đấu" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {selectedCountry && leagues[selectedCountry as keyof typeof leagues]?.map((league) => (
                          <SelectItem key={league.value} value={league.value} className="text-slate-300">
                            {league.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        📅 Tùy chọn khác
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Chọn khoảng thời gian tùy chỉnh</DialogTitle>
                        <DialogDescription className="text-slate-300">
                          Thiết lập khoảng thời gian cụ thể cho việc kiểm thử
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex space-x-4">
                          <Button variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                            < Hôm qua
                          </Button>
                          <Button variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                            Hôm nay
                          </Button>
                          <Button variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                            Ngày mai >
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setShowLeagueDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Chọn Giải đấu
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 2: Điều kiện Chiến lược */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-400" />
                2. Điều kiện Chiến lược
              </h2>

              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg">
                    {index > 0 && (
                      <Select 
                        value={condition.logic} 
                        onValueChange={(value) => updateCondition(condition.id, 'logic', value)}
                      >
                        <SelectTrigger className="w-20 bg-slate-600 border-slate-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="AND" className="text-slate-300">VÀ</SelectItem>
                          <SelectItem value="OR" className="text-slate-300">HOẶC</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <Select 
                      value={condition.market} 
                      onValueChange={(value) => updateCondition(condition.id, 'market', value)}
                    >
                      <SelectTrigger className="flex-1 bg-slate-600 border-slate-500 text-white">
                        <SelectValue placeholder="Thị trường" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="over-under" className="text-slate-300">Tài/Xỉu</SelectItem>
                        <SelectItem value="handicap" className="text-slate-300">Handicap</SelectItem>
                        <SelectItem value="1x2" className="text-slate-300">1X2</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={condition.operator} 
                      onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                    >
                      <SelectTrigger className="w-32 bg-slate-600 border-slate-500 text-white">
                        <SelectValue placeholder="Toán tử" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value=">=" className="text-slate-300">≥</SelectItem>
                        <SelectItem value="<=" className="text-slate-300">≤</SelectItem>
                        <SelectItem value="=" className="text-slate-300">=</SelectItem>
                        <SelectItem value=">" className="text-slate-300">></SelectItem>
                        <SelectItem value="<" className="text-slate-300"><</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Giá trị"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      className="w-32 bg-slate-600 border-slate-500 text-white"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCondition}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm điều kiện
                </Button>
              </div>
            </div>

            {/* Section 3: Hành động Mô phỏng */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Play className="w-5 h-5 mr-2 text-green-400" />
                3. Hành động Mô phỏng
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-300">Loại cược</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Chọn loại cược" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="over" className="text-slate-300">Cửa Tài</SelectItem>
                      <SelectItem value="under" className="text-slate-300">Cửa Xỉu</SelectItem>
                      <SelectItem value="home" className="text-slate-300">Đội nhà</SelectItem>
                      <SelectItem value="away" className="text-slate-300">Đội khách</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Tỷ lệ cược tối thiểu</Label>
                  <Input
                    placeholder="1.90"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-8">
              <Button 
                type="submit"
                size="lg"
                className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                BẮT ĐẦU KIỂM THỬ
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}