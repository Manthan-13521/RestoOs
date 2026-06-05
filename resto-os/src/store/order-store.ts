import { create } from "zustand"

interface OrderItem {
  _id: string
  menuItemId: string
  name: string
  quantity: number
  price: number
  instructions?: string
  status: string
}

interface Order {
  _id: string
  orderNumber: string
  tableId?: any
  tableName?: string
  items: OrderItem[]
  status: string
  total: number
  subtotal?: number
  isPaid: boolean
  createdAt: string
  notes?: string
}

interface OrderStore {
  orders: Order[]
  activeOrder: Order | null
  kitchenOrders: Order[]
  setOrders: (orders: Order[]) => void
  setActiveOrder: (order: Order | null) => void
  setKitchenOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: string) => void
  updateItemStatus: (orderId: string, itemId: string, status: string) => void
  removeOrder: (orderId: string) => void
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  activeOrder: null,
  kitchenOrders: [],
  setOrders: (orders) => set({ orders }),
  setActiveOrder: (activeOrder) => set({ activeOrder }),
  setKitchenOrders: (kitchenOrders) => set({ kitchenOrders }),
  addOrder: (order) => set({ orders: [order, ...get().orders] }),
  updateOrderStatus: (orderId, status) => {
    const updateOrders = (orders: Order[]) =>
      orders.map((o) => (o._id === orderId ? { ...o, status } : o))
    set({
      orders: updateOrders(get().orders),
      kitchenOrders: updateOrders(get().kitchenOrders),
      activeOrder:
        get().activeOrder?._id === orderId
          ? { ...get().activeOrder!, status }
          : get().activeOrder,
    })
  },
  updateItemStatus: (orderId, itemId, status) => {
    const updateItems = (orders: Order[]) =>
      orders.map((o) =>
        o._id === orderId
          ? {
              ...o,
              items: o.items.map((i) =>
                i._id === itemId ? { ...i, status } : i
              ),
            }
          : o
      )
    set({
      orders: updateItems(get().orders),
      kitchenOrders: updateItems(get().kitchenOrders),
    })
  },
  removeOrder: (orderId) =>
    set({
      orders: get().orders.filter((o) => o._id !== orderId),
      kitchenOrders: get().kitchenOrders.filter((o) => o._id !== orderId),
    }),
}))
