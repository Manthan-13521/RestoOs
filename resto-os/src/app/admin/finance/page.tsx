"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import {
  IndianRupee,
  TrendingUp,
  Percent,
  Receipt,
  Banknote,
  CreditCard,
  Smartphone,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

interface FinanceReport {
  totalRevenue: number
  totalTax: number
  averageOrder: number
  paymentMethods: Record<string, number>
  recentBills: any[]
  gstCollected: number
}

const paymentIcons: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
  online: CreditCard,
}

export default function AdminFinancePage() {
  const [report, setReport] = useState<FinanceReport | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadReport() {
    try {
      const res = await fetch("/api/reports/finance")
      const data = await res.json()
      if (res.ok) setReport(data)
    } catch {
      toast.error("Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )

  if (!report)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <IndianRupee className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Failed to load finance data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
        <Button onClick={loadReport} className="mt-4">
          Retry
        </Button>
      </div>
    )

  const paymentEntries = Object.entries(report.paymentMethods || {})
  const maxPayment = paymentEntries.length
    ? Math.max(...paymentEntries.map(([, v]) => v as number))
    : 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">Revenue, taxes, and transaction overview</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">GST Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(report.gstCollected)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(report.averageOrder)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <Receipt className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tax Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(report.totalTax)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Methods */}
        <Card>
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Payment Methods</h2>
          </div>
          <CardContent className="p-5">
            {paymentEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No payment data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentEntries.map(([method, amount]) => {
                  const Icon = paymentIcons[method] || Banknote
                  const pct = (amount as number) / report.totalRevenue * 100
                  return (
                    <div key={method} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            {formatCurrency(amount as number)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({pct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
                          style={{ width: `${Math.max(1, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Badge variant="secondary" className="rounded-full text-xs">
                {report.recentBills?.length || 0} bills
              </Badge>
            </div>
          </div>
          <CardContent className="p-0">
            {(report.recentBills || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Bill #</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.recentBills.map((b: any, idx: number) => (
                      <TableRow
                        key={b._id}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          idx % 2 === 0 && "bg-muted/10"
                        )}
                      >
                        <TableCell className="font-mono text-sm">{b.billNumber}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(b.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === "paid"
                                ? "success"
                                : b.status === "partial"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {b.status}
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
