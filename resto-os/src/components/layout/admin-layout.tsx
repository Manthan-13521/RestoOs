"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  BookOpen,
  ClipboardList,
  Gift,
  Table2,
  CalendarClock,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Moon,
  Sun,
  Tags,
} from "lucide-react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { useUIStore } from "@/store/ui-store"
import { NotificationBell } from "@/components/notification-bell"

const sidebarItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/finance", label: "Finance", icon: DollarSign },
  { href: "/admin/customers", label: "Customers", icon: BookOpen },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/admin/tables",    label: "Tables",     icon: Table2 },
  { href: "/admin/offers",    label: "Offers",     icon: Gift },
  { href: "/staff/menu",      label: "Menu Items", icon: ClipboardList },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/emergency", label: "Emergency", icon: AlertTriangle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 lg:static",
          sidebarOpen ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b px-4", !sidebarOpen && "justify-center")}>
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold text-sidebar-foreground">RestoOS</span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className={cn(
              "ml-auto hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent",
              !sidebarOpen && "ml-0"
            )}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    !sidebarOpen && "justify-center px-2"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom actions */}
        <div className={cn("border-t p-3 space-y-2", !sidebarOpen && "flex flex-col items-center")}>
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              !sidebarOpen && "w-10 justify-center"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            {sidebarOpen && <span className="ml-3">{theme === "dark" ? "Light" : "Dark"} Mode</span>}
          </Button>
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              !sidebarOpen && "w-10 justify-center"
            )}
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex-1" />

          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
