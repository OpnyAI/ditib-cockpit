create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  function_title text null,
  email text null,
  phone text null,
  notes text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null
);

create index tenant_members_tenant_full_name_idx
  on public.tenant_members (tenant_id, full_name);

create index tenant_members_tenant_active_idx
  on public.tenant_members (tenant_id, is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_tenant_members_set_updated_at
before update on public.tenant_members
for each row execute function public.set_updated_at();

alter table public.tenant_members enable row level security;

create policy "tenant_members_select"
on public.tenant_members
as permissive
for select
to authenticated
using (public.is_member_of_tenant(tenant_id));

create policy "tenant_members_insert"
on public.tenant_members
as permissive
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.is_member_of_tenant(tenant_id)
  and (
    public.current_role() in ('ADMIN', 'VORSTAND')
    or public.is_board_member()
  )
);

create policy "tenant_members_update"
on public.tenant_members
as permissive
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.is_member_of_tenant(tenant_id)
  and (
    public.current_role() in ('ADMIN', 'VORSTAND')
    or public.is_board_member()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and public.is_member_of_tenant(tenant_id)
  and (
    public.current_role() in ('ADMIN', 'VORSTAND')
    or public.is_board_member()
  )
);

grant select, insert, update on public.tenant_members to authenticated;
grant all on public.tenant_members to service_role;
