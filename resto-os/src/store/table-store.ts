import { create } from "zustand"

export interface Table {
  _id: string
  number: number
  name: string
  capacity: number
  section: string
  status: "empty" | "reserved" | "occupied" | "billing_pending"
  currentOrderId?: string
}

interface TableStore {
  tables: Table[]
  selectedTable: Table | null
  setTables: (tables: Table[]) => void
  setSelectedTable: (table: Table | null) => void
  updateTableStatus: (
    tableId: string,
    status: Table["status"],
    orderId?: string
  ) => void
}

export const useTableStore = create<TableStore>()((set, get) => ({
  tables: [],
  selectedTable: null,
  setTables: (tables) => set({ tables }),
  setSelectedTable: (selectedTable) => set({ selectedTable }),
  updateTableStatus: (tableId, status, currentOrderId) =>
    set({
      tables: get().tables.map((t) =>
        t._id === tableId ? { ...t, status, currentOrderId } : t
      ),
      selectedTable:
        get().selectedTable?._id === tableId
          ? { ...get().selectedTable!, status, currentOrderId }
          : get().selectedTable,
    }),
}))
