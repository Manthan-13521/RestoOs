import mongoose, { Schema, Document } from "mongoose"

export interface IFeedback extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  customerId?: mongoose.Types.ObjectId
  foodRating: number
  serviceRating: number
  experience: number
  complaint?: string
  createdAt: Date
  updatedAt: Date
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    foodRating: { type: Number, required: true, min: 1, max: 5 },
    serviceRating: { type: Number, required: true, min: 1, max: 5 },
    experience: { type: Number, required: true, min: 1, max: 5 },
    complaint: { type: String },
  },
  { timestamps: true }
)

FeedbackSchema.index({ restaurantId: 1, organizationId: 1, createdAt: -1 })
FeedbackSchema.index({ restaurantId: 1, organizationId: 1, foodRating: 1 })
FeedbackSchema.index({ restaurantId: 1, organizationId: 1, serviceRating: 1 })
FeedbackSchema.index({ restaurantId: 1, organizationId: 1, experience: 1 })

export const Feedback =
  mongoose.models.Feedback ?? mongoose.model<IFeedback>("Feedback", FeedbackSchema)
