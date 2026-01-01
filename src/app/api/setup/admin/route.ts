import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { writeActivityLog } from "@/lib/activity/log";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  const supabaseAuth = await createSupabaseServerMutableClient();
  const { data: sessionData } = await supabaseAuth.auth.getSession();
  const userId = sessionData.session?.user?.id;

  if (!userId)
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const display_name = String(body.display_name ?? "").trim();
  const directory_id = String(body.directory_id ?? "").trim();

  if (!display_name || !directory_id) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const srv = createSupabaseServiceRoleClient();

  // Directory Entry laden
  const { data: directory, error: dirErr } = await srv
    .from("ditib_directory")
    .select("id, name")
    .eq("id", directory_id)
    .maybeSingle<{ id: string; name: string }>();

  if (dirErr || !directory) {
    return NextResponse.json({ error: "DIRECTORY_NOT_FOUND" }, { status: 404 });
  }

  // Tenant darf nur einmal existieren
  const { data: existingTenant } = await srv
    .from("tenants")
    .select("id")
    .eq("directory_id", directory_id)
    .maybeSingle<{ id: string }>();

  if (existingTenant?.id) {
    return NextResponse.json(
      { error: "TENANT_ALREADY_EXISTS" },
      { status: 409 }
    );
  }

  const slug = slugify(directory.name);

  // Tenant anlegen
  const { data: tenant, error: tenantErr } = await srv
    .from("tenants")
    .insert({ name: directory.name, slug, directory_id })
    .select("id, name, slug, directory_id")
    .single<{ id: string; name: string; slug: string; directory_id: string }>();

  if (tenantErr || !tenant) {
    return NextResponse.json(
      { error: "TENANT_CREATE_FAILED", detail: tenantErr?.message },
      { status: 500 }
    );
  }

  // Profil updaten (ADMIN + Board)
  const { error: profileErr } = await srv
    .from("profiles")
    .update({
      tenant_id: tenant.id,
      display_name,
      role: "ADMIN",
      is_board_member: true,
    })
    .eq("user_id", userId);

  if (profileErr) {
    return NextResponse.json(
      { error: "PROFILE_UPDATE_FAILED", detail: profileErr.message },
      { status: 500 }
    );
  }

  // Activity Log (ADMIN_ONLY)
  await writeActivityLog({
    tenant_id: tenant.id,
    actor_user_id: userId,
    actor_name: display_name,
    action: "TENANT_CREATED",
    entity_type: "TENANT",
    entity_id: tenant.id,
    visibility: "ADMIN_ONLY",
    meta: { directory_id, slug, tenant_name: tenant.name },
  });

  return NextResponse.json({ ok: true, tenant });
}
