import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

export const runtime = "nodejs";

type Profile = {
  tenant_id: string | null;
  role: string | null;
  is_board_member: boolean | null;
};

type MemberInsertBody = {
  full_name?: string;
  function_title?: string;
  email?: string;
  phone?: string;
  notes?: string;
  is_active?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canManageMembers(profile: Profile) {
  return (
    profile.role === "ADMIN" ||
    profile.role === "VORSTAND" ||
    Boolean(profile.is_board_member)
  );
}

function toNullableTrimmed(value: unknown) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length > 0 ? v : null;
}

async function getAuthContext() {
  const supabase = await createSupabaseServerMutableClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return {
      error: NextResponse.json(
        { error: "Nicht eingeloggt." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("tenant_id, role, is_board_member")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  if (profileErr || !profile) {
    return {
      error: NextResponse.json(
        { error: "Profil konnte nicht geladen werden." },
        { status: 403 }
      ),
    };
  }

  if (!profile.tenant_id) {
    return {
      error: NextResponse.json(
        { error: "Kein Tenant im Profil gesetzt." },
        { status: 403 }
      ),
    };
  }

  return { supabase, userId: user.id, profile };
}

export async function GET(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  const url = new URL(req.url);
  const active = url.searchParams.get("active");

  let query = ctx.supabase
    .from("tenant_members")
    .select(
      "id, tenant_id, full_name, function_title, email, phone, notes, is_active, created_at, updated_at, created_by, updated_by"
    )
    .eq("tenant_id", ctx.profile.tenant_id)
    .order("full_name", { ascending: true });

  if (active === "1") {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: `Mitglieder konnten nicht geladen werden: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ members: data ?? [] }, { status: 200 });
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canManageMembers(ctx.profile)) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Erstellen von Mitgliedern." },
      { status: 403 }
    );
  }

  let body: MemberInsertBody;
  try {
    body = (await req.json()) as MemberInsertBody;
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
  }

  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  const function_title = toNullableTrimmed(body.function_title);
  const email = toNullableTrimmed(body.email);
  const phone = toNullableTrimmed(body.phone);
  const notes = toNullableTrimmed(body.notes);
  const is_active = typeof body.is_active === "boolean" ? body.is_active : true;

  if (full_name.length < 2) {
    return NextResponse.json(
      { error: "Bitte einen gültigen Namen eingeben (mindestens 2 Zeichen)." },
      { status: 400 }
    );
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Bitte eine gültige E-Mail-Adresse eingeben." },
      { status: 400 }
    );
  }

  const { data, error } = await ctx.supabase
    .from("tenant_members")
    .insert({
      tenant_id: ctx.profile.tenant_id,
      full_name,
      function_title,
      email,
      phone,
      notes,
      is_active,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select(
      "id, tenant_id, full_name, function_title, email, phone, notes, is_active, created_at, updated_at, created_by, updated_by"
    )
    .single();

  if (error) {
    const status = /row-level security|permission denied/i.test(error.message)
      ? 403
      : 500;

    return NextResponse.json(
      { error: `Mitglied konnte nicht erstellt werden: ${error.message}` },
      { status }
    );
  }

  return NextResponse.json({ member: data }, { status: 201 });
}
