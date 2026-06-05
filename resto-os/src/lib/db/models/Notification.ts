import mongoose, { Schema, Document } from "mongoose"

export type NotificationType = "order" | "waiter_call" | "payment" | "reservation" | "system" | "feedback"

export interface INotification extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  recipients: mongoose.Types.ObjectId[]
  readBy: mongoose.Types.ObjectId[]
  referenceId?: string
  referenceType?: string
  priority: "low" | "medium" | "high"
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    type: {
      type: String,
      enum: ["order", "waiter_call", "payment", "reservation", "system", "feedback"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    referenceId: { type: String },
    referenceType: { type: String },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true }
)

NotificationSchema.index({ restaurantId: 1, organizationId: 1, createdAt: -1 })
NotificationSchema.index({ restaurantId: 1, organizationId: 1, recipients: 1, readBy: 1 })
NotificationSchema.index({ restaurantId: 1, organizationId: 1, type: 1 })
NotificationSchema.index({ restaurantId: 1, organizationId: 1, priority: 1, createdAt: -1 })

export const Notification =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema)
