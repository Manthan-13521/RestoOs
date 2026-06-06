"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import {
  IndianRupee,
  TrendingUp,
  Users,
  ShoppingCart,
  Receipt,
  TrendingDown,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

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

const statusConfig: Record<string, "success" | "warning" | "info" | "default"> = {
  completed: "success",
  served: "success",
  preparing: "warning",
  confirmed: "info",
  ready: "success",
  cancelled: "default",
}

export default function AdminDashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      const res = await fetch("/api/reports/dashboard")
      const data = await res.json()
      if (res.ok) setReport(data)
    } catch {
      toast.error("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )

  if (!report)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <TrendingDown className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
        <Button onClick={loadReport} className="mt-4">
          Retry
        </Button>
      </div>
    )

  const maxRevenue = report.salesTrend?.length
    ? Math.max(...report.salesTrend.map((d) => d.revenue))
    : 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Restaurant overview — {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/20">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(report.todayRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{report.todayOrders}</p>
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0">
                    +{report.totalOrders > 0 ? Math.round((report.todayOrders / report.totalOrders) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tables</p>
                <p className="text-2xl font-bold">{report.activeTables}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(report.averageOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Trend */}
        <Card>
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Sales Trend</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              7 days
            </Badge>
          </div>
          <CardContent className="p-5">
            {(report.salesTrend || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.salesTrend.map((day, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-muted-foreground shrink-0">
                      {day.date}
                    </span>
                    <div className="flex-1">
                      <div className="relative h-5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                          style={{
                            width: `${Math.max(3, (day.revenue / maxRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right shrink-0">
                      <span className="text-sm font-semibold">
                        {formatCurrency(day.revenue)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({day.orders})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent Orders</h2>
            </div>
            <Badge variant="secondary" className="rounded-full text-xs">
              {report.recentOrders?.length || 0} orders
            </Badge>
          </div>
          <CardContent className="p-0">
            {(report.recentOrders || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No orders yet today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Order</TableHead>
                      <TableHead className="font-semibold">Table</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.recentOrders.map((o: any, idx: number) => (
                      <TableRow
                        key={o._id}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          idx % 2 === 0 && "bg-muted/10"
                        )}
                      >
                        <TableCell className="font-medium">{o.orderNumber}</TableCell>
                        <TableCell>
                          {o.tableId ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              T{o.tableId.number || ""}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(o.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig[o.status] || "default"}
                            className="capitalize"
                          >
                            {o.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
