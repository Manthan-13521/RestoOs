"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, DoorOpen, Receipt, RotateCcw } from "lucide-react"
import toast from "react-hot-toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"

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

  const activeTables = tables.filter(t => t.status === "occupied" || t.status === "billing_pending")

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency</h1>
          <p className="text-muted-foreground">Force close tables, correct bills, and manage refunds</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className={activeTables.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader><CardTitle className="flex items-center gap-2"><DoorOpen className="h-5 w-5" />Force Close Table</CardTitle><CardDescription>{activeTables.length} active table{activeTables.length !== 1 ? "s" : ""}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {activeTables.length === 0 ? <p className="text-sm text-muted-foreground">No active tables</p> : activeTables.map(t => (
              <div key={t._id} className="flex items-center justify-between rounded-lg border p-3">
                <div><span className="font-medium">Table {t.number}</span><span className="ml-2 text-sm text-muted-foreground">({t.name})</span><Badge variant="outline" className="ml-2">{t.status}</Badge></div>
                <Button variant="destructive" size="sm" onClick={() => setForceTable(t)}>Force Close</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Bill Correction</CardTitle><CardDescription>Adjust bill totals if needed</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {bills.length === 0 ? <p className="text-sm text-muted-foreground">No bills found</p> : bills.slice(0, 5).map(b => (
              <div key={b._id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div><span className="font-medium">{b.billNumber}</span><span className="ml-2 text-muted-foreground">{formatCurrency(b.total)}</span></div>
                <Button variant="outline" size="sm" onClick={() => { setCorrectionBill(b); setNewTotal(String(b.total)) }}>Correct</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" />Refunds</CardTitle><CardDescription>Process payment refunds</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {bills.length === 0 ? <p className="text-sm text-muted-foreground">No bills found</p> : bills.slice(0, 5).map(b => (
              <div key={b._id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div><span className="font-medium">{b.billNumber}</span><span className="ml-2 text-muted-foreground">{formatCurrency(b.paidAmount)}</span></div>
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!confirm(`Refund bill ${b.billNumber} (${formatCurrency(b.paidAmount)})?`)) return
                  setActionLoading("refund")
                  try {
                    const res = await fetch(`/api/bills/${b._id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        payments: [{ method: "cash", amount: -b.paidAmount, status: "refunded", reference: `refund-${Date.now()}` }],
                        paidAmount: 0,
                        remainingAmount: b.total,
                        status: "pending",
                      }),
                    })
                    if (res.ok) { toast.success(`Refunded ${formatCurrency(b.paidAmount)}`); load() }
                    else { const err = await res.json(); toast.error(err.error || "Refund failed") }
                  } catch { toast.error("Something went wrong") }
                  finally { setActionLoading(null) }
                }} disabled={actionLoading === "refund" || b.paidAmount <= 0}>
                  {actionLoading === "refund" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refund"}
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
              {tables.map(t => (
                <TableRow key={t._id}>
                  <TableCell className="font-medium">{t.number}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.section}</TableCell>
                  <TableCell><Badge variant={t.status === "empty" ? "secondary" : t.status === "occupied" ? "default" : "warning"}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!forceTable} onOpenChange={o => !o && setForceTable(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Force Close Table {forceTable?.number}</DialogTitle><DialogDescription>This will cancel any active orders and free the table. This action cannot be undone.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Are you sure you want to force close <strong>Table {forceTable?.number} ({forceTable?.name})</strong>?</p>
            {forceTable?.currentOrderId && <p className="text-sm text-destructive">This table has an active order that will be cancelled.</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setForceTable(null)}>Cancel</Button>
              <Button variant="destructive" onClick={forceClose} disabled={actionLoading === "force"}>
                {actionLoading === "force" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Force Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!correctionBill} onOpenChange={o => !o && setCorrectionBill(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Correct Bill {correctionBill?.billNumber}</DialogTitle><DialogDescription>Adjust the total amount for this bill</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Total: {correctionBill ? formatCurrency(correctionBill.total) : ""}</Label>
              <Input type="number" value={newTotal} onChange={e => setNewTotal(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCorrectionBill(null)}>Cancel</Button>
              <Button onClick={correctBill} disabled={actionLoading === "bill"}>
                {actionLoading === "bill" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Correction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
