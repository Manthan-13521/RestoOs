import mongoose, { Schema, Document } from "mongoose"

export type TableStatus = "empty" | "reserved" | "occupied" | "billing_pending"

export interface ITable extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  number: number
  name: string
  capacity: number
  section: string
  status: TableStatus
  currentOrderId?: mongoose.Types.ObjectId
  qrCode: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const TableSchema = new Schema<ITable>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    number: { type: Number, required: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    section: { type: String, default: "Main" },
    status: {
      type: String,
      enum: ["empty", "reserved", "occupied", "billing_pending"],
      default: "empty",
    },
    currentOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    qrCode: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

TableSchema.index({ restaurantId: 1, number: 1 }, { unique: true })
TableSchema.index({ restaurantId: 1, status: 1 })
TableSchema.index({ restaurantId: 1, createdAt: -1 })

export const Table = mongoose.models.Table ?? mongoose.model<ITable>("Table", TableSchema)
