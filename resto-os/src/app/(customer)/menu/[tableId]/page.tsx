"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, UtensilsCrossed, Plus, Minus } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import { cacheMenuItems, getCachedMenuItems } from "@/lib/offline/db"

interface MenuItem { _id: string; name: string; description: string; price: number; type: "veg"|"nonveg"; isRecommended: boolean; isBestseller: boolean; categoryId: string; status: string; image?: string }
interface Category { _id: string; name: string }

export default function CustomerMenuPage() {
  const params = useParams(); const router = useRouter()
  const { tableId } = params as { tableId: string }
  const { items: cartItems, addItem, updateQuantity, getItemCount, getTotal } = useCartStore()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); const [categories, setCategories] = useState<Category[]>([]); const [loading, setLoading] = useState(true); const [activeCategory, setActiveCategory] = useState("")

  async function loadMenu() {
    try {
      const [menuRes, catRes] = await Promise.all([fetch(`/api/public/menu?tableId=${tableId}`), fetch(`/api/public/categories?tableId=${tableId}`)])
      if (menuRes.ok) { const data = await menuRes.json(); setMenuItems(data); cacheMenuItems(data, "offline") }
      if (catRes.ok) setCategories(await catRes.json())
    } catch {
      const cached = await getCachedMenuItems("offline")
      if (cached.length > 0) { setMenuItems(cached.map((c: any) => c.data)); toast("Showing cached menu") }
      else toast.error("Failed to load menu")
    } finally { setLoading(false) }
  }

  useEffect(() => { useCartStore.getState().setTableId(tableId); loadMenu() }, [tableId])

  const availableItems = menuItems.filter(i => i.status === "available" || i.status === "low_stock")
  const filteredItems = activeCategory ? availableItems.filter(i => i.categoryId === activeCategory) : availableItems

  if (loading) return <div className="min-h-screen bg-background p-4 space-y-4"><Skeleton className="h-8 w-48" /><div className="flex gap-2">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}</div>{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"><UtensilsCrossed className="h-5 w-5 text-primary-foreground" /></div><div><h1 className="text-lg font-bold">Our Menu</h1><p className="text-xs text-muted-foreground">Table #{tableId}</p></div></div>
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-3 sticky top-0 bg-background">
          <Button variant={!activeCategory ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setActiveCategory("")}>All</Button>
          {categories.map(cat => <Button key={cat._id} variant={activeCategory === cat._id ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setActiveCategory(cat._id)}>{cat.name}</Button>)}
        </div>
        <div className="space-y-3">{filteredItems.length === 0 ? <div className="text-center py-12 text-muted-foreground">No items available</div> : filteredItems.map(item => {
          const cartItem = cartItems.find(i => i.menuItemId === item._id); const qty = cartItem?.quantity || 0
          return <Card key={item._id} className="animate-slide-up"><CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><Badge variant="outline" className={cn("h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold", item.type === "veg" ? "border-green-500 text-green-500" : "border-red-500 text-red-500")}>{item.type === "veg" ? "V" : "NV"}</Badge><h3 className="font-medium">{item.name}</h3></div>{item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}<p className="text-lg font-bold mt-2">{formatCurrency(item.price)}</p></div>
              <div className="flex flex-col items-center gap-2">{qty === 0 ? <Button size="sm" className="rounded-full h-10 w-10" onClick={() => addItem({menuItemId: item._id, name: item.name, price: item.price, type: item.type, image: item.image})}><Plus className="h-5 w-5" /></Button> : <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item._id, qty - 1)}><Minus className="h-4 w-4" /></Button><span className="font-bold w-6 text-center">{qty}</span><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item._id, qty + 1)}><Plus className="h-4 w-4" /></Button></div>}</div>
            </div>
          </CardContent></Card>
        })}</div>
      </div>
      {cartItems.length > 0 && <div className="fixed bottom-4 left-4 right-4 z-20"><Button className="w-full h-14 rounded-2xl shadow-xl text-base font-bold" onClick={() => router.push(`/menu/${tableId}/cart`)}><ShoppingCart className="mr-2 h-5 w-5" />Cart ({getItemCount()}) • {formatCurrency(getTotal())}</Button></div>}
    </div>
  )
}
