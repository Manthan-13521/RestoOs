"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn, formatCurrency } from "@/lib/utils"
import { AlertTriangle, Loader2, DoorOpen, Receipt, RotateCcw } from "lucide-react"
import toast from "react-hot-toast"

interface TableData { _id: string; number: number; name: string; status: string; currentOrderId?: string; section: string }
interface BillData { _id: string; billNumber: string; total: number; paidAmount: number; status: string; createdAt: string }

export default function AdminEmergencyPage() {
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<TableData[]>([])
  const [bills, setBills] = useState<BillData[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [forceTable, setForceTable] = useState<TableData | null>(null)
  const [correctionBill, setCorrectionBill] = useState<BillData | null>(null)
  const [newTotal, setNewTotal] = useState("")
  const [refundBill, setRefundBill] = useState<BillData | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [tablesRes, billsRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/bills?page=1&limit=20"),
      ])
      if (tablesRes.ok) setTables(await tablesRes.json())
      if (billsRes.ok) {
        const d = await billsRes.json()
        setBills(d.data || d)
      }
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  async function forceClose() {
    if (!forceTable) return
    setActionLoading("force")
    try {
      if (forceTable.currentOrderId) {
        await fetch(`/api/orders/${forceTable.currentOrderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        })
      }
      const res = await fetch(`/api/tables/${forceTable._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "empty", currentOrderId: null }),
      })
      if (res.ok) {
        toast.success(`Table ${forceTable.number} force closed`)
        setForceTable(null)
        load()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to close table")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  async function correctBill() {
    if (!correctionBill || !newTotal) return
    setActionLoading("bill")
    try {
      const amount = Number(newTotal)
      if (amount <= 0) { toast.error("Invalid amount"); return }
      const res = await fetch(`/api/bills/${correctionBill._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: amount,
          paidAmount: Math.min(amount, correctionBill.paidAmount),
          remainingAmount: Math.max(0, amount - correctionBill.paidAmount),
        }),
      })
      if (res.ok) {
        toast.success("Bill corrected")
        setCorrectionBill(null)
        setNewTotal("")
        load()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to correct bill")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  async function processRefund() {
    if (!refundBill) return
    setActionLoading("refund")
    try {
      const res = await fetch(`/api/bills/${refundBill._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: [{ method: "cash", amount: -refundBill.paidAmount, status: "refunded", reference: `refund-${Date.now()}` }],
          paidAmount: 0,
          remainingAmount: refundBill.total,
          status: "pending",
        }),
      })
      if (res.ok) {
        toast.success(`Refunded ${formatCurrency(refundBill.paidAmount)}`)
        setRefundBill(null)
        load()
      } else {
        const err = await res.json()
        toast.error(err.error || "Refund failed")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  const activeTables = tables.filter(t => t.status === "occupied" || t.status === "billing_pending")
  const unpaidBills = bills.filter(b => b.status !== "paid" && b.paidAmount > 0)
  const recentRefunds = bills.filter(b => b.paidAmount > 0)

  const statusBadgeVariant: Record<string, "default" | "secondary" | "warning" | "destructive" | "outline" | "success"> = {
    empty: "secondary",
    occupied: "default",
    billing_pending: "warning",
  }

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-56 mt-2" />
      <div className="grid gap-6 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency</h1>
          <p className="text-muted-foreground">Force close tables, correct bills, and manage refunds</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20">
                <DoorOpen className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Tables</p>
                <p className="text-xl font-bold">{activeTables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unpaid Bills</p>
                <p className="text-xl font-bold">{unpaidBills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <RotateCcw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recent Refunds</p>
                <p className="text-xl font-bold">{recentRefunds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DoorOpen className="h-5 w-5 text-destructive" />Force Close Table</CardTitle>
            <CardDescription>{activeTables.length} active table{activeTables.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <DoorOpen className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No active tables</p>
              </div>
            ) : activeTables.map(t => (
              <div key={t._id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <span className="font-medium">Table {t.number}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({t.name})</span>
                  <Badge variant="outline" className="ml-2">{t.status}</Badge>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setForceTable(t)}>Force Close</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-amber-600" />Bill Correction</CardTitle>
            <CardDescription>Adjust bill totals if needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No bills found</p>
              </div>
            ) : bills.slice(0, 5).map(b => (
              <div key={b._id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div>
                  <span className="font-medium">{b.billNumber}</span>
                  <span className="ml-2 text-muted-foreground">{formatCurrency(b.total)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setCorrectionBill(b); setNewTotal(String(b.total)) }}>Correct</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-blue-600" />Refunds</CardTitle>
            <CardDescription>Process payment refunds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <RotateCcw className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No bills found</p>
              </div>
            ) : bills.slice(0, 5).map(b => (
              <div key={b._id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div>
                  <span className="font-medium">{b.billNumber}</span>
                  <span className="ml-2 text-muted-foreground">{formatCurrency(b.paidAmount)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRefundBill(b)} disabled={b.paidAmount <= 0}>
                  {actionLoading === "refund" && refundBill?._id === b._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refund"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Tables</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Section</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((t, i) => (
                <TableRow key={t._id} className={cn(i % 2 === 0 && "bg-muted/50")}>
                  <TableCell className="font-medium">{t.number}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.section}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[t.status] || "outline"}>{t.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!forceTable} onOpenChange={o => !o && setForceTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Close Table {forceTable?.number}</DialogTitle>
            <DialogDescription>This will cancel any active orders and free the table. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Are you sure you want to force close <strong>Table {forceTable?.number} ({forceTable?.name})</strong>?</p>
            {forceTable?.currentOrderId && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                This table has an active order that will be cancelled.
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceTable(null)}>Cancel</Button>
              <Button variant="destructive" onClick={forceClose} disabled={actionLoading === "force"}>
                {actionLoading === "force" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Force Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!correctionBill} onOpenChange={o => !o && setCorrectionBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct Bill {correctionBill?.billNumber}</DialogTitle>
            <DialogDescription>Adjust the total amount for this bill</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              Current Total: <span className="font-semibold">{correctionBill ? formatCurrency(correctionBill.total) : ""}</span>
            </div>
            <div className="space-y-2">
              <Label>New Total</Label>
              <Input type="number" value={newTotal} onChange={e => setNewTotal(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCorrectionBill(null)}>Cancel</Button>
              <Button onClick={correctBill} disabled={actionLoading === "bill"}>
                {actionLoading === "bill" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Correction
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!refundBill} onOpenChange={o => !o && setRefundBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Confirm the refund for this bill</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Bill:</span><span className="font-medium">{refundBill?.billNumber}</span></div>
              <div className="flex justify-between"><span>Amount to refund:</span><span className="font-semibold text-destructive">{refundBill ? formatCurrency(refundBill.paidAmount) : ""}</span></div>
            </div>
            <p className="text-sm text-muted-foreground">This will mark the payment as refunded and reopen the bill. This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRefundBill(null)}>Cancel</Button>
              <Button variant="destructive" onClick={processRefund} disabled={actionLoading === "refund"}>
                {actionLoading === "refund" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Refund
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
