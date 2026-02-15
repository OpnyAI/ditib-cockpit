create unique index tenant_members_unique_name_email
on public.tenant_members (tenant_id, full_name, email);