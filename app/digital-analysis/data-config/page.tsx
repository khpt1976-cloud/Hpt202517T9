"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  DialogFooter,
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
  Settings,
  Save,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Timer,
  Gamepad2,
  BookOpen,
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
  const router = useRouter()
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedLeague, setSelectedLeague] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  // Configuration management states
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
  const [configName, setConfigName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [nameError, setNameError] = useState("")
  const [selectedMatch, setSelectedMatch] = useState<typeof mockMatches[0] | null>(null)
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Match control states
  const [currentTime, setCurrentTime] = useState(0) // Current match time in minutes
  const [isPlaying, setIsPlaying] = useState(false)
  const [skipSeconds, setSkipSeconds] = useState(30) // Configurable skip time
  const [showTimeSettings, setShowTimeSettings] = useState(false)

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

  // API functions
  const fetchConfigurations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/data-configurations')
      if (response.ok) {
        const configs = await response.json()
        setSavedConfigs(configs)
      }
    } catch (error) {
      console.error('Error fetching configurations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load configurations on component mount
  useEffect(() => {
    fetchConfigurations()
  }, [])

  // Configuration management functions
  const saveConfiguration = async () => {
    if (!configName.trim()) return
    
    // Check for duplicate names
    const trimmedName = configName.trim()
    const isDuplicate = savedConfigs.some(config => 
      config.name.toLowerCase() === trimmedName.toLowerCase()
    )
    
    if (isDuplicate) {
      setNameError('Tên cấu hình đã tồn tại! Vui lòng chọn tên khác.')
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/data-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          region: selectedRegion,
          country: selectedCountry,
          league: selectedLeague,
          startDate: startDate || null,
          endDate: endDate || null,
          userId: user?.id || null
        })
      })
      
      if (response.ok) {
        const newConfig = await response.json()
        setSavedConfigs(prev => [newConfig, ...prev])
        setConfigName("")
        setNameError("")
        setShowSaveDialog(false)
      } else {
        setNameError('Lỗi khi lưu cấu hình. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      setNameError('Lỗi khi lưu cấu hình. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadConfiguration = (config: typeof savedConfigs[0]) => {
    setSelectedRegion(config.region)
    setSelectedCountry(config.country)
    setSelectedLeague(config.league)
    setStartDate(config.startDate || "")
    setEndDate(config.endDate || "")
    setActiveConfigId(config.id)
  }

  const deleteConfiguration = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/data-configurations/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSavedConfigs(prev => prev.filter(config => config.id !== id))
        if (activeConfigId === id) {
          setActiveConfigId(null)
        }
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset active config when filters change manually
  const resetActiveConfig = () => {
    setActiveConfigId(null)
  }

  const startEditingName = (config: typeof savedConfigs[0]) => {
    setEditingConfig(config.id)
    setEditingName(config.name)
  }

  const saveEditedName = async () => {
    if (!editingName.trim() || !editingConfig) return
    
    // Check for duplicate names (excluding current config)
    const trimmedName = editingName.trim()
    const isDuplicate = savedConfigs.some(config => 
      config.id !== editingConfig && 
      config.name.toLowerCase() === trimmedName.toLowerCase()
    )
    
    if (isDuplicate) {
      alert('Tên cấu hình đã tồn tại! Vui lòng chọn tên khác.')
      return
    }
    
    try {
      setIsLoading(true)
      const currentConfig = savedConfigs.find(config => config.id === editingConfig)
      if (!currentConfig) return
      
      const response = await fetch(`/api/data-configurations/${editingConfig}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentConfig,
          name: trimmedName
        })
      })
      
      if (response.ok) {
        const updatedConfig = await response.json()
        setSavedConfigs(prev => prev.map(config => 
          config.id === editingConfig ? updatedConfig : config
        ))
        setEditingConfig(null)
        setEditingName("")
      } else {
        alert('Lỗi khi cập nhật tên cấu hình. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error updating configuration name:', error)
      alert('Lỗi khi cập nhật tên cấu hình. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEditing = () => {
    setEditingConfig(null)
    setEditingName("")
  }

  const handleConfigNameChange = (value: string) => {
    setConfigName(value)
    if (nameError) setNameError("")
  }

  const handleDialogClose = (open: boolean) => {
    setShowSaveDialog(open)
    if (!open) {
      setConfigName("")
      setNameError("")
    }
  }

  // Match control functions
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const skipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - skipSeconds / 60))
  }

  const skipForward = () => {
    setCurrentTime(Math.min(90, currentTime + skipSeconds / 60))
  }

  const resetTime = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Match detail component
  const MatchDetail = ({ match }: { match: typeof mockMatches[0] }) => {
    // Get current score based on time
    const getCurrentScore = () => {
      if (currentTime < 21) return { home: 0, away: 0 }
      if (currentTime < 45) return { home: 1, away: 0 }
      if (currentTime < 67) return { home: 1, away: 1 }
      return { home: 2, away: 1 }
    }

    const currentScore = getCurrentScore()

    const bettingData = [
      {
        team: match.homeTeam,
        logo: match.homeLogo,
        score: currentScore.home.toString(),
        odds: {
          // Cược Chấp Toàn Trận
          fullHandicap: { line: '1.0', over: '0.91', under: '-0.99' },
          // Tài Xỉu Toàn Trận  
          fullTotal: { line: '2/2.5', over: '-0.98', under: '0.88' },
          // 1X2 Toàn Trận
          fullMatch: '6.80',
          // Cược Chấp Hiệp 1
          halfHandicap: { line: '0/0.5', over: '0.98', under: '0.72' },
          // Tài Xỉu Hiệp 1
          halfTotal: { line: '0.5/1', over: '-0.82', under: 'u' },
          // 1X2 Hiệp 1
          halfMatch: '0.73'
        }
      },
      {
        team: match.awayTeam,
        logo: match.awayLogo,
        score: currentScore.away.toString(),
        odds: {
          // Cược Chấp Toàn Trận
          fullHandicap: { line: '1.0', over: '-0.99', under: '0.91' },
          // Tài Xỉu Toàn Trận
          fullTotal: { line: '2/2.5', over: '0.88', under: '-0.98' },
          // 1X2 Toàn Trận
          fullMatch: '1.56',
          // Cược Chấp Hiệp 1
          halfHandicap: { line: '0/0.5', over: '0.72', under: '0.98' },
          // Tài Xỉu Hiệp 1
          halfTotal: { line: '0.5/1', over: 'u', under: '-0.82' },
          // 1X2 Hiệp 1
          halfMatch: '2.23'
        }
      }
    ]

    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedMatch(null)}
            className="bg-white border-slate-300 text-black font-semibold hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-xl font-semibold text-white">Chi tiết trận đấu</h2>
          <div></div>
        </div>

        {/* Match info */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">{match.league}</h3>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="text-2xl mb-1">{match.homeLogo}</div>
                <div className="text-white font-medium">{match.homeTeam}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-white font-bold">
                  {currentScore.home} - {currentScore.away}
                </div>
                <div className="text-slate-400 text-sm">{match.time}</div>
                {/* Current Time Badge */}
                <div className="mt-1">
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {Math.floor(currentTime)}'
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">{match.awayLogo}</div>
                <div className="text-white font-medium">{match.awayTeam}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                match.status === 'Live' ? 'bg-red-500 text-white' :
                match.status === 'FT' ? 'bg-green-500 text-white' :
                'bg-slate-600 text-slate-300'
              }`}>
                {match.status}
              </span>
              
              {/* Current Match Time */}
              <div className="flex items-center space-x-2 bg-slate-600 px-3 py-1 rounded-full">
                <Timer className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-mono text-sm">{formatTime(currentTime)}'</span>
              </div>
            </div>
          </div>
        </div>



        {/* Betting odds table */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">TRỰC TIẾP</span>
              <span className="text-xs font-bold text-slate-800">
                {String(Math.floor(currentTime / 60)).padStart(2, '0')}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}AM
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>Tên đội</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '6.67%'}}>Tỷ số</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>Cược Chấp Toàn Trận</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>Tài Xỉu Toàn Trận</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>1X2 Toàn Trận</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>Cược Chấp Hiệp 1</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>Tài Xỉu Hiệp 1</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 border border-slate-400" style={{width: '13.33%'}}>1X2 Hiệp 1</th>
                </tr>
              </thead>
              <tbody>
                {/* Team 1 Row - Manchester United */}
                <tr className="h-12">
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-orange-500 text-xs">⭐</span>
                      <span className="font-medium text-slate-800 text-xs">Manchester United</span>
                    </div>
                  </td>
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '6.67%'}}>
                    <span className="text-red-500 text-xs font-bold">0</span>
                  </td>
                  {/* Cược Chấp Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold text-red-600 py-1"></div>
                    </div>
                  </td>
                  {/* Tài Xỉu Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold text-red-600 border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Toàn Trận */}
                  <td className="px-1 py-2 text-center border border-slate-400 text-xs font-semibold" style={{width: '13.33%'}}>0.96</td>
                  {/* Cược Chấp Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold py-1"></div>
                    </div>
                  </td>
                  {/* Tài Xỉu Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold text-red-600 border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Hiệp 1 */}
                  <td className="px-1 py-2 text-center border border-slate-400 text-xs font-semibold" style={{width: '13.33%'}}>1.63</td>
                </tr>

                {/* Team 2 Row - Liverpool */}
                <tr className="h-12">
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-orange-500 text-xs">⭐</span>
                      <span className="font-medium text-slate-800 text-xs">Liverpool</span>
                    </div>
                  </td>
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '6.67%'}}>
                    <span className="text-red-500 text-xs font-bold">0</span>
                  </td>
                  {/* Cược Chấp Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs py-1">u</div>
                    </div>
                  </td>
                  {/* Tài Xỉu Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs py-1">e</div>
                    </div>
                  </td>
                  {/* 1X2 Toàn Trận */}
                  <td className="px-1 py-2 text-center border border-slate-400 text-xs font-semibold" style={{width: '13.33%'}}>0.94</td>
                  {/* Cược Chấp Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs py-1">u</div>
                    </div>
                  </td>
                  {/* Tài Xỉu Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Hiệp 1 */}
                  <td className="px-1 py-2 text-center border border-slate-400 text-xs font-semibold" style={{width: '13.33%'}}>10.00</td>
                </tr>

                {/* Draw Row - Hòa */}
                <tr className="h-12">
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}>
                    <span className="font-medium text-slate-800 text-xs">Hòa</span>
                  </td>
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '6.67%'}}></td>
                  {/* Cược Chấp Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* Tài Xỉu Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Toàn Trận */}
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                  {/* Cược Chấp Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* Tài Xỉu Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Hiệp 1 */}
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                </tr>

                {/* Additional odds row */}
                <tr className="h-12">
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '6.67%'}}></td>
                  {/* Cược Chấp Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold py-1"></div>
                    </div>
                  </td>
                  {/* Tài Xỉu Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Toàn Trận */}
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                  {/* Cược Chấp Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold text-red-600 py-1"></div>
                    </div>
                  </td>
                  {/* Tài Xỉu Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Hiệp 1 */}
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                </tr>

                {/* Bottom row */}
                <tr className="h-12">
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '6.67%'}}></td>
                  {/* Cược Chấp Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs font-semibold text-red-600 border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs py-1">u</div>
                    </div>
                  </td>
                  {/* Tài Xỉu Toàn Trận */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs font-semibold text-red-600 border-r border-slate-400 py-1"></div>
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Toàn Trận */}
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                  {/* Cược Chấp Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-2 h-full">
                      <div className="text-center text-xs font-semibold border-r border-slate-400 py-1"></div>
                      <div className="text-center text-xs py-1">u</div>
                    </div>
                  </td>
                  {/* Tài Xỉu Hiệp 1 */}
                  <td className="px-1 py-2 border border-slate-400" style={{width: '13.33%'}}>
                    <div className="grid grid-cols-3 h-full">
                      <div className="text-center text-xs font-semibold text-red-600 border-r border-slate-400 py-1"></div>
                      <div className="text-center border-r border-slate-400 py-1"></div>
                      <div className="text-center py-1"></div>
                    </div>
                  </td>
                  {/* 1X2 Hiệp 1 */}
                  <td className="px-1 py-2 text-center border border-slate-400" style={{width: '13.33%'}}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Match Controls - Moved to bottom */}
        <div className="bg-slate-700/50 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Reset Time Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetTime}
              className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
              title="Đặt lại thời gian"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Skip Backward */}
            <Button
              variant="outline"
              size="sm"
              onClick={skipBackward}
              className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
              title={`Tua lại ${skipSeconds}s`}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="outline"
              size="lg"
              onClick={togglePlayPause}
              className="bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {/* Skip Forward */}
            <Button
              variant="outline"
              size="sm"
              onClick={skipForward}
              className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
              title={`Tua đi ${skipSeconds}s`}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimeSettings(!showTimeSettings)}
              className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
              title="Cài đặt thời gian tua"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Time Settings Panel */}
          {showTimeSettings && (
            <div className="mt-4 p-4 bg-slate-600/50 rounded-lg">
              <div className="flex items-center justify-center space-x-4">
                <label className="text-white text-sm">Thời gian tua:</label>
                <select
                  value={skipSeconds}
                  onChange={(e) => setSkipSeconds(Number(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
                >
                  <option value={10}>10 giây</option>
                  <option value={15}>15 giây</option>
                  <option value={30}>30 giây</option>
                  <option value={60}>1 phút</option>
                  <option value={120}>2 phút</option>
                  <option value={300}>5 phút</option>
                </select>
              </div>
            </div>
          )}

          {/* Timeline Slider */}
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-slate-400 text-sm">00:00</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #0891b2 0%, #0891b2 ${(currentTime/90)*100}%, #475569 ${(currentTime/90)*100}%, #475569 100%)`
                  }}
                />
              </div>
              <span className="text-slate-400 text-sm">90:00</span>
            </div>
          </div>
        </div>
      </div>
    )
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
                    onSelect={() => setLanguage("vi")}
                    className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                  >
                    <span>🇻🇳</span>
                    <span>Tiếng Việt</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setLanguage("en")}
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
            Công cụ phân tích dữ liệu bóng đá với AI
          </p>
        </div>



        {/* Filters Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-cyan-400" />
              Cấu hình dữ liệu 🇩🇪🇪🇸🇮🇹🇫🇷
            </h2>
            <Button 
              onClick={() => setShowSaveDialog(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!selectedRegion}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu cấu hình
            </Button>
          </div>

          {/* League Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Khu vực</label>
              <Select 
                value={selectedRegion} 
                onValueChange={(value) => {
                  setSelectedRegion(value)
                  setSelectedCountry("")
                  setSelectedLeague("")
                  resetActiveConfig()
                }}
              >
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <SelectValue placeholder="Chọn khu vực">
                    {selectedRegion && (
                      <span>{regions.find(r => r.value === selectedRegion)?.icon} {regions.find(r => r.value === selectedRegion)?.label}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {regions.map((region) => (
                    <SelectItem 
                      key={region.value} 
                      value={region.value}
                      className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <span>{region.icon} {region.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quốc gia hoặc liên châu lục</label>
              <Select 
                value={selectedCountry} 
                onValueChange={(value) => {
                  setSelectedCountry(value)
                  setSelectedLeague("")
                  resetActiveConfig()
                }}
                disabled={!isCountryEnabled}
              >
                <SelectTrigger className={`w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 ${!isCountryEnabled ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder="Quốc gia hoặc liên châu lục">
                    {selectedCountry && selectedRegion && countries[selectedRegion as keyof typeof countries] && (
                      <span>{countries[selectedRegion as keyof typeof countries].find(c => c.value === selectedCountry)?.icon} {countries[selectedRegion as keyof typeof countries].find(c => c.value === selectedCountry)?.label}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {selectedRegion && countries[selectedRegion as keyof typeof countries] && Array.isArray(countries[selectedRegion as keyof typeof countries]) && 
                   countries[selectedRegion as keyof typeof countries].map((country) => (
                    <SelectItem 
                      key={country.value} 
                      value={country.value}
                      className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <span>{country.icon} {country.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Giải đấu</label>
              <Select 
                value={selectedLeague} 
                onValueChange={(value) => {
                  setSelectedLeague(value)
                  resetActiveConfig()
                }}
                disabled={!isLeagueEnabled}
              >
                <SelectTrigger className={`w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 ${!isLeagueEnabled ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder="Giải đấu">
                    {selectedLeague && ((selectedCountry && leagues[selectedCountry as keyof typeof leagues]) || (selectedRegion && leagues[selectedRegion as keyof typeof leagues])) && (
                      <span>{((selectedCountry && leagues[selectedCountry as keyof typeof leagues]) || (selectedRegion && leagues[selectedRegion as keyof typeof leagues]))?.find(l => l.value === selectedLeague)?.icon} {((selectedCountry && leagues[selectedCountry as keyof typeof leagues]) || (selectedRegion && leagues[selectedRegion as keyof typeof leagues]))?.find(l => l.value === selectedLeague)?.label}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {((selectedCountry && leagues[selectedCountry as keyof typeof leagues] && Array.isArray(leagues[selectedCountry as keyof typeof leagues])) || 
                    (selectedRegion && leagues[selectedRegion as keyof typeof leagues] && Array.isArray(leagues[selectedRegion as keyof typeof leagues]))) && 
                   ((selectedCountry && leagues[selectedCountry as keyof typeof leagues]) || 
                    (selectedRegion && leagues[selectedRegion as keyof typeof leagues]))?.map((league) => (
                    <SelectItem 
                      key={league.value} 
                      value={league.value}
                      className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <span>{league.icon} {league.label}</span>
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
                  resetActiveConfig()
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
                onChange={(e) => {
                  setEndDate(e.target.value)
                  resetActiveConfig()
                }}
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
        {selectedMatch ? (
          <MatchDetail match={selectedMatch} />
        ) : (
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
                      onClick={() => router.push(`/digital-analysis/match-detail?id=${match.id}`)}
                      className="bg-white border-slate-300 text-black font-semibold hover:bg-slate-100"
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
                className="bg-white border-slate-300 text-black font-semibold hover:bg-slate-100 disabled:bg-slate-200 disabled:text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </Button>
              <span className="text-slate-300 px-4">Trang {currentPage}</span>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-300 text-black font-semibold hover:bg-slate-100"
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Saved Configurations Section */}
        {savedConfigs.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-green-400" />
              Cấu hình đã lưu ({savedConfigs.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedConfigs.map((config) => {
                const isActive = activeConfigId === config.id
                return (
                <div key={config.id} className={`rounded-lg p-4 border transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyan-900/30 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    {editingConfig === config.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditedName()
                            if (e.key === 'Escape') cancelEditing()
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={saveEditedName}
                          className="bg-green-600 hover:bg-green-700 text-white p-1"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="border-slate-500 text-slate-300 hover:bg-slate-600 p-1"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 flex-1">
                          <h4 className={`font-medium truncate ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                            {config.name}
                          </h4>
                          {isActive && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full border border-cyan-500/30">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingName(config)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteConfiguration(config.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 mb-3">
                    <div>Khu vực: {regions.find(r => r.value === config.region)?.label || config.region}</div>
                    {config.country && <div>Quốc gia: {config.country}</div>}
                    {config.league && <div>Giải đấu: {config.league}</div>}
                    <div>Tạo: {new Date(config.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => loadConfiguration(config)}
                    disabled={isActive}
                    className={`w-full transition-all duration-200 ${
                      isActive 
                        ? 'bg-green-600/50 text-green-200 cursor-not-allowed' 
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    {isActive ? '✓ Đã áp dụng' : 'Áp dụng cấu hình'}
                  </Button>
                </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Save Configuration Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Lưu cấu hình</DialogTitle>
            <DialogDescription className="text-slate-400">
              Đặt tên cho cấu hình hiện tại để sử dụng lại sau này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tên cấu hình
              </label>
              <input
                type="text"
                value={configName}
                onChange={(e) => handleConfigNameChange(e.target.value)}
                placeholder="Ví dụ: Premier League 2024"
                className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white placeholder-slate-400 ${
                  nameError ? 'border-red-500' : 'border-slate-600'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && configName.trim()) {
                    saveConfiguration()
                  }
                }}
              />
              {nameError && (
                <p className="text-red-400 text-sm mt-1">{nameError}</p>
              )}
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
              <div className="font-medium mb-2">Cấu hình hiện tại:</div>
              <div className="space-y-1 text-xs">
                <div>• Khu vực: {regions.find(r => r.value === selectedRegion)?.label || 'Chưa chọn'}</div>
                {selectedCountry && <div>• Quốc gia: {selectedCountry}</div>}
                {selectedLeague && <div>• Giải đấu: {selectedLeague}</div>}
                {startDate && <div>• Từ ngày: {startDate}</div>}
                {endDate && <div>• Đến ngày: {endDate}</div>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              className="bg-white border-slate-300 text-black font-semibold hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              onClick={saveConfiguration}
              disabled={!configName.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}