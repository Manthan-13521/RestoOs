"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, ShoppingBag, CheckCircle2, AlertCircle, Eye } from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"

const statusConfig: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "default"; border: string }
> = {
  confirmed: { label: "Confirmed", variant: "info", border: "border-l-blue-500" },
  preparing: { label: "Preparing", variant: "warning", border: "border-l-amber-500" },
  ready: { label: "Ready", variant: "success", border: "border-l-green-500" },
  served: { label: "Served", variant: "default", border: "border-l-gray-400" },
}

const itemStatusColors: Record<string, string> = {
  new: "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  preparing: "border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-950/20",
  ready: "border-green-500 text-green-500 bg-green-50 dark:bg-green-950/20",
}

export default function StaffOrdersPage() {
  const [viewOrder, setViewOrder] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  useRealtimeSync()

  const allOrders = useOrderStore((s) => s.orders)

  useEffect(() => {
    if (!loaded && (allOrders.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [allOrders, loaded])

  const loading = !loaded

  const orders = allOrders.filter(
    (o: any) => o.status !== "completed" && o.status !== "cancelled"
  )

  const activeOrders = orders.filter(
    (o: any) => o.status !== "ready" && o.status !== "served"
  )
  const readyOrders = orders.filter(
    (o: any) => o.status === "ready" || o.status === "served"
  )

  async function markAsServed(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "served" }),
      })
      if (res.ok) toast.success("Marked as served")
    } catch {
      toast.error("Failed to update")
    }
  }

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <Skeleton className="h-12 w-80 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Track and manage active orders</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="h-11">
          <TabsTrigger value="active" className="text-sm relative">
            Active
            {activeOrders.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 rounded-full px-1.5 py-0 text-[10px]"
              >
                {activeOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="text-sm relative">
            Ready to Serve
            {readyOrders.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 rounded-full px-1.5 py-0 text-[10px]"
              >
                {readyOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No Active Orders
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  New orders from customers will appear here.
                </p>
              </div>
            ) : (
              activeOrders.map((order: any) => {
                const cfg = statusConfig[order.status] || statusConfig.confirmed
                return (
                  <Card
                    key={order._id}
                    className={cn("border-l-4", cfg.border)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">
                            {order.orderNumber}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • Table {order.tableId?.number || "—"}
                          </span>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        {order.items.map((item: any) => (
                          <div
                            key={item._id}
                            className="flex justify-between items-center py-1"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium",
                                itemStatusColors[item.status]
                                  ? `${itemStatusColors[item.status]} border-current`
                                  : ""
                              )}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="italic">{order.notes}</span>
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(order.createdAt)}
                        </span>
                        <span className="font-bold">{formatCurrency(order.total)}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setViewOrder(order)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          View
                        </Button>
                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => markAsServed(order._id)}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Serve
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="ready" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {readyOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No Ready Orders
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Orders ready for pickup will appear here.
                </p>
              </div>
            ) : (
              readyOrders.map((order: any) => (
                <Card
                  key={order._id}
                  className="border-l-4 border-l-green-500"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">
                          {order.orderNumber}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • Table {order.tableId?.number || "—"}
                        </span>
                      </div>
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ready
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      {order.items.map((item: any) => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center py-0.5"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-green-600 font-medium text-xs">
                            ✓ Ready
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full mt-4"
                      size="sm"
                      onClick={() => markAsServed(order._id)}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Mark as Served
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Order {viewOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Table</p>
                  <p className="font-medium">
                    {viewOrder.tableId?.number
                      ? `Table ${viewOrder.tableId.number}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      statusConfig[viewOrder.status]?.variant || "default"
                    }
                    className="mt-0.5"
                  >
                    {statusConfig[viewOrder.status]?.label || viewOrder.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items.map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="text-muted-foreground mr-2">
                          {item.quantity}x
                        </span>
                        {item.name}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {viewOrder.notes && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-2 text-sm">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    Note:{" "}
                  </span>
                  <span className="text-muted-foreground italic">
                    {viewOrder.notes}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(viewOrder.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
