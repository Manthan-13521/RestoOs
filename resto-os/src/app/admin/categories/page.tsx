"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

interface Category {
  _id: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", sortOrder: "0" })

  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?all=true")
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : data.data || [])
    } catch { toast.error("Failed to load categories") } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      })
      if (res.ok) { toast.success("Category created"); setShowForm(false); setForm({ name: "", description: "", sortOrder: "0" }); loadData() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault(); if (!editTarget) return; setSaving(true)
    try {
      const res = await fetch(`/api/categories/${editTarget._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTarget),
      })
      if (res.ok) { toast.success("Category updated"); setShowEdit(false); setEditTarget(null); loadData() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  function handleDelete(id: string) {
    setDeleteId(id)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/categories/${deleteId}`, { method: "DELETE" })
      if (res.ok) { toast.success("Category deleted"); loadData(); setDeleteId(null) }
      else { const d = await res.json(); toast.error(d.error || "Failed"); setDeleteId(null) }
    } catch { toast.error("Something went wrong"); setDeleteId(null) }
  }

  async function toggleActive(cat: Category) {
    try {
      const res = await fetch(`/api/categories/${cat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      })
      if (res.ok) { toast.success(cat.isActive ? "Category hidden" : "Category activated"); loadData() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Categories</h1>
          <p className="text-muted-foreground">Manage food categories and sorting</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: e.target.value})} /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Categories</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No categories</TableCell></TableRow>
              ) : categories.map(cat => (
                <TableRow key={cat._id} className={cat.isActive ? "" : "opacity-60"}>
                  <TableCell className="text-muted-foreground">{cat.sortOrder}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{cat.description || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={cat.isActive ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleActive(cat)}
                    >
                      {cat.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setEditTarget({ ...cat }); setShowEdit(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(cat._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEdit} onOpenChange={v => { setShowEdit(v); if (!v) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editTarget && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label>
                <Input value={editTarget.name} onChange={e => setEditTarget({...editTarget, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label>
                <Input value={editTarget.description} onChange={e => setEditTarget({...editTarget, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Sort Order</Label>
                <Input type="number" value={editTarget.sortOrder} onChange={e => setEditTarget({...editTarget, sortOrder: Number(e.target.value)})} /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? Menu items in this category may become orphaned.
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
