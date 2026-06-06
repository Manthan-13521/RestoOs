"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatTime } from "@/lib/utils"
import { Clock, AlertCircle, ChefHat, Timer, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"

const columns = [
  {
    key: "new",
    label: "New",
    icon: ChefHat,
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
    border: "border-l-blue-500",
    nextLabel: "Start",
    nextStatus: "preparing",
    nextVariant: "default" as const,
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: Timer,
    color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-l-yellow-500",
    nextLabel: "Done",
    nextStatus: "ready",
    nextVariant: "success" as const,
  },
  {
    key: "ready",
    label: "Ready",
    icon: CheckCircle2,
    color: "border-green-500 bg-green-50 dark:bg-green-950/20",
    border: "border-l-green-500",
    nextLabel: "Serve",
    nextStatus: "served",
    nextVariant: "outline" as const,
  },
  {
    key: "served",
    label: "Served",
    icon: CheckCircle2,
    color: "border-gray-300 bg-gray-50 dark:bg-gray-950/20",
    border: "border-l-gray-400",
    nextLabel: "",
    nextStatus: "",
    nextVariant: "outline" as const,
  },
]

function elapsedMinutes(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 60000)
}

export default function KitchenPage() {
  const [loaded, setLoaded] = useState(false)
  const allOrders = useOrderStore((s) => s.orders)
  const [now, setNow] = useState(Date.now())
  useRealtimeSync()

  const orders = allOrders.filter(
    (o: any) =>
      o.status !== "completed" &&
      o.status !== "cancelled" &&
      o.items?.some((i: any) => i.status !== "cancelled")
  )

  useEffect(() => {
    if (!loaded && (allOrders.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 1000)
      return () => clearTimeout(t)
    }
  }, [allOrders, loaded])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const loading = !loaded

  async function updateItemStatus(
    orderId: string,
    itemId: string,
    newStatus: string
  ) {
    try {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status: newStatus }),
      })
      if (res.ok) toast.success("Item moved")
    } catch {
      toast.error("Failed to update item")
    }
  }

  const getColumnOrders = (status: string) =>
    orders
      .filter((o) => o.items.some((i: any) => i.status === status))
      .map((o) => ({
        ...o,
        items: o.items.filter((i: any) => i.status === status),
      }))

  if (loading)
    return (
      <div className="flex gap-4 p-6 h-full animate-fade-in">
        {columns.map((col) => (
          <div key={col.key} className="flex-1 min-w-[260px] space-y-4">
            <Skeleton className="h-10 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    )

  return (
    <div className="flex gap-4 p-4 lg:p-6 h-full overflow-x-auto animate-fade-in">
      {columns.map((column) => {
        const columnOrders = getColumnOrders(column.key)
        const ColumnIcon = column.icon
        const totalItems = columnOrders.reduce(
          (sum, o) => sum + o.items.length,
          0
        )

        return (
          <div
            key={column.key}
            className="flex-1 min-w-[280px] max-w-[420px] flex flex-col"
          >
            {/* Column Header */}
            <div
              className={cn(
                "flex items-center justify-between rounded-t-xl border-b-2 px-4 py-3 mb-3",
                column.color
              )}
            >
              <div className="flex items-center gap-2">
                <ColumnIcon className="h-5 w-5" />
                <h2 className="font-bold text-base">{column.label}</h2>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm font-semibold",
                  column.key === "new" &&
                    "border-blue-500 text-blue-600 dark:text-blue-400",
                  column.key === "preparing" &&
                    "border-yellow-500 text-yellow-600 dark:text-yellow-400",
                  column.key === "ready" &&
                    "border-green-500 text-green-600 dark:text-green-400",
                  column.key === "served" &&
                    "border-gray-400 text-gray-500"
                )}
              >
                {totalItems}
              </Badge>
            </div>

            {/* Cards */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {columnOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No items</p>
                </div>
              ) : (
                columnOrders.map((order: any) => {
                  const mins = elapsedMinutes(order.createdAt)
                  return (
                    <Card
                      key={order._id}
                      className={cn("border-l-4 animate-slide-up", column.border)}
                    >
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • Table {order.tableId?.number || "—"}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-xs flex items-center gap-1 font-medium",
                              mins > 15
                                ? "text-red-500"
                                : mins > 10
                                ? "text-amber-500"
                                : "text-muted-foreground"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {mins}m
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {order.items.map((item: any) => (
                            <div
                              key={item._id}
                              className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-sm truncate">
                                    {item.name}
                                  </span>
                                  {item.instructions && (
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  )}
                                </div>
                                {item.instructions && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic truncate">
                                    {item.instructions}
                                  </p>
                                )}
                              </div>
                              {column.key !== "served" && (
                                <Button
                                  size="sm"
                                  variant={column.nextVariant}
                                  className="ml-2 shrink-0 h-8"
                                  onClick={() =>
                                    updateItemStatus(
                                      order._id,
                                      item._id,
                                      column.nextStatus
                                    )
                                  }
                                >
                                  {column.nextLabel}
                                </Button>
                              )}
                              {column.key === "served" && (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-300 text-xs"
                                >
                                  ✓
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Order notes */}
                        {order.notes && (
                          <p className="mt-2 text-xs text-muted-foreground italic flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{order.notes}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
