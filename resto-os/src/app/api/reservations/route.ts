import { Reservation } from "@/lib/db/models/Reservation"
import { Customer } from "@/lib/db/models/Customer"
import { Table } from "@/lib/db/models/Table"
import { withAuth, apiSuccess, apiError, parsePagination } from "@/lib/db/helpers"
import { reservationSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get("page")
  const date = searchParams.get("date")
  const status = searchParams.get("status")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (date) filter.date = new Date(date)
  if (status) filter.status = status

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [reservations, total] = await Promise.all([
      Reservation.find(filter).populate("customerId", "name phone").populate("tableId", "number name").sort({ date: -1, time: 1 }).skip(skip).limit(limit).lean(),
      Reservation.countDocuments(filter),
    ])
    return apiSuccess({ data: reservations, total, page, limit })
  }

  const reservations = await Reservation.find(filter)
    .populate("customerId", "name phone")
    .populate("tableId", "number name")
    .sort({ date: -1, time: 1 })
    .limit(100)
    .lean()

  return apiSuccess(reservations)
})

export const POST = withAuth(async (req, context, session) => {
  const body = await req.json()
  const result = validateBody(reservationSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { customerName, customerPhone, date, time, guests, tableId, notes } = result.data

  const reservationDate = new Date(date)

  let customer = await Customer.findOne({
    restaurantId: session.user.restaurantId,
    phone: customerPhone,
  })

  if (!customer) {
    customer = await Customer.create({
      organizationId: session.user.organizationId,
      restaurantId: session.user.restaurantId,
      name: customerName,
      phone: customerPhone,
    })
  }

  let assignedTableId = tableId

  if (!assignedTableId) {
    const availableTable = await Table.findOne({
      restaurantId: session.user.restaurantId,
      status: "empty",
      capacity: { $gte: guests },
    }).sort({ capacity: 1 })

    if (!availableTable) {
      return apiError("No available table for this party size", 400)
    }
    assignedTableId = availableTable._id
  }

  const existingReservation = await Reservation.findOne({
    restaurantId: session.user.restaurantId,
    tableId: assignedTableId,
    date: reservationDate,
    time,
    status: "confirmed",
  })

  if (existingReservation) {
    return apiError("This table is already reserved for this time slot", 409)
  }

  const reservation = await Reservation.create({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    customerId: customer._id,
    tableId: assignedTableId,
    date: reservationDate,
    time,
    guests,
    notes,
    status: "confirmed",
  })

  await Table.findByIdAndUpdate(assignedTableId, { status: "reserved" })

  const populated = await Reservation.findById(reservation._id)
    .populate("customerId", "name phone")
    .populate("tableId", "number name")
    .lean()

  return apiSuccess(populated, 201)
})
