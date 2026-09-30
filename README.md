# Plateforme Informatique

A French-UI educational platform for teaching Informatique (Computer Science) to Moroccan
collège students (1APIC/2APIC/3APIC). Single-teacher admin, no student accounts — students
get in with a shared 4-digit access code, and each exam adds its own 4-digit secret code on
top of that.

## Stack

- **Next.js 16** (App Router, Server Components first) + TypeScript
- **Tailwind v4** + **shadcn/ui** (Base UI variant, not Radix)
- **Supabase**: Postgres, Auth (admin only), Storage (public buckets)
- **Zod** for validation, **jose** for the student session JWT (Edge-compatible)
- **@dnd-kit** (reordering), **CodeMirror** (HTML activity editor), **@react-pdf/renderer**
  (answer sheets), **exceljs** (results export)
- Deployed to **Vercel**

## Getting started

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com) (or use the CLI locally). You'll need,
from **Project Settings → API** and **→ Database → Connect**:

- Project URL and `anon` key
- `service_role` key (server-only — never expose this to the client)
- A Postgres connection string using the **Supavisor pooler** host
  (`aws-...-pooler.supabase.com`), not `db.<ref>.supabase.co` — the direct host is IPv6-only
  and unreachable from networks without IPv6 egress.

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
ACCESS_SESSION_SECRET=          # node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 2. Disable public sign-up

In the Supabase dashboard: **Authentication → Sign In / Providers → Email**, turn **off**
"Allow new users to sign up". Every row in `auth.users` is treated as an admin (single-teacher
V1, no roles table) — with sign-up left on, anyone could create an admin account directly
against the Auth API using only the public `anon` key.

### 3. Run migrations

The Supabase CLI wasn't available in the original dev environment, so migrations run through a
small custom runner instead of `supabase db push`:

```bash
npm run db:migrate
```

This applies everything in `supabase/migrations/` in order, tracked in a `_migrations` table so
re-running is safe. Creates the schema, RLS policies, and the three Storage buckets
(`lesson-images`, `lesson-files`, `documents` — all public-read, admin-only write).

If the Supabase CLI is available in your environment, `supabase db push` against the same
`supabase/migrations/` folder works too.

### 4. Create the admin account

No sign-up flow exists by design. Create the first (and normally only) admin user from the
Supabase dashboard: **Authentication → Users → Add user**, set an email and password. That's
the whole account — log in at `/admin/login`.

For a single high-value account like this, enabling TOTP MFA on it (dashboard → the user →
Multi-factor) is worth doing.

### 5. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/` and everything under it requires an
access code — create one first at `/admin/access-codes` (log in at `/admin/login`), then use it
at `/access`.

## Project structure

```
src/
├── middleware.ts          # student session gate + admin auth gate, see below
├── app/
│   ├── (student)/         # public-ish routes, all gated by the access-code session
│   ├── admin/             # admin dashboard, gated by Supabase Auth
│   ├── exam/               # secret-code entry + exam-taking + results
│   └── api/                # verify/submit/export endpoints — see Security below
├── components/            # ui/ (shadcn) + admin/ + student-facing, by feature
├── actions/                # Server Actions — admin CRUD
├── lib/
│   ├── supabase/            # server.ts (SSR), admin.ts (service role, server-only)
│   └── auth/                # access-session.ts, exam-session.ts (jose JWTs)
├── schemas/                 # Zod schemas, one per domain
└── lib/pdf/, app/api/admin/results/export/  # answer sheets, results export
supabase/migrations/         # applied in order by scripts/migrate.mjs
```

## Security model (short version)

- **Student session**: a signed JWT cookie (`platform_session`), set after `/api/access/verify`
  checks a submitted code against `access_codes`. Not Supabase Auth — a separate mechanism, so
  Postgres RLS can't see it directly.
- **RLS**: curriculum content (levels/units/.../exercises/html_pages/announcements) is
  `anon`-readable once `is_published = true` — the real gate is the app-layer session above, RLS
  here is a soft backstop. Anything that can reveal a secret or a correct answer (question
  options, `exams`, `access_codes`, all attempts/answers) has **zero** `anon` grants at all and
  is only ever touched by server-only code using the service-role client
  (`src/lib/supabase/admin.ts`, which imports `server-only` so a client-side import fails the
  build).
- **Exams** add a second, independent 4-digit code (`exams.secret_code`) on top of the platform
  session, verified server-side with the same rate-limiting as the platform code
  (`access_attempts`, scoped by `(ip, code)` and by code-wide velocity — a shared classroom IP
  shouldn't lock a whole class out).
- **HTML activities** run in `<iframe sandbox="allow-scripts" srcDoc={...}>` — deliberately
  *without* `allow-same-origin`, so admin-authored HTML/CSS/JS gets an opaque origin that can't
  read cookies, localStorage, or the parent page, even though it can still run scripts.
- **Middleware** (`src/middleware.ts`) gates page routes and most `/api/*` routes by prefix, but
  every sensitive Server Action/Route Handler re-checks itself too (e.g. an access code that's
  freshly deactivated stops working immediately, not just when its JWT expires) — middleware is
  a fast-path, never the sole authority.

## Scripts

```bash
npm run dev         # Turbopack dev server
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run db:migrate    # apply supabase/migrations/*.sql (idempotent)
```
