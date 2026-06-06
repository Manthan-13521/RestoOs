"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import toast from "react-hot-toast"
import {
  Minus,
  Plus,
  Trash2,
  UtensilsCrossed,
  Receipt,
  Bell,
  Grid3X3,
  Users,
  Search,
  ShoppingBag,
} from "lucide-react"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useTableStore } from "@/store/table-store"
import { formatCurrency } from "@/lib/utils"

interface MenuItem {
  _id: string
  name: string
  price: number
  type: string
  categoryId: string
  status: string
}
interface Category {
  _id: string
  name: string
}

const statusConfig: Record<
  string,
  {
    label: string
    color: string
    border: string
    bg: string
  }
> = {
  empty: {
    label: "Empty",
    color: "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700",
    border: "border-l-green-500",
    bg: "hover:border-green-300 dark:hover:border-green-600",
  },
  reserved: {
    label: "Reserved",
    color:
      "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700",
    border: "border-l-amber-500",
    bg: "hover:border-amber-300 dark:hover:border-amber-600",
  },
  occupied: {
    label: "Occupied",
    color:
      "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700",
    border: "border-l-blue-500",
    bg: "hover:border-blue-300 dark:hover:border-blue-600",
  },
  billing_pending: {
    label: "Billing",
    color:
      "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-700",
    border: "border-l-red-500",
    bg: "hover:border-red-300 dark:hover:border-red-600",
  },
}

export default function StaffManageTablesPage() {
  const tables = useTableStore((s) => s.tables)
  const [loaded, setLoaded] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [cartItems, setCartItems] = useState<
    { menuItemId: string; name: string; price: number; quantity: number }[]
  >([])
  const [orderNote, setOrderNote] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  useRealtimeSync()

  useEffect(() => {
    if (!loaded && (tables.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [tables, loaded])

  useEffect(() => {
    loadMenu()
  }, [])

  async function loadMenu() {
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/menu"),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (menuRes.ok) setMenuItems(await menuRes.json())
    } catch {
      toast.error("Failed to load menu")
    }
  }

  const loading = !loaded

  function handleTableClick(table: any) {
    setSelectedTable(table)
    if (table.status === "empty") {
      setCartItems([])
      setOrderNote("")
      setSelectedCategory("")
      setSearchQuery("")
      setShowOrderDialog(true)
    } else if (table.status === "occupied" || table.status === "billing_pending") {
      setShowBillDialog(true)
    } else {
      toast("This table is reserved")
    }
  }

  const activeTablesCount = tables.filter((t: any) => t.status !== "empty").length
  const occupiedCount = tables.filter((t: any) => t.status === "occupied").length
  const billingCount = tables.filter(
    (t: any) => t.status === "billing_pending"
  ).length

  function addToCart(item: MenuItem) {
    setCartItems((prev) => {
      const e = prev.find((i) => i.menuItemId === item._id)
      return e
        ? prev.map((i) =>
            i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [
            ...prev,
            {
              menuItemId: item._id,
              name: item.name,
              price: item.price,
              quantity: 1,
            },
          ]
    })
  }

  function updateCartQty(id: string, d: number) {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.menuItemId === id
            ? { ...i, quantity: Math.max(0, i.quantity + d) }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  async function placeOrder() {
    if (!selectedTable || cartItems.length === 0) {
      toast.error("Add at least one item")
      return
    }
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable._id,
          items: cartItems.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
          notes: orderNote,
        }),
      })
      if (res.ok) {
        toast.success("Order placed!")
        setShowOrderDialog(false)
        setCartItems([])
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to place order")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const filteredItems = menuItems.filter((i) => {
    const matchesCategory =
      !selectedCategory || i.categoryId === selectedCategory
    const matchesSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && i.status === "available"
  })

  const cartTotal = cartItems.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  )

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">
            {activeTablesCount} active • {occupiedCount} occupied •{" "}
            {billingCount} billing
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <Grid3X3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Empty</p>
                <p className="text-xl font-bold">
                  {tables.filter((t: any) => t.status === "empty").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Occupied</p>
                <p className="text-xl font-bold">{occupiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing</p>
                <p className="text-xl font-bold">{billingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
                <p className="text-xl font-bold">
                  {tables.reduce((s: number, t: any) => s + (t.capacity || 0), 0)}
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
            Ask an admin to add tables before you can start managing them.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((table: any) => {
            const cfg = statusConfig[table.status] || statusConfig.empty
            return (
              <Card
                key={table._id}
                className={cn(
                  "cursor-pointer transition-all border-2 animate-slide-up",
                  cfg.bg
                )}
                onClick={() => handleTableClick(table)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">{table.number}</span>
                    <Badge variant="outline" className={cn(cfg.color)}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{table.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cap: {table.capacity} • {table.section}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              New Order — Table {selectedTable?.number} ({selectedTable?.name})
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
            {/* Menu Side */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="space-y-3 mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Button
                    variant={!selectedCategory ? "default" : "outline"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setSelectedCategory("")}
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat._id}
                      variant={
                        selectedCategory === cat._id ? "default" : "outline"
                      }
                      size="sm"
                      className="shrink-0"
                      onClick={() => setSelectedCategory(cat._id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pr-3">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                      No items found
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <Card
                        key={item._id}
                        className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                        onClick={() => addToCart(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.name}
                              </p>
                              <p className="text-lg font-bold text-primary mt-1">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "ml-2 shrink-0",
                                item.type === "veg"
                                  ? "border-green-500 text-green-500"
                                  : "border-red-500 text-red-500"
                              )}
                            >
                              {item.type === "veg" ? "V" : "NV"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Cart Side */}
            <div className="w-72 shrink-0 flex flex-col border-l pl-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Cart ({cartItems.length})
              </h3>

              <ScrollArea className="flex-1 -mr-2 pr-2">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No items added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQty(item.menuItemId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQty(item.menuItemId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t pt-3 mt-3 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Special instructions..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <Button
                  className="w-full h-11"
                  onClick={placeOrder}
                  disabled={cartItems.length === 0}
                >
                  {cartItems.length > 0
                    ? `Send to Kitchen (${cartItems.length} items)`
                    : "Cart is empty"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-primary" />
              Table {selectedTable?.number} ({selectedTable?.name})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 py-4">
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  selectedTable?.status === "occupied"
                    ? "bg-blue-500"
                    : selectedTable?.status === "billing_pending"
                    ? "bg-red-500"
                    : "bg-green-500"
                )}
              />
              <span className="font-medium capitalize">
                {selectedTable?.status?.replace("_", " ")}
              </span>
            </div>

            <Button
              className="w-full h-11"
              onClick={async () => {
                if (!selectedTable?.currentOrderId) {
                  toast.error("No active order")
                  return
                }
                try {
                  const res = await fetch(
                    `/api/bills?orderId=${selectedTable.currentOrderId}`
                  )
                  const bills = await res.json()
                  if (bills.length > 0) {
                    toast.success("Bill found")
                    window.location.href = "/staff/billing"
                  } else {
                    const billRes = await fetch("/api/bills", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        orderId: selectedTable.currentOrderId,
                        payments: [],
                      }),
                    })
                    if (billRes.ok) {
                      toast.success("Bill generated")
                      window.location.href = "/staff/billing"
                    }
                  }
                } catch {
                  toast.error("Error processing bill")
                }
              }}
            >
              <Receipt className="mr-2 h-5 w-5" />
              Generate Bill
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                if (!selectedTable) return
                try {
                  const res = await fetch("/api/public/waiter-call", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tableNumber: String(selectedTable.number),
                      message: "Staff called waiter",
                    }),
                  })
                  if (res.ok) toast.success("Waiter called!")
                } catch {
                  toast.error("Failed to call waiter")
                }
              }}
            >
              <Bell className="mr-2 h-4 w-4" />
              Call Waiter
            </Button>

            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={async () => {
                if (!selectedTable) return
                try {
                  const res = await fetch(
                    `/api/tables/${selectedTable._id}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        status: "empty",
                        currentOrderId: null,
                      }),
                    }
                  )
                  if (res.ok) {
                    toast.success("Table closed")
                    setShowBillDialog(false)
                  }
                } catch {
                  toast.error("Failed to close table")
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Force Close Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
