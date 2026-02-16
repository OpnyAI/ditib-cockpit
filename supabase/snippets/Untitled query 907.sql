insert into public.tenants (id, name, slug)
values (
  gen_random_uuid(),
  'DITIB Ebersbach an der Fils',
  'ditib-ebersbach-an-der-fils'
)
returning id, name, slug;