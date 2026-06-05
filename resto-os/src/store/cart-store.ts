import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  instructions?: string
  type: "veg" | "nonveg"
  image?: string
}

interface CartStore {
  tableId: string | null
  items: CartItem[]
  setTableId: (tableId: string) => void
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateInstructions: (menuItemId: string, instructions: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tableId: null,
      items: [],
      setTableId: (tableId) => set({ tableId }),
      addItem: (item) => {
        const existing = get().items.find((i) => i.menuItemId === item.menuItemId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] })
        }
      },
      removeItem: (menuItemId) =>
        set({ items: get().items.filter((i) => i.menuItemId !== menuItemId) }),
      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        })
      },
      updateInstructions: (menuItemId, instructions) =>
        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, instructions } : i
          ),
        }),
      clearCart: () => set({ items: [], tableId: null }),
      getTotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    { name: "restoos-cart" }
  )
)
