# Copilot Instructions for Embraflex - Sistema de Pedidos Digital

## Project Overview
- **Purpose:** Web system for managing orders, products, and clients, fully integrated with WooCommerce.
- **Stack:** React (TypeScript), Vite, Tailwind CSS, Radix UI, Shadcn/ui, TanStack Query, React Hook Form, Zod, Axios, jsPDF, WooCommerce REST API.
- **Architecture:**
  - `src/componentes/` – Modular, reusable UI and business components (see `ui/`, `layouts/`, and custom dialogs/modals).
  - `src/pages/` – Route-based pages (Dashboard, Orders, Products, Customers, Reports, etc.).
  - `src/lib/` – Service layer for API integration (`woocommerce.ts`, `customers.ts`), utilities, PDF generation, and business logic.
  - `backend/` – Scripts and SQL for database setup, migrations, and diagnostics (PostgreSQL focus).
  - Path alias `@/` points to `src/` (see `tsconfig.json`, `vite.config.ts`).

## Key Patterns & Conventions
- **WooCommerce Integration:**
  - All product and customer data flows through `lib/woocommerce.ts` and `lib/customers.ts`.
  - Dynamic pricing per quantity is handled via a custom meta field (`precos_por_quantidade`). See `PRECOS_POR_QUANTIDADE.md` for format and parsing logic.
  - Category filtering defaults to "Interna" for internal-use products.
- **Forms:**
  - Use React Hook Form + Zod for validation (see `CustomerFormDialog.tsx`, `NewOrder.tsx`).
  - Form dialogs and modals are in `componentes/`.
- **UI System:**
  - Use Shadcn/ui and Radix UI for all base components. Extend only in `componentes/ui/`.
  - Consistent use of Tailwind CSS for layout, spacing, and color (see `tailwind.config.ts`).
  - Design system: HSL colors, gradients, dark mode, responsive by default.
- **PDF Generation:**
  - Use `lib/pdf-generator.ts` for order PDFs (jsPDF + AutoTable). Triggered from order success modals.
- **Notifications:**
  - Use Sonner and Radix Toast for user feedback (see `use-toast.ts`).
- **Routing & Auth:**
  - All routes defined in `app.tsx`. Use `ProtectedRoute.tsx` for auth-guarded pages.
  - Auth state is managed client-side; login page is `Login.tsx`.

## Developer Workflows
- **Install:** `yarn install` or `npm install`
- **Dev Server:** `yarn dev` or `npm run dev` (Vite, port 5173)
- **Build:** `yarn build` or `npm run build`
- **Lint:** `yarn lint` or `npm run lint`
- **Environment:** Copy `.env.example` to `.env` and set WooCommerce credentials.
- **Backend:** See `backend/` for DB setup, migrations, and diagnostics (PostgreSQL, SQL scripts, and TypeScript tools).

## Integration & Customization
- **WooCommerce:**
  - Configure API keys in `.env` (see README for details).
  - Product/category/price logic is tightly coupled to WooCommerce data model.
- **Logo:** Place `logo-embraflex.png` in `public/` for custom branding.

## Examples
- **API Usage:**
  - `getProducts({ search, category })` in `lib/woocommerce.ts`
  - `createCustomer(data)` in `lib/customers.ts`
- **Component Import:**
  - `import { Button } from "@/componentes/ui/button"`
  - `import { getProducts } from "@/lib/woocommerce"`

## References
- See `README.md` for full project structure, setup, and integration details.
- See `PRECOS_POR_QUANTIDADE.md` for dynamic pricing configuration.
- See `WOOCOMMERCE_CONFIG.md` for WooCommerce API setup.

---

**Update this file if you introduce new architectural patterns, workflows, or integration points.**
