"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, CookingPot, UtensilsCrossed, ChevronRight, Bell, GlassWater, FileText } from "lucide-react"
import toast from "react-hot-toast"

interface OrderData { _id: string; orderNumber: string; items: { _id: string; name: string; quantity: number; price: number; status: string; instructions?: string }[]; status: string; total: number; createdAt: string }

const statusSteps = [
  { key: "confirmed", label: "Order Received", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: CookingPot },
  { key: "ready", label: "Ready", icon: UtensilsCrossed },
  { key: "served", label: "Served", icon: CheckCircle2 },
]

export default function OrderTrackerPage() {
  const params = useParams(); const router = useRouter()
  const { tableId, id } = params as { tableId: string; id: string }
  const [order, setOrder] = useState<OrderData | null>(null); const [loading, setLoading] = useState(true); const [elapsed, setElapsed] = useState(0)

  async function loadOrder() {
    try {       const res = await fetch(`/api/public/orders/${id}?tableId=${tableId}`); const data = await res.json(); if (res.ok) { setOrder(data); if (data.status === "served" || data.status === "completed") setTimeout(() => router.push(`/menu/${tableId}/feedback`), 5000) } } catch { toast.error("Failed to load order") } finally { setLoading(false) }
  }

  useEffect(() => { loadOrder(); const i = setInterval(loadOrder, 5000); return () => clearInterval(i) }, [id])
  useEffect(() => { if (order) { const t = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)), 1000); return () => clearInterval(t) } }, [order])

  function formatElapsed(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}` }
  async function callWaiter(type: string) {
    try {
      const res = await fetch("/api/public/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, message: `Customer needs: ${type}` }),
      })
      if (res.ok) toast.success(`${type} request sent!`)
      else toast.error("Failed to send request")
    } catch { toast.error("Failed to send request") }
  }

  if (loading) return <div className="min-h-screen bg-background p-4 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>

  if (!order) return <div className="min-h-screen flex items-center justify-center p-4"><div className="text-center"><p className="text-muted-foreground">Order not found</p><Button className="mt-4" onClick={() => router.push(`/menu/${tableId}`)}>Back to Menu</Button></div></div>

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status)
  const isComplete = order.status === "served" || order.status === "completed"

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3"><div className={cn("h-20 w-20 rounded-full flex items-center justify-center", isComplete ? "bg-success/10" : "bg-primary/10 animate-pulse")}>{isComplete ? <CheckCircle2 className="h-10 w-10 text-success" /> : <CookingPot className="h-10 w-10 text-primary" />}</div></div>
        <h1 className="text-xl font-bold">{isComplete ? "Order Served!" : "Order Placed!"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{order.orderNumber} • Table #{tableId}</p>
        {!isComplete && <><div className="flex items-center justify-center gap-2 mt-3"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-lg font-mono font-bold text-primary">{formatElapsed(elapsed)}</span></div><p className="text-sm text-muted-foreground mt-1">Est. {Math.max(1, 12 - Math.floor(elapsed / 60))} min remaining</p></>}
      </div>
      <Card className="mb-4"><CardContent className="p-6"><div className="space-y-4">{statusSteps.map((step, index) => { const isActive = index <= currentStepIndex; const isCurrent = index === currentStepIndex; const Icon = step.icon; return <div key={step.key} className="flex items-center gap-4"><div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all", isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground", isCurrent && "ring-4 ring-primary/20")}><Icon className="h-5 w-5" /></div><div><p className={cn("font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>{isCurrent && !isComplete && <p className="text-sm text-primary">In progress...</p>}</div>{index < statusSteps.length - 1 && <ChevronRight className={cn("h-4 w-4 ml-auto", isActive ? "text-primary" : "text-muted-foreground")} />}</div> })}</div></CardContent></Card>
      <Card className="mb-4"><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Items</h2>{order.items.map(item => <div key={item._id} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-muted-foreground">{item.quantity}x</span><span>{item.name}</span></div><Badge variant="outline" className={cn(item.status === "new" && "border-blue-500 text-blue-500", item.status === "preparing" && "border-yellow-500 text-yellow-500", item.status === "ready" && "border-green-500 text-green-500", item.status === "served" && "border-gray-500 text-gray-500")}>{item.status}</Badge></div>)}<div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.total)}</span></div></CardContent></Card>
      {!isComplete && <Card className="mb-4"><CardContent className="p-4"><h2 className="font-semibold mb-3">Need Something?</h2><div className="grid grid-cols-3 gap-2"><Button variant="outline" className="flex-col h-20 gap-1" onClick={() => callWaiter("Water")}><GlassWater className="h-5 w-5" /><span className="text-xs">Water</span></Button><Button variant="outline" className="flex-col h-20 gap-1" onClick={() => callWaiter("Bill")}><FileText className="h-5 w-5" /><span className="text-xs">Bill</span></Button><Button variant="outline" className="flex-col h-20 gap-1" onClick={() => callWaiter("Staff")}><Bell className="h-5 w-5" /><span className="text-xs">Staff</span></Button></div></CardContent></Card>}
      <Button variant="outline" className="w-full" onClick={() => router.push(`/menu/${tableId}`)}>Order More</Button>
    </div>
  )
}
