# Changelog

## 1.0.0 (2026-06-05)

### Initial Production Release

**Core Features**

- Order management with dine-in and takeaway support
- Table management with visual layout and status tracking
- Kitchen Display System with column-based workflow (New → Preparing → Ready → Served)
- Billing engine with tax calculation, split payments, and multiple payment methods
- Online payments via Razorpay
- Menu management with categories, variants, and addons
- Customer QR-code portal for menu browsing, ordering, checkout, and feedback
- Staff management with role-based access control
- Reservation system with table auto-assignment
- Real-time sync across devices via Ably
- Offline support via service worker and IndexedDB (Dexie.js)
- WhatsApp order status and reservation notifications
- Financial reporting and dashboard analytics
- Audit logging for compliance

**Security**

- Role-based access control at API layer (admin/manager/cashier/waiter/kitchen)
- Field allowlisting on all mutation endpoints (prevents `$set` body injection)
- Rate limiting on authentication and public endpoints
- NextAuth.js v5 session management with 24h expiry
- Password hashing with bcryptjs (12 rounds)
- Password reset flow with cryptographically secure tokens
- Webhook signature verification for Razorpay and WhatsApp
- Tenant isolation via organizationId + restaurantId scoping
- CORS and security headers configured

**Infrastructure**

- MongoDB with compound indexes across all models
- Zod schema validation on all API inputs
- TypeScript strict mode with 0 type errors
- ESLint with 0 warnings
- CI/CD pipeline (GitHub Actions + Vercel)
- 16 unit tests, 8 E2E tests — all passing
- PWA with service worker, offline fallback, and installable manifest
- Deployment documentation and environment variable checklist
