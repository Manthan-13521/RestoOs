import mongoose, { Schema, Document } from "mongoose"

export type UserRole = "superadmin" | "admin" | "manager" | "cashier" | "waiter" | "kitchen_staff"

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
  permissions: string[]
  isActive: boolean
  image?: string
  emailVerified?: Date
  resetToken?: string
  resetTokenExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "cashier", "waiter", "kitchen_staff"],
      default: "waiter",
    },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    image: { type: String },
    emailVerified: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
)

UserSchema.index({ email: 1, restaurantId: 1 }, { unique: true })
UserSchema.index({ organizationId: 1 })
UserSchema.index({ restaurantId: 1, role: 1 })
UserSchema.index({ restaurantId: 1, createdAt: -1 })
UserSchema.index({ resetToken: 1 }, { sparse: true })

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema)
