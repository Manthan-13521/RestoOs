"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  ShoppingCart,
  UtensilsCrossed,
  Plus,
  Minus,
  Star,
  TrendingUp,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import { cacheMenuItems, getCachedMenuItems } from "@/lib/offline/db"

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  type: "veg" | "nonveg"
  isRecommended: boolean
  isBestseller: boolean
  categoryId: string
  status: string
  image?: string
}

interface Category {
  _id: string
  name: string
}

export default function CustomerMenuPage() {
  const params = useParams()
  const router = useRouter()
  const { tableId } = params as { tableId: string }
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    getItemCount,
    getTotal,
  } = useCartStore()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  async function loadMenu() {
    try {
      const [menuRes, catRes] = await Promise.all([
        fetch(`/api/public/menu?tableId=${tableId}`),
        fetch(`/api/public/categories?tableId=${tableId}`),
      ])
      if (menuRes.ok) {
        const data = await menuRes.json()
        setMenuItems(data)
        cacheMenuItems(data, "offline")
      }
      if (catRes.ok) setCategories(await catRes.json())
    } catch {
      const cached = await getCachedMenuItems("offline")
      if (cached.length > 0) {
        setMenuItems(cached.map((c: any) => c.data))
        toast("Showing cached menu")
      } else toast.error("Failed to load menu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    useCartStore.getState().setTableId(tableId)
    loadMenu()
  }, [tableId])

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus()
  }, [showSearch])

  const availableItems = menuItems.filter(
    (i) => i.status === "available" || i.status === "low_stock"
  )

  const recommended = availableItems.filter(
    (i) => i.isRecommended || i.isBestseller
  )
  const bestsellers = availableItems.filter((i) => i.isBestseller)

  const filteredItems = activeCategory
    ? availableItems.filter((i) => i.categoryId === activeCategory)
    : availableItems

  const searchedItems = searchQuery
    ? filteredItems.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredItems

  const cartCount = getItemCount()
  const cartTotal = getTotal()

  if (loading)
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        {/* Header skeleton */}
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
            ))}
          </div>
          {/* Featured skeleton */}
          <Skeleton className="h-44 rounded-2xl" />
          {/* Items skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-28 animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Our Menu</h1>
              <p className="text-xs text-muted-foreground">
                Table #{tableId} • {availableItems.length} items
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          {showSearch && (
            <div className="mt-3 animate-slide-up">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Search menu..."
                  className="pl-9 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Pills */}
        {!showSearch && (
          <div className="px-4 pb-3 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveCategory("")
                  setSearchQuery("")
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  !activeCategory
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    activeCategory === cat._id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Featured / Recommended Section */}
        {!searchQuery && !activeCategory && recommended.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">Recommended</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {recommended.slice(0, 6).map((item) => (
                <button
                  key={item._id}
                  onClick={() => {
                    addItem({
                      menuItemId: item._id,
                      name: item.name,
                      price: item.price,
                      type: item.type,
                      image: item.image,
                    })
                    toast.success(`${item.name} added!`)
                  }}
                  className="snap-start shrink-0 w-44"
                >
                  <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-md">
                    <div className="relative h-28 bg-muted">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 w-5 p-0 flex items-center justify-center rounded-full text-[9px] font-bold",
                            item.type === "veg"
                              ? "border-green-500 text-green-600 bg-white/90"
                              : "border-red-500 text-red-600 bg-white/90"
                          )}
                        >
                          {item.type === "veg" ? "V" : "NV"}
                        </Badge>
                      </div>
                      {item.isBestseller && (
                        <div className="absolute top-1.5 right-1.5">
                          <Badge className="bg-orange-500 text-white border-0 text-[9px] px-1.5 py-0 h-4">
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                            Hot
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2.5">
                      <p className="font-semibold text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {formatCurrency(item.price)}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Menu Items */}
        <section>
          <h2 className="text-lg font-bold mb-3">
            {activeCategory
              ? categories.find((c) => c._id === activeCategory)?.name ||
                "Items"
              : searchQuery
              ? `Search results for "${searchQuery}"`
              : "All Items"}
          </h2>

          {searchedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                No items found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "This category is empty"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchedItems.map((item) => {
                const cartItem = cartItems.find(
                  (i) => i.menuItemId === item._id
                )
                const qty = cartItem?.quantity || 0

                return (
                  <Card
                    key={item._id}
                    className={cn(
                      "animate-slide-up overflow-hidden transition-all hover:shadow-md",
                      qty > 0 && "ring-2 ring-primary/20"
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Image */}
                        <div className="relative w-28 h-28 shrink-0 bg-muted">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-5 w-5 p-0 flex items-center justify-center rounded-full text-[9px] font-bold bg-white/90",
                                item.type === "veg"
                                  ? "border-green-500 text-green-600"
                                  : "border-red-500 text-red-600"
                              )}
                            >
                              {item.type === "veg" ? "V" : "NV"}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm truncate">
                                {item.name}
                              </h3>
                              <p className="text-2xl font-bold text-primary mt-1">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            {/* Quantity controls */}
                            <div className="shrink-0 mt-1">
                              {qty === 0 ? (
                                <Button
                                  size="sm"
                                  className="rounded-full h-10 w-10 shadow-sm"
                                  onClick={() =>
                                    addItem({
                                      menuItemId: item._id,
                                      name: item.name,
                                      price: item.price,
                                      type: item.type,
                                      image: item.image,
                                    })
                                  }
                                >
                                  <Plus className="h-5 w-5" />
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-1 py-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-primary/20"
                                    onClick={() =>
                                      updateQuantity(item._id, qty - 1)
                                    }
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-bold text-sm w-6 text-center">
                                    {qty}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-primary/20"
                                    onClick={() =>
                                      updateQuantity(item._id, qty + 1)
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            {item.isBestseller && (
                              <Badge
                                variant="outline"
                                className="border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400 text-[9px] px-1.5 py-0 h-4"
                              >
                                <TrendingUp className="h-3 w-3 mr-0.5" />
                                Bestseller
                              </Badge>
                            )}
                            {item.isRecommended && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 text-[9px] px-1.5 py-0 h-4"
                              >
                                <Star className="h-3 w-3 mr-0.5 fill-amber-400" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            className="w-full h-14 rounded-2xl shadow-xl text-base font-bold bg-primary hover:bg-primary/90"
            onClick={() => router.push(`/menu/${tableId}/cart`)}
          >
            <ShoppingCart className="mr-2.5 h-5 w-5" />
            View Cart • {cartCount} item{cartCount !== 1 ? "s" : ""}
            <span className="ml-auto font-bold">
              {formatCurrency(cartTotal)}
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
