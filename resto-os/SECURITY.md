# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in RestoOS, please report it by emailing the repository owner directly. Do not open a public issue.

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (if known)

## Security Features

### Authentication & Authorization
- **NextAuth.js v5** with JWT sessions (24h expiry)
- **Role-based access control** enforced at the API layer using `requireRole()` and `requirePermission()` helpers
- Admin-only mutation endpoints (staff CRUD, settings, salaries, expenses, attendance)
- Manager+ endpoints (menu, categories, tables, reports)
- Permission-gated endpoints (billing:manage, orders:create/edit, kitchen:manage)

### Data Protection
- **Tenant isolation**: All queries scoped by `organizationId` + `restaurantId`
- **Password hashing**: bcryptjs with 12 salt rounds
- **Password reset**: Cryptographically secure 32-byte tokens with 1-hour expiry
- **Field allowlisting**: Mutation endpoints use field allowlists to prevent `$set` body injection

### API Security
- **Rate limiting**: In-memory rate limiter on auth and public endpoints (60s windows)
- **Webhook verification**: HMAC signature verification for Razorpay and WhatsApp webhooks
- **CORS**: Security headers set via `vercel.json` (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- **Input validation**: All API inputs validated through Zod schemas

### Infrastructure
- All secrets loaded from environment variables — never hardcoded
- `.env` files excluded from version control
- MongoDB Atlas with IP whitelisting
- Vercel deployment with automatic HTTPS
- Structured JSON logging for audit trail

## Best Practices for Deployment

1. Use a strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
2. Restrict MongoDB Atlas network access to Vercel IPs only
3. Enable MongoDB Atlas encryption at rest
4. Configure Razorpay webhook secret and verify signature
5. Set `NEXT_PUBLIC_APP_URL` to the production domain
6. Enable HTTPS (automatic on Vercel)
7. Regularly rotate API keys and secrets
8. Monitor audit logs for suspicious activity
