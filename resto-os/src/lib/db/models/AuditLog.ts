import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAuditLog extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId?: mongoose.Types.ObjectId
  action: string
  userId: mongoose.Types.ObjectId
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true },
    action: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
)

AuditLogSchema.index({ organizationId: 1, createdAt: -1 })
AuditLogSchema.index({ restaurantId: 1, createdAt: -1 })
AuditLogSchema.index({ action: 1, createdAt: -1 })

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
