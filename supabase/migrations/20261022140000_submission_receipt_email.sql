-- Track email receipts for newly submitted cases. Run after the existing helpdesk migrations.
begin;

create or replace function public.student_create_submission(
  p_kind text, p_title text, p_location text, p_details jsonb
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, private, auth
as $$
declare v_uid uuid; v_id uuid; v_ref text; v_note uuid;
begin
  v_uid := private.require_verified_user();
  if p_kind not in ('complaint','facility','venue') then raise exception 'Invalid case type'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 160 then raise exception 'Title must be 1–160 characters'; end if;
  if p_location is not null and char_length(p_location) > 200 then raise exception 'Location is too long'; end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' or octet_length(p_details::text) > 16384 or jsonb_object_length(p_details) > 30 then raise exception 'Invalid case details'; end if;
  if exists (select 1 from jsonb_each_text(p_details) e where char_length(e.value) > 5000) then raise exception 'A detail field is too long'; end if;
  insert into public.submissions(student_id,kind,title,location,details)
    values (v_uid,p_kind,btrim(p_title),nullif(btrim(p_location),''),p_details)
    returning id,reference_code into v_id,v_ref;
  insert into public.notifications(recipient_id,submission_id,event_type,reference_code,summary)
    values (v_uid,v_id,'submission_created',v_ref,'Your submission was received: '||v_ref)
    returning id into v_note;
  insert into public.email_deliveries(notification_id) values(v_note) on conflict(notification_id) do nothing;
  return jsonb_build_object('id',v_id,'reference_code',v_ref,'status','pending');
end;
$$;

create or replace function public.student_receipt_email_payload(p_reference_code text,p_student_id uuid)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'recipient_email',u.email,'reference_code',s.reference_code,'title',s.title,
    'kind',s.kind,'delivery_id',e.id,'delivery_status',e.status
  ) into v_result
  from public.submissions s
  join auth.users u on u.id=s.student_id and u.email_confirmed_at is not null
  join public.notifications n on n.submission_id=s.id and n.event_type='submission_created' and n.recipient_id=s.student_id
  join public.email_deliveries e on e.notification_id=n.id
  where s.reference_code=p_reference_code and s.student_id=p_student_id;
  if v_result is null then raise exception 'Submission receipt not found' using errcode='42501'; end if;
  return v_result;
end;
$$;
revoke all on function public.student_receipt_email_payload(text,uuid) from public,anon,authenticated;
grant execute on function public.student_receipt_email_payload(text,uuid) to service_role;

commit;
