# Contributing to RestoOS

## Development Setup

```bash
git clone https://github.com/Manthan-13521/RestoOs.git
cd RestoOs
npm ci
cp .env.example .env.local
npm run dev
```

## Code Standards

- **TypeScript strict mode** is enabled. All code must compile with zero errors.
- **ESLint** is configured. Run `npm run lint` before committing.
- Use the existing patterns: Zod for validation, `withAuth` for authenticated routes, zustand for client state.
- API routes return `NextResponse` via `apiSuccess()` / `apiError()` helpers.
- All environment variables go through `process.env` — never hardcode secrets.

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e
```

## Pull Request Process

1. Ensure the build passes: `npm run build`
2. Ensure lint passes: `npm run lint`
3. Ensure all tests pass: `npm test && npm run test:e2e`
4. Update `CHANGELOG.md` if adding or changing functionality

## Architecture Notes

The project uses the Next.js App Router with the following structure:

- `src/app/` — Route segments (admin, staff, kitchen, customer)
- `src/app/api/` — API route handlers
- `src/components/` — Shared UI components (shadcn/ui)
- `src/lib/` — Business logic, models, helpers
- `src/store/` — Zustand state stores
- `src/hooks/` — React hooks (including `useRealtimeSync`)

See `AGENTS.md` for detailed implementation context.
