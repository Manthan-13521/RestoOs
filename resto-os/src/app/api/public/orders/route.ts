import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { Order } from "@/lib/db/models/Order"
import { Table } from "@/lib/db/models/Table"
import { MenuItem } from "@/lib/db/models/MenuItem"
import { Customer } from "@/lib/db/models/Customer"
import { orderSchema, validateBody } from "@/lib/validations"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"

async function handler(req: Request) {
  try {
    await connectDB()

    const body = await req.json()
    const { customerName, customerPhone, whatsappOptIn, items, notes } = body
    const tableId = body.tableId

    if (!tableId || typeof tableId !== "string") {
      return NextResponse.json({ error: "tableId is required" }, { status: 400 })
    }
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }
    if (!customerPhone || typeof customerPhone !== "string" || customerPhone.length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    const table = await Table.findById(tableId).lean()
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }
    if (table.status === "reserved") {
      return NextResponse.json({ error: "Table is reserved" }, { status: 400 })
    }

    const result = validateBody(orderSchema, { tableId, items, notes })
    if (!result.success) {
      return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
    }

    const menuItemIds = items.map((i: any) => i.menuItemId)
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId: table.restaurantId,
    }).lean()

    const menuItemMap = new Map(menuItems.map((m: any) => [m._id.toString(), m]))

    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId)
      if (!menuItem) {
        return NextResponse.json({ error: `Menu item ${item.menuItemId} not found` }, { status: 404 })
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: `Invalid quantity for "${menuItem.name}"` }, { status: 400 })
      }
    }

    let customer = await Customer.findOne({
      restaurantId: table.restaurantId,
      phone: customerPhone.trim(),
    })

    if (customer) {
      customer = await Customer.findByIdAndUpdate(
        customer._id,
        { $inc: { visitCount: 1 }, lastVisit: new Date() },
        { new: true }
      )
    } else {
      customer = await Customer.create({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        whatsappOptIn: whatsappOptIn || false,
        organizationId: table.organizationId,
        restaurantId: table.restaurantId,
        visitCount: 1,
      })
    }

    const now = new Date()
    const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const order = await Order.create({
      orderNumber,
      type: "dinein",
      tableId,
      customerId: customer._id,
      items: items.map((i: any) => {
        const menuItem = menuItemMap.get(i.menuItemId)
        return {
          menuItemId: i.menuItemId,
          name: menuItem.name,
          quantity: i.quantity,
          price: menuItem.price,
          instructions: i.instructions || "",
        }
      }),
      notes: notes || "",
      organizationId: table.organizationId,
      restaurantId: table.restaurantId,
    })

    await Table.findByIdAndUpdate(tableId, { status: "occupied", currentOrderId: order._id })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error("Public order creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 })
  }
}

export const POST = withPublicRateLimit(handler, "public")
