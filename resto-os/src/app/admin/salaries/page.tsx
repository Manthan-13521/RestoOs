"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Plus, Loader2, Clock, CheckCheck } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface SalaryData {
  _id: string
  staffId: { _id: string; name: string; email: string }
  amount: number
  bonus: number
  deduction: number
  netAmount: number
  period: string
  paid: boolean
  paidOn?: string
  notes?: string
}

export default function AdminSalariesPage() {
  const [salaries, setSalaries] = useState<SalaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ staffId: "", amount: "", bonus: "0", deduction: "0", period: "", notes: "" })
  const [staffList, setStaffList] = useState<{ _id: string; name: string; role: string; employeeId: string }[]>([])

  useEffect(() => { loadStaff(); loadSalaries() }, [])

  async function loadStaff() {
    try {
      const res = await fetch("/api/staff")
      const data = await res.json()
      if (res.ok) setStaffList((Array.isArray(data) ? data : data.data || []).map((s: any) => ({
        _id: s._id, name: s.userId?.name || "Unknown", role: s.userId?.role || "", employeeId: s.employeeId || "",
      })))
    } catch { toast.error("Failed to load staff") }
  }

  async function loadSalaries() {
    try {
      const res = await fetch("/api/salaries")
      const data = await res.json()
      if (res.ok) setSalaries(Array.isArray(data) ? data : data.data || [])
    } catch { toast.error("Failed to load") } finally { setLoading(false) }
  }

  async function handleAdd() {
    if (!form.staffId || !form.amount || !form.period) { toast.error("Staff, amount, and period required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: form.staffId, amount: Number(form.amount), bonus: Number(form.bonus),
          deduction: Number(form.deduction), period: form.period, notes: form.notes,
        }),
      })
      if (res.ok) { toast.success("Salary recorded"); setShowAdd(false); loadSalaries() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  async function togglePaid(salary: SalaryData) {
    try {
      const res = await fetch(`/api/salaries/${salary._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !salary.paid }),
      })
      if (res.ok) { toast.success("Updated"); loadSalaries() }
    } catch { toast.error("Failed") }
  }

  const totalPayroll = useMemo(() => salaries.reduce((s, r) => s + r.amount, 0), [salaries])
  const pendingCount = useMemo(() => salaries.filter(s => !s.paid).length, [salaries])
  const paidCount = useMemo(() => salaries.filter(s => s.paid).length, [salaries])

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-56 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Salaries</h1>
            <p className="text-muted-foreground">Manage staff salaries</p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Record Salary</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Payroll</p>
                <p className="text-xl font-bold">{formatCurrency(totalPayroll)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <CheckCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid This Period</p>
                <p className="text-xl font-bold">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {salaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">No Salary Records</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Record your first salary entry to track staff payments.
              </p>
              <Button className="mt-4" onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Record Salary</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Staff</TableHead>
                  <TableHead className="font-semibold">Period</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Bonus</TableHead>
                  <TableHead className="font-semibold">Deduction</TableHead>
                  <TableHead className="font-semibold">Net</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((s, i) => (
                  <TableRow key={s._id} className={cn(i % 2 === 0 && "bg-muted/50")}>
                    <TableCell className="font-medium min-w-0 truncate">{s.staffId?.name || "—"}</TableCell>
                    <TableCell>{s.period}</TableCell>
                    <TableCell>{formatCurrency(s.amount)}</TableCell>
                    <TableCell className={cn("min-w-0 truncate", s.bonus > 0 && "text-success")}>{s.bonus > 0 ? formatCurrency(s.bonus) : "—"}</TableCell>
                    <TableCell className={cn("min-w-0 truncate", s.deduction > 0 && "text-destructive")}>{s.deduction > 0 ? formatCurrency(s.deduction) : "—"}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(s.netAmount)}</TableCell>
                    <TableCell><Badge variant={s.paid ? "success" : "secondary"}>{s.paid ? "Paid" : "Pending"}</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => togglePaid(s)}>
                        {s.paid ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) setForm({ staffId: "", amount: "", bonus: "0", deduction: "0", period: "", notes: "" }) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Salary</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Staff *</Label>
              <Select value={form.staffId} onValueChange={v => setForm(p => ({...p, staffId: v}))}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name} ({s.role}) — {s.employeeId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Period *</Label><Input value={form.period} onChange={e => setForm(p => ({...p, period: e.target.value}))} placeholder="e.g. 2024-01" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bonus</Label><Input type="number" value={form.bonus} onChange={e => setForm(p => ({...p, bonus: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Deduction</Label><Input type="number" value={form.deduction} onChange={e => setForm(p => ({...p, deduction: e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record Salary
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
