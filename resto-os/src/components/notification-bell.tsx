"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Loader2, CheckCircle2, CookingPot, AlertTriangle, CreditCard, MessageSquare, PhoneCall } from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import { useSession } from "next-auth/react"

interface NotificationData {
  _id: string
  type: "order" | "waiter_call" | "payment" | "reservation" | "system" | "feedback"
  title: string
  message: string
  readBy: string[]
  priority: "low" | "medium" | "high"
  createdAt: string
}

const typeIcons: Record<string, any> = {
  order: CookingPot,
  waiter_call: PhoneCall,
  payment: CreditCard,
  reservation: CheckCircle2,
  system: AlertTriangle,
  feedback: MessageSquare,
}

const typeColors: Record<string, string> = {
  order: "text-blue-500",
  waiter_call: "text-orange-500",
  payment: "text-green-500",
  reservation: "text-purple-500",
  system: "text-gray-500",
  feedback: "text-pink-500",
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userId = session?.user?.id

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : data.data || [])
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("Failed to load notifications", e)
    } finally { setLoading(false) }
  }

  async function markAsRead(id: string) {
    if (!userId) return
    try {
      await fetch("/api/notifications/mark-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readBy: [...n.readBy, userId] } : n))
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("Failed to mark notification read", e)
    }
  }

  async function markAllAsRead() {
    if (!userId) return
    const unreadIds = notifications.filter(n => !n.readBy.includes(userId)).map(n => n._id)
    if (unreadIds.length === 0) return
    try {
      await fetch("/api/notifications/mark-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, readBy: [...n.readBy, userId] })))
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("Failed to mark all read", e)
    }
  }

  const unreadCount = !userId ? 0 : notifications.filter(n => !n.readBy.includes(userId)).length
  const recentNotifications = notifications.slice(0, 20)

  return (
    <div ref={dropdownRef} className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)} aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`} aria-expanded={open} aria-haspopup="true">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border bg-popover shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : recentNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No notifications</div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map(n => {
                  const Icon = typeIcons[n.type] || Bell
                  const isUnread = !n.readBy.includes(userId!)
                  return (
                    <div
                      key={n._id}
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors cursor-pointer",
                        isUnread ? "bg-accent/50" : "hover:bg-accent/30"
                      )}
                      onClick={() => { if (isUnread) markAsRead(n._id) }}
                    >
                      <div className={cn("mt-0.5", typeColors[n.type])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate", isUnread ? "font-medium" : "text-muted-foreground")}>{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                      {isUnread && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
