-- Invite-Code-basiertes Setup ohne verpflichtende Directory-Abhängigkeit.
-- Bestehende Tabellen bleiben erhalten; wir ergänzen nur fehlende Felder
-- und machen notwendige Spalten für den neuen Flow kompatibel.

-- =========================
-- tenants
-- =========================
alter table public.tenants
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists country text,
  add column if not exists invite_code text,
  add column if not exists invite_enabled boolean not null default true;

-- created_at existiert in der Regel bereits; nur falls nicht vorhanden ergänzen.
alter table public.tenants
  add column if not exists created_at timestamptz not null default now();

-- Country default + erlaubte Werte (idempotent: vorhandene ungültige Werte werden zu DE).
update public.tenants
set country = 'DE'
where country is null
   or country not in ('DE', 'AT', 'CH');

alter table public.tenants
  alter column country set default 'DE',
  alter column country set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_country_check'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_country_check
      check (country in ('DE', 'AT', 'CH'));
  end if;
end
$$;

-- Invite-Code für bestehende Tenants auffüllen.
update public.tenants
set invite_code = upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8))
where invite_code is null or length(trim(invite_code)) = 0;

alter table public.tenants
  alter column invite_code set not null;

create unique index if not exists tenants_invite_code_key
  on public.tenants (invite_code);

create index if not exists tenants_invite_code_idx
  on public.tenants (invite_code);

-- =========================
-- tenant_join_requests
-- =========================
alter table public.tenant_join_requests
  add column if not exists requester_email text;

-- Neue Invite-Code-Variante braucht kein Directory-Feld mehr.
alter table public.tenant_join_requests
  alter column directory_id drop not null;

-- requester_email aus auth.users ergänzen (best effort).
update public.tenant_join_requests tjr
set requester_email = au.email
from auth.users au
where tjr.requester_email is null
  and tjr.user_id = au.id;

-- tenant_id für alte Requests soweit möglich aus Directory ableiten.
update public.tenant_join_requests tjr
set tenant_id = t.id
from public.tenants t
where tjr.tenant_id is null
  and tjr.directory_id is not null
  and t.directory_id = tjr.directory_id;

-- tenant_id soll auf tenants zeigen (ON DELETE CASCADE) – alte SET NULL FK ersetzen.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'tenant_join_requests_tenant_id_fkey'
      and conrelid = 'public.tenant_join_requests'::regclass
  ) then
    alter table public.tenant_join_requests
      drop constraint tenant_join_requests_tenant_id_fkey;
  end if;
end
$$;

alter table public.tenant_join_requests
  add constraint tenant_join_requests_tenant_id_fkey
  foreign key (tenant_id)
  references public.tenants(id)
  on delete cascade;

-- Nur wenn keine NULLs mehr existieren, tenant_id auf NOT NULL setzen.
do $$
begin
  if not exists (
    select 1
    from public.tenant_join_requests
    where tenant_id is null
  ) then
    alter table public.tenant_join_requests
      alter column tenant_id set not null;
  end if;
end
$$;

-- Status-Constraint sicherstellen (falls alte Constraint fehlt/abweicht).
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'tenant_join_requests_status_check'
      and conrelid = 'public.tenant_join_requests'::regclass
  ) then
    alter table public.tenant_join_requests
      drop constraint tenant_join_requests_status_check;
  end if;
end
$$;

alter table public.tenant_join_requests
  add constraint tenant_join_requests_status_check
  check (status in ('PENDING', 'APPROVED', 'REJECTED'));
