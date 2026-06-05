import mongoose, { Schema, Document } from "mongoose"

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "holiday"

export interface IAttendance extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  staffId: mongoose.Types.ObjectId
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: AttendanceStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "holiday"],
      default: "present",
    },
    notes: { type: String },
  },
  { timestamps: true }
)

AttendanceSchema.index({ restaurantId: 1, organizationId: 1, staffId: 1, date: 1 }, { unique: true })
AttendanceSchema.index({ restaurantId: 1, organizationId: 1, date: 1 })
AttendanceSchema.index({ restaurantId: 1, organizationId: 1, status: 1 })

export const Attendance =
  mongoose.models.Attendance ?? mongoose.model<IAttendance>("Attendance", AttendanceSchema)
