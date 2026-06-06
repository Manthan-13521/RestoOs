"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Loader2,
  Search,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Upload,
  UtensilsCrossed,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface MenuItemData {
  _id: string
  name: string
  description: string
  price: number
  type: "veg" | "nonveg"
  categoryId: string
  status: string
  stock: number
  isRecommended: boolean
  isBestseller: boolean
  preparationTime: number
  image?: string
}

interface Category {
  _id: string
  name: string
}

export default function StaffMenuPage() {
  const [items, setItems] = useState<MenuItemData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<MenuItemData | null>(null)
  const [deleteItem, setDeleteItem] = useState<MenuItemData | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    type: "veg" as "veg" | "nonveg",
    preparationTime: "10",
    status: "available",
    image: "",
    isRecommended: false,
    isBestseller: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [itemsRes, catRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories"),
      ])
      if (itemsRes.ok) setItems(await itemsRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch {
      toast.error("Failed to load menu")
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      type: "veg",
      preparationTime: "10",
      status: "available",
      image: "",
      isRecommended: false,
      isBestseller: false,
    })
    setShowForm(true)
  }

  function openEdit(item: MenuItemData) {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      categoryId: item.categoryId,
      type: item.type,
      preparationTime: String(item.preparationTime || 10),
      status: item.status,
      image: item.image || "",
      isRecommended: item.isRecommended || false,
      isBestseller: item.isBestseller || false,
    })
    setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setForm((p) => ({ ...p, image: data.url }))
        toast.success("Image uploaded")
      } else {
        toast.error(data.error || "Upload failed")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/menu/${editing._id}` : "/api/menu"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          preparationTime: Number(form.preparationTime),
        }),
      })
      if (res.ok) {
        toast.success(editing ? "Item updated" : "Item added")
        setShowForm(false)
        loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(item: MenuItemData) {
    const newStatus = item.status === "available" ? "out_of_stock" : "available"
    try {
      const res = await fetch(`/api/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`${item.name} is now ${newStatus.replace("_", " ")}`)
        loadData()
      }
    } catch {
      toast.error("Failed")
    }
  }

  function handleDelete(item: MenuItemData) {
    setDeleteItem(item)
  }

  async function confirmDelete() {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/menu/${deleteItem._id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Item deleted")
        loadData()
        setDeleteItem(null)
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed")
        setDeleteItem(null)
      }
    } catch {
      toast.error("Something went wrong")
      setDeleteItem(null)
    }
  }

  const filtered = items.filter((i) => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase())
    const mc = !activeCategory || i.categoryId === activeCategory
    return ms && mc
  })

  const popularItems = items.filter((i) => i.isBestseller || i.isRecommended)
  const activeItems = items.filter((i) => i.status === "available")

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
            <p className="text-muted-foreground">
              {activeItems.length} active • {items.length} total items
            </p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <UtensilsCrossed className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-bold">{activeItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Featured</p>
                <p className="text-xl font-bold">{popularItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="text-xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={!activeCategory ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat._id}
              variant={activeCategory === cat._id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat._id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {search || activeCategory ? (
              <Search className="h-8 w-8 text-muted-foreground" />
            ) : (
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            {search || activeCategory
              ? "No matching items"
              : "Menu is empty"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {search || activeCategory
              ? "Try a different search or category"
              : "Add your first menu item to get started"}
          </p>
          {!search && !activeCategory && (
            <Button onClick={openAdd} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card
              key={item._id}
              className={cn(
                "animate-slide-up relative group overflow-hidden transition-all hover:shadow-lg",
                item.status !== "available" && "opacity-70"
              )}
            >
              {/* Image */}
              <div className="relative h-36 bg-muted overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5",
                      item.type === "veg"
                        ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/60"
                        : "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/60"
                    )}
                  >
                    {item.type === "veg" ? "VEG" : "NON-VEG"}
                  </Badge>
                  {item.isRecommended && (
                    <Badge
                      variant="outline"
                      className="border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/60 text-[10px] px-1.5 h-5"
                    >
                      <Star className="h-3 w-3 mr-0.5 fill-amber-400" />
                      Featured
                    </Badge>
                  )}
                </div>
                {/* Status */}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={item.status === "available" ? "success" : "destructive"}
                    className="text-[10px] px-1.5 py-0 h-5"
                  >
                    {item.status === "available" ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                {/* Actions */}
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 hover:bg-white text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(item)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 hover:bg-white text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate flex-1">
                    {item.name}
                  </h3>
                  <span className="text-base font-bold text-primary shrink-0">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.preparationTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.preparationTime}min
                      </span>
                    )}
                    {item.isBestseller && (
                      <Badge
                        variant="outline"
                        className="border-orange-400 text-orange-600 text-[9px] px-1 py-0 h-4"
                      >
                        Bestseller
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={item.status === "available" ? "outline" : "default"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStatus(item)
                    }}
                  >
                    {item.status === "available" ? "Mark OOS" : "Restock"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              {editing ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update item details, photo, and pricing"
                : "Add a new item to your menu"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
                  form.image
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {form.image ? (
                  <div className="relative">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="mx-auto max-h-40 rounded-lg object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation()
                        setForm((p) => ({ ...p, image: "" }))
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload an image
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          JPEG, PNG, WebP • Max 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Butter Chicken"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Rich, creamy tomato-based curry with tender chicken..."
                className="min-h-[60px]"
              />
            </div>

            {/* Price & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  placeholder="299"
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: "veg" | "nonveg") =>
                    setForm({ ...form, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="nonveg">Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category & Prep Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prep Time (min)</Label>
                <Input
                  type="number"
                  value={form.preparationTime}
                  onChange={(e) =>
                    setForm({ ...form, preparationTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Status & Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Badges</Label>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant={form.isRecommended ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setForm({ ...form, isRecommended: !form.isRecommended })
                    }
                  >
                    <Star className={cn("h-4 w-4 mr-1", form.isRecommended && "fill-current")} />
                    Featured
                  </Button>
                  <Button
                    type="button"
                    variant={form.isBestseller ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setForm({ ...form, isBestseller: !form.isBestseller })
                    }
                  >
                    <TrendingUp className={cn("h-4 w-4 mr-1", form.isBestseller && "fill-current")} />
                    Bestseller
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={saving || uploading}
            >
              {(saving || uploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? "Update Item" : "Add Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteItem}
        onOpenChange={(v) => {
          if (!v) setDeleteItem(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteItem?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteItem?.image && (
            <img
              src={deleteItem.image}
              alt={deleteItem.name}
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
