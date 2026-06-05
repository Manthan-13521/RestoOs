import mongoose, { Schema, Document } from "mongoose"

export interface ISalary extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  staffId: mongoose.Types.ObjectId
  amount: number
  bonus: number
  deduction: number
  netAmount: number
  period: string
  paid: boolean
  paidOn?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const SalarySchema = new Schema<ISalary>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    amount: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    period: { type: String, required: true },
    paid: { type: Boolean, default: false },
    paidOn: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
)

SalarySchema.index({ restaurantId: 1, staffId: 1, period: 1 }, { unique: true })
SalarySchema.index({ restaurantId: 1, paid: 1 })
SalarySchema.index({ restaurantId: 1, createdAt: -1 })

export const Salary = mongoose.models.Salary ?? mongoose.model<ISalary>("Salary", SalarySchema)
