"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Grid3X3,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  QrCode,
  Download,
  Printer,
  Table2,
} from "lucide-react"
import toast from "react-hot-toast"

import { QRCodeSVG } from "qrcode.react"

interface TableData {
  _id: string
  number: number
  name: string
  capacity: number
  section: string
  status: string
}

const statusConfig: Record<
  string,
  { label: string; color: string; border: string }
> = {
  empty: {
    label: "Empty",
    color: "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20",
    border: "border-green-400",
  },
  reserved: {
    label: "Reserved",
    color: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-400",
  },
  occupied: {
    label: "Occupied",
    color: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-400",
  },
  billing_pending: {
    label: "Billing",
    color: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20",
    border: "border-red-400",
  },
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<TableData | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    number: "",
    name: "",
    capacity: "4",
    section: "Main",
  })
  const [qrTable, setQrTable] = useState<TableData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TableData | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
    try {
      const res = await fetch("/api/tables")
      const data = await res.json()
      if (res.ok) setTables(data)
    } catch {
      toast.error("Failed to load tables")
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm({ number: "", name: "", capacity: "4", section: "Main" })
    setShowDialog(true)
  }

  function openEdit(t: TableData) {
    setEditing(t)
    setForm({
      number: String(t.number),
      name: t.name,
      capacity: String(t.capacity),
      section: t.section,
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.number || !form.name) {
      toast.error("Table number and name required")
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/tables/${editing._id}` : "/api/tables"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: Number(form.number),
          name: form.name,
          capacity: Number(form.capacity),
          section: form.section,
        }),
      })
      if (res.ok) {
        toast.success(editing ? "Table updated!" : "Table added!")
        setShowDialog(false)
        loadTables()
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

  function handleDelete(t: TableData) {
    setDeleteTarget(t)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/tables/${deleteTarget._id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Table deleted")
        loadTables()
        setDeleteTarget(null)
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed")
        setDeleteTarget(null)
      }
    } catch {
      toast.error("Something went wrong")
      setDeleteTarget(null)
    }
  }

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )

  const occupiedCount = tables.filter(
    (t) => t.status === "occupied" || t.status === "billing_pending"
  ).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
            <p className="text-muted-foreground">
              {tables.length} tables • {occupiedCount} occupied
            </p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <Table2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tables</p>
                <p className="text-xl font-bold">{tables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Grid3X3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-bold">
                  {tables.filter((t) => t.status === "empty").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <QrCode className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
                <p className="text-xl font-bold">
                  {tables.reduce((s, t) => s + t.capacity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Grid */}
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Grid3X3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            No Tables Configured
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Add your first table to start managing your floor layout.
          </p>
          <Button onClick={openAdd} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tables.map((table) => {
            const cfg = statusConfig[table.status] || statusConfig.empty
            return (
              <Card
                key={table._id}
                className={cn(
                  "border-2 relative group transition-all hover:shadow-md",
                  cfg.border
                )}
              >
                <CardContent className="p-4">
                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 rounded-lg p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setQrTable(table)}
                      title="QR Code"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(table)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(table)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Table Info */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl font-bold">{table.number}</span>
                    <Badge variant="outline" className={cn(cfg.color)}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{table.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Capacity: {table.capacity} &bull; {table.section}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Table" : "Add Table"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update table details"
                : "Create a new table in your floor plan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Table Number *</Label>
                <Input
                  type="number"
                  value={form.number}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, number: e.target.value }))
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Table Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Window Table"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, capacity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input
                  value={form.section}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, section: e.target.value }))
                  }
                  placeholder="Main"
                />
              </div>
            </div>
            <Button
              className="w-full h-11"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update Table" : "Add Table"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog
        open={!!qrTable}
        onOpenChange={(v) => {
          if (!v) setQrTable(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-primary" />
              Table {qrTable?.number} — QR Code
            </DialogTitle>
          </DialogHeader>
          {qrTable && (
            <div className="flex flex-col items-center gap-4">
              <div
                ref={qrRef}
                className="rounded-xl border bg-white p-4"
              >
                <QRCodeSVG
                  value={`${window.location.origin}/menu/${qrTable._id}`}
                  size={240}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Customers scan this QR code to view the menu and place orders
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const svg = qrRef.current?.querySelector("svg")
                    if (!svg) return
                    const canvas = document.createElement("canvas")
                    const ctx = canvas.getContext("2d")
                    const img = new Image()
                    const svgData = new XMLSerializer().serializeToString(svg)
                    img.onload = () => {
                      canvas.width = img.width
                      canvas.height = img.height
                      ctx?.drawImage(img, 0, 0)
                      const a = document.createElement("a")
                      a.download = `table-${qrTable.number}-qr.png`
                      a.href = canvas.toDataURL("image/png")
                      a.click()
                    }
                    img.src =
                      "data:image/svg+xml;base64," + btoa(svgData)
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete table {deleteTarget?.number} (
              {deleteTarget?.name})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
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
