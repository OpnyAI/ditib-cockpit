import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

type Body = {
  display_name?: string;
  directory_id?: string;
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerMutableClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const display_name = (body.display_name ?? "").trim();
  const directory_id = (body.directory_id ?? "").trim();

  if (display_name.length < 2) {
    return NextResponse.json(
      { error: "Bitte einen gültigen Namen eingeben." },
      { status: 400 }
    );
  }

  if (!directory_id) {
    return NextResponse.json(
      { error: "Bitte eine Gemeinde auswählen." },
      { status: 400 }
    );
  }

  // Tenant anhand directory_id finden
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("directory_id", directory_id)
    .maybeSingle();

  if (tenantErr) {
    return NextResponse.json(
      { error: `Tenant Lookup fehlgeschlagen: ${tenantErr.message}` },
      { status: 500 }
    );
  }

  if (!tenant?.id) {
    return NextResponse.json(
      {
        error:
          "Diese Gemeinde ist noch nicht eingerichtet. Ein ADMIN muss zuerst „Gemeinde einrichten“ durchführen.",
      },
      { status: 400 }
    );
  }

  // Duplikat-Check: pro User+Tenant eine Anfrage
  const { data: existing, error: exErr } = await supabase
    .from("tenant_join_requests")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exErr) {
    return NextResponse.json(
      { error: `Duplikat-Check fehlgeschlagen: ${exErr.message}` },
      { status: 500 }
    );
  }

  if (existing?.id) {
    return NextResponse.json(
      { alreadyExists: true, status: existing.status },
      { status: 200 }
    );
  }

  const { error: insErr } = await supabase.from("tenant_join_requests").insert({
    user_id: user.id,
    tenant_id: tenant.id,
    directory_id,
    display_name,
    status: "PENDING",
  });

  if (insErr) {
    return NextResponse.json(
      { error: `Insert fehlgeschlagen: ${insErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, alreadyExists: false }, { status: 200 });
}
