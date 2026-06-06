"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const { tableId } = params as { tableId: string }
  const {
    items,
    updateQuantity,
    updateInstructions,
    removeItem,
    getTotal,
    getItemCount,
  } = useCartStore()

  if (items.length === 0)
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-xs">
          Looks like you haven&apos;t added anything yet. Browse the menu to
          find your favorites.
        </p>
        <Button
          size="lg"
          className="rounded-xl h-12 px-8"
          onClick={() => router.push(`/menu/${tableId}`)}
        >
          Browse Menu
        </Button>
      </div>
    )

  const subtotal = getTotal()
  const tax = Math.round(subtotal * 0.05 * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-36 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Your Cart</h1>
            <p className="text-xs text-muted-foreground">
              {getItemCount()} items • Table #{tableId}
            </p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-4 space-y-3">
        {items.map((item) => {
          const itemTotal = item.price * item.quantity
          return (
            <Card
              key={item.menuItemId}
              className={cn(
                "overflow-hidden transition-all hover:shadow-md",
                "ring-1 ring-primary/5"
              )}
            >
              <CardContent className="p-4">
                {/* Item Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Image or placeholder */}
                    <div className="relative w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-0.5 left-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 w-4 p-0 flex items-center justify-center rounded-full text-[7px] font-bold bg-white/90",
                            item.type === "veg"
                              ? "border-green-500 text-green-600"
                              : "border-red-500 text-red-600"
                          )}
                        >
                          {item.type === "veg" ? "V" : "NV"}
                        </Badge>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.menuItemId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quantity Controls & Total */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-background"
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity - 1)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold w-8 text-center text-base">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-background"
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="font-bold text-lg">
                    {formatCurrency(itemTotal)}
                  </span>
                </div>

                {/* Instructions */}
                <div className="mt-3">
                  <Textarea
                    placeholder="Any special instructions? (optional)"
                    className="text-sm min-h-[56px] rounded-xl resize-none"
                    value={item.instructions || ""}
                    onChange={(e) =>
                      updateInstructions(item.menuItemId, e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t">
        <div className="px-4 py-4 space-y-3">
          {/* Order Summary */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            className="w-full h-14 rounded-2xl shadow-xl text-base font-bold"
            onClick={() => router.push(`/menu/${tableId}/checkout`)}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
