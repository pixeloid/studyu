# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 application with Supabase backend, using the App Router pattern with TypeScript and TailwindCSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: TailwindCSS 4
- **Database**: Supabase (PostgreSQL) with local development support
- **Auth**: Supabase Auth with SSR support

## Development Commands

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
supabase start       # Start local Supabase (requires Docker)
supabase stop        # Stop local Supabase
supabase db reset    # Reset database to initial state
supabase gen types typescript --local > src/types/database.ts  # Generate types from schema
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
├── lib/supabase/          # Supabase client configuration
│   ├── client.ts          # Browser client (use in Client Components)
│   ├── server.ts          # Server client (use in Server Components/Actions)
│   └── middleware.ts      # Session refresh middleware
├── types/
│   └── database.ts        # TypeScript types for Supabase tables
└── middleware.ts          # Next.js middleware for auth session refresh
supabase/
├── config.toml            # Local Supabase configuration
├── migrations/            # Database migrations (applied with supabase db push)
└── seed.sql               # Seed data for local development
```

## Supabase Client Usage

**Server Components / Server Actions:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select()
}
```

**Client Components:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function Component() {
  const supabase = createClient()
  // Use in useEffect or event handlers
}
```

## Database Migrations

Create migrations in `supabase/migrations/` with timestamp prefix:
```bash
supabase migration new your_migration_name
```

Apply migrations to local database:
```bash
supabase db reset  # Applies all migrations from scratch
```

## Environment Variables

Local development uses `.env.local` (created automatically from local Supabase):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Publishable API key

For production, set these in your deployment platform with your Supabase project credentials.
