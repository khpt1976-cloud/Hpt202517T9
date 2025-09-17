"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Home,
  Database,
  BarChart3,
  Globe,
  ChevronDown,
  User,
  TrendingUp,
  FileText,
  Settings,
  Gamepad2,
  BookOpen,
  DollarSign,
  Clock,
  Target,
  Activity,
} from "lucide-react"

export default function DigitalAnalysisPage() {
  const { language, setLanguage, t, isHydrated } = useLanguage()
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Configuration management states
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [configName, setConfigName] = useState("")
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // States for betting rules
  const [selectedStrategy, setSelectedStrategy] = useState("")
  const [selectedConfig, setSelectedConfig] = useState("")
  const [betAmount, setBetAmount] = useState("10000000")

  // Format number with thousand separators
  const formatNumber = (num: string) => {
    if (!num) return ""
    const number = num.replace(/[^\d]/g, "")
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Handle bet amount change with formatting
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "")
    setBetAmount(value)
  }
  const [betScope, setBetScope] = useState("")
  const [betTiming, setBetTiming] = useState("")
  const [timeRangeFrom, setTimeRangeFrom] = useState("")
  const [timeRangeTo, setTimeRangeTo] = useState("")
  const [goalsRangeFrom, setGoalsRangeFrom] = useState("")
  const [goalsRangeTo, setGoalsRangeTo] = useState("")
  const [oddsRangeFrom, setOddsRangeFrom] = useState("")
  const [oddsRangeTo, setOddsRangeTo] = useState("")
  
  // Pagination states
  const [leagueCurrentPage, setLeagueCurrentPage] = useState(1)
  const [matchCurrentPage, setMatchCurrentPage] = useState(1)
  const leaguesPerPage = 5
  const matchesPerPage = 10

  // State for saved configurations
  const [savedConfigs, setSavedConfigs] = useState<Array<{
    id: string
    name: string
    region: string
    country: string
    league: string
    startDate: string | null
    endDate: string | null
    createdAt: string
    updatedAt: string
  }>>([])

  // Load saved configurations from API
  useEffect(() => {
    setIsMounted(true)
    const fetchConfigurations = async () => {
      try {
        const response = await fetch('/api/data-configurations')
        if (response.ok) {
          const configs = await response.json()
          setSavedConfigs(configs)
        }
      } catch (error) {
        console.error('Error loading saved configurations:', error)
      }
    }

    fetchConfigurations()
  }, [])

  // Mock results data with league analysis
  const mockLeagueResults = [
    { 
      league: "Premier League", 
      category: "Anh", 
      winRate: "75%",
      totalWinnings: "+320,000",
      totalMatches: 8,
      matches: [
        { match: "Man City vs Liverpool", time: "45'", goals: 2, odds: 2.5, actualOdds: 0.8, result: "Thắng", profit: "+50,000" },
        { match: "Arsenal vs Chelsea", time: "67'", goals: 1, odds: 2, actualOdds: -0.2, result: "Thua", profit: "-25,000" },
        { match: "Tottenham vs Manchester United", time: "34'", goals: 1, odds: 1.5, actualOdds: 0.3, result: "Thắng", profit: "+30,000" },
        { match: "Newcastle vs Brighton", time: "78'", goals: 2, odds: 2.5, actualOdds: 0.7, result: "Thắng", profit: "+45,000" },
        { match: "West Ham vs Everton", time: "56'", goals: 0, odds: 1, actualOdds: 0.9, result: "Thua", profit: "-20,000" },
      ]
    },
    { 
      league: "La Liga", 
      category: "Tây Ban Nha", 
      winRate: "68%",
      totalWinnings: "+450,000",
      totalMatches: 12,
      matches: [
        { match: "Barcelona vs Real Madrid", time: "23'", goals: 0, odds: 3, actualOdds: 1.0, result: "Thắng", profit: "+80,000" },
        { match: "Atletico Madrid vs Sevilla", time: "41'", goals: 1, odds: 1.5, actualOdds: 0.4, result: "Thắng", profit: "+35,000" },
        { match: "Valencia vs Villarreal", time: "62'", goals: 2, odds: 2.5, actualOdds: -0.1, result: "Thua", profit: "-15,000" },
        { match: "Real Sociedad vs Athletic Bilbao", time: "29'", goals: 0, odds: 2, actualOdds: 0.8, result: "Thắng", profit: "+40,000" },
      ]
    },
    { 
      league: "Champions League", 
      category: "Châu Âu", 
      winRate: "82%",
      totalWinnings: "+280,000",
      totalMatches: 6,
      matches: [
        { match: "PSG vs Bayern Munich", time: "89'", goals: 3, odds: 3.5, actualOdds: 0.5, result: "Thắng", profit: "+110,000" },
        { match: "Real Madrid vs Manchester City", time: "12'", goals: 0, odds: 2.5, actualOdds: 0.9, result: "Thắng", profit: "+75,000" },
        { match: "Liverpool vs Barcelona", time: "67'", goals: 2, odds: 2.5, actualOdds: 0.6, result: "Thắng", profit: "+60,000" },
      ]
    },
    { 
      league: "Serie A", 
      category: "Ý", 
      winRate: "71%",
      totalWinnings: "+180,000",
      totalMatches: 7,
      matches: [
        { match: "Juventus vs AC Milan", time: "55'", goals: 1, odds: 2, actualOdds: 0.4, result: "Thắng", profit: "+25,000" },
        { match: "Inter Milan vs Napoli", time: "33'", goals: 0, odds: 1.5, actualOdds: 0.7, result: "Thua", profit: "-10,000" },
        { match: "AS Roma vs Lazio", time: "71'", goals: 2, odds: 2.5, actualOdds: 0.3, result: "Thắng", profit: "+35,000" },
      ]
    },
    { 
      league: "Bundesliga", 
      category: "Đức", 
      winRate: "79%",
      totalWinnings: "+220,000",
      totalMatches: 9,
      matches: [
        { match: "Bayern Munich vs Borussia Dortmund", time: "44'", goals: 1, odds: 1.5, actualOdds: 0.5, result: "Thắng", profit: "+40,000" },
        { match: "RB Leipzig vs Bayer Leverkusen", time: "28'", goals: 0, odds: 2, actualOdds: 0.8, result: "Thắng", profit: "+30,000" },
        { match: "Eintracht Frankfurt vs Wolfsburg", time: "63'", goals: 2, odds: 2.5, actualOdds: -0.3, result: "Thua", profit: "-20,000" },
      ]
    },
    { 
      league: "Ligue 1", 
      category: "Pháp", 
      winRate: "65%",
      totalWinnings: "+150,000",
      totalMatches: 10,
      matches: [
        { match: "PSG vs Marseille", time: "52'", goals: 1, odds: 2, actualOdds: 0.6, result: "Thắng", profit: "+25,000" },
        { match: "Lyon vs Monaco", time: "37'", goals: 0, odds: 1.5, actualOdds: 0.9, result: "Thua", profit: "-15,000" },
        { match: "Lille vs Nice", time: "81'", goals: 3, odds: 3.5, actualOdds: 0.2, result: "Thắng", profit: "+50,000" },
      ]
    },
    { 
      league: "Eredivisie", 
      category: "Hà Lan", 
      winRate: "73%",
      totalWinnings: "+95,000",
      totalMatches: 5,
      matches: [
        { match: "Ajax vs PSV", time: "26'", goals: 0, odds: 2.5, actualOdds: 0.7, result: "Thắng", profit: "+20,000" },
        { match: "Feyenoord vs AZ Alkmaar", time: "59'", goals: 2, odds: 2.5, actualOdds: 0.4, result: "Thắng", profit: "+15,000" },
      ]
    },
  ]

  // Flatten matches for individual display
  const mockResults = mockLeagueResults.flatMap(league => 
    league.matches.map(match => ({
      ...match,
      league: league.league,
      category: league.category,
      winRate: league.winRate,
      totalWinnings: league.totalWinnings,
      totalMatches: league.totalMatches
    }))
  )

  // Pagination logic for leagues
  const totalLeaguePages = Math.ceil(mockLeagueResults.length / leaguesPerPage)
  const startLeagueIndex = (leagueCurrentPage - 1) * leaguesPerPage
  const endLeagueIndex = startLeagueIndex + leaguesPerPage
  const currentLeagues = mockLeagueResults.slice(startLeagueIndex, endLeagueIndex)

  // Pagination logic for matches
  const totalMatchPages = Math.ceil(mockResults.length / matchesPerPage)
  const startMatchIndex = (matchCurrentPage - 1) * matchesPerPage
  const endMatchIndex = startMatchIndex + matchesPerPage
  const currentMatches = mockResults.slice(startMatchIndex, endMatchIndex)

  // Strategy display names mapping
  const strategyDisplayNames: { [key: string]: string } = {
    "tai-xiu": "Tài Xỉu",
    "chau-au": "Châu Âu", 
    "chau-a": "Châu Á",
    "tai": "Tài (Over)",
    "xiu": "Xỉu (Under)",
    "doi-cua-tren": "Đội Cửa Trên",
    "doi-cua-duoi": "Đội Cửa Dưới"
  }

  // Configuration management functions
  const handleSaveConfig = async () => {
    if (!configName.trim()) {
      alert('Vui lòng nhập tên cấu hình!')
      return
    }

    const newConfig = {
      id: Date.now().toString(),
      name: configName,
      selectedConfig,
      selectedStrategy,
      betAmount,
      betScope,
      betTiming,
      timeRangeFrom,
      timeRangeTo,
      goalsRangeFrom,
      goalsRangeTo,
      oddsRangeFrom,
      oddsRangeTo,
      region: "Custom",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/betting-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })

      if (response.ok) {
        setSavedConfigs(prev => [...prev, newConfig])
        setConfigName("")
        setShowSaveModal(false)
        alert('Lưu cấu hình thành công!')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Có lỗi xảy ra khi lưu cấu hình!')
    }
  }

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cấu hình này?')) return

    try {
      const response = await fetch(`/api/betting-presets/${configId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSavedConfigs(prev => prev.filter(config => config.id !== configId))
        alert('Xóa cấu hình thành công!')
      }
    } catch (error) {
      console.error('Error deleting config:', error)
      alert('Có lỗi xảy ra khi xóa cấu hình!')
    }
  }

  const handleEditConfig = async (configId: string) => {
    if (!editingName.trim()) {
      alert('Vui lòng nhập tên mới!')
      return
    }

    try {
      const response = await fetch(`/api/betting-presets/${configId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName })
      })

      if (response.ok) {
        setSavedConfigs(prev => prev.map(config => 
          config.id === configId 
            ? { ...config, name: editingName, updatedAt: new Date().toISOString() }
            : config
        ))
        setEditingConfig(null)
        setEditingName("")
        alert('Cập nhật tên thành công!')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      alert('Có lỗi xảy ra khi cập nhật!')
    }
  }

  const handleLoadConfig = (config: any) => {
    setSelectedConfig(config.selectedConfig || "")
    setSelectedStrategy(config.selectedStrategy || "")
    setBetAmount(config.betAmount || "10000000")
    setBetScope(config.betScope || "")
    setBetTiming(config.betTiming || "")
    setTimeRangeFrom(config.timeRangeFrom || "")
    setTimeRangeTo(config.timeRangeTo || "")
    setGoalsRangeFrom(config.goalsRangeFrom || "")
    setGoalsRangeTo(config.goalsRangeTo || "")
    setOddsRangeFrom(config.oddsRangeFrom || "")
    setOddsRangeTo(config.oddsRangeTo || "")
    setShowManageModal(false)
    alert(`Đã tải cấu hình: ${config.name}`)
  }

  // Pagination component
  const PaginationComponent = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void 
  }) => {
    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Trước
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage 
                ? "bg-cyan-500 text-white" 
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sau
        </button>
      </div>
    )
  }

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
                <div className="flex items-center space-x-2 text-cyan-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>Phân tích cách chơi</span>
                </div>
                <Link
                  href="/play-demo"
                  className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Chơi thử</span>
                </Link>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Phân tích cách chơi
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Thiết lập quy tắc cược và phân tích kết quả
          </p>
        </div>

        {/* Strategy Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-cyan-400" />
            Chọn Cách Chơi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Configuration Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <Database className="w-4 h-4 mr-1" />
                Cấu hình dữ liệu:
              </label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <SelectValue placeholder="Chọn cấu hình dữ liệu" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {savedConfigs.length > 0 ? (
                    savedConfigs.map((config) => (
                      <SelectItem key={config.id} value={config.id} className="text-white hover:bg-slate-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{config.name}</span>
                          <span className="text-xs text-slate-400">
                            {config.region} {config.country && `• ${config.country}`} {config.league && `• ${config.league}`}
                          </span>
                          {(config.startDate || config.endDate) && (
                            <span className="text-xs text-slate-500">
                              {config.startDate || ''} {config.endDate && `→ ${config.endDate}`}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-configs" disabled className="text-slate-500">
                      Chưa có cấu hình nào được lưu
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {savedConfigs.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Chưa có cấu hình dữ liệu nào được lưu
                </p>
              )}
            </div>

            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Loại cược:</label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <SelectValue placeholder="Chọn cách chơi" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="tai" className="text-white hover:bg-slate-700">
                    🔺 Tài (Over)
                  </SelectItem>
                  <SelectItem value="xiu" className="text-white hover:bg-slate-700">
                    🔻 Xỉu (Under)
                  </SelectItem>
                  <SelectItem value="doi-cua-tren" className="text-white hover:bg-slate-700">
                    ⬆️ Đội cửa trên
                  </SelectItem>
                  <SelectItem value="doi-cua-duoi" className="text-white hover:bg-slate-700">
                    ⬇️ Đội cửa dưới
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Configuration Info */}
          {selectedConfig && (
            <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center">
                <Database className="w-4 h-4 mr-1 text-green-400" />
                Cấu hình đã chọn:
              </h4>
              {(() => {
                const config = savedConfigs.find(c => c.id === selectedConfig)
                return config ? (
                  <div className="text-sm text-slate-400">
                    <p><span className="text-white font-medium">{config.name}</span></p>
                    <p>Khu vực: {config.region}</p>
                    {config.country && <p>Quốc gia: {config.country}</p>}
                    {config.league && <p>Giải đấu: {config.league}</p>}
                    {(config.startDate || config.endDate) && (
                      <p>Thời gian: {config.startDate || ''} {config.endDate && `→ ${config.endDate}`}</p>
                    )}
                  </div>
                ) : null
              })()}
            </div>
          )}
        </div>

        {/* Betting Rules Configuration - Always show */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-400" />
              Thiết Lập Chi Tiết Bộ Quy Tắc
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bet Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Số Tiền Cược (Mỗi Lệnh):
                </label>
                <Input
                  type="text"
                  value={formatNumber(betAmount)}
                  onChange={handleBetAmountChange}
                  placeholder="Nhập số tiền gốc cho mỗi lần vào lệnh"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">Nhập số tiền gốc cho mỗi lần vào lệnh.</p>
              </div>

              {/* Bet Scope */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phạm Vi Cược:</label>
                <Select value={betScope} onValueChange={setBetScope}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Chọn phạm vi" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ft" className="text-white hover:bg-slate-700">Cả Trận (FT)</SelectItem>
                    <SelectItem value="h1" className="text-white hover:bg-slate-700">Hiệp 1 (H1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bet Timing */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Thời Điểm Vào Kèo:</label>
                <Select value={betTiming} onValueChange={setBetTiming}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Chọn thời điểm" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pre-match" className="text-white hover:bg-slate-700">Trước Trận</SelectItem>
                    <SelectItem value="live" className="text-white hover:bg-slate-700">Trong Trận (Rung)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range - Only show when "live" is selected */}
              {betTiming === "live" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Khoảng Thời Gian (Rung):
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={timeRangeFrom}
                      onChange={(e) => setTimeRangeFrom(e.target.value)}
                      placeholder="Từ phút"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <span className="text-slate-400">đến</span>
                    <Input
                      type="number"
                      value={timeRangeTo}
                      onChange={(e) => setTimeRangeTo(e.target.value)}
                      placeholder="Đến phút"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Goals Range */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  Khoảng Số Bàn Thắng Đã Có:
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={goalsRangeFrom}
                    onChange={(e) => setGoalsRangeFrom(e.target.value)}
                    placeholder="Từ"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <span className="text-slate-400">đến</span>
                  <Input
                    type="number"
                    value={goalsRangeTo}
                    onChange={(e) => setGoalsRangeTo(e.target.value)}
                    placeholder="Đến"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Odds Range */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Khoảng Hệ Số Kèo Tài Xỉu:
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={oddsRangeFrom}
                    onChange={(e) => setOddsRangeFrom(e.target.value)}
                    placeholder="Từ"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <span className="text-slate-400">đến</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={oddsRangeTo}
                    onChange={(e) => setOddsRangeTo(e.target.value)}
                    placeholder="Đến"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3">
                <BarChart3 className="w-5 h-5 mr-2" />
                Phân Tích Kết Quả
              </Button>
              <Button 
                onClick={() => setShowSaveModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3"
              >
                <Settings className="w-5 h-5 mr-2" />
                Lưu Cấu Hình
              </Button>
              <Button 
                onClick={() => setShowManageModal(true)}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-8 py-3"
              >
                <FileText className="w-5 h-5 mr-2" />
                Quản Lý Cấu Hình
              </Button>
            </div>
          </div>

        {/* Results Table - Always show */}
        <div className="mt-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
              {selectedStrategy ? `Bảng Kết Quả Phân Tích - ${strategyDisplayNames[selectedStrategy] || selectedStrategy}` : "Bảng Kết Quả Phân Tích"}
            </h3>

            {/* League Summary Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300">Tên Giải Đấu</th>
                    <th className="text-left py-3 px-4 text-slate-300">Phân Loại</th>
                    <th className="text-left py-3 px-4 text-slate-300">% Thắng</th>
                    <th className="text-left py-3 px-4 text-slate-300">Số Tiền Thắng</th>
                    <th className="text-left py-3 px-4 text-slate-300">Số Trận Đấu</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeagues.map((league, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white font-medium">{league.league}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                          {league.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{league.winRate}</td>
                      <td className={`py-3 px-4 font-medium ${
                        league.totalWinnings.startsWith("+") ? "text-green-400" : "text-red-400"
                      }`}>
                        {league.totalWinnings}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{league.totalMatches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* League Pagination */}
            <PaginationComponent 
              currentPage={leagueCurrentPage}
              totalPages={totalLeaguePages}
              onPageChange={setLeagueCurrentPage}
            />

            {/* Detailed Match Results */}
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Database className="w-4 h-4 mr-2 text-cyan-400" />
              Chi Tiết Trận Đấu
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-300">Trận Đấu</th>
                    <th className="text-left py-3 px-4 text-slate-300">Giải Đấu</th>
                    <th className="text-left py-3 px-4 text-slate-300">Thời Gian</th>
                    <th className="text-left py-3 px-4 text-slate-300">Số Bàn Đã Có Khi Vào Cược</th>
                    <th className="text-left py-3 px-4 text-slate-300">Hệ Số Tài Xỉu</th>
                    <th className="text-left py-3 px-4 text-slate-300">Hệ Số Tỷ Lệ Cược</th>
                    <th className="text-left py-3 px-4 text-slate-300">Kết Quả</th>
                    <th className="text-left py-3 px-4 text-slate-300">Lợi Nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMatches.map((result, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white">{result.match}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="text-cyan-400">{result.league}</span>
                        <span className="text-slate-500 text-xs ml-1">({result.category})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{result.time}</td>
                      <td className="py-3 px-4 text-slate-300 text-center">{result.goals}</td>
                      <td className="py-3 px-4 text-slate-300">{result.odds}</td>
                      <td className={`py-3 px-4 font-medium ${
                        result.actualOdds < 0 ? "text-red-400" : "text-green-400"
                      }`}>
                        {result.actualOdds}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.result === "Thắng" 
                            ? "bg-green-500/20 text-green-300" 
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {result.result}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-medium ${
                        result.profit.startsWith("+") ? "text-green-400" : "text-red-400"
                      }`}>
                        {result.profit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Match Pagination */}
            <PaginationComponent 
              currentPage={matchCurrentPage}
              totalPages={totalMatchPages}
              onPageChange={setMatchCurrentPage}
            />

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Tổng Trận</p>
                <p className="text-2xl font-bold text-white">{isMounted ? mockResults.length : 0}</p>
              </div>
              <div className="bg-green-500/20 rounded-lg p-4 text-center">
                <p className="text-green-300 text-sm">Thắng</p>
                <p className="text-2xl font-bold text-green-400">
                  {isMounted ? mockResults.filter(r => r.result === "Thắng").length : 0}
                </p>
              </div>
              <div className="bg-red-500/20 rounded-lg p-4 text-center">
                <p className="text-red-300 text-sm">Thua</p>
                <p className="text-2xl font-bold text-red-400">
                  {isMounted ? mockResults.filter(r => r.result === "Thua").length : 0}
                </p>
              </div>
              <div className="bg-cyan-500/20 rounded-lg p-4 text-center">
                <p className="text-cyan-300 text-sm">Lợi Nhuận</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {isMounted ? `+${mockLeagueResults.reduce((total, league) => {
                    const amount = parseInt(league.totalWinnings.replace(/[+,]/g, ''))
                    return total + amount
                  }, 0).toLocaleString()}` : '+0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save Configuration Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-400" />
              Lưu Cấu Hình
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tên cấu hình
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Nhập tên cấu hình..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-sm text-slate-300 mb-2">Cấu hình sẽ lưu:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Cấu hình dữ liệu: {selectedConfig || "Chưa chọn"}</li>
                  <li>• Loại cược: {strategyDisplayNames[selectedStrategy] || selectedStrategy || "Chưa chọn"}</li>
                  <li>• Số tiền cược: {betAmount ? parseInt(betAmount).toLocaleString() : "Chưa nhập"}</li>
                  <li>• Các thông số khác (nếu có)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowSaveModal(false)
                  setConfigName("")
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveConfig}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Configurations Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-400" />
              Quản Lý Cấu Hình
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              {savedConfigs.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Chưa có cấu hình nào được lưu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConfigs.map((config) => (
                    <div key={config.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingConfig === config.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                autoFocus
                              />
                              <Button
                                onClick={() => handleEditConfig(config.id)}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                              >
                                ✓
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingConfig(null)
                                  setEditingName("")
                                }}
                                className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white text-sm"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-medium text-white">{config.name}</h4>
                              <div className="text-xs text-slate-400 mt-1 space-y-1">
                                <p>Loại cược: {strategyDisplayNames[config.selectedStrategy] || config.selectedStrategy || "N/A"}</p>
                                <p>Số tiền: {config.betAmount ? parseInt(config.betAmount).toLocaleString() : "N/A"}</p>
                                <p>Tạo: {new Date(config.createdAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {editingConfig !== config.id && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={() => handleLoadConfig(config)}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm"
                              title="Tải cấu hình"
                            >
                              📥
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingConfig(config.id)
                                setEditingName(config.name)
                              }}
                              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                              title="Sửa tên"
                            >
                              ✏️
                            </Button>
                            <Button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                              title="Xóa"
                            >
                              🗑️
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
              <Button
                onClick={() => {
                  setShowManageModal(false)
                  setEditingConfig(null)
                  setEditingName("")
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}