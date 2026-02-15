do $$
declare
  v_dup_count bigint;
  v_sample text;
begin
  select count(*)
    into v_dup_count
  from (
    select p.user_id
    from public.profiles p
    group by p.user_id
    having count(*) > 1
  ) d;

  if v_dup_count > 0 then
    select string_agg(d.user_id::text, ', ')
      into v_sample
    from (
      select p.user_id
      from public.profiles p
      group by p.user_id
      having count(*) > 1
      order by p.user_id
      limit 10
    ) d;

    raise exception
      'Cannot enforce unique profiles.user_id: found % duplicate user_id(s). Sample: %',
      v_dup_count,
      coalesce(v_sample, '(none)');
  end if;
end;
$$;

create unique index if not exists profiles_user_id_uidx
  on public.profiles (user_id);
