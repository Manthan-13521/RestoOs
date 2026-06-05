import mongoose, { Schema, Document } from "mongoose"

export interface IExpense extends Document {
  organizationId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  title: string
  amount: number
  category: string
  description?: string
  date: Date
  receipt?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    receipt: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
)

ExpenseSchema.index({ restaurantId: 1, organizationId: 1, date: -1 })
ExpenseSchema.index({ restaurantId: 1, organizationId: 1, category: 1 })
ExpenseSchema.index({ restaurantId: 1, createdBy: 1 })

export const Expense =
  mongoose.models.Expense ?? mongoose.model<IExpense>("Expense", ExpenseSchema)
