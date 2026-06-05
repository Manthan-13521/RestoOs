"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UtensilsCrossed, ListChecks, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function KitchenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
        <Link href="/kitchen" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">RestoOS Kitchen</span>
        </Link>

        <div className="flex-1" />

        <nav className="flex items-center gap-1">
          <Link
            href="/kitchen"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/kitchen"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <ListChecks className="h-4 w-4" />
            Orders
          </Link>
          <Link
            href="/kitchen/config"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/kitchen/config"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
