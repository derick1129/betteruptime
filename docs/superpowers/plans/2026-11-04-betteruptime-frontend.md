# BetterUptime Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, responsive Next.js frontend with Shadcn UI and Tailwind CSS for the BetterUptime platform in Turborepo, connecting to the Express REST API and PostgreSQL database.

**Architecture:** Colocate Tailwind CSS and Shadcn UI components directly in `apps/web` (Next.js App Router). Structure pages into `(marketing)`, `(auth)`, and protected `(dashboard)` route groups. Integrate authentication via JWT persisted in cookies & localStorage with Next.js route middleware and a central typed API client.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Shadcn UI patterns, js-cookie, Express, Prisma, Turborepo, Bun.

## Global Constraints

- Branch: All changes must be made on branch `frontend`.
- Atomic Commits: Each task must end with an atomic commit with clear git message.
- Next.js Port: `apps/web` runs on port `3000` (`http://localhost:3000`).
- API Port: `apps/api` runs on port `3001` (`http://localhost:3001`) with base URL `http://localhost:3001/api/v1`.
- Manual Refresh: Dashboard updates via initial load and user-triggered manual refresh button.
- Styling: Tailwind CSS utility classes with Shadcn UI color variables (light/dark palette support).
- Verification Gates: Every task must compile without TypeScript errors (`bun run check-types`).

---

### Task 1: Backend Polish (`apps/api`)

**Files:**
- Modify: `apps/api/index.ts:5`
- Modify: `apps/api/routes/website.ts:22-60`
- Create: `apps/api/test-api.ts`

**Interfaces:**
- Consumes: Prisma models `Website`, `WebsiteTick`, `Region` in `store/client`.
- Produces:
  - API on port `3001` by default.
  - `GET /api/v1/website/status/:websiteId`: returns `{ id, url, userId, timeAdded, ticks: Array<{ id, response_time_ms, status, createdAt, region: { id, name } }> }`.
  - `DELETE /api/v1/website/:websiteId`: deletes ticks and website, returns `{ message: "Website deleted" }`.

- [ ] **Step 1: Write integration test script for backend API**

Create `apps/api/test-api.ts` to test health, user signup, signin, website creation, website status with ticks, and website deletion:
```ts
import axios from "axios";

async function run() {
  const baseURL = "http://localhost:3001/api/v1";
  console.log("Testing Backend API on " + baseURL);
  
  // 1. Health
  const health = await axios.get("http://localhost:3001/health");
  console.log("Health:", health.data);

  // 2. Auth signup
  const username = "testuser_" + Date.now();
  const password = "password123";
  const signupRes = await axios.post(`${baseURL}/user/signup`, { username, password });
  console.log("Signup:", signupRes.data);

  // 3. Auth signin
  const signinRes = await axios.post(`${baseURL}/user/signin`, { username, password });
  const token = signinRes.data.jwt;
  console.log("Signin token received:", !!token);

  // 4. Create website
  const siteRes = await axios.post(`${baseURL}/website`, { url: "https://google.com" }, {
    headers: { Authorization: token }
  });
  const siteId = siteRes.data.id;
  console.log("Created website ID:", siteId);

  // 5. Get status
  const statusRes = await axios.get(`${baseURL}/website/status/${siteId}`, {
    headers: { Authorization: token }
  });
  console.log("Website status response keys:", Object.keys(statusRes.data));
  if (!("ticks" in statusRes.data)) {
    throw new Error("ticks field missing from website status response");
  }

  // 6. Delete website
  const delRes = await axios.delete(`${baseURL}/website/${siteId}`, {
    headers: { Authorization: token }
  });
  console.log("Deleted website:", delRes.data);
  console.log("Backend API verification passed!");
}

run().catch((e) => {
  console.error("Test failed:", e.response?.data || e.message);
  process.exit(1);
});
```

- [ ] **Step 2: Update `apps/api/index.ts` to default to PORT 3001**

In `apps/api/index.ts`, change:
```ts
const PORT = process.env.PORT || 3001;
```

- [ ] **Step 3: Update `apps/api/routes/website.ts` to return ticks and support DELETE**

In `apps/api/routes/website.ts`:
1. Include `region: true` in `ticks` query inside `GET /status/:websiteId`:
```ts
router.get("/status/:websiteId", authmiddleware, async (req, res) => {
    const website = await prismaClient.website.findFirst({
        where: {
            userId: req.userId,
            id: req.params.websiteId as string
        },
        include: {
            ticks: {
                include: {
                    region: true
                },
                orderBy: [{
                    createdAt: "desc"
                }],
                take: 20
            }
        }
    })

    if (!website) {
        return res.status(404).json({ message: "Website not found" })
    }
    res.json({
        id: website.id,
        url: website.url,
        userId: website.userId,
        timeAdded: website.timeAdded,
        ticks: website.ticks
    })
})
```
2. Add DELETE route:
```ts
router.delete("/:websiteId", authmiddleware, async (req, res) => {
    const websiteId = req.params.websiteId as string;
    const website = await prismaClient.website.findFirst({
        where: {
            id: websiteId,
            userId: req.userId
        }
    });

    if (!website) {
        return res.status(404).json({ message: "Website not found" });
    }

    await prismaClient.websiteTick.deleteMany({
        where: { websiteId }
    });

    await prismaClient.website.delete({
        where: { id: websiteId }
    });

    res.json({ message: "Website deleted" });
});
```

- [ ] **Step 4: Verify backend changes and type check**

Run:
```bash
bun --filter api check-types || bun run check-types
```
Expected: Clean compile.

- [ ] **Step 5: Commit backend polish**

```bash
git add apps/api
git commit -m "feat(api): update default port to 3001, include ticks in status, add delete endpoint"
```

---

### Task 2: Frontend Setup, Tailwind CSS, and Shadcn Primitives (`apps/web`)

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/components/ui/button.tsx`
- Create: `apps/web/components/ui/card.tsx`
- Create: `apps/web/components/ui/input.tsx`
- Create: `apps/web/components/ui/badge.tsx`
- Create: `apps/web/components/ui/dialog.tsx`
- Create: `apps/web/components/ui/table.tsx`

**Interfaces:**
- Produces:
  - `@/lib/utils`: `cn(...inputs: ClassValue[]): string`
  - `@/components/ui/button`: `Button` component with variants (`default`, `outline`, `destructive`, `secondary`, `ghost`, `link`) and sizes.
  - `@/components/ui/card`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - `@/components/ui/input`: `Input` HTML input wrapper.
  - `@/components/ui/badge`: `Badge` component with variants (`default`, `secondary`, `destructive`, `outline`, `success`).
  - `@/components/ui/dialog`: Modal dialog primitives (`Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`).
  - `@/components/ui/table`: Table primitives (`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`).

- [ ] **Step 1: Install frontend dependencies**

In `apps/web`:
```bash
bun add --cwd apps/web tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20 clsx@^2.1.1 tailwind-merge@^3.0.1 class-variance-authority@^0.7.1 lucide-react@^1.16.0 js-cookie@^3.0.5 @radix-ui/react-dialog@^1.1.6
bun add --cwd apps/web -D @types/js-cookie@^3.0.6
```

- [ ] **Step 2: Configure Path Alias in `apps/web/tsconfig.json`**

Update `apps/web/tsconfig.json`:
```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ],
    "strictNullChecks": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "next-env.d.ts",
    "next.config.js",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create PostCSS & Tailwind configurations**

Create `apps/web/postcss.config.mjs`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `apps/web/tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Update `apps/web/app/globals.css` with Shadcn design tokens**

Replace `apps/web/app/globals.css` with standard Tailwind base and CSS variables for light & dark modes:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 142 76% 36%;
    --primary-foreground: 355 100% 97%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 142 76% 36%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 4.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 4.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 142 70% 45%;
    --primary-foreground: 144 100% 11%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 142 70% 45%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Create `lib/utils.ts` and Shadcn UI primitives**

1. Create `apps/web/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

2. Create `apps/web/components/ui/button.tsx`:
```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

3. Create `apps/web/components/ui/card.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
```

4. Create `apps/web/components/ui/input.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
```

5. Create `apps/web/components/ui/badge.tsx`:
```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        danger: "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

6. Create `apps/web/components/ui/dialog.tsx`:
```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
```

7. Create `apps/web/components/ui/table.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";
```

- [ ] **Step 6: Verify TypeScript types and build**

Run:
```bash
bun --filter web check-types
```
Expected: Pass without errors.

- [ ] **Step 7: Commit UI primitives**

```bash
git add apps/web
git commit -m "feat(web): configure tailwind, path aliases and shadcn ui components"
```

---

### Task 3: API Client, Authentication Context, and Route Middleware (`apps/web`)

**Files:**
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/auth-context.tsx`
- Create: `apps/web/middleware.ts`
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**
- Consumes: Express backend `/api/v1` routes.
- Produces:
  - `@/lib/api`: `apiClient`, `authApi.signup()`, `authApi.signin()`, `websiteApi.list()`, `websiteApi.create()`, `websiteApi.getStatus()`, `websiteApi.delete()`.
  - `@/lib/auth-context`: `AuthProvider`, `useAuth()` hook returning `{ user, token, isAuthenticated, login, signup, logout }`.
  - `middleware.ts`: protects `/dashboard` and redirects unauthenticated users to `/signin`.

- [ ] **Step 1: Create typed API client in `apps/web/lib/api.ts`**

```ts
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface ApiError {
  message: string;
}

export interface WebsiteTick {
  id: string;
  response_time_ms: number;
  status: "Up" | "Down" | "Unknow";
  createdAt: string;
  regionId: string;
  region?: {
    id: string;
    name: string;
  };
}

export interface Website {
  id: string;
  url: string;
  userId: string;
  timeAdded: string;
  ticks?: WebsiteTick[];
}

export interface WebsiteStatusResponse extends Website {
  ticks: WebsiteTick[];
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("betteruptime_token") || Cookies.get("auth_token") || null;
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("betteruptime_token", token);
    Cookies.set("auth_token", token, { expires: 7, path: "/" });
  } else {
    localStorage.removeItem("betteruptime_token");
    Cookies.remove("auth_token", { path: "/" });
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", token);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      const errText = await res.text();
      if (errText) errorMsg = errText;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  signup: (username: string, password: string) =>
    request<{ id: string }>("/user/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  signin: (username: string, password: string) =>
    request<{ jwt: string }>("/user/signin", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

export const websiteApi = {
  list: () =>
    request<{ websites: Website[] }>("/website/websites"),
  create: (url: string) =>
    request<{ id: string }>("/website", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  getStatus: (websiteId: string) =>
    request<WebsiteStatusResponse>(`/website/status/${websiteId}`),
  delete: (websiteId: string) =>
    request<{ message: string }>(`/website/${websiteId}`, {
      method: "DELETE",
    }),
};
```

- [ ] **Step 2: Create `apps/web/lib/auth-context.tsx`**

```tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken, setStoredToken, authApi } from "./api";

interface User {
  id?: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): { sub?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = getStoredToken();
    if (saved) {
      setToken(saved);
      const decoded = parseJwt(saved);
      if (decoded?.sub) {
        setUser({ id: decoded.sub, username: "User" });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.signin(username, password);
    setStoredToken(res.jwt);
    setToken(res.jwt);
    const decoded = parseJwt(res.jwt);
    setUser({ id: decoded?.sub, username });
    router.push("/dashboard");
  };

  const signup = async (username: string, password: string) => {
    await authApi.signup(username, password);
    await login(username, password);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    router.push("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 3: Create Next.js route protection middleware**

Create `apps/web/middleware.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
  const isDashboardPage = pathname.startsWith("/dashboard");

  if (isDashboardPage && !token) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup"],
};
```

- [ ] **Step 4: Update root layout with AuthProvider**

Update `apps/web/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetterUptime - High-Performance Website Uptime Monitoring",
  description: "Distributed multi-region website uptime and latency monitoring powered by Redis Streams and PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify types**

Run:
```bash
bun --filter web check-types
```
Expected: Pass.

- [ ] **Step 6: Commit Auth and API client**

```bash
git add apps/web
git commit -m "feat(web): add typed api client, auth context, and route middleware"
```

---

### Task 4: Public Marketing Landing Page (`apps/web`)

**Files:**
- Create: `apps/web/components/navbar.tsx`
- Create: `apps/web/components/footer.tsx`
- Create: `apps/web/app/(marketing)/layout.tsx`
- Create: `apps/web/app/(marketing)/page.tsx`
- Remove/replace placeholder `apps/web/app/page.tsx`

**Interfaces:**
- Produces:
  - `@/components/navbar`: App header showing logo, nav anchors, and dynamic Auth/Dashboard button.
  - `@/components/footer`: Public footer with architecture and copyright links.
  - Landing page at `/` with interactive probe simulation.

- [ ] **Step 1: Create Navbar component**

Create `apps/web/components/navbar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { Activity, ShieldCheck, ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">BetterUptime</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#architecture" className="hover:text-foreground transition-colors">
            Architecture
          </Link>
          <Link href="#demo" className="hover:text-foreground transition-colors">
            Live Preview
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={logout} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-1.5">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Footer component**

Create `apps/web/components/footer.tsx`:
```tsx
import { Activity } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20 py-12 text-sm text-muted-foreground">
      <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-foreground">BetterUptime</span>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        <p className="text-xs text-center md:text-left">
          Distributed website health & latency monitoring built on Turborepo, Redis Streams & PostgreSQL.
        </p>
        <div className="flex space-x-6 text-xs">
          <Link href="/signin" className="hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create Marketing Layout & Landing Page**

Create `apps/web/app/(marketing)/layout.tsx`:
```tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

Create `apps/web/app/(marketing)/page.tsx` (and remove original `apps/web/app/page.tsx` or point to route group):
```tsx
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Server,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-b from-background via-muted/10 to-background border-b border-border/40">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Distributed Probing Engine Active
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Uptime monitoring that <span className="text-emerald-500">never misses a beat</span>.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal">
            High-frequency multi-region health checks backed by Redis Streams consumer groups and fault-tolerant message acknowledgments.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Start Monitoring Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Live Simulation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Simulation Card */}
      <section id="demo" className="w-full py-16 px-4 max-w-5xl">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Multi-Region Probing In Action</h2>
          <p className="text-sm text-muted-foreground">Real-time check distribution across regional probe workers</p>
        </div>

        <Card className="border border-border/80 bg-card/60 backdrop-blur shadow-2xl overflow-hidden">
          <div className="border-b border-border/60 bg-muted/40 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-muted-foreground ml-2">target: https://api.production.internal</span>
            </div>
            <Badge variant="success" className="gap-1.5 font-mono text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              100% Operational
            </Badge>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" /> us-east-1
                  </span>
                  <span className="text-emerald-500 font-mono font-medium">99.98%</span>
                </div>
                <div className="text-2xl font-bold font-mono">42 ms</div>
                <p className="text-xs text-muted-foreground mt-1">Worker #1 • XACK committed</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" /> eu-west-1
                  </span>
                  <span className="text-emerald-500 font-mono font-medium">100.0%</span>
                </div>
                <div className="text-2xl font-bold font-mono">118 ms</div>
                <p className="text-xs text-muted-foreground mt-1">Worker #2 • XACK committed</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" /> ap-south-1
                  </span>
                  <span className="text-emerald-500 font-mono font-medium">99.95%</span>
                </div>
                <div className="text-2xl font-bold font-mono">184 ms</div>
                <p className="text-xs text-muted-foreground mt-1">Worker #1 • XACK committed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Feature Grid */}
      <section id="features" className="w-full py-16 px-4 bg-muted/10 border-t border-border/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Engineered for Zero Downtime Blindspots</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              How BetterUptime distributes and guarantees verification checks at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Redis Streams Queue</CardTitle>
                <CardDescription>
                  Decoupled producers and consumers batch target checks with persistent in-memory append logs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Zero Dropped Pings</CardTitle>
                <CardDescription>
                  Pending Entries List (PEL) and explicit XACK acknowledgments ensure no check is ever lost on crash.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Millisecond Precision</CardTitle>
                <CardDescription>
                  High-frequency HTTP latency benchmarking with detailed per-region response time history.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 text-center border-t border-border/40">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to monitor your services?</h2>
          <p className="text-muted-foreground text-sm">
            Sign up in seconds and get instant alerts for your websites and APIs.
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-11 px-8 gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Clean up old template files**

Remove `apps/web/app/page.module.css` and ensure `apps/web/app/page.tsx` exports the landing page:
In `apps/web/app/page.tsx`:
```tsx
import LandingPage from "./(marketing)/page";
import MarketingLayout from "./(marketing)/layout";

export default function Home() {
  return (
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>
  );
}
```

- [ ] **Step 5: Verify types and build**

Run:
```bash
bun --filter web check-types
```
Expected: Pass.

- [ ] **Step 6: Commit Landing Page**

```bash
git add apps/web
git commit -m "feat(web): add marketing landing page, navbar, and footer"
```

---

### Task 5: Authentication Pages (`apps/web`)

**Files:**
- Create: `apps/web/app/(auth)/layout.tsx`
- Create: `apps/web/app/(auth)/signin/page.tsx`
- Create: `apps/web/app/(auth)/signup/page.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/lib/auth-context`.
- Produces:
  - `/signin`: Sign in form posting to `/user/signin`.
  - `/signup`: Sign up form posting to `/user/signup` and autologging in.

- [ ] **Step 1: Create Auth Layout**

Create `apps/web/app/(auth)/layout.tsx`:
```tsx
import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">BetterUptime</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Sign In Page**

Create `apps/web/app/(auth)/signin/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields");
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Sign In</CardTitle>
        <CardDescription>Enter your account credentials to access your monitors</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Username</label>
            <Input
              type="text"
              placeholder="e.g. devops_admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-500 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Create Sign Up Page**

Create `apps/web/app/(auth)/signup/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await signup(username.trim(), password);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Username may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Create Account</CardTitle>
        <CardDescription>Start monitoring your websites and services in real-time</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Username</label>
            <Input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-emerald-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 4: Verify types and build**

Run:
```bash
bun --filter web check-types
```
Expected: Pass.

- [ ] **Step 5: Commit Auth Pages**

```bash
git add apps/web
git commit -m "feat(web): add signin and signup auth pages with validation"
```

---

### Task 6: Main Dashboard (`apps/web`)

**Files:**
- Create: `apps/web/components/status-badge.tsx`
- Create: `apps/web/components/add-website-modal.tsx`
- Create: `apps/web/app/(dashboard)/layout.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `websiteApi.list()`, `websiteApi.create()`, `websiteApi.delete()`.
- Produces:
  - `@/components/status-badge`: displays `Up` (green), `Down` (red), `Pending` / `Unknow` (gray).
  - `@/components/add-website-modal`: dialog to register new URL.
  - `/dashboard`: main dashboard view with metrics summary, search filter, website table, refresh button.

- [ ] **Step 1: Create Status Badge component**

Create `apps/web/components/status-badge.tsx`:
```tsx
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: "Up" | "Down" | "Unknow" | "Pending" | string }) {
  if (status === "Up") {
    return (
      <Badge variant="success" className="gap-1.5 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Operational
      </Badge>
    );
  }

  if (status === "Down") {
    return (
      <Badge variant="danger" className="gap-1.5 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Downtime
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Pending
    </Badge>
  );
}
```

- [ ] **Step 2: Create Add Website Modal component**

Create `apps/web/components/add-website-modal.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { websiteApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddWebsiteModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let formattedUrl = url.trim();
    if (!formattedUrl) {
      setError("Please provide a valid website URL");
      return;
    }

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      setLoading(true);
      await websiteApi.create(formattedUrl);
      setUrl("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to add website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Monitor a New Website</DialogTitle>
            <DialogDescription>
              Enter the target URL. Our regional probe workers will ping it periodically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {error && (
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Target URL</label>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Monitoring
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create Dashboard Layout**

Create `apps/web/app/(dashboard)/layout.tsx`:
```tsx
"use client";

import Link from "next/link";
import { Activity, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight">BetterUptime</span>
            </Link>
            <nav className="flex items-center space-x-4 text-xs font-medium text-muted-foreground">
              <Link href="/dashboard" className="text-foreground hover:text-foreground">
                Monitors
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Logged in as <strong className="text-foreground">{user?.username || "Admin"}</strong>
            </span>
            <Button size="sm" variant="outline" onClick={logout} className="gap-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create Dashboard Overview Page**

Create `apps/web/app/(dashboard)/dashboard/page.tsx`:
```tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  RotateCw,
  Search,
  ExternalLink,
  ChevronRight,
  Trash2,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { websiteApi, type Website } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { AddWebsiteModal } from "@/components/add-website-modal";

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWebsites = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const res = await websiteApi.list();
      setWebsites(res.websites || []);
    } catch (err) {
      console.error("Failed to fetch websites", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to stop monitoring and delete this website?")) {
      return;
    }
    try {
      setDeletingId(id);
      await websiteApi.delete(id);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert("Failed to delete website");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    return websites.filter((w) =>
      w.url.toLowerCase().includes(search.toLowerCase())
    );
  }, [websites, search]);

  return (
    <div className="space-y-8">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitors</h1>
          <p className="text-xs text-muted-foreground">
            Manage your monitored endpoints and inspect check history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWebsites(true)}
            disabled={refreshing || loading}
            className="gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AddWebsiteModal onCreated={() => fetchWebsites(true)} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Monitors</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{websites.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Targets</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-500">{websites.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Probing Strategy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">Redis Streams + Consumer Groups</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <p className="text-xs">Loading monitors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium">No monitors found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {websites.length === 0
                ? "Start by adding your first website URL to monitor its availability and response times."
                : "No monitors match your search query."}
            </p>
            {websites.length === 0 && (
              <div className="pt-2">
                <AddWebsiteModal onCreated={() => fetchWebsites(true)} />
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target URL</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/${website.id}`}
                        className="hover:underline text-foreground font-semibold flex items-center gap-1.5"
                      >
                        {website.url}
                      </Link>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {website.timeAdded ? new Date(website.timeAdded).toLocaleDateString() : "Just now"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="Pending" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/dashboard/${website.id}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                          Inspect
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, website.id)}
                        disabled={deletingId === website.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Verify types and build**

Run:
```bash
bun --filter web check-types
```
Expected: Pass.

- [ ] **Step 6: Commit Dashboard Page**

```bash
git add apps/web
git commit -m "feat(web): add dashboard overview page, add website modal, and status badges"
```

---

### Task 7: Monitor Detail View with Latency Chart & Recent Ticks (`apps/web`)

**Files:**
- Create: `apps/web/components/latency-chart.tsx`
- Create: `apps/web/components/ticks-table.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/[websiteId]/page.tsx`

**Interfaces:**
- Consumes: `websiteApi.getStatus(websiteId)` returning ticks with regions.
- Produces:
  - `@/components/latency-chart`: responsive SVG bar/line chart rendering response time (ms).
  - `@/components/ticks-table`: detailed table listing check timestamps, regions, status badges, and ms.
  - `/dashboard/[websiteId]`: monitor detail page with uptime percentage, latest latency, manual refresh.

- [ ] **Step 1: Create Latency Chart component**

Create `apps/web/components/latency-chart.tsx`:
```tsx
import type { WebsiteTick } from "@/lib/api";

export function LatencyChart({ ticks }: { ticks: WebsiteTick[] }) {
  if (!ticks || ticks.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground">
        No latency data recorded yet.
      </div>
    );
  }

  // Chronological order for chart
  const data = [...ticks].reverse();
  const maxMs = Math.max(...data.map((t) => t.response_time_ms), 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Latency timeline (ms)</span>
        <span>Max: {maxMs} ms</span>
      </div>
      <div className="h-44 w-full flex items-end gap-1.5 p-3 rounded-lg border border-border/60 bg-muted/10">
        {data.map((tick, idx) => {
          const heightPercent = Math.min(100, Math.max(12, (tick.response_time_ms / maxMs) * 100));
          const isDown = tick.status === "Down";

          return (
            <div
              key={tick.id || idx}
              className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-9 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground border border-border px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-md pointer-events-none">
                <span>{tick.response_time_ms} ms</span>
                <span className="text-muted-foreground">{tick.region?.name || "probe"}</span>
              </div>

              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-sm transition-all duration-300 ${
                  isDown
                    ? "bg-rose-500/80 hover:bg-rose-500"
                    : "bg-emerald-500/70 hover:bg-emerald-500"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Ticks Table component**

Create `apps/web/components/ticks-table.tsx`:
```tsx
import type { WebsiteTick } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";

export function TicksTable({ ticks }: { ticks: WebsiteTick[] }) {
  if (!ticks || ticks.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        No checks recorded yet. Regional probe workers ping this target on their scheduled cycles.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Response Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ticks.map((tick) => (
          <TableRow key={tick.id}>
            <TableCell className="text-xs text-muted-foreground font-mono">
              {new Date(tick.createdAt).toLocaleTimeString()}
            </TableCell>
            <TableCell className="text-xs font-medium">
              {tick.region?.name || "us-east-1"}
            </TableCell>
            <TableCell>
              <StatusBadge status={tick.status} />
            </TableCell>
            <TableCell className="text-right text-xs font-mono font-semibold">
              <span className={tick.status === "Down" ? "text-rose-500" : "text-foreground"}>
                {tick.response_time_ms} ms
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: Create Monitor Detail Page**

Create `apps/web/app/(dashboard)/dashboard/[websiteId]/page.tsx`:
```tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Trash2,
  Clock,
  Activity,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { websiteApi, type WebsiteStatusResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { LatencyChart } from "@/components/latency-chart";
import { TicksTable } from "@/components/ticks-table";

export default function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const router = useRouter();
  const { websiteId } = use(params);

  const [data, setData] = useState<WebsiteStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await websiteApi.getStatus(websiteId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load website status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [websiteId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    try {
      await websiteApi.delete(websiteId);
      router.push("/dashboard");
    } catch (err) {
      alert("Failed to delete monitor");
    }
  };

  const ticks = data?.ticks || [];
  const latestTick = ticks[0];
  const upTicks = ticks.filter((t) => t.status === "Up").length;
  const uptimePercent = ticks.length > 0 ? ((upTicks / ticks.length) * 100).toFixed(1) : "100.0";
  const avgLatency =
    ticks.length > 0
      ? Math.round(ticks.reduce((acc, t) => acc + t.response_time_ms, 0) / ticks.length)
      : 0;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-xs">Loading monitor metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Monitors
          </Button>
        </Link>
        <Card className="border-destructive/40 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">{error || "Monitor not found"}</p>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-1 gap-1">
            <ArrowLeft className="h-3 w-3" />
            Monitors
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">{data.url}</h1>
            <a href={data.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
            </a>
            <StatusBadge status={latestTick?.status || "Pending"} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Uptime Ratio</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{uptimePercent}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Based on last {ticks.length} checks</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgLatency} ms</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Latest: {latestTick?.response_time_ms ? `${latestTick.response_time_ms} ms` : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Pings Logged</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{ticks.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Recorded in PostgreSQL</p>
          </CardContent>
        </Card>
      </div>

      {/* Latency Chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Latency History</CardTitle>
          <CardDescription>Response time per probe check tick across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <LatencyChart ticks={ticks} />
        </CardContent>
      </Card>

      {/* Recent Ticks Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Recent Check Log</CardTitle>
          <CardDescription>Most recent health checks executed by worker instances</CardDescription>
        </CardHeader>
        <TicksTable ticks={ticks} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify types and build**

Run:
```bash
bun --filter web check-types
```
Expected: Pass without errors.

- [ ] **Step 5: Commit Detail Page**

```bash
git add apps/web
git commit -m "feat(web): add website detail view with latency chart and check history"
```

---

### Task 8: End-to-End Verification & Integration Test

**Files:**
- Create: `apps/web/test-e2e.ts`

**Interfaces:**
- Validates the complete pipeline: backend API running on `3001`, Next.js app on `3000`, auth flow, website registration, status querying, and deletion.

- [ ] **Step 1: Write automated end-to-end test script**

Create `apps/web/test-e2e.ts`:
```ts
import axios from "axios";

async function verify() {
  const apiBase = "http://localhost:3001/api/v1";
  console.log("Checking API health at http://localhost:3001/health...");
  const health = await axios.get("http://localhost:3001/health");
  console.log("Health OK:", health.data);

  console.log("Testing user signup/signin flow...");
  const testUser = "e2e_user_" + Math.random().toString(36).substring(7);
  const testPass = "secret123";
  await axios.post(`${apiBase}/user/signup`, { username: testUser, password: testPass });
  const signin = await axios.post(`${apiBase}/user/signin`, { username: testUser, password: testPass });
  const token = signin.data.jwt;
  console.log("JWT acquired successfully.");

  console.log("Creating website monitor...");
  const site = await axios.post(`${apiBase}/website`, { url: "https://github.com" }, {
    headers: { Authorization: token }
  });
  const siteId = site.data.id;
  console.log("Created monitor ID:", siteId);

  console.log("Verifying website status and ticks response structure...");
  const status = await axios.get(`${apiBase}/website/status/${siteId}`, {
    headers: { Authorization: token }
  });
  console.log("Status keys:", Object.keys(status.data));
  if (!Array.isArray(status.data.ticks)) {
    throw new Error("Expected status.data.ticks to be an array");
  }

  console.log("Deleting website monitor...");
  await axios.delete(`${apiBase}/website/${siteId}`, {
    headers: { Authorization: token }
  });
  console.log("E2E API verification completed successfully!");
}

verify().catch((e) => {
  console.error("Verification failed:", e.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run type check across all workspaces**

Run:
```bash
bun run check-types
```
Expected: `turbo run check-types` succeeds with zero errors.

- [ ] **Step 3: Run production build on web**

Run:
```bash
bun --filter web build
```
Expected: Next.js production build completes successfully (`Compiled successfully`).

- [ ] **Step 4: Commit e2e verification script**

```bash
git add apps/web
git commit -m "test: add e2e verification script and confirm successful build"
```
