<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:rate-limiter-limitation -->
# Rate Limiter — Single-Instance Limitation

The rate limiter in `src/lib/rate-limit.ts` uses an in-memory `Map` with a 60s cleanup interval. This is acceptable for single-instance deployments (e.g., a single Vercel serverless function or one Node process) but will NOT work correctly across multiple instances.

**Impact:** If the app is scaled to multiple instances/workers, each instance has its own independent rate-limit counter, allowing an attacker to exceed the intended limit by spreading requests across instances.

**Upgrade path:** Replace with an external store (Redis via `ioredis`, Vercel KV, or Upstash Redis) that shares state across all instances. The `rateLimit()` function's signature (`(key: string) => { allowed, remaining, resetAt }`) is designed to be replaceable without changing callers.
<!-- END:rate-limiter-limitation -->

<!-- BEGIN:deployment-readiness -->
# Deployment Readiness

## Backup & Recovery
- **Database**: MongoDB Atlas automated snapshots (daily, 7-day retention). Manual backup: `mongodump --uri=$MONGODB_URI --gzip --archive=backup-$(date +%Y%m%d).gz`
- **Restore**: `mongorestore --uri=$MONGODB_URI --gzip --archive=backup-20260601.gz --drop`
- **Environment variables**: Stored securely (Vercel Environment Variables / 1Password). Never commit to repo.

## CI/CD
- `.github/workflows/ci.yml`: Runs lint, build, unit tests, and E2E tests on push/PR.
- Deploy to Vercel via Vercel GitHub integration (automatic on merge to `main`).

## Monitoring
- All API requests logged as structured JSON (timestamp, method, path, status, duration, requestId).
- Rate-limit violations logged at 429. Audit logs persisted to MongoDB for admin review.
- Errors logged with request context for debugging.

## Pre-deployment Checklist
1. `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` configured
2. `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` configured and webhook endpoint verified
3. `ABLY_API_KEY` configured for realtime sync
4. `BLOB_READ_WRITE_TOKEN` configured for image uploads
5. `SMTP_HOST/USER/PASS` configured for password reset emails
6. `NEXT_PUBLIC_APP_URL` set to production URL
7. Build passes: `npm run build` (0 errors)
8. Tests pass: `npm test` and `npm run test:e2e`
9. MongoDB indexes created (handled automatically on first connect)
10. SSL/TLS enforced at reverse proxy level
<!-- END:deployment-readiness -->
