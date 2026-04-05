# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### عالم زمرد - Mobile App (Expo)
- **Path**: `artifacts/alam-zomorod/`
- **Language**: Arabic (RTL)
- **Tech**: React Native + Expo Router
- **Features**:
  - Authentication (Customer / Provider / Admin)
  - Categories & Services management
  - Service request with bidding system + date/time scheduling
  - Privacy: first name only shown in offers before acceptance
  - Coupon code validation in request flow
  - Order tracking (pending → offers → accepted → in_progress → completed)
  - Provider profiles with ratings, service toggle management
  - Wallet system: providers request top-ups, admin approves
  - Rating & review system
  - Favorites system
  - Provider types: Salon / Freelancer
  - Notifications system (per-user role) with unread badge
  - Admin: provider search/filter by name/phone/city
  - Admin: provider detail view (4 tabs: info, services, wallet, attachments)
  - Admin: suspension with reason text, sent to provider as notification
  - Admin: coupon management (CRUD, fixed/percent)
  - Admin: package approval workflow
  - Admin: wallet top-up request approval
  - Provider: service on/off toggle, wallet top-up request modal
- **Local storage**: AsyncStorage (no backend for first build)
- **Target stores**: iOS App Store (via Expo Launch), Google Play (manual EAS)

### API Server
- **Path**: `artifacts/api-server/`
- **Framework**: Express 5 + Drizzle ORM + PostgreSQL

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
