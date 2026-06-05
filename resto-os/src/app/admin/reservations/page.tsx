"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Plus, Loader2, Search, Pencil, XCircle } from "lucide-react"
import toast from "react-hot-toast"

interface Reservation {
  _id: string
  customerId: { _id: string; name: string; phone: string }
  tableId: { _id: string; number: number; name: string }
  date: string
  time: string
  guests: number
  status: string
  notes?: string
}

interface TableOption {
  _id: string
  number: number
  name: string
  capacity: number
  status: string
}

type FilterTab = "today" | "upcoming" | "past" | "cancelled"

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tables, setTables] = useState<TableOption[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>("today")
  const [search, setSearch] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", date: "", time: "", guests: "2", tableId: "", notes: "",
  })

  const [editTarget, setEditTarget] = useState<Reservation | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)

  const today = new Date().toISOString().split("T")[0]

  const loadData = useCallback(async () => {
    try {
      const [resRes, tablesRes] = await Promise.all([
        fetch(`/api/reservations`),
        fetch(`/api/tables`),
      ])
      const resData = await resRes.json()
      const tablesData = await tablesRes.json()

      const list = Array.isArray(resData) ? resData : resData.data || []
      setReservations(list)
      setTables(Array.isArray(tablesData) ? tablesData : tablesData.data || [])
    } catch { toast.error("Failed to load reservations") } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function filterReservations(): Reservation[] {
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]

    let filtered = reservations

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(r =>
        r.customerId?.name?.toLowerCase().includes(q) ||
        r.customerId?.phone?.includes(q) ||
        r.tableId?.name?.toLowerCase().includes(q)
      )
    }

    switch (tab) {
      case "today":
        return filtered.filter(r => r.date.startsWith(todayStr) && r.status === "confirmed")
      case "upcoming":
        return filtered.filter(r => r.date > todayStr && r.status === "confirmed")
      case "past":
        return filtered.filter(r => r.status === "completed" || r.status === "no_show")
      case "cancelled":
        return filtered.filter(r => r.status === "cancelled")
      default:
        return filtered
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests) }),
      })
      if (res.ok) {
        toast.success("Reservation created"); setShowForm(false)
        setForm({ customerName: "", customerPhone: "", date: "", time: "", guests: "2", tableId: "", notes: "" })
        loadData()
      } else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault(); if (!editTarget) return; setSaving(true)
    try {
      const res = await fetch(`/api/reservations/${editTarget._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editTarget.status }),
      })
      if (res.ok) { toast.success("Reservation updated"); setShowEdit(false); setEditTarget(null); loadData() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  function handleCancel(id: string) {
    setCancelId(id)
  }

  async function confirmCancel() {
    if (!cancelId) return
    try {
      const res = await fetch(`/api/reservations/${cancelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (res.ok) { toast.success("Reservation cancelled"); loadData(); setCancelId(null) }
      else { const d = await res.json(); toast.error(d.error || "Failed"); setCancelId(null) }
    } catch { toast.error("Something went wrong"); setCancelId(null) }
  }

  const statusBadge: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
    confirmed: "success",
    cancelled: "destructive",
    completed: "secondary",
    no_show: "warning",
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  const filtered = filterReservations()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">Manage all table reservations</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Reservation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Reservation</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Customer Name</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Guests</Label><Input type="number" value={form.guests} onChange={e => setForm({...form, guests: e.target.value})} required min={1} /></div>
                <div className="space-y-2"><Label>Table (optional)</Label>
                  <Select value={form.tableId} onValueChange={v => setForm({...form, tableId: v})}>
                    <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>
                      {tables.filter(t => t.status === "empty").map(t => (
                        <SelectItem key={t._id} value={t._id}>Table {t.number} ({t.name}) — {t.capacity} seats</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reservations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {(["today", "upcoming", "past", "cancelled"] as FilterTab[]).map(t => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg capitalize">{t} Reservations</CardTitle>
                <Badge variant="secondary" className="ml-auto">{filtered.length}</Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No reservations</TableCell></TableRow>
                    ) : filtered.map(r => (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">{r.customerId?.name || "—"}</TableCell>
                        <TableCell>{r.customerId?.phone || "—"}</TableCell>
                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell>{r.time}</TableCell>
                        <TableCell>{r.guests}</TableCell>
                        <TableCell>Table {r.tableId?.number} ({r.tableId?.name})</TableCell>
                        <TableCell><Badge variant={statusBadge[r.status] || "secondary"}>{r.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => { setEditTarget(r); setShowEdit(true) }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {r.status === "confirmed" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                onClick={() => handleCancel(r._id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showEdit} onOpenChange={v => { setShowEdit(v); if (!v) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Reservation</DialogTitle></DialogHeader>
          {editTarget && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Customer</Label><p className="text-sm font-medium">{editTarget.customerId?.name}</p></div>
                <div className="space-y-2"><Label>Phone</Label><p className="text-sm font-medium">{editTarget.customerId?.phone}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><p className="text-sm font-medium">{new Date(editTarget.date).toLocaleDateString()}</p></div>
                <div className="space-y-2"><Label>Time</Label><p className="text-sm font-medium">{editTarget.time}</p></div>
              </div>
              <div className="space-y-2"><Label>Guests</Label><p className="text-sm font-medium">{editTarget.guests}</p></div>
              <div className="space-y-2"><Label>Table</Label><p className="text-sm font-medium">Table {editTarget.tableId?.number} ({editTarget.tableId?.name})</p></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editTarget.status} onValueChange={v => setEditTarget({...editTarget, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelId} onOpenChange={v => { if (!v) setCancelId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Go Back</Button>
            <Button variant="destructive" onClick={confirmCancel}>Cancel Reservation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
