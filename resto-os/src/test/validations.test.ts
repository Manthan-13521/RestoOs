import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema, tableSchema, menuItemSchema, orderSchema, billSchema, feedbackSchema } from "@/lib/validations"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "123456" })).toBeTruthy()
  })

  it("rejects invalid email", () => {
    expect(() => loginSchema.parse({ email: "notanemail", password: "123456" })).toThrow()
  })

  it("rejects short password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "123" })).toThrow()
  })
})

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    expect(registerSchema.parse({
      organizationName: "Test Org",
      restaurantName: "Test Rest",
      name: "John",
      email: "john@test.com",
      phone: "1234567890",
      password: "password123",
    })).toBeTruthy()
  })

  it("rejects short phone number", () => {
    expect(() => registerSchema.parse({
      organizationName: "Test Org",
      restaurantName: "Test Rest",
      name: "John",
      email: "john@test.com",
      phone: "123",
      password: "password123",
    })).toThrow()
  })
})

describe("tableSchema", () => {
  it("accepts valid table", () => {
    expect(tableSchema.parse({ number: 1, name: "Table 1", capacity: 4 })).toBeTruthy()
  })

  it("rejects zero capacity", () => {
    expect(() => tableSchema.parse({ number: 1, name: "Table 1", capacity: 0 })).toThrow()
  })

  it("rejects missing name", () => {
    expect(() => tableSchema.parse({ number: 1, capacity: 4 })).toThrow()
  })
})

describe("menuItemSchema", () => {
  it("accepts valid menu item", () => {
    expect(menuItemSchema.parse({ name: "Burger", price: 10, categoryId: "cat1", type: "veg" })).toBeTruthy()
  })

  it("rejects negative price", () => {
    expect(() => menuItemSchema.parse({ name: "Burger", price: -5, categoryId: "cat1", type: "veg" })).toThrow()
  })
})

describe("orderSchema", () => {
  it("accepts valid order", () => {
    expect(orderSchema.parse({ tableId: "t1", items: [{ menuItemId: "m1", quantity: 2 }] })).toBeTruthy()
  })

  it("rejects empty items", () => {
    expect(() => orderSchema.parse({ tableId: "t1", items: [] })).toThrow()
  })
})

describe("billSchema", () => {
  it("accepts valid bill", () => {
    expect(billSchema.parse({ orderId: "o1", payments: [{ method: "cash", amount: 100 }] })).toBeTruthy()
  })

  it("rejects invalid payment method", () => {
    expect(() => billSchema.parse({ orderId: "o1", payments: [{ method: "bitcoin", amount: 100 }] })).toThrow()
  })
})

describe("feedbackSchema", () => {
  it("accepts valid feedback", () => {
    expect(feedbackSchema.parse({ orderId: "o1", foodRating: 5, serviceRating: 4, experience: 3 })).toBeTruthy()
  })

  it("rejects out of range rating", () => {
    expect(() => feedbackSchema.parse({ orderId: "o1", foodRating: 6, serviceRating: 4, experience: 3 })).toThrow()
  })
})
