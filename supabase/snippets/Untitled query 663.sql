-- Atomic "mark paid" for membership fees:
-- - Updates invoice to PAID + paid_at
-- - Creates a payment row (membership_fee_payments)
-- - Creates a finance income transaction (finance_transactions)
-- - Idempotent: if a payment already exists with a transaction_id, do nothing and return existing ids.

create or replace function public.mark_membership_fee_invoice_paid(
  p_invoice_id uuid,
  p_paid_at timestamptz default now(),
  p_account_id uuid default null
)
returns table (
  invoice_id uuid,
  payment_id uuid,
  finance_transaction_id uuid
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant_id uuid;
  v_role text;

  v_member_id uuid;
  v_invoice_amount bigint;
  v_existing_paid_at timestamptz;

  v_payment_id uuid;
  v_existing_tx_id uuid;

  v_account_id uuid;
  v_category_id uuid;

  v_finance_tx_id uuid;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'NO_TENANT';
  end if;

  v_role := public.current_role();
  if v_role not in ('ADMIN', 'KASSIERER') then
    raise exception 'FORBIDDEN';
  end if;

  -- Lock invoice row
  select i.member_id, i.amount_cents::bigint, i.paid_at
    into v_member_id, v_invoice_amount, v_existing_paid_at
  from public.membership_fee_invoices i
  where i.id = p_invoice_id
  for update;

  if v_member_id is null then
    raise exception 'INVOICE_NOT_FOUND';
  end if;

  -- Ensure invoice belongs to current tenant (via tenant_members)
  if not exists (
    select 1
    from public.tenant_members tm
    where tm.id = v_member_id
      and tm.tenant_id = v_tenant_id
  ) then
    raise exception 'INVOICE_NOT_IN_TENANT';
  end if;

  -- Check if a payment already exists
  select p.id, p.transaction_id
    into v_payment_id, v_existing_tx_id
  from public.membership_fee_payments p
  where p.invoice_id = p_invoice_id
  order by p.paid_at desc
  limit 1
  for update;

  -- If already linked to a finance tx, just ensure invoice is PAID and return
  if v_payment_id is not null and v_existing_tx_id is not null then
    update public.membership_fee_invoices
    set status = 'PAID',
        paid_at = coalesce(v_existing_paid_at, p_paid_at)
    where id = p_invoice_id;

    invoice_id := p_invoice_id;
    payment_id := v_payment_id;
    finance_transaction_id := v_existing_tx_id;
    return next;
    return;
  end if;

  -- Resolve finance account
  if p_account_id is not null then
    if not exists (
      select 1
      from public.finance_accounts fa
      where fa.id = p_account_id
        and fa.tenant_id = v_tenant_id
        and fa.is_archived = false
    ) then
      raise exception 'INVALID_ACCOUNT';
    end if;
    v_account_id := p_account_id;
  else
    select fa.id
      into v_account_id
    from public.finance_accounts fa
    where fa.tenant_id = v_tenant_id
      and fa.is_archived = false
    order by fa.created_at asc
    limit 1;

    if v_account_id is null then
      raise exception 'NO_FINANCE_ACCOUNT';
    end if;
  end if;

  -- Resolve / create category "Mitgliedsbeiträge" (INCOME)
  select fc.id
    into v_category_id
  from public.finance_categories fc
  where fc.tenant_id = v_tenant_id
    and fc.type = 'INCOME'
    and fc.name = 'Mitgliedsbeiträge'
  limit 1;

  if v_category_id is null then
    insert into public.finance_categories (tenant_id, type, name, sort_order, is_archived)
    values (v_tenant_id, 'INCOME', 'Mitgliedsbeiträge', 0, false)
    returning id into v_category_id;
  end if;

  -- Create finance transaction (INCOME)
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
    created_by
  )
  values (
    v_tenant_id,
    v_account_id,
    v_category_id,
    'INCOME',
    (p_paid_at::date),
    v_invoice_amount,
    'Mitgliedsbeitrag',
    'Beitrag bezahlt (Fees)',
    p_invoice_id::text,
    auth.uid()
  )
  returning id into v_finance_tx_id;

  -- Create payment row (link to finance tx)
  if v_payment_id is null then
    insert into public.membership_fee_payments (
      invoice_id,
      transaction_id,
      paid_amount_cents,
      paid_at
    )
    values (
      p_invoice_id,
      v_finance_tx_id,
      v_invoice_amount::int,
      p_paid_at
    )
    returning id into v_payment_id;
  else
    update public.membership_fee_payments
    set transaction_id = v_finance_tx_id
    where id = v_payment_id;
  end if;

  -- Update invoice
  update public.membership_fee_invoices
  set status = 'PAID',
      paid_at = p_paid_at
  where id = p_invoice_id;

  invoice_id := p_invoice_id;
  payment_id := v_payment_id;
  finance_transaction_id := v_finance_tx_id;
  return next;
end;
$$;

grant execute on function public.mark_membership_fee_invoice_paid(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.mark_membership_fee_invoice_paid(uuid, timestamptz, uuid) to service_role;