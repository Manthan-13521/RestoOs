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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Users,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react"
import toast from "react-hot-toast"

interface StaffData {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    phone: string
    role: string
    isActive: boolean
  }
  employeeId: string
  salary: number
  isActive: boolean
}

const roleColors: Record<string, string> = {
  admin: "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400",
  manager: "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400",
  cashier: "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400",
  waiter: "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400",
  kitchen_staff: "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400",
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<StaffData | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "waiter",
    salary: "0",
    employeeId: "",
  })
  const [deactivateTarget, setDeactivateTarget] = useState<StaffData | null>(null)

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      const res = await fetch("/api/staff")
      const data = await res.json()
      if (res.ok) setStaff(data)
    } catch {
      toast.error("Failed to load staff")
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "waiter",
      salary: "0",
      employeeId: "",
    })
    setShowDialog(true)
  }

  function openEdit(s: StaffData) {
    setEditing(s)
    setForm({
      name: s.userId?.name || "",
      email: s.userId?.email || "",
      phone: s.userId?.phone || "",
      password: "",
      role: s.userId?.role || "waiter",
      salary: String(s.salary || 0),
      employeeId: s.employeeId || "",
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.phone || !form.role) {
      toast.error("Fill required fields")
      return
    }
    if (!editing && !form.password && form.role !== "kitchen_staff") {
      toast.error("Password required for this role")
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/staff/${editing._id}` : "/api/staff"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salary: Number(form.salary) || 0 }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? "Staff updated!" : "Staff added!")
        setShowDialog(false)
        loadStaff()
      } else toast.error(data.error || "Failed")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(s: StaffData) {
    setDeactivateTarget(s)
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return
    try {
      const res = await fetch(`/api/staff/${deactivateTarget._id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Staff deactivated")
        loadStaff()
        setDeactivateTarget(null)
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed")
        setDeactivateTarget(null)
      }
    } catch {
      toast.error("Something went wrong")
      setDeactivateTarget(null)
    }
  }

  const filtered = search
    ? staff.filter(
        (s) =>
          s.userId?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          s.userId?.email
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          s.employeeId?.includes(search)
      )
    : staff

  const activeStaff = staff.filter((s) => s.isActive)

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
            <p className="text-muted-foreground">
              {activeStaff.length} active • {staff.length} total
            </p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{activeStaff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inactive</p>
                <p className="text-xl font-bold">
                  {staff.length - activeStaff.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Payroll</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    staff.reduce((s, m) => s + (m.salary || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or ID..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Staff Table */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">All Staff</h2>
        </div>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-muted-foreground">
                {search ? "No staff found" : "No staff members"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Add staff to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold text-right">Salary</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right w-24">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, idx) => (
                    <TableRow
                      key={s._id}
                      className={
                        idx % 2 === 0 ? "bg-muted/10" : ""
                      }
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.employeeId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.userId?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.userId?.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            roleColors[s.userId?.role] ||
                            "border-gray-300 text-gray-600"
                          }
                        >
                          {s.userId?.role?.replace("_", " ") || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(s.salary)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.isActive ? "success" : "secondary"}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(s)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Staff" : "Add Staff Member"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update staff details and role"
                : "Create a new staff account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {editing ? "New Password (leave blank)" : "Password"}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, role: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="kitchen_staff">
                      Kitchen Staff
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Salary</Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salary: e.target.value }))
                }
              />
            </div>
            <Button
              className="w-full h-11"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update Staff" : "Add Staff"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Staff</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              {deactivateTarget?.userId?.name || "this staff member"}? They
              will lose access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
