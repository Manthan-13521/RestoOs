import mongoose, { Schema, Document } from "mongoose"

export interface IOrganization extends Document {
  name: string
  slug: string
  ownerId: mongoose.Types.ObjectId | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

OrganizationSchema.index({ slug: 1 })
OrganizationSchema.index({ ownerId: 1 })

export const Organization =
  mongoose.models.Organization ?? mongoose.model<IOrganization>("Organization", OrganizationSchema)
