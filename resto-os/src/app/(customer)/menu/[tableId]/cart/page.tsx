"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { formatCurrency } from "@/lib/utils"

export default function CartPage() {
  const params = useParams(); const router = useRouter()
  const { tableId } = params as { tableId: string }
  const { items, updateQuantity, updateInstructions, removeItem, getTotal, getItemCount } = useCartStore()

  if (items.length === 0) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"><ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" /><h2 className="text-xl font-bold mb-2">Your cart is empty</h2><p className="text-muted-foreground mb-6">Add items from the menu</p><Button onClick={() => router.push(`/menu/${tableId}`)}>Browse Menu</Button></div>

  return (
    <div className="min-h-screen bg-background pb-32 animate-fade-in">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button><div><h1 className="text-lg font-bold">Your Cart</h1><p className="text-xs text-muted-foreground">{getItemCount()} items • Table #{tableId}</p></div></div>
      </div>
      <div className="px-4 py-4 space-y-3">{items.map(item => (
        <Card key={item.menuItemId}><CardContent className="p-4">
          <div className="flex items-start justify-between mb-2"><div className="flex-1 min-w-0 mr-3"><div className="flex items-center gap-2"><Badge variant="outline" className={`h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold ${item.type === "veg" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}>{item.type === "veg" ? "V" : "NV"}</Badge><h3 className="font-medium">{item.name}</h3></div><p className="text-sm font-bold text-primary mt-1">{formatCurrency(item.price)}</p></div><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeItem(item.menuItemId)}><Trash2 className="h-4 w-4" /></Button></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}><Minus className="h-4 w-4" /></Button><span className="font-bold w-8 text-center">{item.quantity}</span><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}><Plus className="h-4 w-4" /></Button></div><span className="font-bold">{formatCurrency(item.price * item.quantity)}</span></div>
          <div className="mt-3"><Textarea placeholder="Special instructions?" className="text-sm min-h-[60px]" value={item.instructions || ""} onChange={e => updateInstructions(item.menuItemId, e.target.value)} /></div>
        </CardContent></Card>
      ))}</div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="flex items-center justify-between mb-3"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{formatCurrency(getTotal())}</p></div><p className="text-sm text-muted-foreground">Taxes at checkout</p></div>
        <Button className="w-full h-14 rounded-2xl shadow-xl text-base font-bold" onClick={() => router.push(`/menu/${tableId}/checkout`)}>Proceed to Checkout</Button>
      </div>
    </div>
  )
}
