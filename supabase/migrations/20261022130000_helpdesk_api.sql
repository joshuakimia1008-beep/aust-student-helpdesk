-- AUST Helpdesk Stage 2: secure API functions
-- Run after 20261022120000_helpdesk_core.sql.
-- Browser code must use these functions instead of querying case tables directly.

begin;

create table if not exists public.email_deliveries (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.email_deliveries enable row level security;
revoke all on table public.email_deliveries from public, anon, authenticated;

-- Evidence is kept in a private bucket. Object names start with the case UUID,
-- not the student's account UUID, so staff never receive the account ID.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('helpdesk-evidence','helpdesk-evidence',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=2097152,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create or replace function private.can_upload_case_evidence(p_object_name text)
returns boolean language plpgsql stable security definer
set search_path = pg_catalog, public, auth
as $$
declare v_case uuid; v_count bigint;
begin
  if auth.uid() is null or split_part(p_object_name,'/',1) !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  v_case := split_part(p_object_name,'/',1)::uuid;
  if not exists(select 1 from public.submissions s where s.id=v_case and s.student_id=auth.uid()) then return false; end if;
  select count(*) into v_count from storage.objects o
    where o.bucket_id='helpdesk-evidence' and split_part(o.name,'/',1)=v_case::text;
  return v_count<4;
exception when invalid_text_representation then return false;
end;
$$;

create or replace function private.can_read_case_evidence(p_object_name text)
returns boolean language plpgsql stable security definer
set search_path = pg_catalog, public, auth
as $$
declare v_case uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null or split_part(p_object_name,'/',1) !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  v_case := split_part(p_object_name,'/',1)::uuid;
  return exists(select 1 from public.submissions s where s.id=v_case
    and (s.student_id=v_uid or private.can_handle(v_uid,s.kind)));
exception when invalid_text_representation then return false;
end;
$$;
revoke all on function private.can_upload_case_evidence(text) from public,anon,authenticated;
revoke all on function private.can_read_case_evidence(text) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.can_upload_case_evidence(text) to authenticated;
grant execute on function private.can_read_case_evidence(text) to authenticated;
drop policy if exists helpdesk_evidence_insert on storage.objects;
create policy helpdesk_evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id='helpdesk-evidence' and private.can_upload_case_evidence(name));
drop policy if exists helpdesk_evidence_select on storage.objects;
create policy helpdesk_evidence_select on storage.objects for select to authenticated
  using (bucket_id='helpdesk-evidence' and private.can_read_case_evidence(name));

create or replace function private.require_verified_user()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sign in is required' using errcode = '28000'; end if;
  if not exists (select 1 from auth.users u where u.id = v_uid and u.email_confirmed_at is not null) then
    raise exception 'Verify your email before continuing' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function private.admin_role(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog, auth, public
as $$
  select a.role
  from public.admins a
  join auth.users u on u.id = a.user_id
  where a.user_id = p_uid and a.active and u.email_confirmed_at is not null
  limit 1
$$;

create or replace function private.can_handle(p_uid uuid, p_kind text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public
as $$
  select case private.admin_role(p_uid)
    when 'Super Admin' then p_kind in ('complaint','facility','venue')
    when 'Complaint Admin' then p_kind in ('complaint','facility')
    when 'Venue Admin' then p_kind = 'venue'
    else false
  end
$$;

create or replace function private.require_admin(p_kind text default null, p_write boolean default false)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public
as $$
declare v_uid uuid := auth.uid(); v_role text;
begin
  if v_uid is null then raise exception 'Sign in is required' using errcode = '28000'; end if;
  v_role := private.admin_role(v_uid);
  if v_role is null then raise exception 'Active admin permission required' using errcode = '42501'; end if;
  if p_write and v_role = 'Read-Only Admin' then
    raise exception 'Read-only admins cannot make changes' using errcode = '42501';
  end if;
  if p_kind is not null and not private.can_handle(v_uid, p_kind) then
    raise exception 'Your role cannot access this case type' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

revoke all on function private.require_verified_user() from public, anon, authenticated;
revoke all on function private.admin_role(uuid) from public, anon, authenticated;
revoke all on function private.can_handle(uuid,text) from public, anon, authenticated;
revoke all on function private.require_admin(text,boolean) from public, anon, authenticated;

create or replace function public.current_admin_role()
returns text
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare v_uid uuid := private.require_verified_user();
begin
  return private.admin_role(v_uid);
end;
$$;
revoke all on function public.current_admin_role() from public, anon;
grant execute on function public.current_admin_role() to authenticated;

-- Student creates a case. Applicant identity is derived from the signed-in user;
-- clients cannot choose another student_id or generate a reference code.
create or replace function public.student_create_submission(
  p_kind text, p_title text, p_location text, p_details jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $$
declare v_uid uuid; v_id uuid; v_ref text;
begin
  v_uid := private.require_verified_user();
  if p_kind not in ('complaint','facility','venue') then raise exception 'Invalid case type'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 160 then raise exception 'Title must be 1–160 characters'; end if;
  if p_location is not null and char_length(p_location) > 200 then raise exception 'Location is too long'; end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' or octet_length(p_details::text) > 16384 or jsonb_object_length(p_details) > 30 then
    raise exception 'Invalid case details';
  end if;
  if exists (select 1 from jsonb_each_text(p_details) e where char_length(e.value) > 5000) then
    raise exception 'A detail field is too long';
  end if;
  insert into public.submissions(student_id,kind,title,location,details)
  values (v_uid,p_kind,btrim(p_title),nullif(btrim(p_location),''),p_details)
  returning id,reference_code into v_id,v_ref;
  insert into public.notifications(recipient_id,submission_id,event_type,reference_code,summary)
  values (v_uid,v_id,'submission_created',v_ref,'Your submission was received: '||v_ref);
  return jsonb_build_object('id',v_id,'reference_code',v_ref,'status','pending');
end;
$$;

create or replace function public.student_attach_evidence(p_reference_code text,p_object_path text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, storage
as $$
declare v_uid uuid := private.require_verified_user(); v_sub public.submissions%rowtype; v_paths jsonb;
begin
  select * into v_sub from public.submissions where reference_code=p_reference_code and student_id=v_uid for update;
  if not found then raise exception 'Submission not found' using errcode='P0002'; end if;
  if p_object_path !~ ('^'||v_sub.id::text||'/[0-9a-fA-F-]{36}[.]jpg$') then raise exception 'Invalid evidence path'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='helpdesk-evidence' and o.name=p_object_path) then
    raise exception 'Evidence upload was not found';
  end if;
  v_paths := coalesce(v_sub.details->'evidence_paths','[]'::jsonb);
  if jsonb_typeof(v_paths)<>'array' or jsonb_array_length(v_paths)>=4 then raise exception 'Up to four images are allowed'; end if;
  update public.submissions set details=jsonb_set(details,'{evidence_paths}',v_paths||to_jsonb(p_object_path),true)
    where id=v_sub.id;
end;
$$;

create or replace function public.student_list_submissions()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid; v_result jsonb;
begin
  v_uid := private.require_verified_user();
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'reference_code',s.reference_code,'kind',s.kind,'status',s.status,
    'title',s.title,'location',s.location,'details',s.details,'admin_response',s.admin_response,
    'created_at',s.created_at,'updated_at',s.updated_at
  ) order by s.created_at desc),'[]'::jsonb) into v_result
  from public.submissions s where s.student_id = v_uid;
  return v_result;
end;
$$;

create or replace function public.student_get_submission(p_reference_code text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_verified_user(); v_result jsonb;
begin
  select jsonb_build_object(
    'id',s.id,'reference_code',s.reference_code,'kind',s.kind,'status',s.status,
    'title',s.title,'location',s.location,'details',s.details,'admin_response',s.admin_response,
    'created_at',s.created_at,'updated_at',s.updated_at,
    'messages',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'from',case when m.sender_id=v_uid then 'You' else 'AUST Helpdesk' end,
      'body',m.body,'created_at',m.created_at
    ) order by m.created_at) from public.messages m where m.submission_id=s.id),'[]'::jsonb)
  ) into v_result
  from public.submissions s
  where s.reference_code=p_reference_code and s.student_id=v_uid;
  if v_result is null then raise exception 'Submission not found' using errcode='P0002'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_list_submissions(p_kind text default null, p_status text default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid; v_result jsonb;
begin
  v_uid := private.require_admin(null,false);
  if p_kind is not null and p_kind not in ('complaint','facility','venue') then raise exception 'Invalid case type'; end if;
  if p_status is not null and p_status not in ('pending','accepted','declined','meeting') then raise exception 'Invalid status'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'reference_code',s.reference_code,'kind',s.kind,'status',s.status,
    'title',s.title,'location',s.location,'details',s.details,'admin_response',s.admin_response,
    'created_at',s.created_at,'updated_at',s.updated_at
  ) order by s.created_at desc),'[]'::jsonb) into v_result
  from public.submissions s
  where private.can_handle(v_uid,s.kind)
    and (p_kind is null or s.kind=p_kind)
    and (p_status is null or s.status=p_status);
  return v_result;
end;
$$;

create or replace function public.admin_get_submission(p_reference_code text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_admin(null,false); v_result jsonb;
begin
  select jsonb_build_object(
    'id',s.id,'reference_code',s.reference_code,'kind',s.kind,'status',s.status,
    'title',s.title,'location',s.location,'details',s.details,'admin_response',s.admin_response,
    'created_at',s.created_at,'updated_at',s.updated_at,
    'messages',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'from',case when m.sender_type='student' then 'Student' else 'AUST Helpdesk' end,
      'body',m.body,'created_at',m.created_at
    ) order by m.created_at) from public.messages m where m.submission_id=s.id),'[]'::jsonb)
  ) into v_result
  from public.submissions s
  where s.reference_code=p_reference_code and private.can_handle(v_uid,s.kind);
  if v_result is null then raise exception 'Submission not found' using errcode='P0002'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_decide(
  p_reference_code text, p_status text, p_response text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid; v_sub public.submissions%rowtype; v_note uuid;
begin
  v_uid := private.require_admin(null,true);
  if p_status not in ('accepted','declined','meeting') then raise exception 'Invalid decision'; end if;
  if p_response is not null and char_length(p_response)>5000 then raise exception 'Response is too long'; end if;
  select * into v_sub from public.submissions where reference_code=p_reference_code for update;
  if not found then raise exception 'Submission not found' using errcode='P0002'; end if;
  if not private.can_handle(v_uid,v_sub.kind) then raise exception 'Submission not found' using errcode='P0002'; end if;
  if v_sub.status not in ('pending','meeting') then raise exception 'This case is already closed'; end if;
  update public.submissions set status=p_status,admin_response=nullif(btrim(p_response),''),decided_at=now()
    where id=v_sub.id;
  if v_sub.student_id is not null then
    insert into public.notifications(recipient_id,submission_id,event_type,reference_code,summary)
    values (v_sub.student_id,v_sub.id,case when p_status='meeting' then 'meeting' else 'decision' end,
      v_sub.reference_code,'There is an update on your submission '||v_sub.reference_code)
    returning id into v_note;
    insert into public.email_deliveries(notification_id) values(v_note);
  end if;
  insert into public.audit_logs(actor_id,submission_id,action,metadata)
  values(v_uid,v_sub.id,'decision_recorded',jsonb_build_object('status',p_status,'reference_code',v_sub.reference_code));
  return jsonb_build_object('reference_code',v_sub.reference_code,'status',p_status,'notification_id',v_note);
end;
$$;

create or replace function public.send_submission_message(p_reference_code text,p_body text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_verified_user(); v_sub public.submissions%rowtype; v_type text; v_id uuid; v_note uuid;
begin
  if p_body is null or char_length(btrim(p_body)) not between 1 and 5000 then raise exception 'Message must be 1–5000 characters'; end if;
  if private.admin_role(v_uid) is null then
    select * into v_sub from public.submissions
      where reference_code=p_reference_code and student_id=v_uid for update;
  else
    select * into v_sub from public.submissions
      where reference_code=p_reference_code and private.can_handle(v_uid,kind) for update;
  end if;
  if not found then raise exception 'Submission not found' using errcode='P0002'; end if;
  if v_sub.student_id=v_uid then
    v_type := 'student';
  else
    perform private.require_admin(v_sub.kind,true);
    v_type := 'admin';
  end if;
  insert into public.messages(submission_id,sender_id,sender_type,body)
    values(v_sub.id,v_uid,v_type,btrim(p_body)) returning id into v_id;
  if v_sub.student_id is not null then
    insert into public.notifications(recipient_id,submission_id,event_type,reference_code,summary)
    values(v_sub.student_id,v_sub.id,'message',v_sub.reference_code,'A new message was added to '||v_sub.reference_code)
    returning id into v_note;
    if v_type='admin' then insert into public.email_deliveries(notification_id) values(v_note); end if;
  end if;
  insert into public.audit_logs(actor_id,submission_id,action,metadata)
    values(v_uid,v_sub.id,'message_sent',jsonb_build_object('reference_code',v_sub.reference_code,'sender_type',v_type));
  return jsonb_build_object('id',v_id,'created_at',now(),'notification_id',v_note,'sender_type',v_type);
end;
$$;

create or replace function public.student_list_notifications()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_verified_user(); v_result jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'reference_code',n.reference_code,
    'event_type',n.event_type,'summary',n.summary,'read_at',n.read_at,'created_at',n.created_at)
    order by n.created_at desc),'[]'::jsonb) into v_result
  from public.notifications n where n.recipient_id=v_uid;
  return v_result;
end;
$$;

create or replace function public.student_mark_notifications_read()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_verified_user();
begin update public.notifications set read_at=now() where recipient_id=v_uid and read_at is null; end;
$$;

create or replace function public.admin_list_notifications(p_limit integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_admin(null,false); v_result jsonb;
begin
  if p_limit<1 or p_limit>200 then raise exception 'Limit must be 1–200'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'reference_code',x.reference_code,
    'event_type',x.event_type,'summary',x.summary,'created_at',x.created_at)
    order by x.created_at desc),'[]'::jsonb) into v_result
  from (
    select n.id,n.reference_code,n.event_type,n.summary,n.created_at
    from public.notifications n
    join public.submissions s on s.id=n.submission_id
    where private.can_handle(v_uid,s.kind) and n.event_type<>'message'
    union all
    select m.id,s.reference_code,'message','New student message on '||s.reference_code,m.created_at
    from public.messages m join public.submissions s on s.id=m.submission_id
    where m.sender_type='student' and private.can_handle(v_uid,s.kind)
    order by created_at desc
    limit p_limit
  ) x;
  return v_result;
end;
$$;

create or replace function public.admin_list_team()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_admin(null,false); v_result jsonb;
begin
  if private.admin_role(v_uid)<>'Super Admin' then raise exception 'Super Admin permission required' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',a.user_id,'display_name',a.display_name,
    'email',u.email,'role',a.role,'active',a.active)
    order by a.display_name),'[]'::jsonb) into v_result
  from public.admins a join auth.users u on u.id=a.user_id;
  return v_result;
end;
$$;

create or replace function public.super_admin_set_admin_by_email(
  p_email text,p_role text,p_active boolean,p_display_name text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $$
declare v_user_id uuid; v_uid uuid := private.require_admin(null,true);
begin
  if private.admin_role(v_uid)<>'Super Admin' then raise exception 'Super Admin permission required' using errcode='42501'; end if;
  select id into v_user_id from auth.users where lower(email)=lower(btrim(p_email)) and email_confirmed_at is not null;
  if v_user_id is null then raise exception 'No verified account found for that email'; end if;
  perform public.super_admin_set_admin(v_user_id,p_role,p_active,p_display_name);
end;
$$;

create or replace function public.super_admin_set_admin(p_user_id uuid,p_role text,p_active boolean,p_display_name text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $$
declare v_uid uuid := private.require_admin(null,true); v_count integer;
begin
  if private.admin_role(v_uid)<>'Super Admin' then raise exception 'Super Admin permission required' using errcode='42501'; end if;
  if p_role not in ('Super Admin','Complaint Admin','Venue Admin','Read-Only Admin') then raise exception 'Invalid role'; end if;
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 100 then raise exception 'Name must be 1–100 characters'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'User must exist and have verified email'; end if;
  if p_user_id=v_uid and (not p_active or p_role<>'Super Admin') then raise exception 'You cannot remove your own Super Admin access'; end if;
  if exists(select 1 from public.admins where user_id=p_user_id and role='Super Admin' and active and (not p_active or p_role<>'Super Admin')) then
    select count(*) into v_count from public.admins where role='Super Admin' and active;
    if v_count<=1 then raise exception 'At least one active Super Admin must remain'; end if;
  end if;
  insert into public.admins(user_id,display_name,role,active) values(p_user_id,btrim(p_display_name),p_role,p_active)
  on conflict(user_id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active;
  insert into public.audit_logs(actor_id,action,metadata) values(v_uid,'admin_role_changed',jsonb_build_object('target_user_id',p_user_id,'role',p_role,'active',p_active));
end;
$$;

create or replace function public.admin_list_logs(p_limit integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_uid uuid := private.require_admin(null,false); v_result jsonb;
begin
  if p_limit<1 or p_limit>200 then raise exception 'Limit must be 1–200'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'action',x.action,
    'reference_code',x.reference_code,'metadata',x.metadata,'created_at',x.created_at)
    order by x.created_at desc),'[]'::jsonb) into v_result
  from (
    select l.id,l.action,l.metadata,l.created_at,s.reference_code
    from public.audit_logs l
    left join public.submissions s on s.id=l.submission_id
    where (private.admin_role(v_uid)='Super Admin'
      or (s.id is not null and private.can_handle(v_uid,s.kind)))
    order by l.created_at desc
    limit p_limit
  ) x;
  return v_result;
end;
$$;

-- This RPC is for the server-side Edge Function only. It is never granted to
-- anon/authenticated, so an admin browser cannot ask for a student's email.
create or replace function public.admin_email_payload(p_notification_id uuid,p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $$
declare v_result jsonb; v_n public.notifications%rowtype; v_s public.submissions%rowtype; v_email text;
begin
  if private.admin_role(p_actor_id) is null then raise exception 'Active admin required' using errcode='42501'; end if;
  select * into v_n from public.notifications where id=p_notification_id;
  if not found then raise exception 'Notification not found' using errcode='P0002'; end if;
  select * into v_s from public.submissions where id=v_n.submission_id;
  if not found or not private.can_handle(p_actor_id,v_s.kind) then raise exception 'Not authorized' using errcode='42501'; end if;
  select email into v_email from auth.users where id=v_n.recipient_id and email_confirmed_at is not null;
  if v_email is null then raise exception 'Verified recipient email unavailable'; end if;
  select jsonb_build_object('recipient_email',v_email,'reference_code',v_s.reference_code,
    'title',v_s.title,'kind',v_s.kind,'status',v_s.status,'response',coalesce(v_s.admin_response,''),
    'message_body',coalesce((select m.body from public.messages m where m.submission_id=v_s.id
      and m.sender_type='admin' and v_n.event_type='message' order by m.created_at desc limit 1),''),
    'delivery_id',e.id,'delivery_status',e.status)
    into v_result from public.email_deliveries e where e.notification_id=v_n.id;
  return v_result;
end;
$$;

create or replace function public.admin_email_delivery_result(p_delivery_id uuid,p_status text,p_provider_id text,p_error text)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if p_status not in ('sent','failed') then raise exception 'Invalid delivery status'; end if;
  update public.email_deliveries set status=p_status,provider_message_id=left(p_provider_id,200),
    attempts=attempts+1,last_error=left(p_error,500),updated_at=now()
    where id=p_delivery_id and status<>'sent';
end;
$$;

-- Lock down default PUBLIC execution. Grant only the functions each role needs.
revoke all on function public.student_create_submission(text,text,text,jsonb) from public,anon;
revoke all on function public.student_list_submissions() from public,anon;
revoke all on function public.student_attach_evidence(text,text) from public,anon;
revoke all on function public.student_get_submission(text) from public,anon;
revoke all on function public.admin_list_submissions(text,text) from public,anon;
revoke all on function public.admin_get_submission(text) from public,anon;
revoke all on function public.admin_decide(text,text,text) from public,anon;
revoke all on function public.send_submission_message(text,text) from public,anon;
revoke all on function public.student_list_notifications() from public,anon;
revoke all on function public.student_mark_notifications_read() from public,anon;
revoke all on function public.admin_list_notifications(integer) from public,anon;
revoke all on function public.admin_list_team() from public,anon;
revoke all on function public.super_admin_set_admin_by_email(text,text,boolean,text) from public,anon;
revoke all on function public.super_admin_set_admin(uuid,text,boolean,text) from public,anon;
revoke all on function public.admin_list_logs(integer) from public,anon;
revoke all on function public.admin_email_payload(uuid,uuid) from public,anon,authenticated;
revoke all on function public.admin_email_delivery_result(uuid,text,text,text) from public,anon,authenticated;
grant update (status,provider_message_id,attempts,last_error,updated_at) on public.email_deliveries to service_role;

grant execute on function public.student_create_submission(text,text,text,jsonb) to authenticated;
grant execute on function public.student_list_submissions() to authenticated;
grant execute on function public.student_attach_evidence(text,text) to authenticated;
grant execute on function public.student_get_submission(text) to authenticated;
grant execute on function public.admin_list_submissions(text,text) to authenticated;
grant execute on function public.admin_get_submission(text) to authenticated;
grant execute on function public.admin_decide(text,text,text) to authenticated;
grant execute on function public.send_submission_message(text,text) to authenticated;
grant execute on function public.student_list_notifications() to authenticated;
grant execute on function public.student_mark_notifications_read() to authenticated;
grant execute on function public.admin_list_notifications(integer) to authenticated;
grant execute on function public.admin_list_team() to authenticated;
grant execute on function public.super_admin_set_admin_by_email(text,text,boolean,text) to authenticated;
grant execute on function public.super_admin_set_admin(uuid,text,boolean,text) to authenticated;
grant execute on function public.admin_list_logs(integer) to authenticated;
grant execute on function public.admin_email_payload(uuid,uuid) to service_role;
grant execute on function public.admin_email_delivery_result(uuid,text,text,text) to service_role;

commit;
