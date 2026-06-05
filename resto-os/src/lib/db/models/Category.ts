import mongoose, { Schema, Document } from "mongoose"

export interface ICategory extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  name: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CategorySchema.index({ restaurantId: 1, sortOrder: 1 })
CategorySchema.index({ restaurantId: 1, createdAt: -1 })

export const Category =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema)
