"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Clock,
  Bell,
  UtensilsCrossed,
  IndianRupee,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"
import { useNotificationStore } from "@/store/notification-store"

const statusConfig: Record<string, { label: string; variant: "warning" | "info" | "success" | "default"; color: string }> = {
  confirmed: { label: "Confirmed", variant: "info", color: "border-l-blue-500" },
  preparing: { label: "Preparing", variant: "warning", color: "border-l-amber-500" },
  ready: { label: "Ready", variant: "success", color: "border-l-green-500" },
}

const itemStatusColors: Record<string, string> = {
  new: "border-blue-500 text-blue-500",
  preparing: "border-amber-500 text-amber-500",
  ready: "border-green-500 text-green-500",
}

export default function StaffHomePage() {
  const orders = useOrderStore((s) => s.orders)
  const notifications = useNotificationStore((s) => s.notifications)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayOrdersCount, setTodayOrdersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  useRealtimeSync()

  const activeOrders = orders.filter((o: any) =>
    ["confirmed", "preparing", "ready"].includes(o.status)
  ).slice(0, 10)
  const notificationCount = notifications.filter(
    (n) => !(n as any).readBy?.length
  ).length
  const pendingBills = orders.filter((o: any) => !o.isPaid && o.status !== "cancelled")

  useEffect(() => {
    async function load() {
      try {
        const revenueRes = await fetch("/api/reports/dashboard")
        if (revenueRes.ok) {
          const data = await revenueRes.json()
          setTodayRevenue(data.todayRevenue || 0)
          setTodayOrdersCount(data.todayOrders || 0)
        }
      } catch {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Dashboard</h1>
        <p className="text-muted-foreground">Live overview of orders and operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                  <span className="text-xs text-muted-foreground">in progress</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <Bell className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{notificationCount}</p>
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="rounded-full px-1.5 py-0 text-[10px]"
                    >
                      NEW
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/20">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{todayOrdersCount}</p>
                  <span className="text-xs text-muted-foreground">
                    {pendingBills.length} pending
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Active Orders</h2>
            <Badge variant="secondary" className="rounded-full">
              {activeOrders.length}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Clock className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-muted-foreground">No Active Orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                New orders will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order: any) => {
                const cfg = statusConfig[order.status] || statusConfig.confirmed
                return (
                  <Card
                    key={order._id}
                    className={cn("border-l-4", cfg.color)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">
                              {order.orderNumber}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              • Table {order.tableId?.number || "—"}
                            </span>
                          </div>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>

                      <div className="space-y-1.5">
                        {order.items.map((item: any) => (
                          <div
                            key={item._id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>
                              <span className="text-muted-foreground mr-2">
                                {item.quantity}x
                              </span>
                              {item.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium",
                                itemStatusColors[item.status] ||
                                  "border-gray-300 text-gray-500"
                              )}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(order.createdAt)}
                        </span>
                        <span className="font-bold text-base">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
