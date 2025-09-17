"use client"

import { useState } from "react"
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Clock,
  MapPin,
} from "lucide-react"

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo: string
  awayLogo: string
  time: string
  date: string
  league: string
  status: 'Chưa đá' | 'Live' | 'HT' | 'FT'
  score?: string
}

export default function DataConfigPage() {
  const { language, setLanguage, t, isHydrated } = useLanguage()
  const { user } = useAuth()
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedLeague, setSelectedLeague] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  // Region data
  const regions = [
    { value: "all", label: "Tất cả", icon: "🌍" },
    { value: "featured", label: "Nổi bật", icon: "⭐" },
    { value: "international", label: "Quốc tế", icon: "🌐" },
    { value: "countries", label: "Quốc gia", icon: "🏳️" },
    { value: "europe", label: "Châu Âu", icon: "🇪🇺" },
    { value: "asia", label: "Châu Á", icon: "🌏" },
    { value: "america", label: "Châu Mỹ", icon: "🌎" },
    { value: "africa", label: "Châu Phi", icon: "🌍" }
  ]

  const countries = {
    europe: [
      { value: "inter-europe", label: "Liên Châu Âu", icon: "🇪🇺" },
      { value: "england", label: "Anh", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { value: "spain", label: "Tây Ban Nha", icon: "🇪🇸" },
      { value: "germany", label: "Đức", icon: "🇩🇪" },
      { value: "italy", label: "Ý", icon: "🇮🇹" },
      { value: "france", label: "Pháp", icon: "🇫🇷" },
      { value: "netherlands", label: "Hà Lan", icon: "🇳🇱" },
      { value: "portugal", label: "Bồ Đào Nha", icon: "🇵🇹" },
      { value: "belgium", label: "Bỉ", icon: "🇧🇪" },
      { value: "austria", label: "Áo", icon: "🇦🇹" },
      { value: "switzerland", label: "Thụy Sĩ", icon: "🇨🇭" },
      { value: "sweden", label: "Thụy Điển", icon: "🇸🇪" },
      { value: "norway", label: "Na Uy", icon: "🇳🇴" },
      { value: "denmark", label: "Đan Mạch", icon: "🇩🇰" },
      { value: "finland", label: "Phần Lan", icon: "🇫🇮" },
      { value: "poland", label: "Ba Lan", icon: "🇵🇱" },
      { value: "czech", label: "Séc", icon: "🇨🇿" },
      { value: "croatia", label: "Croatia", icon: "🇭🇷" },
      { value: "serbia", label: "Serbia", icon: "🇷🇸" },
      { value: "ukraine", label: "Ukraine", icon: "🇺🇦" },
      { value: "russia", label: "Nga", icon: "🇷🇺" }
    ],
    asia: [
      { value: "inter-asia", label: "Liên Châu Á", icon: "🌏" },
      { value: "vietnam", label: "Việt Nam", icon: "🇻🇳" },
      { value: "japan", label: "Nhật Bản", icon: "🇯🇵" },
      { value: "korea", label: "Hàn Quốc", icon: "🇰🇷" },
      { value: "china", label: "Trung Quốc", icon: "🇨🇳" },
      { value: "thailand", label: "Thái Lan", icon: "🇹🇭" },
      { value: "malaysia", label: "Malaysia", icon: "🇲🇾" },
      { value: "singapore", label: "Singapore", icon: "🇸🇬" },
      { value: "indonesia", label: "Indonesia", icon: "🇮🇩" },
      { value: "philippines", label: "Philippines", icon: "🇵🇭" },
      { value: "india", label: "Ấn Độ", icon: "🇮🇳" },
      { value: "australia", label: "Úc", icon: "🇦🇺" },
      { value: "saudi-arabia", label: "Ả Rập Saudi", icon: "🇸🇦" },
      { value: "uae", label: "UAE", icon: "🇦🇪" },
      { value: "qatar", label: "Qatar", icon: "🇶🇦" },
      { value: "iran", label: "Iran", icon: "🇮🇷" },
      { value: "iraq", label: "Iraq", icon: "🇮🇶" }
    ],
    america: [
      { value: "inter-america", label: "Liên Châu Mỹ", icon: "🌎" },
      { value: "usa", label: "Hoa Kỳ", icon: "🇺🇸" },
      { value: "brazil", label: "Brazil", icon: "🇧🇷" },
      { value: "argentina", label: "Argentina", icon: "🇦🇷" },
      { value: "mexico", label: "Mexico", icon: "🇲🇽" },
      { value: "canada", label: "Canada", icon: "🇨🇦" },
      { value: "chile", label: "Chile", icon: "🇨🇱" },
      { value: "colombia", label: "Colombia", icon: "🇨🇴" },
      { value: "uruguay", label: "Uruguay", icon: "🇺🇾" },
      { value: "peru", label: "Peru", icon: "🇵🇪" },
      { value: "ecuador", label: "Ecuador", icon: "🇪🇨" },
      { value: "venezuela", label: "Venezuela", icon: "🇻🇪" },
      { value: "paraguay", label: "Paraguay", icon: "🇵🇾" },
      { value: "bolivia", label: "Bolivia", icon: "🇧🇴" }
    ],
    africa: [
      { value: "inter-africa", label: "Liên Châu Phi", icon: "🌍" },
      { value: "egypt", label: "Ai Cập", icon: "🇪🇬" },
      { value: "morocco", label: "Morocco", icon: "🇲🇦" },
      { value: "nigeria", label: "Nigeria", icon: "🇳🇬" },
      { value: "south-africa", label: "Nam Phi", icon: "🇿🇦" },
      { value: "ghana", label: "Ghana", icon: "🇬🇭" },
      { value: "senegal", label: "Senegal", icon: "🇸🇳" },
      { value: "tunisia", label: "Tunisia", icon: "🇹🇳" },
      { value: "cameroon", label: "Cameroon", icon: "🇨🇲" },
      { value: "algeria", label: "Algeria", icon: "🇩🇿" },
      { value: "ivory-coast", label: "Bờ Biển Ngà", icon: "🇨🇮" },
      { value: "mali", label: "Mali", icon: "🇲🇱" },
      { value: "burkina-faso", label: "Burkina Faso", icon: "🇧🇫" }
    ],
    countries: [
      // Châu Âu
      { value: "england", label: "Anh", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { value: "spain", label: "Tây Ban Nha", icon: "🇪🇸" },
      { value: "germany", label: "Đức", icon: "🇩🇪" },
      { value: "italy", label: "Ý", icon: "🇮🇹" },
      { value: "france", label: "Pháp", icon: "🇫🇷" },
      { value: "netherlands", label: "Hà Lan", icon: "🇳🇱" },
      { value: "portugal", label: "Bồ Đào Nha", icon: "🇵🇹" },
      { value: "belgium", label: "Bỉ", icon: "🇧🇪" },
      { value: "austria", label: "Áo", icon: "🇦🇹" },
      { value: "switzerland", label: "Thụy Sĩ", icon: "🇨🇭" },
      { value: "sweden", label: "Thụy Điển", icon: "🇸🇪" },
      { value: "norway", label: "Na Uy", icon: "🇳🇴" },
      { value: "denmark", label: "Đan Mạch", icon: "🇩🇰" },
      { value: "finland", label: "Phần Lan", icon: "🇫🇮" },
      { value: "poland", label: "Ba Lan", icon: "🇵🇱" },
      { value: "czech", label: "Séc", icon: "🇨🇿" },
      { value: "croatia", label: "Croatia", icon: "🇭🇷" },
      { value: "serbia", label: "Serbia", icon: "🇷🇸" },
      { value: "ukraine", label: "Ukraine", icon: "🇺🇦" },
      { value: "russia", label: "Nga", icon: "🇷🇺" },
      
      // Châu Á
      { value: "vietnam", label: "Việt Nam", icon: "🇻🇳" },
      { value: "japan", label: "Nhật Bản", icon: "🇯🇵" },
      { value: "korea", label: "Hàn Quốc", icon: "🇰🇷" },
      { value: "china", label: "Trung Quốc", icon: "🇨🇳" },
      { value: "thailand", label: "Thái Lan", icon: "🇹🇭" },
      { value: "malaysia", label: "Malaysia", icon: "🇲🇾" },
      { value: "singapore", label: "Singapore", icon: "🇸🇬" },
      { value: "indonesia", label: "Indonesia", icon: "🇮🇩" },
      { value: "philippines", label: "Philippines", icon: "🇵🇭" },
      { value: "india", label: "Ấn Độ", icon: "🇮🇳" },
      { value: "australia", label: "Úc", icon: "🇦🇺" },
      { value: "saudi-arabia", label: "Ả Rập Saudi", icon: "🇸🇦" },
      { value: "uae", label: "UAE", icon: "🇦🇪" },
      { value: "qatar", label: "Qatar", icon: "🇶🇦" },
      { value: "iran", label: "Iran", icon: "🇮🇷" },
      { value: "iraq", label: "Iraq", icon: "🇮🇶" },
      
      // Châu Mỹ
      { value: "usa", label: "Hoa Kỳ", icon: "🇺🇸" },
      { value: "brazil", label: "Brazil", icon: "🇧🇷" },
      { value: "argentina", label: "Argentina", icon: "🇦🇷" },
      { value: "mexico", label: "Mexico", icon: "🇲🇽" },
      { value: "canada", label: "Canada", icon: "🇨🇦" },
      { value: "chile", label: "Chile", icon: "🇨🇱" },
      { value: "colombia", label: "Colombia", icon: "🇨🇴" },
      { value: "uruguay", label: "Uruguay", icon: "🇺🇾" },
      { value: "peru", label: "Peru", icon: "🇵🇪" },
      { value: "ecuador", label: "Ecuador", icon: "🇪🇨" },
      { value: "venezuela", label: "Venezuela", icon: "🇻🇪" },
      { value: "paraguay", label: "Paraguay", icon: "🇵🇾" },
      { value: "bolivia", label: "Bolivia", icon: "🇧🇴" },
      
      // Châu Phi
      { value: "egypt", label: "Ai Cập", icon: "🇪🇬" },
      { value: "morocco", label: "Morocco", icon: "🇲🇦" },
      { value: "nigeria", label: "Nigeria", icon: "🇳🇬" },
      { value: "south-africa", label: "Nam Phi", icon: "🇿🇦" },
      { value: "ghana", label: "Ghana", icon: "🇬🇭" },
      { value: "senegal", label: "Senegal", icon: "🇸🇳" },
      { value: "tunisia", label: "Tunisia", icon: "🇹🇳" },
      { value: "cameroon", label: "Cameroon", icon: "🇨🇲" },
      { value: "algeria", label: "Algeria", icon: "🇩🇿" },
      { value: "ivory-coast", label: "Bờ Biển Ngà", icon: "🇨🇮" },
      { value: "mali", label: "Mali", icon: "🇲🇱" },
      { value: "burkina-faso", label: "Burkina Faso", icon: "🇧🇫" }
    ]
  }

  const leagues = {
    // Giải đấu theo quốc gia
    england: [
      { value: "premier-league", label: "Premier League", icon: "🏆" },
      { value: "championship", label: "Championship", icon: "🥈" }
    ],
    spain: [
      { value: "la-liga", label: "La Liga", icon: "🏆" },
      { value: "segunda", label: "Segunda División", icon: "🥈" }
    ],
    vietnam: [
      { value: "v-league", label: "V-League", icon: "🏆" },
      { value: "v-league-2", label: "V-League 2", icon: "🥈" }
    ],
    germany: [
      { value: "bundesliga", label: "Bundesliga", icon: "🏆" },
      { value: "2-bundesliga", label: "2. Bundesliga", icon: "🥈" }
    ],
    italy: [
      { value: "serie-a", label: "Serie A", icon: "🏆" },
      { value: "serie-b", label: "Serie B", icon: "🥈" }
    ],
    france: [
      { value: "ligue-1", label: "Ligue 1", icon: "🏆" },
      { value: "ligue-2", label: "Ligue 2", icon: "🥈" }
    ],
    
    // Giải đấu liên châu lục
    "europe-continental": [
      { value: "champions-league", label: "UEFA Champions League", icon: "🏆" },
      { value: "europa-league", label: "UEFA Europa League", icon: "🥈" },
      { value: "conference-league", label: "UEFA Conference League", icon: "🥉" },
      { value: "euro-championship", label: "Euro Championship", icon: "🏆" },
      { value: "nations-league", label: "UEFA Nations League", icon: "🏅" }
    ],
    "asia-continental": [
      { value: "afc-champions-league", label: "AFC Champions League", icon: "🏆" },
      { value: "afc-cup", label: "AFC Cup", icon: "🥈" },
      { value: "asian-cup", label: "AFC Asian Cup", icon: "🏆" },
      { value: "aff-championship", label: "AFF Championship", icon: "🏅" }
    ],
    "america-continental": [
      { value: "copa-libertadores", label: "Copa Libertadores", icon: "🏆" },
      { value: "copa-sudamericana", label: "Copa Sudamericana", icon: "🥈" },
      { value: "copa-america", label: "Copa América", icon: "🏆" },
      { value: "concacaf-champions", label: "CONCACAF Champions League", icon: "🏅" }
    ],
    "africa-continental": [
      { value: "caf-champions-league", label: "CAF Champions League", icon: "🏆" },
      { value: "caf-cup", label: "CAF Cup", icon: "🥈" },
      { value: "afcon", label: "Africa Cup of Nations", icon: "🏆" },
      { value: "chan", label: "African Nations Championship", icon: "🏅" }
    ],
    
    // Giải đấu quốc tế
    international: [
      { value: "world-cup", label: "FIFA World Cup", icon: "🏆" },
      { value: "world-cup-qualifiers", label: "World Cup Qualifiers", icon: "🎯" },
      { value: "friendlies", label: "International Friendlies", icon: "🤝" },
      { value: "olympics", label: "Olympic Games", icon: "🥇" }
    ],
    
    // Giải đấu nổi bật
    featured: [
      { value: "premier-league", label: "Premier League", icon: "🏆" },
      { value: "la-liga", label: "La Liga", icon: "🏆" },
      { value: "bundesliga", label: "Bundesliga", icon: "🏆" },
      { value: "serie-a", label: "Serie A", icon: "🏆" },
      { value: "ligue-1", label: "Ligue 1", icon: "🏆" },
      { value: "champions-league", label: "Champions League", icon: "🏆" }
    ]
  }

  // Mock match data
  const mockMatches: Match[] = [
    {
      id: "1",
      homeTeam: "Manchester United",
      awayTeam: "Liverpool",
      homeLogo: "🔴",
      awayLogo: "🔴",
      time: "22:00",
      date: "2024-01-15",
      league: "Premier League",
      status: "Chưa đá"
    },
    {
      id: "2",
      homeTeam: "Barcelona",
      awayTeam: "Real Madrid",
      homeLogo: "🔵",
      awayLogo: "⚪",
      time: "21:00",
      date: "2024-01-15",
      league: "La Liga",
      status: "Live",
      score: "1-1"
    },
    {
      id: "3",
      homeTeam: "Bayern Munich",
      awayTeam: "Dortmund",
      homeLogo: "🔴",
      awayLogo: "🟡",
      time: "20:30",
      date: "2024-01-15",
      league: "Bundesliga",
      status: "FT",
      score: "2-1"
    }
  ]

  const isCountryEnabled = selectedRegion === "countries" || (selectedRegion && ["europe", "asia", "america", "africa"].includes(selectedRegion))
  const isLeagueEnabled = selectedRegion === "featured" || selectedRegion === "international" || (selectedCountry && selectedCountry !== "")

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live': return 'bg-red-500/20 text-red-400'
      case 'FT': return 'bg-green-500/20 text-green-400'
      case 'HT': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-slate-500/20 text-slate-400'
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
                className="flex items-center space-x-2 text-cyan-400 font-medium"
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
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Phân tích cách chơi
            </span>
          </h1>
          <p className="text-slate-300">
            Công cụ phân tích dữ liệu xây dựng thông minh với AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <BarChart3 className="w-6 h-6 text-green-400" />
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
                <BarChart3 className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-cyan-400" />
            Khu vực Bộ lọc
          </h2>

          {/* League Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Khu vực</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Chọn khu vực ▼" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {regions.map((region) => (
                    <SelectItem key={region.value} value={region.value} className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span>{region.icon}</span>
                        <span>{region.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quốc gia</label>
              <Select 
                value={selectedCountry} 
                onValueChange={setSelectedCountry}
                disabled={!isCountryEnabled}
              >
                <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${!isCountryEnabled ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder="Quốc gia ▼" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {selectedRegion && countries[selectedRegion as keyof typeof countries] && Array.isArray(countries[selectedRegion as keyof typeof countries]) && 
                   countries[selectedRegion as keyof typeof countries].map((country) => (
                    <SelectItem key={country.value} value={country.value} className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span>{country.icon}</span>
                        <span>{country.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Giải đấu</label>
              <Select 
                value={selectedLeague} 
                onValueChange={setSelectedLeague}
                disabled={!isLeagueEnabled}
              >
                <SelectTrigger className={`bg-slate-700 border-slate-600 text-white ${!isLeagueEnabled ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder="Giải đấu ▼" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {((selectedCountry && leagues[selectedCountry as keyof typeof leagues] && Array.isArray(leagues[selectedCountry as keyof typeof leagues])) || 
                    (selectedRegion && leagues[selectedRegion as keyof typeof leagues] && Array.isArray(leagues[selectedRegion as keyof typeof leagues]))) && 
                   ((selectedCountry && leagues[selectedCountry as keyof typeof leagues]) || 
                    (selectedRegion && leagues[selectedRegion as keyof typeof leagues]))?.map((league) => (
                    <SelectItem key={league.value} value={league.value} className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span>{league.icon}</span>
                        <span>{league.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Bắt đầu
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  // Reset end date if it's before the new start date
                  if (endDate && endDate < e.target.value) {
                    setEndDate("")
                  }
                }}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Chọn ngày bắt đầu"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Kết thúc
              </label>
              <Input
                type="date"
                value={endDate}
                min={startDate} // Ensure end date cannot be before start date
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Chọn ngày kết thúc"
                disabled={!startDate} // Disable until start date is selected
              />
              {startDate && endDate && endDate < startDate && (
                <p className="text-red-400 text-xs mt-1">
                  Ngày kết thúc không được nhỏ hơn ngày bắt đầu
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Matches Display Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-400" />
              Danh sách Trận đấu
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm trận đấu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {/* League Group Header */}
            <div className="bg-slate-700/50 rounded-lg p-3">
              <h3 className="font-semibold text-cyan-400">Premier League</h3>
            </div>

            {/* Match Items */}
            {mockMatches.map((match) => (
              <div key={match.id} className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{match.time}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{match.homeLogo}</span>
                        <span className="text-white font-medium">{match.homeTeam}</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-white font-bold text-lg">
                          {match.score || "vs"}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{match.awayTeam}</span>
                        <span className="text-2xl">{match.awayLogo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                      {match.status}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Chi tiết >
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Hiển thị {mockMatches.length} trận đấu
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </Button>
              <span className="text-slate-300 px-4">Trang {currentPage}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}