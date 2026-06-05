import mongoose, { Schema, Document } from "mongoose"

export type OfferType = "percent" | "fixed"

export interface IOffer extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  title: string
  description: string
  type: OfferType
  value: number
  minOrder: number
  itemIds: mongoose.Types.ObjectId[]
  validFrom: Date
  validTill: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const OfferSchema = new Schema<IOffer>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    itemIds: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
    validFrom: { type: Date, required: true },
    validTill: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

OfferSchema.index({ restaurantId: 1, isActive: 1 })
OfferSchema.index({ restaurantId: 1, validTill: 1 })
OfferSchema.index({ restaurantId: 1, createdAt: -1 })

export const Offer = mongoose.models.Offer ?? mongoose.model<IOffer>("Offer", OfferSchema)
