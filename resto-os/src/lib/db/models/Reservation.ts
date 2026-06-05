import mongoose, { Schema, Document } from "mongoose"

export type ReservationStatus = "confirmed" | "cancelled" | "completed" | "no_show"

export interface IReservation extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  tableId: mongoose.Types.ObjectId
  date: Date
  time: string
  guests: number
  status: ReservationStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ReservationSchema = new Schema<IReservation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed", "no_show"],
      default: "confirmed",
    },
    notes: { type: String },
  },
  { timestamps: true }
)

ReservationSchema.index({ restaurantId: 1, date: 1, time: 1 })
ReservationSchema.index({ restaurantId: 1, tableId: 1, date: 1 })
ReservationSchema.index({ restaurantId: 1, status: 1 })
ReservationSchema.index({ restaurantId: 1, createdAt: -1 })

export const Reservation =
  mongoose.models.Reservation ?? mongoose.model<IReservation>("Reservation", ReservationSchema)
