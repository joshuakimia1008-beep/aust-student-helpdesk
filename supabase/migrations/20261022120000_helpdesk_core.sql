-- AUST Student Helpdesk — Stage 1 core schema
-- Security model:
--   * Authenticated students can read/update only their own limited profile fields.
--   * The browser receives no direct privileges on submissions, admins, messages,
--     notifications, or audit_logs. Later migrations add narrow, verified RPCs.
--   * Student identity is stored separately from case data. Admin case RPCs must
--     never join/return profiles or auth.users.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Private account details.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default ''
    check (char_length(display_name) <= 100),
  phone text
    check (phone is null or char_length(phone) <= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Administrative role assignments.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 1 and 100),
  role text not null check (role in (
    'Super Admin', 'Complaint Admin', 'Venue Admin', 'Read-Only Admin'
  )),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Student submissions.
create table if not exists public.submissions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  reference_code text not null unique default
    ('AUST-' || upper(replace(pg_catalog.gen_random_uuid()::text, '-', ''))),
  student_id uuid references auth.users(id) on delete set null,
  kind text not null
    check (kind in ('complaint', 'facility', 'venue')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'meeting')),
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  location text
    check (location is null or char_length(location) <= 200),
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object')
    check (octet_length(details::text) <= 16384),
  admin_response text
    check (admin_response is null or char_length(admin_response) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint submissions_reference_format
    check (reference_code ~ '^AUST-[0-9A-F]{32}$')
);

create index if not exists submissions_student_created_idx
  on public.submissions (student_id, created_at desc);

create index if not exists submissions_kind_status_created_idx
  on public.submissions (kind, status, created_at desc);

-- Messages tied to a submission.
create table if not exists public.messages (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  submission_id uuid not null
    references public.submissions(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_type text not null
    check (sender_type in ('student', 'admin')),
  body text not null
    check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists messages_submission_created_idx
  on public.messages (submission_id, created_at);

-- Student-targeted notifications.
create table if not exists public.notifications (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  recipient_id uuid not null
    references auth.users(id) on delete cascade,
  submission_id uuid
    references public.submissions(id) on delete set null,
  event_type text not null check (event_type in (
    'submission_created', 'decision', 'meeting', 'message'
  )),
  reference_code text,
  summary text not null
    check (char_length(summary) between 1 and 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

-- Append-only audit/event records.
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  submission_id uuid
    references public.submissions(id) on delete set null,
  action text not null
    check (char_length(action) between 1 and 100),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object')
    check (octet_length(metadata::text) <= 4096),
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_submission_created_idx
  on public.audit_logs (submission_id, created_at desc);

-- Server-maintained updated_at.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at()
  from public, anon, authenticated;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

create trigger admins_touch_updated_at
  before update on public.admins
  for each row execute function private.touch_updated_at();

create trigger submissions_touch_updated_at
  before update on public.submissions
  for each row execute function private.touch_updated_at();

-- Create a private profile for each new Auth user.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        ''
      ),
      100
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated;

create trigger on_auth_user_created_helpdesk_profile
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- Enable Row Level Security on every table.
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.submissions enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_self
  on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_update_self
  on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Remove direct client privileges on sensitive tables.
revoke all on table
  public.profiles,
  public.admins,
  public.submissions,
  public.messages,
  public.notifications,
  public.audit_logs
  from public, anon, authenticated;

grant select on table public.profiles to authenticated;

grant update (display_name, phone)
  on table public.profiles to authenticated;

-- Sequences are not exposed to the browser.
revoke all on all sequences in schema public
  from public, anon, authenticated;

-- Future functions must be granted explicitly.
alter default privileges in schema public
  revoke execute on functions from public;

comment on table public.profiles is
  'Private student account data. No administrator-facing query may expose this table.';

comment on table public.submissions is
  'Case data linked to a student UUID for authorization; browser access is through scoped RPCs only.';

comment on table public.admins is
  'Trusted admin role registry. Never writable directly by authenticated clients.';

comment on table public.audit_logs is
  'Security/event audit trail; do not put personal data or message contents in metadata.';

commit;