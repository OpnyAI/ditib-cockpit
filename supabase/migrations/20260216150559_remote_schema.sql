set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.membership_fee_summaries()
 RETURNS TABLE(member_id uuid, open_amount_cents bigint, open_count bigint, has_overdue boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_role text;
  v_email text;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    return;
  end if;

  v_role := public.current_role();
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if v_role in ('ADMIN', 'KASSIERER') then
    return query
    select
      tm.id::uuid as member_id,
      coalesce(sum(case when i.status in ('OPEN','PARTIAL','OVERDUE') then i.amount_cents else 0 end), 0)::bigint as open_amount_cents,
      coalesce(count(*) filter (where i.status in ('OPEN','PARTIAL','OVERDUE')), 0)::bigint as open_count,
      coalesce(
        bool_or(
          (i.status = 'OVERDUE')
          or (
            i.status in ('OPEN','PARTIAL','OVERDUE')
            and i.due_date < current_date
          )
        ),
        false
      )::boolean as has_overdue
    from public.tenant_members tm
    left join public.membership_fee_invoices i
      on i.member_id = tm.id
    where tm.tenant_id = v_tenant_id
    group by tm.id;
    return;
  end if;

  if v_email = '' then
    return;
  end if;

  return query
  select
    tm.id::uuid as member_id,
    coalesce(sum(case when i.status in ('OPEN','PARTIAL','OVERDUE') then i.amount_cents else 0 end), 0)::bigint as open_amount_cents,
    coalesce(count(*) filter (where i.status in ('OPEN','PARTIAL','OVERDUE')), 0)::bigint as open_count,
    coalesce(
      bool_or(
        (i.status = 'OVERDUE')
        or (
          i.status in ('OPEN','PARTIAL','OVERDUE')
          and i.due_date < current_date
        )
      ),
      false
    )::boolean as has_overdue
  from public.tenant_members tm
  left join public.membership_fee_invoices i
    on i.member_id = tm.id
  where tm.tenant_id = v_tenant_id
    and lower(coalesce(tm.email, '')) = v_email
  group by tm.id;
end;
$function$
;


