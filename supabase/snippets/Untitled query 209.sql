-- 1. Tenant ID holen
select id from public.tenants where name = 'DITIB Ebersbach an der Fils';

-- Falls nichts zurückkommt, Tenant anlegen:
insert into public.tenants (id, name)
values (gen_random_uuid(), 'DITIB Ebersbach an der Fils')
on conflict (name) do nothing;

-- 2. Admin-Profil anlegen (UPSERT)
insert into public.profiles (
  user_id,
  tenant_id,
  role,
  is_board_member,
  display_name
)
select
  '7cfae4a7-1442-4854-bf1d-9838bdcdbbc7',
  t.id,
  'ADMIN',
  true,
  'Mehmet Catalsakal'
from public.tenants t
where t.name = 'DITIB Ebersbach an der Fils'
on conflict (user_id) do update
set
  tenant_id = excluded.tenant_id,
  role = 'ADMIN',
  is_board_member = true,
  display_name = 'Mehmet Catalsakal';