# Plateforme Informatique — v2

French-UI educational platform for teaching Informatique (Computer Science) to Moroccan
collège students (1APIC / 2APIC / 3APIC). Single-teacher admin, no student accounts —
students get in with a shared 4-digit access code, and each exam adds its own secret code
on top of that.

> **v2 clean-slate rewrite in progress.** This README reflects the v2 architecture. The
> previous (v1) README is preserved in git history at the `ce1cdb5` checkpoint commit.
> This foundation (session 1 of a multi-session rebuild) covers access gate, admin
> curriculum CRUD, student landing, course viewer, and settings. Exams and exercises are
> implemented in follow-up sessions — see `.claude/plans/sleepy-squishing-crescent.md` §
> "REBUILD v2" for the complete multi-session roadmap.

## Stack

- **Next.js 16** (App Router, Server Components first) + TypeScript
- **Tailwind v4** + shadcn / Base UI primitives
- **Supabase**: Postgres with RLS, Auth (admin only), Storage
- **Zod** for validation, **jose** for the student session JWT
- **@react-pdf/renderer** (reports) + **ExcelJS** (exports) — wired in later sessions
- Deployed to **Vercel**

## Getting started

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com). From **Project Settings → API** copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

From **Project Settings → Database → Connection string → URI** (the pooler one) copy the
whole URL with your DB password filled in → `SUPABASE_DB_URL`.

Also pick a random long string for `ACCESS_SESSION_SECRET` (used to sign the student JWT).

### 2. `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
ACCESS_SESSION_SECRET=<random 32+ char string>
```

### 3. Apply the v2 schema

**One-paste reset (recommended):** open the Supabase SQL Editor, paste the entire contents of
[`scripts/reset-and-rebuild.sql`](scripts/reset-and-rebuild.sql), run. This drops anything
previously in the `public` schema, recreates all v2 tables with RLS, seeds one access code
(`2026`), and marks the migration as applied.

**Via `scripts/migrate.mjs`:** also works, if the DB is already empty. Just:
```bash
npm run db:migrate
```

### 4. Create the admin account

In the Supabase dashboard → **Authentication → Users → Add user**, create your admin email +
password. Also disable **Allow new users to sign up** under Authentication → Settings → Sign
In / Up — the only account should be the one you just created.

### 5. Run

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You'll be redirected to `/access` —
enter the seeded code `2026` to get in. Admin side is at
[http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## What's in v2 (vs v1)

| Area | v1 | v2 |
|------|----|-----|
| Content hierarchy | Level → Unit → Sequence → Session, with polymorphic `lesson_contents` blocks (text/image/video/pdf/file/exercise/html) | Same hierarchy, but each session has a single `content_markdown` field (admin writes markdown directly) |
| Admin curriculum UI | 3 separate top-level pages (Units / Sequences / Sessions) + a 4th for block builder | 1 unified page: pick a level, see the full tree with inline CRUD everywhere |
| Exams | 1 exam = 1 secret code + 1 question set; multi-model workaround via `devoir_number`/`semester` tags | 1 **exam** (parent) + N **exam_models** (A/B/C/D children), each model has own secret code + own questions, results aggregated under the parent |
| HTML activities | Separate `html_pages` table + CodeMirror editor + sandboxed iframe | **Dropped** |
| Announcements | Separate `announcements` table + CRUD + Actualités public page | **Dropped** |
| Rate limiting | DB table `access_attempts` | **In-memory sliding window** (`src/lib/rate-limit.ts`) |
| `description` fields | Everywhere | **Dropped from every form** |
| Schema | ~20 tables | 15 tables |

## Project layout

```
src/
  app/
    layout.tsx                 — root layout (fonts + globals.css)
    globals.css                — Tailwind v4 + design tokens
    middleware.ts              — route guards (student JWT + admin Supabase Auth)
    access/                    — platform access gate
    (student)/                 — student app (gated group)
      layout.tsx               — student header + footer
      page.tsx                 — landing (hero + level grid)
      courses/                 — curriculum browsing
      exercises/, exam/        — placeholders, built in sessions 2-3
    admin/
      login/                   — admin login (unauthed)
      (authed)/                — everything requiring admin auth
        layout.tsx             — admin shell (sidebar)
        page.tsx               — dashboard
        curriculum/            — unified Level → Unit → Sequence → Session CRUD
        access-codes/          — access code CRUD
        settings/              — school/teacher key-value settings
        exercises/, exams/, results/   — placeholders
    api/
      access/verify/           — JWT access cookie
  components/
    ui/                        — Button, Input, Card, Dialog, etc.
    access/                    — access form
    admin/                     — admin shell, curriculum tree, dialogs, forms
    student/                   — student nav, markdown renderer
  lib/
    env.ts                     — env validation
    utils.ts                   — cn()
    rate-limit.ts              — in-memory limiter
    settings.ts                — read school settings
    grading.ts                 — scoreOutOf20 + getAppreciation
    shuffle.ts                 — deterministic shuffle for exam questions
    supabase/                  — SSR + admin + browser clients
    auth/                      — JWT session + admin guard
    pdf/fonts/                 — Cairo/Kalam/PatrickHand .ttf
  schemas/                     — Zod form schemas
  actions/                     — Server Actions

scripts/
  migrate.mjs                  — incremental migration runner
  reset-and-rebuild.sql        — one-paste full reset for Supabase SQL Editor

supabase/migrations/
  0001_v2_schema.sql           — the only v2 migration (so far)
```

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run db:migrate` — apply unapplied migrations from `supabase/migrations/`
