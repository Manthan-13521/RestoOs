"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"

export default function StaffOrdersPage() {
  const [viewOrder, setViewOrder] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  useRealtimeSync()

  const allOrders = useOrderStore(s => s.orders)

  useEffect(() => {
    if (!loaded && (allOrders.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [allOrders, loaded])

  const loading = !loaded

  const orders = allOrders.filter((o: any) => o.status !== "completed" && o.status !== "cancelled")

  const activeOrders = orders.filter((o: any) => o.status !== "ready" && o.status !== "served")
  const readyOrders = orders.filter((o: any) => o.status === "ready" || o.status === "served")

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold tracking-tight">Orders</h1><p className="text-muted-foreground">Track and manage orders</p></div>
      <Tabs defaultValue="active"><TabsList><TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger><TabsTrigger value="ready">Ready ({readyOrders.length})</TabsTrigger></TabsList>
        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{activeOrders.length === 0 ? <div className="col-span-full text-center py-12 text-muted-foreground">No active orders</div> : activeOrders.map(order => (
            <Card key={order._id} className="border-l-4 border-l-primary"><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2"><div><span className="font-bold">{order.orderNumber}</span><span className="ml-2 text-sm text-muted-foreground">• Table {order.tableId?.number || "—"}</span></div><Badge variant={order.status === "preparing" ? "warning" : order.status === "confirmed" ? "info" : "default"}>{order.status}</Badge></div>
              <div className="space-y-1 text-sm">{order.items.map(item => <div key={item._id} className="flex justify-between"><span>{item.quantity}x {item.name}</span><Badge variant="outline" className={cn("text-xs", item.status === "new" && "border-blue-500 text-blue-500", item.status === "preparing" && "border-yellow-500 text-yellow-500", item.status === "ready" && "border-green-500 text-green-500")}>{item.status}</Badge></div>)}</div>
              {order.notes && <p className="mt-2 text-sm text-muted-foreground italic">Note: {order.notes}</p>}
              <div className="mt-3 flex items-center justify-between"><span className="text-sm text-muted-foreground">{formatTime(order.createdAt)}</span><span className="font-bold">{formatCurrency(order.total)}</span></div>
              <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="flex-1" onClick={() => setViewOrder(order)}>View</Button>{order.status === "ready" && <Button size="sm" className="flex-1" onClick={async () => { await fetch(`/api/orders/${order._id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({status: "served"}) }); toast.success("Marked as served") }}>Serve</Button>}</div>
            </CardContent></Card>
          ))}</div>
        </TabsContent>
        <TabsContent value="ready" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{readyOrders.length === 0 ? <div className="col-span-full text-center py-12 text-muted-foreground">No ready orders</div> : readyOrders.map(order => (
            <Card key={order._id} className="border-l-4 border-l-success"><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2"><div><span className="font-bold">{order.orderNumber}</span><span className="ml-2 text-sm text-muted-foreground">• Table {order.tableId?.number || "—"}</span></div><Badge variant="success">Ready</Badge></div>
              <div className="space-y-1 text-sm">{order.items.map(item => <div key={item._id} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span className="text-success">✓</span></div>)}</div>
              <Button className="w-full mt-3" size="sm" onClick={async () => { await fetch(`/api/orders/${order._id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({status: "served"}) }); toast.success("Marked as served") }}>Mark as Served</Button>
            </CardContent></Card>
          ))}</div>
        </TabsContent>
      </Tabs>
      <Dialog open={!!viewOrder} onOpenChange={o => !o && setViewOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order {viewOrder?.orderNumber}</DialogTitle></DialogHeader>
          {viewOrder && <div className="space-y-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Table</span><span>{viewOrder.tableId?.number || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge>{viewOrder.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{viewOrder.items.length}</span></div>
            <div className="space-y-2">{viewOrder.items.map((item: any) => (
              <div key={item._id} className="flex justify-between text-sm border-b pb-1">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
              </div>
            ))}</div>
            {viewOrder.notes && <p className="text-sm italic">Note: {viewOrder.notes}</p>}
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(viewOrder.total)}</span></div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
