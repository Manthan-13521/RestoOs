import mongoose, { Schema, Document } from "mongoose"

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"
export type OrderType = "dinein" | "takeaway" | "delivery"
export type ItemStatus = "new" | "preparing" | "ready" | "served" | "cancelled"

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
  instructions?: string
  status: ItemStatus
  preparationTimer?: number
  startedAt?: Date
}

export interface IOrder extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  orderNumber: string
  tableId?: mongoose.Types.ObjectId
  customerId?: mongoose.Types.ObjectId
  staffId?: mongoose.Types.ObjectId
  items: IOrderItem[]
  status: OrderStatus
  type: OrderType
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  notes?: string
  isPaid: boolean
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  instructions: { type: String },
  status: {
    type: String,
    enum: ["new", "preparing", "ready", "served", "cancelled"],
    default: "new",
  },
  preparationTimer: { type: Number },
  startedAt: { type: Date },
})

const OrderSchema = new Schema<IOrder>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderNumber: { type: String, required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    staffId: { type: Schema.Types.ObjectId, ref: "User" },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["dinein", "takeaway", "delivery"],
      default: "dinein",
    },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
)

OrderSchema.pre("validate", function () {
  if (this.type === "dinein" && !this.tableId) {
    this.invalidate("tableId", "Table is required for dine-in orders")
  }
  if ((this.type === "takeaway" || this.type === "delivery") && this.tableId) {
    this.invalidate("tableId", "Table must not be set for takeaway/delivery orders")
  }
})

OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true })
OrderSchema.index({ restaurantId: 1, tableId: 1, status: 1 })
OrderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 })
OrderSchema.index({ restaurantId: 1, "items.status": 1 })

export const Order = mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema)
