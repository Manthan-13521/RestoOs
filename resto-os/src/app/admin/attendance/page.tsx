"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/utils"
import { CalendarCheck, Plus, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface AttendanceRecord { _id: string; staffId: { _id: string; name: string; email: string }; date: string; checkIn?: string; checkOut?: string; status: string; notes?: string }

const statusColors = { present: "success", absent: "destructive", late: "warning", half_day: "secondary", holiday: "outline" } as const

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]); const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false); const [saving, setSaving] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [form, setForm] = useState({ staffId: "", date: "", status: "present", checkIn: "" })
  const [staffList, setStaffList] = useState<{ _id: string; name: string; role: string; employeeId: string }[]>([])

  useEffect(() => { loadStaff(); loadRecords() }, [filterDate])

  async function loadStaff() {
    try { const res = await fetch("/api/staff"); const data = await res.json(); if (res.ok) setStaffList((Array.isArray(data) ? data : data.data || []).map((s: any) => ({ _id: s._id, name: s.userId?.name || "Unknown", role: s.userId?.role || "", employeeId: s.employeeId || "" }))) } catch { toast.error("Failed to load staff") }
  }

  async function loadRecords() {
    try { const res = await fetch(`/api/attendance?date=${filterDate}`); const data = await res.json(); if (res.ok) setRecords(Array.isArray(data) ? data : data.data || []) } catch { toast.error("Failed to load") } finally { setLoading(false) }
  }

  async function handleAdd() {
    if (!form.staffId || !form.date) { toast.error("Staff and date required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/attendance", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(form) })
      if (res.ok) { toast.success("Record added"); setShowAdd(false); loadRecords() } else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><CalendarCheck className="h-5 w-5 text-primary" /></div><div><h1 className="text-2xl font-bold tracking-tight">Attendance</h1><p className="text-muted-foreground">Track staff attendance</p></div></div>
        <div className="flex items-center gap-3"><Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40" /><Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add Record</Button></div>
      </div>
      <Card><CardHeader><CardTitle>Records — {filterDate}</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
          <TableBody>{records.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records for this date</TableCell></TableRow> : records.map(r => (
            <TableRow key={r._id}><TableCell className="font-medium">{r.staffId?.name || "—"}</TableCell><TableCell>{r.checkIn ? formatDateTime(r.checkIn) : "—"}</TableCell><TableCell>{r.checkOut ? formatDateTime(r.checkOut) : "—"}</TableCell><TableCell><Badge variant={statusColors[r.status as keyof typeof statusColors]} className="capitalize">{r.status}</Badge></TableCell><TableCell className="text-muted-foreground">{r.notes || "—"}</TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>

      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) setForm({ staffId: "", date: "", status: "present", checkIn: "" }) }}>
        <DialogContent><DialogHeader><DialogTitle>Add Attendance Record</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Staff *</Label><Select value={form.staffId} onValueChange={v => setForm(p => ({...p, staffId: v}))}><SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger><SelectContent>{staffList.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.role}) — {s.employeeId}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} /></div><div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="present">Present</SelectItem><SelectItem value="absent">Absent</SelectItem><SelectItem value="late">Late</SelectItem><SelectItem value="half_day">Half Day</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-2"><Label>Check In Time</Label><Input type="datetime-local" value={form.checkIn} onChange={e => setForm(p => ({...p, checkIn: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Record</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
