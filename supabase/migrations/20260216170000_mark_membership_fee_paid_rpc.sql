-- Creates an RPC that marks a membership fee invoice as paid
-- AND creates:
-- 1) membership_fee_payments row
-- 2) finance_transactions income row (Mitgliedsbeiträge)
--
-- Security:
-- - Uses current_tenant_id() + current_role()
-- - Only ADMIN/KASSIERER are allowed

create or replace function public.mark_membership_fee_paid(
  p_invoice_id uuid,
  p_paid_at timestamptz default now(),
  p_paid_amount_cents integer default null,
  p_account_id uuid default null,
  p_category_id uuid default null
)
returns table (
  invoice_id uuid,
  payment_id uuid,
  finance_transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_role text;
  v_uid uuid;
  v_member_id uuid;
  v_amount integer;
  v_paid_at timestamptz;
  v_account_id uuid;
  v_category_id uuid;
  v_payment_id uuid;
  v_finance_tx_id uuid;
  v_member_name text;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'NO_TENANT';
  end if;

  v_role := public.current_role();
  if v_role not in ('ADMIN', 'KASSIERER') then
    raise exception 'FORBIDDEN';
  end if;

  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'NO_AUTH';
  end if;

  v_paid_at := coalesce(p_paid_at, now());

  -- Lock invoice row
  select i.member_id, i.amount_cents
    into v_member_id, v_amount
  from public.membership_fee_invoices i
  join public.tenant_members tm on tm.id = i.member_id
  where i.id = p_invoice_id
    and tm.tenant_id = v_tenant_id
  for update;

  if v_member_id is null then
    raise exception 'INVOICE_NOT_FOUND_OR_FORBIDDEN';
  end if;

  v_amount := coalesce(p_paid_amount_cents, v_amount);

  -- Idempotency: if a payment already exists, return existing linkage (best effort)
  select p.id, p.transaction_id
    into v_payment_id, v_finance_tx_id
  from public.membership_fee_payments p
  where p.invoice_id = p_invoice_id
  order by p.paid_at desc
  limit 1;

  if v_payment_id is not null then
    -- ensure invoice is PAID (in case it wasn't)
    update public.membership_fee_invoices
      set status = 'PAID',
          paid_at = coalesce(paid_at, v_paid_at)
    where id = p_invoice_id;

    invoice_id := p_invoice_id;
    payment_id := v_payment_id;
    finance_transaction_id := v_finance_tx_id;
    return next;
    return;
  end if;

  -- Resolve default finance account (first active account)
  v_account_id := p_account_id;
  if v_account_id is null then
    select fa.id
      into v_account_id
    from public.finance_accounts fa
    where fa.tenant_id = v_tenant_id
      and fa.is_archived = false
    order by fa.created_at asc
    limit 1;
  end if;

  if v_account_id is null then
    raise exception 'NO_FINANCE_ACCOUNT';
  end if;

  -- Resolve category "Mitgliedsbeiträge" (INCOME)
  v_category_id := p_category_id;
  if v_category_id is null then
    select fc.id
      into v_category_id
    from public.finance_categories fc
    where fc.tenant_id = v_tenant_id
      and fc.type = 'INCOME'
      and fc.name = 'Mitgliedsbeiträge'
      and fc.is_archived = false
    order by fc.sort_order asc, fc.created_at asc
    limit 1;
  end if;

  -- Member name for counterparty
  select tm.full_name
    into v_member_name
  from public.tenant_members tm
  where tm.id = v_member_id;

  -- Create finance transaction (income)
  insert into public.finance_transactions (
    tenant_id,
    account_id,
    category_id,
    type,
    booking_date,
    amount_cents,
    counterparty,
    memo,
    reference,
    created_by,
    updated_by
  )
  values (
    v_tenant_id,
    v_account_id,
    v_category_id,
    'INCOME',
    (v_paid_at::date),
    v_amount::bigint,
    coalesce(v_member_name, 'Mitglied'),
    'Mitgliedsbeitrag bezahlt',
    'membership_fee_invoice:' || p_invoice_id::text,
    v_uid,
    v_uid
  )
  returning id into v_finance_tx_id;

  -- Create payment row (link to finance transaction)
  insert into public.membership_fee_payments (
    invoice_id,
    transaction_id,
    paid_amount_cents,
    paid_at
  )
  values (
    p_invoice_id,
    v_finance_tx_id,
    v_amount,
    v_paid_at
  )
  returning id into v_payment_id;

  -- Update invoice
  update public.membership_fee_invoices
    set status = 'PAID',
        paid_at = v_paid_at
  where id = p_invoice_id;

  invoice_id := p_invoice_id;
  payment_id := v_payment_id;
  finance_transaction_id := v_finance_tx_id;
  return next;
end;
$$;

-- Allow calling via PostgREST (Supabase) for authenticated users
revoke all on function public.mark_membership_fee_paid(uuid, timestamptz, integer, uuid, uuid) from public;
grant execute on function public.mark_membership_fee_paid(uuid, timestamptz, integer, uuid, uuid) to authenticated;
