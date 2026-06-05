"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Plus, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface SalaryData { _id: string; staffId: { _id: string; name: string; email: string }; amount: number; bonus: number; deduction: number; netAmount: number; period: string; paid: boolean; paidOn?: string; notes?: string }

export default function AdminSalariesPage() {
  const [salaries, setSalaries] = useState<SalaryData[]>([]); const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false); const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ staffId: "", amount: "", bonus: "0", deduction: "0", period: "", notes: "" })
  const [staffList, setStaffList] = useState<{ _id: string; name: string; role: string; employeeId: string }[]>([])

  useEffect(() => { loadStaff(); loadSalaries() }, [])

  async function loadStaff() {
    try { const res = await fetch("/api/staff"); const data = await res.json(); if (res.ok) setStaffList((Array.isArray(data) ? data : data.data || []).map((s: any) => ({ _id: s._id, name: s.userId?.name || "Unknown", role: s.userId?.role || "", employeeId: s.employeeId || "" }))) } catch { toast.error("Failed to load staff") }
  }

  async function loadSalaries() {
    try { const res = await fetch("/api/salaries"); const data = await res.json(); if (res.ok) setSalaries(Array.isArray(data) ? data : data.data || []) } catch { toast.error("Failed to load") } finally { setLoading(false) }
  }

  async function handleAdd() {
    if (!form.staffId || !form.amount || !form.period) { toast.error("Staff, amount, and period required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/salaries", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ staffId: form.staffId, amount: Number(form.amount), bonus: Number(form.bonus), deduction: Number(form.deduction), period: form.period, notes: form.notes }) })
      if (res.ok) { toast.success("Salary recorded"); setShowAdd(false); loadSalaries() } else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  async function togglePaid(salary: SalaryData) {
    try { const res = await fetch(`/api/salaries/${salary._id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ paid: !salary.paid }) }); if (res.ok) { toast.success("Updated"); loadSalaries() } } catch { toast.error("Failed") }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Wallet className="h-5 w-5 text-primary" /></div><div><h1 className="text-2xl font-bold tracking-tight">Salaries</h1><p className="text-muted-foreground">Manage staff salaries</p></div></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Record Salary</Button>
      </div>
      <Card><CardHeader><CardTitle>Salary Records</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Bonus</TableHead><TableHead>Deduction</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>{salaries.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No salary records</TableCell></TableRow> : salaries.map(s => (
            <TableRow key={s._id}><TableCell className="font-medium">{s.staffId?.name || "—"}</TableCell><TableCell>{s.period}</TableCell><TableCell>{formatCurrency(s.amount)}</TableCell><TableCell className="text-success">{s.bonus > 0 ? formatCurrency(s.bonus) : "—"}</TableCell><TableCell className="text-destructive">{s.deduction > 0 ? formatCurrency(s.deduction) : "—"}</TableCell><TableCell className="font-bold">{formatCurrency(s.netAmount)}</TableCell><TableCell><Badge variant={s.paid ? "success" : "secondary"}>{s.paid ? "Paid" : "Pending"}</Badge></TableCell><TableCell><Button variant="outline" size="sm" onClick={() => togglePaid(s)}>{s.paid ? "Mark Unpaid" : "Mark Paid"}</Button></TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>

      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) setForm({ staffId: "", amount: "", bonus: "0", deduction: "0", period: "", notes: "" }) }}>
        <DialogContent><DialogHeader><DialogTitle>Record Salary</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Staff *</Label><Select value={form.staffId} onValueChange={v => setForm(p => ({...p, staffId: v}))}><SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger><SelectContent>{staffList.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.role}) — {s.employeeId}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Amount *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} /></div><div className="space-y-2"><Label>Period *</Label><Input value={form.period} onChange={e => setForm(p => ({...p, period: e.target.value}))} placeholder="e.g. 2024-01" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Bonus</Label><Input type="number" value={form.bonus} onChange={e => setForm(p => ({...p, bonus: e.target.value}))} /></div><div className="space-y-2"><Label>Deduction</Label><Input type="number" value={form.deduction} onChange={e => setForm(p => ({...p, deduction: e.target.value}))} /></div></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record Salary</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
