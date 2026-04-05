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
  - Admin: provider search/filter by name/phone/city + city chips filter (Jordan cities)
  - Admin: provider detail view (4 tabs: info, services, wallet, attachments)
  - Admin: suspension with reason text, sent to provider as notification
  - Admin: coupon management (CRUD, fixed/percent)
  - Admin: package approval workflow
  - Admin: wallet top-up request approval
  - Admin: direct wallet top-up for individual providers (wallet tab in provider detail)
  - Admin: per-provider commission override (info tab in provider detail)
  - Admin: profile change approval/rejection with reason (pendingProfileChange in info tab)
  - Admin: settings — location enable/disable, Google Maps API key, app logo URI
  - Provider: service on/off toggle (all global services), wallet top-up request modal (admin-approved)
  - Provider: custom service creation (name, description, price, duration) with delete
  - Provider: packages tab (add/delete personal service bundles with price/sessions/duration)
  - Provider: portfolio tab (add photos by URL with caption, remove photos — shown in customer offer cards)
  - Provider: OTP phone edit (enter new phone → mock OTP 1234 → submit to admin for approval)
  - Provider: service radius setting (km input in overview tab)
  - Provider: pending profile change indicator in overview tab
  - Provider: requests screen with 3 tabs (available / my offers / accepted) + Hijri dates
  - Provider: active jobs screen with 4 filter tabs (all / accepted / in_progress / completed)
  - Provider: earnings screen uses requestWalletTopup (admin approval required, no direct recharge)
  - Customer: offer cards show provider portfolio photo count + thumbnails
  - Customer: profile has no wallet recharge; bell icon navigates to notifications
  - Hijri calendar dates throughout (utils/date.ts utility)
  - Currency: Jordanian Dinar (د.أ) throughout; cities: Jordan (عمان, الزرقاء, إربد, العقبة, السلط, الرصيفة)
  - Rating modal has onRequestClose to prevent navigation freeze
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
