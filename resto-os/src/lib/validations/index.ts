import { z } from "zod"

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: { message: string; details: any } } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return { success: false, error: { message: "Validation failed", details: result.error.issues } }
  }
  return { success: true, data: result.data }
}

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  restaurantName: z.string().min(2, "Restaurant name is required"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const tableSchema = z.object({
  number: z.number().positive("Table number must be positive"),
  name: z.string().min(1, "Table name is required"),
  capacity: z.number().positive("Capacity must be positive"),
  section: z.string().optional(),
})

export const menuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["veg", "nonveg"]),
  image: z.string().optional(),
  status: z.enum(["available", "low_stock", "out_of_stock", "available_after"]).optional(),
  stock: z.number().optional(),
  preparationTime: z.number().optional(),
  sortOrder: z.number().optional(),
  isRecommended: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
})

export const orderSchema = z
  .object({
    type: z.enum(["dinein", "takeaway", "delivery"]).optional().default("dinein"),
    tableId: z.string().optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1),
          quantity: z.number().min(1, "Quantity must be at least 1"),
          instructions: z.string().optional(),
        })
      )
      .min(1, "At least one item is required"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "dinein" && !data.tableId) return false
      if ((data.type === "takeaway" || data.type === "delivery") && data.tableId) return false
      return true
    },
    { message: "tableId is required for dine-in and must not be set for takeaway/delivery", path: ["tableId"] }
  )

export const billSchema = z.object({
  orderId: z.string().min(1),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  gstDetails: z.object({
    cgst: z.number().optional(),
    sgst: z.number().optional(),
    igst: z.number().optional(),
  }).optional(),
  payments: z
    .array(
      z.object({
        method: z.enum(["cash", "card", "upi", "online"]),
        amount: z.number().positive("Amount must be positive"),
      })
    )
    .default([]),
})

export const reservationSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  guests: z.number().min(1, "At least 1 guest required"),
  tableId: z.string().optional(),
  notes: z.string().optional(),
})

export const feedbackSchema = z.object({
  orderId: z.string().min(1),
  foodRating: z.number().min(1).max(5),
  serviceRating: z.number().min(1).max(5),
  experience: z.number().min(1).max(5),
  complaint: z.string().optional(),
})

export const staffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone required"),
  role: z.enum(["admin", "manager", "cashier", "waiter", "kitchen_staff"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  salary: z.number().positive().optional(),
})

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
})

export const whatsappSchema = z.object({
  to: z.string().min(10, "Valid phone required"),
  template: z.string().min(1, "Template is required"),
  variables: z.record(z.string(), z.string()).optional(),
})
