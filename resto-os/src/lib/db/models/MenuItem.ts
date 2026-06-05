import mongoose, { Schema, Document } from "mongoose"

export type ItemType = "veg" | "nonveg"
export type ItemStatus = "available" | "low_stock" | "out_of_stock" | "available_after"

export interface IMenuItem extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  categoryId: mongoose.Types.ObjectId
  name: string
  description: string
  price: number
  image?: string
  type: ItemType
  status: ItemStatus
  stock: number
  availableAfter?: string
  isRecommended: boolean
  isBestseller: boolean
  preparationTime: number
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    image: { type: String },
    type: { type: String, enum: ["veg", "nonveg"], required: true },
    status: {
      type: String,
      enum: ["available", "low_stock", "out_of_stock", "available_after"],
      default: "available",
    },
    stock: { type: Number, default: 999 },
    availableAfter: { type: String },
    isRecommended: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 10 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

MenuItemSchema.index({ restaurantId: 1, categoryId: 1, sortOrder: 1 })
MenuItemSchema.index({ restaurantId: 1, status: 1 })
MenuItemSchema.index({ restaurantId: 1, isRecommended: 1 })
MenuItemSchema.index({ restaurantId: 1, isBestseller: 1 })
MenuItemSchema.index({ restaurantId: 1, createdAt: -1 })

export const MenuItem =
  mongoose.models.MenuItem ?? mongoose.model<IMenuItem>("MenuItem", MenuItemSchema)
