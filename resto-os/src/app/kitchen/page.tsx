"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatTime } from "@/lib/utils"
import { Clock, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"

const columns = [
  { key: "new", label: "New", color: "border-blue-500 bg-blue-50 dark:bg-blue-950/20" },
  { key: "preparing", label: "Preparing", color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" },
  { key: "ready", label: "Ready", color: "border-green-500 bg-green-50 dark:bg-green-950/20" },
  { key: "served", label: "Served", color: "border-gray-300 bg-gray-50 dark:bg-gray-950/20" },
]

export default function KitchenPage() {
  const [loaded, setLoaded] = useState(false)
  const allOrders = useOrderStore(s => s.orders)
  useRealtimeSync()

  const orders = allOrders.filter((o: any) => o.status !== "completed" && o.status !== "cancelled" && o.items?.some((i: any) => i.status !== "cancelled"))

  useEffect(() => {
    if (!loaded && (allOrders.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [allOrders, loaded])

  const loading = !loaded

  async function updateItemStatus(orderId: string, itemId: string, newStatus: string) {
    try { const res = await fetch(`/api/orders/${orderId}/items`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ itemId, status: newStatus }) }); if (res.ok) { toast.success(`Item moved`) } } catch { toast.error("Failed to update item") }
  }

  const getColumnOrders = (status: string) => orders.filter(o => o.items.some(i => i.status === status)).map(o => ({...o, items: o.items.filter(i => i.status === status)}))

  if (loading) return <div className="flex gap-4 p-6 h-full">{columns.map(col => <div key={col.key} className="flex-1 space-y-4"><Skeleton className="h-10 w-32" />{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>)}</div>

  return (
    <div className="flex gap-4 p-4 lg:p-6 h-full overflow-x-auto animate-fade-in">
      {columns.map(column => {
        const columnOrders = getColumnOrders(column.key)
        return (
          <div key={column.key} className="flex-1 min-w-[280px] max-w-[400px]">
            <div className={cn("flex items-center justify-between rounded-t-lg border-b-2 px-4 py-3 mb-3", column.color)}>
              <h2 className="font-bold text-lg">{column.label}</h2>
              <Badge variant="outline" className="text-sm">{columnOrders.reduce((sum, o) => sum + o.items.length, 0)}</Badge>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
              {columnOrders.length === 0 ? <div className="text-center py-12 text-muted-foreground text-sm">No items</div> : columnOrders.map(order => (
                <Card key={order._id} className={cn("animate-slide-up border-l-4", column.key === "new" && "border-l-blue-500", column.key === "preparing" && "border-l-yellow-500", column.key === "ready" && "border-l-green-500", column.key === "served" && "border-l-gray-400")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2"><div><span className="font-bold text-sm">{order.orderNumber}</span><span className="ml-2 text-xs text-muted-foreground">• Table {order.tableId?.number || "—"}</span></div><span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(order.createdAt)}</span></div>
                    <div className="space-y-2">{order.items.map(item => (
                      <div key={item._id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm">{item.quantity}x</span><span className="font-medium text-sm truncate">{item.name}</span>{item.instructions && <AlertCircle className="h-3 w-3 text-warning shrink-0" />}</div>{item.instructions && <p className="text-xs text-warning mt-1 italic">{item.instructions}</p>}</div>
                        {column.key !== "served" && <Button size="sm" variant={column.key === "new" ? "default" : column.key === "preparing" ? "success" : "outline"} className="ml-2 shrink-0" onClick={() => updateItemStatus(order._id, item._id, column.key === "new" ? "preparing" : column.key === "preparing" ? "ready" : "served")}>{column.key === "new" ? "Start" : column.key === "preparing" ? "Done" : "Serve"}</Button>}
                      </div>
                    ))}</div>
                    {order.notes && <p className="mt-2 text-xs text-muted-foreground italic">Note: {order.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
