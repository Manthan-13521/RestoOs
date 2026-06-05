"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { IndianRupee, TrendingUp, Users, ShoppingCart, Receipt } from "lucide-react"
import toast from "react-hot-toast"

interface DashboardReport {
  totalRevenue: number
  totalOrders: number
  activeTables: number
  averageOrderValue: number
  todayOrders: number
  todayRevenue: number
  recentOrders: any[]
  salesTrend: { date: string; revenue: number; orders: number }[]
}

export default function AdminDashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadReport() }, [])

  async function loadReport() {
    try { const res = await fetch("/api/reports/dashboard"); const data = await res.json(); if (res.ok) setReport(data) } catch { toast.error("Failed to load dashboard") } finally { setLoading(false) }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid gap-4 md:grid-cols-4">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /></div>

  if (!report) return <div className="text-center py-12 text-muted-foreground">Failed to load dashboard data</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="text-muted-foreground">Restaurant overview and key metrics</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Today Revenue</p><p className="text-2xl font-bold">{formatCurrency(report.todayRevenue)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-info" /></div><div><p className="text-sm text-muted-foreground">Today Orders</p><p className="text-2xl font-bold">{report.todayOrders}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Users className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Active Tables</p><p className="text-2xl font-bold">{report.activeTables}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Avg. Order</p><p className="text-2xl font-bold">{formatCurrency(report.averageOrderValue)}</p></div></div></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Sales Trend</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">{(report.salesTrend || []).length === 0 ? <p className="text-muted-foreground text-sm">No data yet</p> : report.salesTrend.map((day, i) => (
            <div key={i} className="flex items-center justify-between text-sm"><span className="text-muted-foreground w-24">{day.date}</span><div className="flex-1 h-4 bg-muted rounded-full mx-3 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (day.revenue / Math.max(...report.salesTrend.map(d => d.revenue)) * 100))}%` }} /></div><span className="font-medium w-20 text-right">{formatCurrency(day.revenue)}</span></div>
          ))}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Table</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{report.recentOrders.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No recent orders</TableCell></TableRow> : report.recentOrders.map((o: any) => (
            <TableRow key={o._id}><TableCell className="font-medium">{o.orderNumber}</TableCell><TableCell>{o.tableId ? `Table ${o.tableId.number || ""}` : "—"}</TableCell><TableCell>{formatCurrency(o.total)}</TableCell><TableCell><Badge variant={o.status === "completed" || o.status === "served" ? "success" : o.status === "preparing" ? "warning" : "info"}>{o.status}</Badge></TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>
      </div>
    </div>
  )
}
