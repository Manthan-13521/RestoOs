"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Search, Pencil, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface MenuItemData { _id: string; name: string; description: string; price: number; type: "veg" | "nonveg"; categoryId: string; status: string; stock: number; isRecommended: boolean; isBestseller: boolean; preparationTime: number }
interface Category { _id: string; name: string }

export default function StaffMenuPage() {
  const [items, setItems] = useState<MenuItemData[]>([]); const [categories, setCategories] = useState<Category[]>([]); const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(""); const [activeCategory, setActiveCategory] = useState(""); const [showForm, setShowForm] = useState(false); const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<MenuItemData | null>(null)
  const [deleteItem, setDeleteItem] = useState<MenuItemData | null>(null)
  const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "", type: "veg" as "veg"|"nonveg", preparationTime: "10", status: "available" })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try { const [itemsRes, catRes] = await Promise.all([fetch("/api/menu"), fetch("/api/categories")]); if (itemsRes.ok) setItems(await itemsRes.json()); if (catRes.ok) setCategories(await catRes.json()) } catch { toast.error("Failed to load menu") } finally { setLoading(false) }
  }

  function openAdd() {
    setEditing(null); setForm({ name: "", description: "", price: "", categoryId: "", type: "veg", preparationTime: "10", status: "available" }); setShowForm(true)
  }

  function openEdit(item: MenuItemData) {
    setEditing(item); setForm({ name: item.name, description: item.description || "", price: String(item.price), categoryId: item.categoryId, type: item.type, preparationTime: String(item.preparationTime || 10), status: item.status }); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editing ? `/api/menu/${editing._id}` : "/api/menu"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: {"Content-Type": "application/json"}, body: JSON.stringify({...form, price: Number(form.price), preparationTime: Number(form.preparationTime)}) })
      if (res.ok) { toast.success(editing ? "Item updated" : "Item added"); setShowForm(false); loadData() } else { const data = await res.json(); toast.error(data.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  async function toggleStatus(item: MenuItemData) {
    const newStatus = item.status === "available" ? "out_of_stock" : "available"
    try { const res = await fetch(`/api/menu/${item._id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({status: newStatus}) }); if (res.ok) { toast.success(`${item.name} is now ${newStatus}`); loadData() } } catch { toast.error("Failed") }
  }

  function handleDelete(item: MenuItemData) {
    setDeleteItem(item)
  }

  async function confirmDelete() {
    if (!deleteItem) return
    try { const res = await fetch(`/api/menu/${deleteItem._id}`, { method: "DELETE" }); if (res.ok) { toast.success("Item deleted"); loadData(); setDeleteItem(null) } else { const d = await res.json(); toast.error(d.error || "Failed"); setDeleteItem(null) } } catch { toast.error("Something went wrong"); setDeleteItem(null) }
  }

  const filtered = items.filter(i => { const ms = i.name.toLowerCase().includes(search.toLowerCase()); const mc = !activeCategory || i.categoryId === activeCategory; return ms && mc })

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Menu Management</h1><p className="text-muted-foreground">Manage your menu items</p></div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Item</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search menu..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="flex gap-2 overflow-x-auto pb-2"><Button variant={!activeCategory ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("")}>All</Button>{categories.map(cat => <Button key={cat._id} variant={activeCategory === cat._id ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(cat._id)}>{cat.name}</Button>)}</div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.length === 0 ? <div className="col-span-full text-center py-12 text-muted-foreground">No items found</div> : filtered.map(item => (
        <Card key={item._id} className="animate-slide-up relative group"><CardContent className="p-4">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
          <div className="flex items-start justify-between mb-2"><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-medium truncate">{item.name}</p><Badge variant="outline" className={item.type === "veg" ? "border-green-500 text-green-500 text-[10px] px-1" : "border-red-500 text-red-500 text-[10px] px-1"}>{item.type === "veg" ? "V" : "NV"}</Badge></div><p className="text-sm text-muted-foreground truncate">{item.description}</p></div></div>
          <div className="flex items-center justify-between"><span className="text-lg font-bold">{formatCurrency(item.price)}</span><Button variant={item.status === "available" ? "outline" : "destructive"} size="sm" onClick={() => toggleStatus(item)}>{item.status === "available" ? "In Stock" : "Out of Stock"}</Button></div>
          {item.isRecommended && <Badge variant="warning" className="mt-2">Recommended</Badge>}
          {item.isBestseller && <Badge variant="success" className="mt-2 ml-1">Bestseller</Badge>}
        </CardContent></Card>
      ))}</div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Item Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={(v: "veg"|"nonveg") => setForm({...form, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="veg">Veg</SelectItem><SelectItem value="nonveg">Non-Veg</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Category</Label><Select value={form.categoryId} onValueChange={v => setForm({...form, categoryId: v})}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Prep Time (min)</Label><Input type="number" value={form.preparationTime} onChange={e => setForm({...form, preparationTime: e.target.value})} /></div>
              <div className="space-y-2"><Label>Initial Status</Label><Select value={form.status} onValueChange={v => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="out_of_stock">Out of Stock</SelectItem></SelectContent></Select></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update Item" : "Add Item"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={v => { if (!v) setDeleteItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteItem?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
