------------------------------------------------------------
-- VERIFY tenant_members table exists
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'tenant_members';

------------------------------------------------------------
-- VERIFY RLS is enabled
select relname, relrowsecurity
from pg_class
where relname = 'tenant_members';

------------------------------------------------------------
-- VERIFY policies
select *
from pg_policies
where tablename = 'tenant_members';

------------------------------------------------------------
-- FORCE PostgREST schema reload
NOTIFY pgrst, 'reload schema';
------------------------------------------------------------
