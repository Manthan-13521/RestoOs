"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Loader2, Smartphone, CreditCard, Banknote } from "lucide-react"
import toast from "react-hot-toast"

export default function CheckoutPage() {
  const params = useParams(); const router = useRouter()
  const { tableId } = params as { tableId: string }
  const { items, getTotal, clearCart } = useCartStore()
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [whatsappOptIn, setWhatsappOptIn] = useState(false); const [placing, setPlacing] = useState(false)

  const subtotal = getTotal(); const tax = Math.round(subtotal * 0.05 * 100) / 100; const total = Math.round((subtotal + tax) * 100) / 100

  async function placeOrder() {
    if (!name.trim() || !phone.trim()) { toast.error("Please provide your name and phone number"); return }
    setPlacing(true)
    try {
      const res = await fetch("/api/public/orders", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ tableId, customerName: name.trim(), customerPhone: phone.trim(), whatsappOptIn, items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, instructions: i.instructions })) }) })
      const data = await res.json()
      if (res.ok) { toast.success("Order placed!"); if (typeof window !== 'undefined') sessionStorage.setItem("lastOrderId", data._id); clearCart(); router.push(`/menu/${tableId}/order/${data._id}`) } else { toast.error(data.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setPlacing(false) }
  }

  if (items.length === 0) { router.push(`/menu/${tableId}`); return null }

  return (
    <div className="min-h-screen bg-background pb-32 animate-fade-in">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button><div><h1 className="text-lg font-bold">Checkout</h1><p className="text-xs text-muted-foreground">Table #{tableId}</p></div></div></div>
      <div className="px-4 py-4 space-y-4">
        <Card><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Your Details</h2><div className="space-y-2"><Label>Name</Label><Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-2"><Label>Phone</Label><Input type="tel" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} /></div><div className="flex items-center justify-between"><div><Label className="text-sm">WhatsApp updates</Label><p className="text-xs text-muted-foreground">Order status and receipt</p></div><Switch checked={whatsappOptIn} onCheckedChange={setWhatsappOptIn} /></div></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Order Summary</h2>{items.map(item => <div key={item.menuItemId} className="flex justify-between text-sm"><span>{item.quantity}x {item.name}</span><span>{formatCurrency(item.price * item.quantity)}</span></div>)}<div className="border-t pt-2 space-y-1"><div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between text-sm text-muted-foreground"><span>GST (5%)</span><span>{formatCurrency(tax)}</span></div><div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div></div></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Payment</h2><p className="text-sm text-muted-foreground">Pay at the counter when ready</p><div className="flex gap-2"><Badge variant="outline" className="flex items-center gap-1 py-2"><Banknote className="h-4 w-4" /> Cash</Badge><Badge variant="outline" className="flex items-center gap-1 py-2"><CreditCard className="h-4 w-4" /> Card</Badge><Badge variant="outline" className="flex items-center gap-1 py-2"><Smartphone className="h-4 w-4" /> UPI</Badge></div></CardContent></Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4"><Button className="w-full h-14 rounded-2xl shadow-xl text-base font-bold" onClick={placeOrder} disabled={placing}>{placing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Placing Order...</> : `Place Order • ${formatCurrency(total)}`}</Button></div>
    </div>
  )
}
