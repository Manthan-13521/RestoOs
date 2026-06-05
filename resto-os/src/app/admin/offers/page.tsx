"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Gift, Plus, Loader2, Pencil, Trash2 } from "lucide-react"
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
    } finally {
      setLoading(false)
    }
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
      toast.error("Fill required fields")
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/offers/${editing._id}` : "/api/offers"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          minOrder: form.minOrder ? Number(form.minOrder) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? "Offer updated!" : "Offer created!")
        setShowDialog(false)
        loadOffers()
      } else {
        toast.error(data.error || "Failed to save offer")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(offer: OfferData) {
    try {
      const res = await fetch(`/api/offers/${offer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      })
      if (res.ok) {
        toast.success(offer.isActive ? "Offer deactivated" : "Offer activated")
        loadOffers()
      }
    } catch {
      toast.error("Failed to update offer")
    }
  }

  function handleDelete(id: string) {
    setDeleteId(id)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/offers/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Offer deleted")
        loadOffers()
        setDeleteId(null)
      }
    } catch {
      toast.error("Failed to delete offer")
      setDeleteId(null)
    }
  }

  const now = new Date()

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
            <p className="text-muted-foreground">Manage discounts and promotions</p>
          </div>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Offer</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Offers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Valid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No offers found</TableCell>
                </TableRow>
              ) : offers.map((offer) => {
                const isExpired = new Date(offer.validTill) < now
                return (
                  <TableRow key={offer._id}>
                    <TableCell className="font-medium">{offer.title}</TableCell>
                    <TableCell><Badge variant="outline">{offer.type === "percent" ? "% Off" : "Fixed"}</Badge></TableCell>
                    <TableCell>{offer.type === "percent" ? `${offer.value}%` : formatCurrency(offer.value)}</TableCell>
                    <TableCell>{offer.minOrder ? formatCurrency(offer.minOrder) : "—"}</TableCell>
                    <TableCell className="text-xs">
                      {offer.validFrom?.slice(0, 10)} → {offer.validTill?.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={!offer.isActive ? "secondary" : isExpired ? "outline" : "success"}>
                        {!offer.isActive ? "Inactive" : isExpired ? "Expired" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch checked={offer.isActive} onCheckedChange={() => toggleActive(offer)} />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(offer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(offer._id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle>
            <DialogDescription>{editing ? "Update offer details" : "Create a new promotion or discount"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Summer Special" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v: "percent" | "fixed") => setForm(p => ({...p, type: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} placeholder={form.type === "percent" ? "10" : "100"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From *</Label>
                <Input type="date" value={form.validFrom} onChange={e => setForm(p => ({...p, validFrom: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Valid Till *</Label>
                <Input type="date" value={form.validTill} onChange={e => setForm(p => ({...p, validTill: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Min Order Amount</Label>
              <Input type="number" value={form.minOrder} onChange={e => setForm(p => ({...p, minOrder: e.target.value}))} placeholder="Optional" />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update Offer" : "Create Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
