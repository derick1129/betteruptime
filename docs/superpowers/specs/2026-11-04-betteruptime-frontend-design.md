# BetterUptime Frontend Design Specification

**Date:** 2026-11-04  
**Status:** Approved  
**Branch:** `frontend`  
**Target Workspaces:** `apps/web` (Next.js Frontend), `apps/api` (Express REST API Polish)

---

## 1. Overview & Goals

This specification outlines the architecture, component structure, user flow, and API contracts for the BetterUptime frontend application built with **Next.js (App Router)**, **Tailwind CSS**, and **Shadcn UI** within the Turborepo monorepo.

The frontend interfaces with the existing BetterUptime backend (`apps/api`), database schema (`packages/store`), and background probing engine (`apps/pusher`, `apps/worker`, `packages/redisstreams`).

### Key Deliverables:
- **Public Landing Page (`/`)**: Engaging marketing experience detailing features, zero-loss Redis Streams architecture, and live monitor simulation.
- **Authentication (`/signin`, `/signup`)**: Token-based authentication connecting to `apps/api/routes/user.ts` with client-side validation, cookie/localStorage sync, and route guards.
- **Main Dashboard (`/dashboard`)**: Central monitoring hub displaying overall uptime stats, active monitors list with status indicators, search filtering, "Add Website" modal, and manual refresh controls.
- **Monitor Detail View (`/dashboard/[websiteId]`)**: Granular metrics page displaying latency trends, uptime percentage, and tabular check history (status, latency in ms, region, timestamp).
- **Backend Polish (`apps/api`)**: Small non-breaking adjustments (defaulting API port to 3001, returning tick records in website status endpoint, and adding website deletion).

---

## 2. Monorepo & System Architecture

```
betteruptime/
├── apps/
│   ├── api/                   # Express REST API (runs on :3001)
│   │   ├── routes/
│   │   │   ├── user.ts        # /api/v1/user (signup, signin)
│   │   │   └── website.ts     # /api/v1/website (create, list, status, delete)
│   │   └── index.ts           # Configured for PORT=3001
│   ├── web/                   # Next.js App Router (runs on :3000)
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   ├── layout.tsx # Marketing layout (Navbar, Footer)
│   │   │   │   └── page.tsx   # Landing page
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx # Auth layout (branded centered card)
│   │   │   │   ├── signin/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx # Protected layout with Navbar & auth guard
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx # Monitors list & summary cards
│   │   │   │   │   └── [websiteId]/
│   │   │   │   │       └── page.tsx # Detail inspection & tick history
│   │   │   ├── globals.css    # Tailwind CSS & theme tokens
│   │   │   └── layout.tsx     # Root layout with AuthProvider & Toaster
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn UI primitives (button, card, dialog, badge, input, table)
│   │   │   ├── navbar.tsx     # App navigation bar
│   │   │   ├── footer.tsx     # Footer component
│   │   │   ├── add-website-modal.tsx # Modal dialog to register a URL
│   │   │   ├── status-badge.tsx      # Up / Down / Pending status indicator
│   │   │   ├── latency-chart.tsx     # SVG / Canvas response latency timeline
│   │   │   └── ticks-table.tsx       # Recent checks table
│   │   ├── lib/
│   │   │   ├── api.ts         # Central typed API client
│   │   │   ├── auth-context.tsx # React Context for session & token management
│   │   │   └── utils.ts       # cn() helper
│   │   └── middleware.ts      # Route protection for /dashboard
└── packages/
    └── store/                 # Prisma client & PostgreSQL models
```

---

## 3. Screen Specifications & User Experience

### 3.1 Public Landing Page (`/`)
- **Hero**: Clean headline, sub-headline highlighting multi-region Redis Streams checks, CTA buttons ("Start Monitoring Free", "View Live Demo").
- **Interactive Live Preview**: Card showing simulated real-time checks across global probe locations (`us-east-1`, `eu-west-1`, `ap-south-1`).
- **Feature Cards**:
  1. *Distributed Probing*: High-frequency health checks executed via consumer groups.
  2. *Instant Latency Tracking*: Real-time millisecond-precision response tracking.
  3. *Zero Dropped Events*: Fault-tolerant message acknowledgment (`XACK`) and pending entry safety.
- **Header & Footer**: Contextual navigation (Sign In / Sign Up if unauthenticated, "Go to Dashboard" if logged in).

### 3.2 Authentication (`/signin` & `/signup`)
- **Forms**: Username and password fields with input validation and loading spinners.
- **Feedback**: Clear error alerts for duplicate username or invalid credentials.
- **State Transition**: On successful signin, stores JWT in `localStorage` (`betteruptime_token`) and cookie (`auth_token`), then redirects to `/dashboard`.

### 3.3 Main Dashboard (`/dashboard`)
- **Global Metrics Summary**:
  - Total Monitors Count
  - Monitors Currently Up
  - Monitors Down
  - Average Latency (ms) across active targets
- **Toolbar**:
  - Search input for real-time client filtering of URLs
  - "Refresh Data" manual trigger button (with spinning indicator while in flight)
  - "+ Add Website" modal button
- **Monitors Table / Grid**:
  - Domain / URL (with external link icon)
  - Current Status Badge (`Up` with green pulse, `Down` with red indicator, `Pending`)
  - Added timestamp (formatted)
  - "View" button navigating to `/dashboard/[websiteId]`
  - "Delete" button with confirmation prompt
- **Empty State**: Friendly CTA inviting user to add their first website when 0 websites exist.

### 3.4 Monitor Detail Inspection (`/dashboard/[websiteId]`)
- **Header**: URL display, back link to `/dashboard`, current status badge, and manual "Refresh" button.
- **Metric Cards**:
  - Latest Response Time (ms)
  - Availability / Uptime percentage calculated from ticks
  - Total Recorded Checks count
- **Latency Trend Chart**: Clean visual chart displaying response times over recent ticks.
- **Recent Ticks Table**:
  - Columns: Timestamp, Region (`us-east-1`, etc.), Status (`Up` / `Down`), Latency (`response_time_ms`).
  - Empty State: "No checks recorded yet. The background worker pings targets periodically."

---

## 4. API Client & Contracts

### 4.1 Base URL
- Configured via `NEXT_PUBLIC_API_URL`, defaults to `http://localhost:3001/api/v1`.

### 4.2 Endpoints Used by Frontend
1. **`POST /user/signup`**:
   - Request: `{ "username": string, "password": string }`
   - Response: `{ "id": string }`
2. **`POST /user/signin`**:
   - Request: `{ "username": string, "password": string }`
   - Response: `{ "jwt": string }`
3. **`GET /website/websites`**:
   - Header: `Authorization: <jwt>`
   - Response: `{ "websites": Array<{ id: string, url: string, timeAdded: string, userId: string }> }`
4. **`POST /website`**:
   - Header: `Authorization: <jwt>`
   - Request: `{ "url": string }`
   - Response: `{ "id": string }`
5. **`GET /website/status/:websiteId`**:
   - Header: `Authorization: <jwt>`
   - Response:
     ```json
     {
       "id": "...",
       "url": "https://example.com",
       "userId": "...",
       "timeAdded": "2026-11-04T...",
       "ticks": [
         {
           "id": "...",
           "response_time_ms": 142,
           "status": "Up",
           "createdAt": "2026-11-04T...",
           "region": { "id": "...", "name": "us-east-1" }
         }
       ]
     }
     ```
6. **`DELETE /website/:websiteId`**:
   - Header: `Authorization: <jwt>`
   - Response: `{ "message": "Website deleted" }`

---

## 5. Backend Polish Implementation Plan

To support the above frontend contracts seamlessly:
1. **`apps/api/index.ts`**:
   - Change default `PORT` from `3000` to `3001` (`const PORT = process.env.PORT || 3001;`).
2. **`apps/api/routes/website.ts`**:
   - In `GET /status/:websiteId`: Include `ticks` with their `region` relation in Prisma query, and return `ticks` in `res.json()`.
   - Add `DELETE /:websiteId`: Deletes `WebsiteTick` records for the site, then deletes the `Website` record where `id = websiteId` and `userId = req.userId`.

---

## 6. Verification & Quality Plan

1. **Static Analysis & Types**:
   - `bun run check-types` passes across all monorepo packages.
   - `bun run lint` passes without warnings.
2. **Build Test**:
   - `bun run build` succeeds for `apps/web` and `apps/api`.
3. **End-to-End Verification**:
   - Start backend API on port 3001 and Next.js on port 3000.
   - Register a new user, login, verify session tokens.
   - Add new monitoring target URL.
   - Inspect monitor detail page and verify status, latency metrics, and tick table render properly.
   - Verify manual refresh button re-fetches without page reload.
   - Test logout and route protection redirection.
