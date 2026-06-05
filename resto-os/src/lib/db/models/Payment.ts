import mongoose, { Schema, Document } from "mongoose"

export type PaymentMethod = "cash" | "card" | "upi" | "online"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  billId?: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  method: PaymentMethod
  amount: number
  reference?: string
  status: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  refundReason?: string
  refundedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    billId: { type: Schema.Types.ObjectId, ref: "Bill" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    method: { type: String, enum: ["cash", "card", "upi", "online"], required: true },
    amount: { type: Number, required: true },
    reference: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    refundReason: { type: String },
    refundedAt: { type: Date },
  },
  { timestamps: true }
)

PaymentSchema.index({ restaurantId: 1, organizationId: 1, billId: 1 })
PaymentSchema.index({ restaurantId: 1, organizationId: 1, status: 1 })
PaymentSchema.index({ restaurantId: 1, organizationId: 1, createdAt: -1 })
PaymentSchema.index({ razorpayOrderId: 1 })
PaymentSchema.index({ razorpayPaymentId: 1 })
PaymentSchema.index({ restaurantId: 1, orderId: 1 })

export const Payment =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema)
