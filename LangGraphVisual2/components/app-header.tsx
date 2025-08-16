"use client"

import { Moon, Sun, Globe } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage, useLanguageActions } from '@/stores/i18n-store'
import { useI18n } from '@/stores/i18n-store'
import { ImportExportButtons } from "@/components/import-export-buttons"
import type { LangGraph } from "@/lib/types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth, useAuthActions } from "@/stores/auth-store"

interface AppHeaderProps {
  onImport: (data: { graph: LangGraph; code: string }) => void
}

export function AppHeader({ onImport }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const { user, loading } = useAuth()
  const { loadMe, logout, loginWithGithub, loginWithGoogle } = useAuthActions()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }
  
  // Load session on mount
  useEffect(() => {
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex-shrink-0 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("app.title")}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Import/Export Buttons */}
          <ImportExportButtons onImport={onImport} />

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[100px]">
                <Globe className="w-4 h-4 mr-2" />
                {language === "en" ? "English" : "한국어"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ko")}>한국어</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-10 h-8"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Auth Controls (rightmost) */}
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-1">
                  <Avatar className="h-7 w-7">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />
                    ) : (
                      <AvatarFallback>{(user.name || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm">Signed in as</span>
                    <span className="text-xs text-slate-500 truncate max-w-[220px]">{user.name || user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Sign in</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Continue with</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={loginWithGithub}>GitHub</DropdownMenuItem>
                <DropdownMenuItem onClick={loginWithGoogle}>Google</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
