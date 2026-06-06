"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { CalendarIcon, CheckCircle2, XCircle, Clock, Plus, Loader2 } from "lucide-react"
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

const statusBadge: Record<string, "success" | "destructive" | "secondary" | "warning"> = {
  confirmed: "success",
  cancelled: "destructive",
  completed: "secondary",
  no_show: "warning",
}

export default function StaffReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [form, setForm] = useState({ customerName: "", customerPhone: "", date: "", time: "", guests: "2", notes: "" })

  useEffect(() => { loadReservations() }, [date])

  async function loadReservations() {
    try {
      setLoading(true)
      const res = await fetch(`/api/reservations?date=${date}`)
      const data = await res.json()
      if (res.ok) setReservations(data)
    } catch { toast.error("Failed to load reservations") } finally { setLoading(false) }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) { toast.success(`Marked as ${status.replace("_", " ")}`); loadReservations() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests) }),
      })
      if (res.ok) {
        toast.success("Reservation created!")
        setShowForm(false)
        setForm({ customerName: "", customerPhone: "", date: "", time: "", guests: "2", notes: "" })
        loadReservations()
      } else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  const confirmedCount = reservations.filter(r => r.status === "confirmed").length
  const completedCount = reservations.filter(r => r.status === "completed").length
  const cancelledCount = reservations.filter(r => r.status === "cancelled").length

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">Manage table reservations</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Reservation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Reservation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input value={form.customerName} onChange={e => setForm(p => ({...p, customerName: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.customerPhone} onChange={e => setForm(p => ({...p, customerPhone: e.target.value}))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={form.time} onChange={e => setForm(p => ({...p, time: e.target.value}))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Guests</Label>
                  <Input type="number" value={form.guests} onChange={e => setForm(p => ({...p, guests: e.target.value}))} required min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-xl font-bold">{confirmedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-xl font-bold">{cancelledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Date</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-fit" />
      </div>

      <Card>
        <CardContent className="p-0">
          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">No reservations</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                No reservations found for this date. Create a new reservation to get started.
              </p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />New Reservation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold">Guests</TableHead>
                  <TableHead className="font-semibold">Table</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r, i) => (
                  <TableRow key={r._id} className={cn("transition-colors hover:bg-muted/30", i % 2 === 0 && "bg-muted/50")}>
                    <TableCell className="font-medium">{r.customerId?.name || "—"}</TableCell>
                    <TableCell>{r.customerId?.phone || "—"}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell>{r.guests}</TableCell>
                    <TableCell>{r.tableId ? `Table ${r.tableId.number} (${r.tableId.name})` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[r.status] || "default"} className="capitalize">
                        {r.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateStatus(r._id, "completed")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {r.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => updateStatus(r._id, "cancelled")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {r.status !== "no_show" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => updateStatus(r._id, "no_show")}
                          >
                            <Clock className="h-4 w-4" />
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
    </div>
  )
}
