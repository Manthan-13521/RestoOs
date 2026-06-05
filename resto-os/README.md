# RestoOS

**Restaurant Management Operating System** — A full-featured, production-ready platform for managing restaurants, orders, tables, billing, kitchen operations, and customer engagement.

## Features

- **Order Management** — Dine-in and takeaway order processing with real-time status tracking
- **Table Management** — Visual table layout with occupancy tracking, reservations, and billing status
- **Kitchen Display System** — Live KDS with column-based workflow (New → Preparing → Ready → Served)
- **Billing & Payments** — Integrated billing with tax calculation, split payments, cash/card/UPI, and Razorpay online payments
- **Menu Management** — Categories, items, variants, addons, pricing, and availability controls
- **Staff Management** — Role-based access control with staff accounts, attendance, and salary tracking
- **Reservations** — Customer reservation system with table auto-assignment
- **Customer Portal** — QR-code-based menu browsing, ordering, checkout, and feedback
- **Offline Support** — PWA with service worker, offline fallback, and Dexie.js-based offline sync
- **Real-time Sync** — Ably-powered real-time updates across all devices
- **WhatsApp Integration** — Order status notifications, reservation confirmations, and feedback requests
- **Reporting** — Dashboard with revenue, orders, trends, and financial reports
- **Audit Logging** — Full action audit trail for compliance and security

## Screenshots

> Screenshots to be added. Replace these placeholders with actual screenshots.

| Staff Dashboard | Table Management | Kitchen Display |
|:---:|:---:|:---:|
| ![Staff Dashboard](https://via.placeholder.com/400x250?text=Staff+Dashboard) | ![Table Management](https://via.placeholder.com/400x250?text=Table+Management) | ![Kitchen Display](https://via.placeholder.com/400x250?text=Kitchen+Display) |

| Billing | Menu Management | Customer Portal |
|:---:|:---:|:---:|
| ![Billing](https://via.placeholder.com/400x250?text=Billing) | ![Menu Management](https://via.placeholder.com/400x250?text=Menu+Management) | ![Customer Portal](https://via.placeholder.com/400x250?text=Customer+Portal) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 (App Router)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Admin UI  │ │ Staff UI │ │Kitchen UI│ │Customer UI │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │             │             │             │         │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐   │
│  │              API Routes (REST)                     │   │
│  │  withAuth / withPublicRateLimit / withRoleAuth     │   │
│  └─────────────────────┬─────────────────────────────┘   │
│                        │                                  │
│  ┌─────────────────────┴─────────────────────────────┐   │
│  │         External Services                          │   │
│  │  MongoDB  │  Ably  │  Razorpay  │  WhatsApp  │ Vercel│
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 (strict mode) |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **State** | Zustand 5 |
| **Validation** | Zod 4 |
| **Database** | MongoDB 7 + Mongoose 9 |
| **Auth** | NextAuth.js 5 (Credentials + Google OAuth) |
| **Payments** | Razorpay |
| **Realtime** | Ably |
| **Offline** | Dexie.js (IndexedDB) |
| **Messaging** | WhatsApp Cloud API |
| **Storage** | Vercel Blob |
| **Testing** | Vitest, Playwright |
| **PWA** | Custom Service Worker + Manifest |
| **Deployment** | Vercel |

## Installation

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB 7)
- Razorpay merchant account
- Ably account
- WhatsApp Business API access (optional)
- Vercel account (for deployment)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/Manthan-13521/RestoOs.git
cd RestoOs

# Install dependencies
npm ci

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials (see Environment Variables below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Run

1. Navigate to `/auth/register` to create your restaurant account
2. You'll be prompted to create an organization and restaurant
3. The first registered user becomes the admin
4. Add staff, configure tables, and set up your menu

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `NEXTAUTH_SECRET` | Yes | NextAuth encryption secret (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Application URL (`http://localhost:3000` for dev) |
| `ABLY_API_KEY` | Yes | Ably API key for real-time sync |
| `ABLY_CLIENT_ID` | Yes | Ably client identifier |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook verification secret |
| `SMTP_HOST` | Yes* | SMTP server hostname (required for password reset) |
| `SMTP_PORT` | Yes* | SMTP server port (587 for TLS) |
| `SMTP_USER` | Yes* | SMTP username |
| `SMTP_PASS` | Yes* | SMTP password or app password |
| `SMTP_FROM` | Yes* | From email address for password reset emails |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob storage token for image uploads |
| `NEXT_PUBLIC_APP_URL` | Yes | Public-facing application URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `WHATSAPP_PHONE_NUMBER_ID` | No | WhatsApp Business phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | No | WhatsApp API access token |
| `WHATSAPP_VERIFY_TOKEN` | No | WhatsApp webhook verification token |
| `WHATSAPP_APP_SECRET` | No | WhatsApp app secret for webhook verification |

*\* Required for password reset functionality. If not configured, reset links are logged to console.*

## MongoDB Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (M0 free tier is sufficient)
2. Create a database user with read/write access
3. Add your IP address to the network access whitelist
4. Copy the connection string into `MONGODB_URI`
5. Indexes are created automatically on first connect

## Razorpay Setup

1. Register at [Razorpay](https://razorpay.com)
2. Get API keys from Dashboard → Settings → API Keys
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
4. Configure webhook: Dashboard → Settings → Webhooks → Add webhook
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Set `RAZORPAY_WEBHOOK_SECRET`

## WhatsApp Setup

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a WhatsApp Business app
3. Get the phone number ID and access token
4. Configure webhook URL: `https://your-domain.com/api/whatsapp/webhook`
5. Set `WHATSAPP_VERIFY_TOKEN` to a value of your choice

## Ably Setup

1. Sign up at [Ably](https://ably.com)
2. Create a new app
3. Copy the API key (starts with root or has subscribe/publish/presence capabilities)
4. Set `ABLY_API_KEY` and `ABLY_CLIENT_ID`

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FManthan-13521%2FRestoOs)

1. Push the repository to GitHub
2. Import the project in Vercel
3. Configure all environment variables in Vercel dashboard
4. Deploy

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB Atlas cluster accessible from Vercel IPs
- [ ] Razorpay webhook configured
- [ ] WhatsApp webhook configured (if using)
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] `NEXTAUTH_SECRET` set to a strong random value
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test` and `npm run test:e2e`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **MongoDB connection error** | Verify `MONGODB_URI` is correct and the IP is whitelisted in Atlas |
| **NextAuth errors** | Ensure `NEXTAUTH_SECRET` is set and `NEXTAUTH_URL` matches the deployment URL |
| **Payment failures** | Verify `RAZORPAY_KEY_ID`/`KEY_SECRET` and check webhook endpoint is public |
| **Real-time not working** | Check `ABLY_API_KEY` has the correct capabilities (subscribe, publish, presence) |
| **Image upload fails** | Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel dashboard |
| **Password reset email not sent** | Check SMTP configuration; reset links are logged to console if SMTP is not configured |
| **PWA not installing** | Ensure the app is served over HTTPS (required for service workers) |

## License

MIT
