import mongoose, { Schema, Document } from "mongoose"

export interface IRestaurantSettings {
  currency: string
  timezone: string
  taxRate: number
  gstin?: string
  serviceCharge: number
  enableKDS: boolean
  enableWhatsApp: boolean
  enableQR: boolean
  enableReservations: boolean
  autoScroll?: boolean
  preparationTimer?: boolean
  kitchenDarkMode?: boolean
}

export interface IRestaurant extends Document {
  organizationId: mongoose.Types.ObjectId
  name: string
  slug: string
  address: string
  phone: string
  email: string
  gstin?: string
  settings: IRestaurantSettings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    gstin: { type: String },
    settings: {
      currency: { type: String, default: "INR" },
      timezone: { type: String, default: "Asia/Kolkata" },
      taxRate: { type: Number, default: 5 },
      gstin: { type: String },
      serviceCharge: { type: Number, default: 0 },
      enableKDS: { type: Boolean, default: true },
      enableWhatsApp: { type: Boolean, default: false },
      enableQR: { type: Boolean, default: true },
      enableReservations: { type: Boolean, default: true },
      autoScroll: { type: Boolean, default: true },
      preparationTimer: { type: Boolean, default: true },
      kitchenDarkMode: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

RestaurantSchema.index({ organizationId: 1, slug: 1 }, { unique: true })

export const Restaurant =
  mongoose.models.Restaurant ?? mongoose.model<IRestaurant>("Restaurant", RestaurantSchema)
