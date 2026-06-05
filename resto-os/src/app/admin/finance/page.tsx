"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { IndianRupee, TrendingUp, Percent, Receipt } from "lucide-react"
import toast from "react-hot-toast"

interface FinanceReport { totalRevenue: number; totalTax: number; averageOrder: number; paymentMethods: Record<string, number>; recentBills: any[]; gstCollected: number }

export default function AdminFinancePage() {
  const [report, setReport] = useState<FinanceReport | null>(null); const [loading, setLoading] = useState(true)

  async function loadReport() {
    try { const res = await fetch("/api/reports/finance"); const data = await res.json(); if (res.ok) setReport(data) } catch { toast.error("Failed to load report") } finally { setLoading(false) }
  }

  useEffect(() => { loadReport() }, [])

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid gap-4 md:grid-cols-4">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /></div>

  if (!report) return <div className="text-center py-12 text-muted-foreground">Failed to load finance data</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold tracking-tight">Finance</h1><p className="text-muted-foreground">Revenue, taxes, and transactions</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><Percent className="h-5 w-5 text-info" /></div><div><p className="text-sm text-muted-foreground">GST Collected</p><p className="text-2xl font-bold">{formatCurrency(report.gstCollected)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Avg. Order</p><p className="text-2xl font-bold">{formatCurrency(report.averageOrder)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Receipt className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Total Tax</p><p className="text-2xl font-bold">{formatCurrency(report.totalTax)}</p></div></div></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(report.paymentMethods || {}).length === 0 ? <p className="text-muted-foreground text-sm">No payment data</p> : Object.entries(report.paymentMethods).map(([method, amount]) => (
          <div key={method} className="flex items-center justify-between"><span className="capitalize text-sm">{method}</span><span className="font-medium">{formatCurrency(amount as number)}</span></div>
        ))}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Bill #</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{report.recentBills.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No transactions yet</TableCell></TableRow> : report.recentBills.map((b: any) => (
            <TableRow key={b._id}><TableCell>{b.billNumber}</TableCell><TableCell>{formatCurrency(b.total)}</TableCell><TableCell><Badge variant={b.status === "paid" ? "success" : b.status === "partial" ? "warning" : "secondary"}>{b.status}</Badge></TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>
      </div>
    </div>
  )
}
