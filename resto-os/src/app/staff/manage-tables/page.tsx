"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useTableStore } from "@/store/table-store"

interface MenuItem { _id: string; name: string; price: number; type: string; categoryId: string; status: string }
interface Category { _id: string; name: string }

const statusColors: Record<string, string> = { empty: "border-green-500/30 hover:border-green-500", reserved: "border-yellow-500/30 hover:border-yellow-500", occupied: "border-blue-500/30 hover:border-blue-500", billing_pending: "border-red-500/30 hover:border-red-500" }
const statusLabels: Record<string, string> = { empty: "Empty", reserved: "Reserved", occupied: "Occupied", billing_pending: "Billing" }

export default function StaffManageTablesPage() {
  const tables = useTableStore(s => s.tables)
  const [loaded, setLoaded] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false); const [showBillDialog, setShowBillDialog] = useState(false)
  const [categories, setCategories] = useState<Category[]>([]); const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [cartItems, setCartItems] = useState<{ menuItemId: string; name: string; price: number; quantity: number }[]>([])
  const [orderNote, setOrderNote] = useState("")
  useRealtimeSync()

  useEffect(() => {
    if (!loaded && (tables.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [tables, loaded])
  useEffect(() => { loadMenu() }, [])

  async function loadMenu() { try { const [catRes, menuRes] = await Promise.all([fetch("/api/categories"), fetch("/api/menu")]); if (catRes.ok) setCategories(await catRes.json()); if (menuRes.ok) setMenuItems(await menuRes.json()) } catch { toast.error("Failed to load menu") } }

  const loading = !loaded

  function handleTableClick(table: any) {
    setSelectedTable(table)
    if (table.status === "empty") { setCartItems([]); setOrderNote(""); setShowOrderDialog(true) }
    else if (table.status === "occupied" || table.status === "billing_pending") setShowBillDialog(true)
    else toast("This table is reserved")
  }

  function addToCart(item: MenuItem) { setCartItems(prev => { const e = prev.find(i => i.menuItemId === item._id); return e ? prev.map(i => i.menuItemId === item._id ? {...i, quantity: i.quantity + 1} : i) : [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }] }) }
  function updateCartQty(id: string, d: number) { setCartItems(prev => prev.map(i => i.menuItemId === id ? {...i, quantity: Math.max(0, i.quantity + d)} : i).filter(i => i.quantity > 0)) }

  async function placeOrder() {
    if (!selectedTable || cartItems.length === 0) { toast.error("Add at least one item"); return }
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ tableId: selectedTable._id, items: cartItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })), notes: orderNote }) })
      if (res.ok) { toast.success("Order placed!"); setShowOrderDialog(false); setCartItems([]) } else { const data = await res.json(); toast.error(data.error || "Failed to place order") }
    } catch { toast.error("Something went wrong") }
  }

  const filteredItems = selectedCategory ? menuItems.filter(i => i.categoryId === selectedCategory && i.status === "available") : menuItems.filter(i => i.status === "available")
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{Array.from({length:12}).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold tracking-tight">Tables</h1><p className="text-muted-foreground">{tables.filter(t => t.status !== "empty").length} active tables</p></div>
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{tables.length === 0 ? <div className="col-span-full text-center py-12 text-muted-foreground">No tables configured</div> : tables.map(table => (
        <Card key={table._id} className={cn("cursor-pointer transition-all hover:shadow-lg border-2 animate-slide-up", statusColors[table.status])} onClick={() => handleTableClick(table)}>
          <CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-2xl font-bold">{table.number}</span><Badge variant="outline" className={cn(table.status === "empty" && "border-green-500 text-green-500", table.status === "reserved" && "border-yellow-500 text-yellow-500", table.status === "occupied" && "border-blue-500 text-blue-500", table.status === "billing_pending" && "border-red-500 text-red-500")}>{statusLabels[table.status]}</Badge></div><p className="font-medium text-sm">{table.name}</p><p className="text-xs text-muted-foreground">Cap: {table.capacity} • {table.section}</p></CardContent>
        </Card>
      ))}</div>

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Order — Table {selectedTable?.number} ({selectedTable?.name})</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("")}>All</Button>
              {categories.map(cat => <Button key={cat._id} variant={selectedCategory === cat._id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat._id)}>{cat.name}</Button>)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{filteredItems.map(item => (
              <Card key={item._id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => addToCart(item)}>
                <CardContent className="p-3"><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{item.name}</p><p className="text-sm font-bold text-primary">₹{item.price}</p></div><Badge variant="outline" className={item.type === "veg" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>{item.type === "veg" ? "V" : "NV"}</Badge></div></CardContent>
              </Card>
            ))}</div>
            {cartItems.length > 0 && <div className="border rounded-lg p-4 space-y-3"><h3 className="font-semibold">Cart</h3>{cartItems.map(item => (
              <div key={item.menuItemId} className="flex items-center justify-between">
                <div className="flex-1"><p className="text-sm">{item.name}</p><p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p></div>
                <div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.menuItemId, -1)}><Minus className="h-3 w-3" /></Button><span className="w-6 text-center text-sm">{item.quantity}</span><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.menuItemId, 1)}><Plus className="h-3 w-3" /></Button></div>
              </div>
            ))}<div className="flex items-center justify-between pt-2 border-t"><div className="space-y-1 flex-1 mr-4"><Label>Notes</Label><Input placeholder="Special instructions..." value={orderNote} onChange={e => setOrderNote(e.target.value)} /></div><div className="text-right"><p className="text-sm text-muted-foreground">Total</p><p className="text-lg font-bold">₹{cartTotal}</p></div></div><Button className="w-full" onClick={placeOrder}>Send to Kitchen</Button></div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Table {selectedTable?.number} ({selectedTable?.name})</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">Table is currently {selectedTable?.status}</p>
            <div className="flex gap-3">
              <Button variant="default" className="flex-1" onClick={async () => {
                if (!selectedTable?.currentOrderId) { toast.error("No active order"); return }
                try { const res = await fetch(`/api/bills?orderId=${selectedTable.currentOrderId}`); const bills = await res.json(); if (bills.length > 0) toast.success("Bill found"); else { const billRes = await fetch("/api/bills", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ orderId: selectedTable.currentOrderId, payments: [] }) }); if (billRes.ok) { toast.success("Bill generated") } } } catch { toast.error("Error processing bill") }
              }}>View / Generate Bill</Button>
            </div>
            {(selectedTable?.status === "occupied" || selectedTable?.status === "billing_pending") && <Button variant="secondary" className="w-full" onClick={async () => {
              if (!selectedTable) return
              try { const res = await fetch("/api/public/waiter-call", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ tableNumber: String(selectedTable.number), message: "Staff called waiter" }) }); if (res.ok) toast.success("Waiter called!") } catch { toast.error("Failed to call waiter") }
            }}>Call Waiter</Button>}
            <Button variant="ghost" className="w-full" onClick={async () => {
              if (!selectedTable) return
              try { const res = await fetch(`/api/tables/${selectedTable._id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ status: "empty", currentOrderId: null }) }); if (res.ok) { toast.success("Table closed"); setShowBillDialog(false) } } catch { toast.error("Failed to close table") }
            }}><Trash2 className="mr-2 h-4 w-4" />Force Close Table</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
