create table public.membership_fee_rules (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.tenant_members(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  interval text not null check (interval in ('MONTHLY','QUARTERLY','YEARLY')),
  due_day integer not null check (due_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id)
);

create table public.membership_fee_invoices (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.tenant_members(id) on delete cascade,
  rule_id uuid null references public.membership_fee_rules(id) on delete set null,
  due_date date not null,
  amount_cents integer not null check (amount_cents > 0),
  status text not null check (status in ('OPEN','PAID','PARTIAL','OVERDUE')),
  generated_at timestamptz not null default now(),
  paid_at timestamptz null
);

create table public.membership_fee_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.membership_fee_invoices(id) on delete cascade,
  transaction_id uuid null,
  paid_amount_cents integer not null check (paid_amount_cents > 0),
  paid_at timestamptz not null default now()
);

create index membership_fee_rules_member_idx
  on public.membership_fee_rules (member_id);

create index membership_fee_invoices_member_due_status_idx
  on public.membership_fee_invoices (member_id, due_date, status);

create index membership_fee_invoices_rule_idx
  on public.membership_fee_invoices (rule_id);

create index membership_fee_payments_invoice_idx
  on public.membership_fee_payments (invoice_id);

create trigger trg_membership_fee_rules_set_updated_at
before update on public.membership_fee_rules
for each row execute function public.set_updated_at();

alter table public.membership_fee_rules enable row level security;
alter table public.membership_fee_invoices enable row level security;
alter table public.membership_fee_payments enable row level security;

-- Leserollen:
-- - ADMIN/KASSIERER: alle Gebühren im eigenen Tenant
-- - übrige Mitglieder: nur Gebührenzeilen, deren Mitglieds-E-Mail der eingeloggten E-Mail entspricht
create policy "membership_fee_rules_select"
on public.membership_fee_rules
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_rules.member_id
      and tm.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('ADMIN', 'KASSIERER')
        or lower(coalesce(tm.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

create policy "membership_fee_rules_insert"
on public.membership_fee_rules
as permissive
for insert
to authenticated
with check (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_rules.member_id
      and tm.tenant_id = public.current_tenant_id()
  )
);

create policy "membership_fee_rules_update"
on public.membership_fee_rules
as permissive
for update
to authenticated
using (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_rules.member_id
      and tm.tenant_id = public.current_tenant_id()
  )
)
with check (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_rules.member_id
      and tm.tenant_id = public.current_tenant_id()
  )
);

create policy "membership_fee_invoices_select"
on public.membership_fee_invoices
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_invoices.member_id
      and tm.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('ADMIN', 'KASSIERER')
        or lower(coalesce(tm.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

create policy "membership_fee_invoices_insert"
on public.membership_fee_invoices
as permissive
for insert
to authenticated
with check (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_invoices.member_id
      and tm.tenant_id = public.current_tenant_id()
  )
);

create policy "membership_fee_invoices_update"
on public.membership_fee_invoices
as permissive
for update
to authenticated
using (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_invoices.member_id
      and tm.tenant_id = public.current_tenant_id()
  )
)
with check (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.tenant_members tm
    where tm.id = membership_fee_invoices.member_id
      and tm.tenant_id = public.current_tenant_id()
  )
);

create policy "membership_fee_payments_select"
on public.membership_fee_payments
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.membership_fee_invoices i
    join public.tenant_members tm on tm.id = i.member_id
    where i.id = membership_fee_payments.invoice_id
      and tm.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('ADMIN', 'KASSIERER')
        or lower(coalesce(tm.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

create policy "membership_fee_payments_insert"
on public.membership_fee_payments
as permissive
for insert
to authenticated
with check (
  public.current_role() in ('ADMIN', 'KASSIERER')
  and exists (
    select 1
    from public.membership_fee_invoices i
    join public.tenant_members tm on tm.id = i.member_id
    where i.id = membership_fee_payments.invoice_id
      and tm.tenant_id = public.current_tenant_id()
  )
);

grant select, insert, update on public.membership_fee_rules to authenticated;
grant select, insert, update on public.membership_fee_invoices to authenticated;
grant select, insert on public.membership_fee_payments to authenticated;

grant all on public.membership_fee_rules to service_role;
grant all on public.membership_fee_invoices to service_role;
grant all on public.membership_fee_payments to service_role;
