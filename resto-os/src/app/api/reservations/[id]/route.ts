import { Reservation } from "@/lib/db/models/Reservation"
import { Table } from "@/lib/db/models/Table"
import { withAuth, apiSuccess, apiError, requireRole } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const reservation = await Reservation.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  })
    .populate("customerId", "name phone")
    .populate("tableId", "number name")
    .lean()

  if (!reservation) return apiError("Reservation not found", 404)
  return apiSuccess(reservation)
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const body = await req.json()
  const { date, time, guests, tableId, notes, status } = body

  const existing = await Reservation.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  })
  if (!existing) return apiError("Reservation not found", 404)

  const allowedStatuses = ["confirmed", "cancelled", "completed", "no_show"]
  if (status && !allowedStatuses.includes(status)) {
    return apiError("Invalid status", 400)
  }

  const update: Record<string, any> = {}
  if (date) update.date = new Date(date)
  if (time) update.time = time
  if (guests) update.guests = guests
  if (tableId) update.tableId = tableId
  if (notes !== undefined) update.notes = notes
  if (status) update.status = status

  if (status === "cancelled" && existing.tableId) {
    await Table.findByIdAndUpdate(existing.tableId, { status: "empty" })
  }

  const reservation = await Reservation.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: update },
    { new: true }
  )
    .populate("customerId", "name phone")
    .populate("tableId", "number name")
    .lean()

  return apiSuccess(reservation)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const reservation = await Reservation.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: { isActive: false } },
    { new: true }
  )
  if (!reservation) return apiError("Reservation not found", 404)

  if (reservation.tableId) {
    await Table.findByIdAndUpdate(reservation.tableId, { status: "empty" })
  }

  return apiSuccess({ message: "Reservation cancelled" })
})
