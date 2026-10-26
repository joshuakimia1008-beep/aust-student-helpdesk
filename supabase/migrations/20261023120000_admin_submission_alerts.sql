
begin;

create or replace function public.student_create_submission(
  p_kind text,
  p_title text,
  p_location text,
  p_details jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $$
declare
  v_uid uuid;
  v_id uuid;
  v_ref text;
  v_note uuid;
  v_admin record;
begin
  v_uid := private.require_verified_user();

  if p_kind not in ('complaint','facility','venue') then
    raise exception 'Invalid case type';
  end if;

  if p_title is null
     or char_length(btrim(p_title)) not between 1 and 160 then
    raise exception 'Title must be 1-160 characters';
  end if;

  if p_location is not null and char_length(p_location) > 200 then
    raise exception 'Location is too long';
  end if;

  if p_details is null
     or jsonb_typeof(p_details) <> 'object'
     or octet_length(p_details::text) > 16384
     or (select count(*) from jsonb_object_keys(p_details)) > 30 then
    raise exception 'Invalid case details';
  end if;

  if exists (
    select 1
    from jsonb_each_text(p_details) e
    where char_length(e.value) > 5000
  ) then
    raise exception 'A detail field is too long';
  end if;

  insert into public.submissions(
    student_id, kind, title, location, details
  )
  values (
    v_uid, p_kind, btrim(p_title),
    nullif(btrim(p_location), ''), p_details
  )
  returning id, reference_code into v_id, v_ref;

  -- Keep the existing student receipt notification.
  insert into public.notifications(
    recipient_id, submission_id, event_type, reference_code, summary
  )
  values (
    v_uid, v_id, 'submission_created', v_ref,
    'Your submission was received: ' || v_ref
  )
  returning id into v_note;

  insert into public.email_deliveries(notification_id)
  values (v_note)
  on conflict(notification_id) do nothing;

  -- Queue a separate alert for each eligible admin.
  for v_admin in
    select a.user_id
    from public.admins a
    join auth.users u on u.id = a.user_id
    where a.active = true
      and u.email_confirmed_at is not null
      and private.can_handle(a.user_id, p_kind)
  loop
    insert into public.notifications(
      recipient_id, submission_id, event_type, reference_code, summary
    )
    values (
      v_admin.user_id,
      v_id,
      'submission_created',
      v_ref,
      'New ' || p_kind || ' submission: ' || v_ref
    )
    returning id into v_note;

    insert into public.email_deliveries(notification_id)
    values (v_note)
    on conflict(notification_id) do nothing;
  end loop;

  return jsonb_build_object(
    'id', v_id,
    'reference_code', v_ref,
    'status', 'pending'
  );
end;
$$;

-- Build an email payload only for the admin who owns the notification.
create or replace function public.admin_submission_alert_payload(
  p_notification_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'recipient_email', u.email,
    'reference_code', s.reference_code,
    'title', s.title,
    'kind', s.kind,
    'location', s.location,
    'delivery_id', e.id,
    'delivery_status', e.status
  )
  into v_result
  from public.notifications n
  join public.submissions s on s.id = n.submission_id
  join public.admins a on a.user_id = n.recipient_id and a.active = true
  join auth.users u on u.id = a.user_id
    and u.email_confirmed_at is not null
  join public.email_deliveries e on e.notification_id = n.id
  where n.id = p_notification_id
    and n.event_type = 'submission_created'
    and n.recipient_id = a.user_id
    and n.summary like 'New % submission: %'
    and private.can_handle(a.user_id, s.kind);

  if v_result is null then
    raise exception 'Authorized admin alert not found'
      using errcode = '42501';
  end if;

  return v_result;
end;
$$;

revoke all on function
  public.admin_submission_alert_payload(uuid)
  from public, anon, authenticated;

grant execute on function
  public.admin_submission_alert_payload(uuid)
  to service_role;

commit;
