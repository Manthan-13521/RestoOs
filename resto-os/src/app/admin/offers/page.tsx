"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import {
  Gift,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Percent,
  Coins,
  CalendarDays,
  Sparkles,
  Ticket,
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface OfferData {
  _id: string
  title: string
  description?: string
  type: "percent" | "fixed"
  value: number
  minOrder?: number
  validFrom: string
  validTill: string
  isActive: boolean
}

function getOfferStatus(offer: OfferData): {
  label: string
  variant: "success" | "secondary" | "outline" | "destructive"
} {
  const now = new Date()
  const start = new Date(offer.validFrom)
  const end = new Date(offer.validTill)
  if (!offer.isActive) return { label: "Inactive", variant: "secondary" }
  if (now < start) return { label: "Scheduled", variant: "outline" }
  if (now > end) return { label: "Expired", variant: "destructive" }
  return { label: "Active", variant: "success" }
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<OfferData | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    minOrder: "",
    validFrom: "",
    validTill: "",
  })

  useEffect(() => { loadOffers() }, [])

  async function loadOffers() {
    try {
      const res = await fetch("/api/offers")
      if (res.ok) setOffers(await res.json())
      else toast.error("Failed to load offers")
    } catch {
      toast.error("Failed to load offers")
    } finally { setLoading(false) }
  }

  function openAdd() {
    setEditing(null)
    setForm({ title: "", description: "", type: "percent", value: "", minOrder: "", validFrom: "", validTill: "" })
    setShowDialog(true)
  }

  function openEdit(offer: OfferData) {
    setEditing(offer)
    setForm({
      title: offer.title,
      description: offer.description || "",
      type: offer.type,
      value: String(offer.value),
      minOrder: offer.minOrder ? String(offer.minOrder) : "",
      validFrom: offer.validFrom ? offer.validFrom.slice(0, 10) : "",
      validTill: offer.validTill ? offer.validTill.slice(0, 10) : "",
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.title || !form.value || !form.validFrom || !form.validTill) {
      toast.error("Fill required fields"); return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/offers/${editing._id}` : "/api/offers"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, value: Number(form.value), minOrder: form.minOrder ? Number(form.minOrder) : undefined }),
      })
      const data = await res.json()
      if (res.ok) { toast.success(editing ? "Offer updated!" : "Offer created!"); setShowDialog(false); loadOffers() }
      else { toast.error(data.error || "Failed to save offer") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function toggleActive(offer: OfferData) {
    try {
      const res = await fetch(`/api/offers/${offer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      })
      if (res.ok) { toast.success(offer.isActive ? "Offer deactivated" : "Offer activated"); loadOffers() }
    } catch { toast.error("Failed to update offer") }
  }

  function handleDelete(id: string) { setDeleteId(id) }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/offers/${deleteId}`, { method: "DELETE" })
      if (res.ok) { toast.success("Offer deleted"); loadOffers(); setDeleteId(null) }
    } catch { toast.error("Failed to delete offer"); setDeleteId(null) }
  }

  const now = new Date()
  const activeOffers = offers.filter((o) => {
    if (!o.isActive) return false
    const s = new Date(o.validFrom); const e = new Date(o.validTill)
    return now >= s && now <= e
  })

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-56 mt-2" />
      <div className="grid gap-4 sm:grid-cols-3">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Gift className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold tracking-tight">Offers</h1><p className="text-muted-foreground">{activeOffers.length} active &bull; {offers.length} total</p></div>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Offer</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20"><Sparkles className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{activeOffers.length}</p></div>
          </div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20"><CalendarDays className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-xs text-muted-foreground">Scheduled</p><p className="text-xl font-bold">{offers.filter(o => o.isActive && new Date(o.validFrom) > now).length}</p></div>
          </div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20"><Ticket className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-xs text-muted-foreground">Expired</p><p className="text-xl font-bold">{offers.filter(o => o.isActive && new Date(o.validTill) < now).length}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Gift className="h-8 w-8 text-muted-foreground" /></div>
          <h3 className="text-lg font-semibold text-muted-foreground">No Offers Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">Create your first promotion or discount to attract more customers.</p>
          <Button onClick={openAdd} className="mt-4"><Plus className="mr-2 h-4 w-4" />Create Offer</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const status = getOfferStatus(offer)
            return (
              <Card key={offer._id} className={cn("relative overflow-hidden transition-all hover:shadow-md", !offer.isActive && "opacity-70")}>
                <div className={cn("h-1.5 w-full", status.variant === "success" ? "bg-green-500" : status.variant === "destructive" ? "bg-red-500" : status.variant === "outline" ? "bg-amber-500" : "bg-gray-300")} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{offer.title}</h3>
                      {offer.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{offer.description}</p>}
                    </div>
                    <Badge variant={status.variant} className="shrink-0 ml-2">{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold", offer.type === "percent" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400")}>
                      {offer.type === "percent" ? <Percent className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                      {offer.type === "percent" ? `${offer.value}% OFF` : `${formatCurrency(offer.value)} OFF`}
                    </div>
                    {offer.minOrder ? <span className="text-xs text-muted-foreground">Min. {formatCurrency(offer.minOrder)}</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{new Date(offer.validFrom).toLocaleDateString()} &rarr; {new Date(offer.validTill).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={offer.isActive} onCheckedChange={() => toggleActive(offer)} />
                      <span className="text-xs text-muted-foreground">{offer.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(offer)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(offer._id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3"><Gift className="h-5 w-5 text-primary" />{editing ? "Edit Offer" : "Create Offer"}</DialogTitle>
            <DialogDescription>{editing ? "Update your promotion or discount" : "Set up a new promotion for your customers"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Summer Special" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Optional description" className="min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type *</Label><Select value={form.type} onValueChange={(v: "percent"|"fixed") => setForm(p => ({...p, type: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Value *</Label><Input type="number" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} placeholder={form.type === "percent" ? "10" : "100"} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valid From *</Label><Input type="date" value={form.validFrom} onChange={e => setForm(p => ({...p, validFrom: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Valid Till *</Label><Input type="date" value={form.validTill} onChange={e => setForm(p => ({...p, validTill: e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>Min Order Amount</Label><Input type="number" value={form.minOrder} onChange={e => setForm(p => ({...p, minOrder: e.target.value}))} placeholder="Optional" /></div>
            <Button className="w-full h-11" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update Offer" : "Create Offer"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Offer</DialogTitle><DialogDescription>Are you sure you want to delete this offer? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
