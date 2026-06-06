"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Plus, Loader2, Search, Pencil, XCircle, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
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

  const loadData = useCallback(async () => {
    try {
      const [resRes, tablesRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/tables"),
      ])
      const resData = await resRes.json()
      const tablesData = await tablesRes.json()

      setReservations(Array.isArray(resData) ? resData : resData.data || [])
      setTables(Array.isArray(tablesData) ? tablesData : tablesData.data || [])
    } catch { toast.error("Failed to load reservations") } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]

    let result = reservations

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.customerId?.name?.toLowerCase().includes(q) ||
        r.customerId?.phone?.includes(q) ||
        r.tableId?.name?.toLowerCase().includes(q)
      )
    }

    switch (tab) {
      case "today":
        return result.filter(r => r.date.startsWith(todayStr) && r.status === "confirmed")
      case "upcoming":
        return result.filter(r => r.date > todayStr && r.status === "confirmed")
      case "past":
        return result.filter(r => r.status === "completed" || r.status === "no_show")
      case "cancelled":
        return result.filter(r => r.status === "cancelled")
      default:
        return result
    }
  }, [reservations, search, tab])

  const tabCounts = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    return {
      today: reservations.filter(r => r.date.startsWith(todayStr) && r.status === "confirmed").length,
      upcoming: reservations.filter(r => r.date > todayStr && r.status === "confirmed").length,
      past: reservations.filter(r => r.status === "completed" || r.status === "no_show").length,
      cancelled: reservations.filter(r => r.status === "cancelled").length,
    }
  }, [reservations])

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

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
            <p className="text-muted-foreground">Manage all table reservations</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Reservation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Reservation</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Customer Name</Label><Input value={form.customerName} onChange={e => setForm(p => ({...p, customerName: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.customerPhone} onChange={e => setForm(p => ({...p, customerPhone: e.target.value}))} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm(p => ({...p, time: e.target.value}))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Guests</Label><Input type="number" value={form.guests} onChange={e => setForm(p => ({...p, guests: e.target.value}))} required min={1} /></div>
                <div className="space-y-2"><Label>Table (optional)</Label>
                  <Select value={form.tableId} onValueChange={v => setForm(p => ({...p, tableId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>
                      {tables.filter(t => t.status === "empty").map(t => (
                        <SelectItem key={t._id} value={t._id}>Table {t.number} ({t.name}) — {t.capacity} seats</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-xl font-bold">{tabCounts.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-xl font-bold">{tabCounts.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-xl font-bold">{tabCounts.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reservations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="today">Today <Badge variant="secondary" className="ml-1.5">{tabCounts.today}</Badge></TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming <Badge variant="secondary" className="ml-1.5">{tabCounts.upcoming}</Badge></TabsTrigger>
          <TabsTrigger value="past">Past <Badge variant="secondary" className="ml-1.5">{tabCounts.past}</Badge></TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled <Badge variant="secondary" className="ml-1.5">{tabCounts.cancelled}</Badge></TabsTrigger>
        </TabsList>

        {(["today", "upcoming", "past", "cancelled"] as FilterTab[]).map(t => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground">No reservations found</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                      {t === "today" ? "No reservations scheduled for today." :
                       t === "upcoming" ? "No upcoming reservations scheduled." :
                       t === "past" ? "No past reservations found." :
                       "No cancelled reservations."}
                    </p>
                    <Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" />New Reservation</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Phone</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">Guests</TableHead>
                        <TableHead className="font-semibold">Table</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r, i) => (
                        <TableRow key={r._id} className={cn(i % 2 === 0 && "bg-muted/50")}>
                          <TableCell className="font-medium min-w-0 truncate">{r.customerId?.name || "—"}</TableCell>
                          <TableCell className="min-w-0 truncate">{r.customerId?.phone || "—"}</TableCell>
                          <TableCell className="min-w-0 truncate">{new Date(r.date).toLocaleDateString()}</TableCell>
                          <TableCell>{r.time}</TableCell>
                          <TableCell>{r.guests}</TableCell>
                          <TableCell className="min-w-0 truncate">Table {r.tableId?.number} ({r.tableId?.name})</TableCell>
                          <TableCell><Badge variant={statusBadge[r.status] || "secondary"}>{r.status.replace("_", " ")}</Badge></TableCell>
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
                )}
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
