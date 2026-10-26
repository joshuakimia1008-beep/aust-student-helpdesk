# AUST Student Helpdesk — Vue project

This keeps your existing Vue pages and design. It adds student login pages, a student dashboard and profile, a Supabase backend, role-based admin pages, private image uploads, and a server-side email function.

## Start the app on your computer

1. Download and unzip the project.
2. Open the unzipped `aust-guide-portal` folder in VS Code.
3. Open **Terminal → New Terminal** in VS Code.
4. Check that Node.js 22.18 or newer is installed, then run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of the `cp` command. Open the local address Vite prints (usually `http://localhost:5173`).

The provided `.env.example` selects **real Supabase mode**. Configure the project URL and public anon key before starting the app. To preview without a Supabase project, explicitly set `VITE_BACKEND_MODE=demo`; demo accounts are not real accounts and are not secure storage.

## Run the checks

```bash
npm run type-check
npm run build
npx playwright install chromium   # only needed the first time
npm run test:e2e
```

The Playwright tests cover demo sign-in, a complaint, the student dashboard, anonymous admin case handling, a demo decision, and a protected-page redirect. They do **not** prove that your live Supabase project has correct security settings.

## Connect Supabase

1. Create a Supabase project.
2. In the project, enable email/password sign-in and email confirmation. Add your local address (for example `http://localhost:5173`) and your real website address to Supabase **Authentication → URL Configuration**.
3. Install the Supabase CLI if needed, then in this project folder run:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

This runs the three files in `supabase/migrations` in order:

- `20261022120000_helpdesk_core.sql`
- `20261022130000_helpdesk_api.sql`
- `20261022140000_submission_receipt_email.sql`

If you use the Supabase SQL Editor instead, paste and run those three files **one at a time, in that order**. Do not run them a second time after a successful run.

4. In the Supabase project settings, copy the **Project URL** and the public/anon client key. Open `.env.local` and set:

```dotenv
VITE_BACKEND_MODE=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_OR_ANON_KEY
```

Restart `npm run dev` after changing `.env.local`. Never put a Supabase `service_role` or secret key in `.env.local`, Vue code, or any variable starting with `VITE_`.

5. Deploy the email function and set its secrets. In Supabase, set `RESEND_API_KEY`, `EMAIL_FROM`, and `ALLOWED_ORIGINS` (comma-separated website addresses such as `http://localhost:5173,https://helpdesk.example.edu`). Then run:

```bash
npx supabase functions deploy decision-email
```

The function uses Supabase's server-side environment values for the project URL and service-role key. It sends a request receipt to the student's verified account email with the unique reference number, plus emails when staff record a decision or send a reply. New requests and student messages already appear in the relevant admins' in-app notifications. The student's email is looked up only on the server and is not returned to the admin page. Email failures do not discard a saved request; the portal remains the source of truth.

6. Make the first real admin. Register a real account in the app and verify its email. Then, in **Supabase → SQL Editor**, run this query after replacing the email and display name:

```sql
insert into public.admins (user_id, display_name, role, active)
select id, 'Your Name', 'Super Admin', true
from auth.users
where lower(email) = lower('your.verified@aust.edu.ng')
  and email_confirmed_at is not null;
```

After that, sign in again. That Super Admin can add other **already registered and email-verified** staff from **Team & Roles**. The app will not automatically make a new user an admin.

## What the security setup does

- Students can get their own submissions; case staff receive anonymous case data without the student's name, email, phone, or account ID.
- Admin permissions are checked in database functions, not just hidden buttons. Read-only accounts cannot decide or message.
- Complaint and facility staff and venue staff see only their allowed case types.
- Evidence uses a private Storage bucket. Images are resized and re-encoded in the browser; signed links are short-lived. Image content can still identify a person.
- Email addresses and the service-role key stay out of admin browser responses.

## Important: finish these policy decisions before production

This is a working code base and a good next stage, but it has **not** been connected to your Supabase project or tested against real user accounts. Do not put real student data in it until you test the deployed project and choose the policies below:

- **Database security tests:** run checks in Supabase with separate student, Complaint Admin, Venue Admin, Read-Only Admin, and Super Admin accounts. Verify direct table access, wrong-case access, read-only writes, Storage access, and service-function permissions. The included browser tests use demo data only; there are no PGlite or live Supabase permission tests yet.
- **Duplicate submissions and limits:** the database validates field sizes and types, but the school still needs to decide what counts as a duplicate open complaint and how many requests are allowed. Those rules are not guessed here.
- **Account deletion and records retention:** choose how long the university keeps cases and what happens to a student's profile when an account is deleted before enabling account deletion.
- **Meeting details:** the app can mark a case as “meeting” and staff can include time/place in their response, but meeting time and location are not separate structured fields yet.
- **Email coverage:** student request receipts and staff decisions/replies are emailed to the student. New case and student-message alerts appear in the admin portal; configure and test a shared office inbox separately if AUST wants email alerts for staff. Avoid emailing every admin to reduce noise and unnecessary exposure of case details.
- **Retrying email:** failed email is recorded; add an approved retry workflow and verify provider duplicate-delivery behavior before relying on it operationally.

For public use, also set up backups, production email sender verification, domain allowlists, rate limits, and a privacy review with AUST. `npm run build` passing does not replace those checks.

## Main files

- `src/lib/auth.ts` — Supabase and demo sign-in.
- `src/lib/backend.ts` — shared demo/Supabase data functions.
- `src/lib/supabase.ts` — browser client configuration.
- `src/router.ts` — public and protected routes.
- `src/views/StudentDashboard.vue`, `StudentSubmission.vue`, `StudentProfile.vue` — student pages.
- `src/views/admin/` — admin pages.
- `supabase/migrations/` — database, roles, policies, and functions.
- `supabase/functions/decision-email/index.ts` — private email sending.
- `tests/e2e/helpdesk.spec.ts` — demo browser tests.
