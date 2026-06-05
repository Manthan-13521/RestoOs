import mongoose, { Schema, Document } from "mongoose"

export interface IShift {
  day: string
  start: string
  end: string
}

export interface IStaff extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  employeeId: string
  shifts: IShift[]
  salary: number
  joiningDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const StaffSchema = new Schema<IStaff>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: { type: String, required: true },
    shifts: [
      {
        day: { type: String },
        start: { type: String },
        end: { type: String },
      },
    ],
    salary: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

StaffSchema.index({ restaurantId: 1, employeeId: 1 }, { unique: true })
StaffSchema.index({ restaurantId: 1, userId: 1 })
StaffSchema.index({ restaurantId: 1, createdAt: -1 })

export const Staff = mongoose.models.Staff ?? mongoose.model<IStaff>("Staff", StaffSchema)
