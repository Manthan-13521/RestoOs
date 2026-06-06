"use client"

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Grid3X3,
  ClipboardList,
  BookOpen,
  CalendarClock,
  Receipt,
  LogOut,
  UtensilsCrossed,
  Menu,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { NotificationBell } from "@/components/notification-bell"
import { useUIStore } from "@/store/ui-store"

const navItems = [
  { href: "/staff/home", label: "Dashboard", icon: Home },
  { href: "/staff/manage-tables", label: "Tables", icon: Grid3X3 },
  { href: "/staff/orders", label: "Orders", icon: ClipboardList },
  { href: "/staff/menu", label: "Menu", icon: BookOpen },
  { href: "/staff/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/staff/billing", label: "Billing", icon: Receipt },
]

export function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeItem = navItems.find((item) => pathname.startsWith(item.href))

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
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            !sidebarOpen && "justify-center"
          )}
        >
          <Link
            href="/staff/home"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
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
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
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

        {/* Sign out */}
        <div
          className={cn(
            "border-t p-3",
            !sidebarOpen && "flex flex-col items-center"
          )}
        >
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
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {activeItem && (
            <div className="hidden sm:block text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {activeItem.label}
              </span>
            </div>
          )}

          <div className="flex-1" />

          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex items-center justify-around border-t bg-background px-1 py-1 lg:hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium transition-colors min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
