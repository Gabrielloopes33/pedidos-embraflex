# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands
Frontend (Vite + React/TS) commands are in the repo root (`package.json`). Backend commands are in `backend/package.json`.

### Install
```bash
# root (frontend)
npm install
# or
yarn install

# backend
cd backend
npm install
```

### Environment files
```bash
# frontend (Vite reads .env at build/dev time)
cp .env.example .env

# backend (dotenv)
cp backend/.env.example backend/.env
```

### Run locally
```bash
# frontend dev server (Vite)
npm run dev
# serves http://localhost:5173

# backend API (Express + nodemon)
cd backend
npm run dev
# default API base is http://localhost:3001 (see backend/src/index.ts)
```

### Lint / build
```bash
# frontend
npm run lint
npm run build
npm run build:dev
npm run build:prod
npm run preview

# backend
cd backend
npm run build
npm start
```

### Backend maintenance scripts
```bash
cd backend
npm run seed
npm run setup-db
npm run hash
npm run add-vendedor-to-customers
```

### Tests
- Frontend: no test runner is configured in root `package.json` (no `test` script).
- Backend: `npm test` is a placeholder that exits with an error.

## High-level architecture
This repo is a two-part system:
- A **React SPA** (root `src/`) for the Embraflex order/quote workflow.
- A **Node/Express API** (`backend/`) that handles authentication, Supabase persistence, WooCommerce proxying, and background sync.

### Frontend (root `src/`)
Key entry points and cross-cutting concerns:
- `src/main.tsx` boots the SPA.
- `src/app.tsx` wires:
  - React Router routes (public: `/login`, `/assinar/:token`; protected routes under `ProtectedRoute`).
  - `DashboardLayout` shell for protected pages.
  - TanStack Query `QueryClient` + localStorage persistence (`embraflex-cache`) with selective query persistence.
  - A backend warmup call (`warmupBackend()`), so check `src/lib/warmup` when debugging cold-start behavior.

Routing and UI structure:
- Route-level pages live in `src/pages/` and are the primary “screens” (Dashboard, Products, Customers, Orders, Quotes, Production, Settings, Users, etc.).
- Complex, multi-step flows are organized under subfolders, notably:
  - `src/pages/NewOrder/…` (order wizard)
  - `src/pages/NewQuote/…` (quote wizard)
- Reusable UI primitives and shadcn/radix wrappers are under `src/componentes/ui/`.
- Forms generally use **React Hook Form + Zod** (validation + typing).
- PDF generation for orders lives in `src/lib/pdf-generator.ts`.
- User notifications/toasts are wired in `src/app.tsx` (Radix Toast + Sonner).

Data access boundaries:
- `src/lib/api.ts` defines the axios client:
  - Base URL comes from `VITE_API_BASE_URL` (fallback `http://localhost:3001/api`).
  - Adds `Authorization: Bearer <token>` from `localStorage.authToken` via request interceptor.
  - On 401 responses it clears auth storage and redirects to `/login`.
- WooCommerce access from the UI is typically **via backend proxy**:
  - `src/lib/woocommerce.ts` calls `/wc/*` endpoints through `apiClient`.
  - `src/lib/customers.ts` calls `/wc/*` endpoints through `apiClient`.
- Some production-order reads/writes are done **directly to Supabase** from the frontend (see `src/lib/api.ts` usage of `supabase`). When debugging “why didn’t the backend see this write?”, check whether the code path is bypassing the API.

Aliases:
- Import alias `@/` maps to `./src` (see `vite.config.ts`).

### Backend (`backend/`)
Backend is TypeScript compiled with `tsc` to `backend/dist/`.

Server entry point:
- `backend/src/index.ts` configures Express, CORS, JWT auth, and mounts routers.

Auth model:
- Login: `POST /api/auth/login` issues a JWT (12h expiry) containing `{ id, role, username }`.
- Auth middleware is used for `/api/users` routes; many other endpoints are intentionally unprotected for internal usage.

Major route groups (mounted in `backend/src/index.ts`):
- `/api/quotes` (see `backend/src/routes/quotes.ts`)
- `/api/signature` (see `backend/src/routes/signature.ts`)
- `/api/sync` (see `backend/src/routes/sync.ts`)
- `/api/users` (JWT-protected; admin-gated inside `backend/src/routes/users.ts`)

WooCommerce proxy:
- The backend exposes `/api/wc/*` endpoints that the frontend calls via `src/lib/woocommerce.ts` and `src/lib/customers.ts`.
- Product listing in `/api/wc/products` enforces a category filter for “Interno/Interna” (if the category can’t be resolved, it returns an empty list).

Supabase persistence and caching:
- Supabase is used for:
  - `orders` (production orders)
  - `users` (auth + role model)
  - WooCommerce caches: `wc_products_cache`, `wc_customers_cache`
  - Sync metadata: `wc_sync_metadata`
- WooCommerce sync runs in background (triggered by `POST /api/sync/woocommerce`) and is implemented in `backend/src/services/sync.ts`.
- Cache stats + cleanup endpoints are in `backend/src/routes/sync.ts` and are called by helper functions in `src/lib/api.ts` (`getCacheStats`, `cleanupCache`, etc.).

### Environment/config you will see referenced
Frontend (root `.env`):
- `VITE_API_BASE_URL` (backend base, e.g. `https://.../api`)
- `VITE_WOOCOMMERCE_URL`, `VITE_WOOCOMMERCE_CONSUMER_KEY`, `VITE_WOOCOMMERCE_CONSUMER_SECRET`

Backend (`backend` environment; see `DEPLOY.md` for full list):
- `WOOCOMMERCE_URL`, `WOOCOMMERCE_KEY`, `WOOCOMMERCE_SECRET`
- `JWT_SECRET`, `PORT`, `APP_URL`
- Supabase/DB settings used by the backend (Supabase URL/keys and/or Postgres connection vars depending on deployment)