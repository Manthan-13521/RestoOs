import mongoose, { Schema, Document } from "mongoose"

export interface ICustomer extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  name: string
  phone: string
  whatsappOptIn: boolean
  visitCount: number
  lastVisit?: Date
  totalSpent: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsappOptIn: { type: Boolean, default: false },
    visitCount: { type: Number, default: 0 },
    lastVisit: { type: Date },
    totalSpent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CustomerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true })
CustomerSchema.index({ restaurantId: 1, name: 1 })
CustomerSchema.index({ restaurantId: 1, createdAt: -1 })

export const Customer =
  mongoose.models.Customer ?? mongoose.model<ICustomer>("Customer", CustomerSchema)
