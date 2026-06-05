"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, formatTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Clock, Bell, UtensilsCrossed } from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"
import { useNotificationStore } from "@/store/notification-store"

export default function StaffHomePage() {
  const orders = useOrderStore(s => s.orders)
  const notifications = useNotificationStore(s => s.notifications)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  useRealtimeSync()

  const recentOrders = orders.filter(o => ["confirmed", "preparing", "ready"].includes(o.status)).slice(0, 10)
  const notificationCount = notifications.filter(n => !(n as any).readBy?.length).length

  useEffect(() => {
    async function load() {
      try {
        const revenueRes = await fetch("/api/reports/dashboard")
        if (revenueRes.ok) { const data = await revenueRes.json(); setTodayRevenue(data.todayRevenue || 0) }
      } catch { toast.error("Failed to load data") } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid gap-4 md:grid-cols-3">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold tracking-tight">Staff Dashboard</h1><p className="text-muted-foreground">Manage orders and tables</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><Clock className="h-5 w-5 text-info" /></div><div><p className="text-sm text-muted-foreground">Active Orders</p><p className="text-2xl font-bold">{recentOrders.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Bell className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Notifications</p><p className="text-2xl font-bold">{notificationCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><UtensilsCrossed className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Today's Revenue</p><p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p></div></div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Active Orders</CardTitle></CardHeader><CardContent><ScrollArea className="h-[500px]"><div className="space-y-3">{recentOrders.length === 0 ? <div className="text-center py-12 text-muted-foreground">No active orders</div> : recentOrders.map(order => (
        <Card key={order._id} className="border-l-4 border-l-primary"><CardContent className="p-4">
          <div className="flex items-center justify-between mb-2"><div><span className="font-bold">{order.orderNumber}</span><span className="ml-2 text-sm text-muted-foreground">• Table {order.tableId?.number || "—"}</span></div><Badge variant={order.status === "preparing" ? "warning" : "info"}>{order.status}</Badge></div>
          <div className="space-y-1">{order.items.map(item => <div key={item._id} className="flex items-center justify-between text-sm"><span><span className="text-muted-foreground mr-2">{item.quantity}x</span>{item.name}</span><Badge variant="outline" className={cn("text-xs", item.status === "new" && "border-blue-500 text-blue-500", item.status === "preparing" && "border-yellow-500 text-yellow-500", item.status === "ready" && "border-green-500 text-green-500")}>{item.status}</Badge></div>)}</div>
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground"><span>{formatTime(order.createdAt)}</span><span className="font-medium text-foreground">{formatCurrency(order.total)}</span></div>
        </CardContent></Card>
      ))}</div></ScrollArea></CardContent></Card>
    </div>
  )
}
