import mongoose, { Schema, Document } from "mongoose"

export type BillStatus = "pending" | "paid" | "partial" | "cancelled"

export interface ISplitPayment {
  method: "cash" | "card" | "upi" | "online"
  amount: number
  reference?: string
  status: "pending" | "completed"
}

export interface IBill extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  staffId?: mongoose.Types.ObjectId
  billNumber: string
  subtotal: number
  taxRate: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  paidAmount: number
  remainingAmount: number
  status: BillStatus
  payments: ISplitPayment[]
  gstDetails?: {
    cgst: number
    sgst: number
    igst: number
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const SplitPaymentSchema = new Schema<ISplitPayment>({
  method: { type: String, enum: ["cash", "card", "upi", "online"], required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  status: { type: String, enum: ["pending", "completed"], default: "completed" },
})

const BillSchema = new Schema<IBill>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User" },
    billNumber: { type: String, required: true },
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 5 },
    tax: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "partial", "cancelled"],
      default: "pending",
    },
    payments: [SplitPaymentSchema],
    gstDetails: {
      cgst: { type: Number },
      sgst: { type: Number },
      igst: { type: Number },
    },
    notes: { type: String },
  },
  { timestamps: true }
)

BillSchema.index({ restaurantId: 1, billNumber: 1 }, { unique: true })
BillSchema.index({ restaurantId: 1, orderId: 1 })
BillSchema.index({ restaurantId: 1, status: 1 })
BillSchema.index({ restaurantId: 1, createdAt: -1 })

export const Bill = mongoose.models.Bill ?? mongoose.model<IBill>("Bill", BillSchema)
