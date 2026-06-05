"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Plus, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface Reservation { _id: string; customerId: { _id: string; name: string; phone: string }; tableId: { _id: string; number: number; name: string }; date: string; time: string; guests: number; status: string; notes?: string }

export default function StaffReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]); const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false); const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customerName: "", customerPhone: "", date: "", time: "", guests: "2", notes: "" })

  useEffect(() => { loadReservations() }, [])

  async function loadReservations() {
    try { const today = new Date().toISOString().split("T")[0]; const res = await fetch(`/api/reservations?date=${today}`); const data = await res.json(); if (res.ok) setReservations(data) } catch { toast.error("Failed to load reservations") } finally { setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { const res = await fetch("/api/reservations", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({...form, guests: Number(form.guests)}) }); if (res.ok) { toast.success("Reservation created!"); setShowForm(false); setForm({customerName:"",customerPhone:"",date:"",time:"",guests:"2",notes:""}); loadReservations() } else { const data = await res.json(); toast.error(data.error || "Failed") } } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Reservations</h1><p className="text-muted-foreground">Manage table reservations</p></div>
        <Dialog open={showForm} onOpenChange={setShowForm}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Reservation</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create Reservation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Customer Name</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div><div className="space-y-2"><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required /></div></div>
              <div className="space-y-2"><Label>Guests</Label><Input type="number" value={form.guests} onChange={e => setForm({...form, guests: e.target.value})} required min={1} /></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardHeader className="flex flex-row items-center gap-3"><CalendarIcon className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-lg">Today's Reservations</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Time</TableHead><TableHead>Guests</TableHead><TableHead>Table</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{reservations.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No reservations</TableCell></TableRow> : reservations.map(r => (
            <TableRow key={r._id}><TableCell className="font-medium">{r.customerId?.name || "—"}</TableCell><TableCell>{r.customerId?.phone || "—"}</TableCell><TableCell>{r.time}</TableCell><TableCell>{r.guests}</TableCell><TableCell>Table {r.tableId?.number} ({r.tableId?.name})</TableCell><TableCell><Badge variant={r.status === "confirmed" ? "success" : r.status === "cancelled" ? "destructive" : "warning"}>{r.status}</Badge></TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>
    </div>
  )
}
