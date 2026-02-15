-- 1️⃣ User aus auth.users holen
-- (falls mehmet_ctskl@hotmail.de existiert)

insert into public.profiles (user_id, tenant_id, role, is_board_member, display_name)
select
  u.id,
  t.id,
  'ADMIN',
  true,
  'Mehmet Catalsakal'
from auth.users u
cross join public.tenants t
where u.email = 'mehmet_ctskl@hotmail.de'
  and t.name = 'DITIB Ebersbach an der Fils'
limit 1;

-- 2️⃣ Kontrolle
select *
from public.profiles
where user_id = (
  select id from auth.users
  where email = 'mehmet_ctskl@hotmail.de'
);