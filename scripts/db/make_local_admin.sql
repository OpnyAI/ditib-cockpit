do $$
declare
  v_user_id uuid := '7cfae4a7-1442-4854-bf1d-9838bdcdbbc7';
  v_tenant_name text := 'DITIB Ebersbach an der Fils';
  v_tenant_slug text := 'ditib-ebersbach-an-der-fils';
  v_tenant_id uuid;
begin
  insert into public.tenants (name, slug)
  values (v_tenant_name, v_tenant_slug)
  on conflict (slug) do update
    set name = excluded.name
  returning id into v_tenant_id;

  if v_tenant_id is null then
    select t.id
      into v_tenant_id
    from public.tenants t
    where t.slug = v_tenant_slug
    limit 1;
  end if;

  if v_tenant_id is null then
    raise exception 'Tenant could not be ensured: %', v_tenant_name;
  end if;

  insert into public.profiles (user_id, tenant_id, role, is_board_member)
  values (v_user_id, v_tenant_id, 'ADMIN', true)
  on conflict (user_id) do update
    set tenant_id = excluded.tenant_id,
        role = excluded.role,
        is_board_member = excluded.is_board_member;

  begin
    execute 'update public.profiles set display_name = $1 where user_id = $2'
      using 'Mehmet Catalsakal', v_user_id;
  exception
    when undefined_column then
      null;
  end;
end;
$$;
