import mongoose, { Schema, Document } from "mongoose"

export type WhatsAppStatus = "pending" | "sent" | "delivered" | "read" | "failed"

export interface IWhatsAppLog extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  to: string
  template: string
  variables: Record<string, string>
  messageId?: string
  status: WhatsAppStatus
  error?: string
  createdAt: Date
}

const WhatsAppLogSchema = new Schema<IWhatsAppLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    to: { type: String, required: true },
    template: { type: String, required: true },
    variables: { type: Schema.Types.Mixed, default: {} },
    messageId: { type: String },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "pending",
    },
    error: { type: String },
  },
  { timestamps: true }
)

WhatsAppLogSchema.index({ restaurantId: 1, organizationId: 1, status: 1 })
WhatsAppLogSchema.index({ restaurantId: 1, organizationId: 1, createdAt: -1 })
WhatsAppLogSchema.index({ messageId: 1 }, { sparse: true })

export const WhatsAppLog =
  mongoose.models.WhatsAppLog ?? mongoose.model<IWhatsAppLog>("WhatsAppLog", WhatsAppLogSchema)
