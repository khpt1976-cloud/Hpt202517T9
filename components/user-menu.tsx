"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { User, Settings, LogOut, CreditCard, HelpCircle, Shield, Bot } from "lucide-react"

export function UserMenu() {
  const { user, logout, isAdmin } = useAuth()
  const { t } = useLanguage()
  const currentPlan = "professional"
  const planNames = {
    free: "Free",
    basic: "Basic",
    professional: "Pro",
    enterprise: "Enterprise",
  }

  if (!user) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAdminBot = () => {
    window.open('https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev/admin/register', '_blank')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback className="bg-slate-900 text-white text-xs">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden md:block text-sm font-medium text-slate-300">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {planNames[currentPlan as keyof typeof planNames]}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profile" className="flex items-center w-full">
            <User className="w-4 h-4 mr-2" />
            {t("user_menu.profile")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings" className="flex items-center w-full">
            <Settings className="w-4 h-4 mr-2" />
            {t("user_menu.settings")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/subscription" className="flex items-center w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            {t("user_menu.billing")}
          </a>
        </DropdownMenuItem>
        {isAdmin() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin" className="flex items-center w-full">
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAdminBot} className="flex items-center w-full cursor-pointer">
              <Bot className="w-4 h-4 mr-2" />
              AdminBot
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/contact" className="flex items-center w-full">
            <HelpCircle className="w-4 h-4 mr-2" />
            {t("user_menu.help")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          {t("user_menu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
