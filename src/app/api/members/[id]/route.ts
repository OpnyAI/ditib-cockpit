import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

export const runtime = "nodejs";

type Profile = {
  tenant_id: string | null;
  role: string | null;
  is_board_member: boolean | null;
};

type MemberUpdateBody = {
  full_name?: string;
  function_title?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getAuthContext() {
  const supabase = await createSupabaseServerMutableClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return {
      error: NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 }),
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
        { status: 403 },
      ),
    };
  }

  if (!profile.tenant_id) {
    return {
      error: NextResponse.json(
        { error: "Kein Tenant im Profil gesetzt." },
        { status: 403 },
      ),
    };
  }

  return { supabase, userId: user.id, profile };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !isUuid(id)) {
    return NextResponse.json(
      { error: "Ungültige Mitglied-ID." },
      { status: 400 },
    );
  }

  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  const { data, error } = await ctx.supabase
    .from("tenant_members")
    .select(
      "id, tenant_id, full_name, function_title, email, phone, notes, is_active, created_at, updated_at, created_by, updated_by",
    )
    .eq("id", id)
    .eq("tenant_id", ctx.profile.tenant_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Mitglied konnte nicht geladen werden: ${error.message}` },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Mitglied nicht gefunden." },
      { status: 404 },
    );
  }

  return NextResponse.json({ member: data }, { status: 200 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !isUuid(id)) {
    return NextResponse.json(
      { error: "Ungültige Mitglied-ID." },
      { status: 400 },
    );
  }

  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canManageMembers(ctx.profile)) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Bearbeiten von Mitgliedern." },
      { status: 403 },
    );
  }

  let body: MemberUpdateBody;
  try {
    body = (await req.json()) as MemberUpdateBody;
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    updated_by: ctx.userId,
  };

  if (body.full_name !== undefined) {
    if (typeof body.full_name !== "string") {
      return NextResponse.json(
        { error: "full_name muss ein String sein." },
        { status: 400 },
      );
    }

    const full_name = body.full_name.trim();
    if (full_name.length < 2) {
      return NextResponse.json(
        {
          error: "Bitte einen gültigen Namen eingeben (mindestens 2 Zeichen).",
        },
        { status: 400 },
      );
    }
    patch.full_name = full_name;
  }

  if (body.function_title !== undefined) {
    patch.function_title = toNullableTrimmed(body.function_title);
  }

  if (body.email !== undefined) {
    const email = toNullableTrimmed(body.email);
    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Bitte eine gültige E-Mail-Adresse eingeben." },
        { status: 400 },
      );
    }
    patch.email = email;
  }

  if (body.phone !== undefined) {
    patch.phone = toNullableTrimmed(body.phone);
  }

  if (body.notes !== undefined) {
    patch.notes = toNullableTrimmed(body.notes);
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active muss ein Boolean sein." },
        { status: 400 },
      );
    }
    patch.is_active = body.is_active;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json(
      { error: "Keine gültigen Felder zum Aktualisieren übergeben." },
      { status: 400 },
    );
  }

  const { data, error } = await ctx.supabase
    .from("tenant_members")
    .update(patch)
    .eq("id", id)
    // ✅ CRITICAL: Tenant-Scoping
    .eq("tenant_id", ctx.profile.tenant_id)
    .select(
      "id, tenant_id, full_name, function_title, email, phone, notes, is_active, created_at, updated_at, created_by, updated_by",
    )
    .maybeSingle();

  if (error) {
    const status = /row-level security|permission denied/i.test(error.message)
      ? 403
      : 500;

    return NextResponse.json(
      { error: `Mitglied konnte nicht aktualisiert werden: ${error.message}` },
      { status },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Mitglied nicht gefunden." },
      { status: 404 },
    );
  }

  return NextResponse.json({ member: data }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !isUuid(id)) {
    return NextResponse.json(
      { error: "Ungültige Mitglied-ID." },
      { status: 400 },
    );
  }

  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canManageMembers(ctx.profile)) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Deaktivieren von Mitgliedern." },
      { status: 403 },
    );
  }

  const { data, error } = await ctx.supabase
    .from("tenant_members")
    .update({ is_active: false, updated_by: ctx.userId })
    .eq("id", id)
    // ✅ CRITICAL: Tenant-Scoping
    .eq("tenant_id", ctx.profile.tenant_id)
    .select(
      "id, tenant_id, full_name, function_title, email, phone, notes, is_active, created_at, updated_at, created_by, updated_by",
    )
    .maybeSingle();

  if (error) {
    const status = /row-level security|permission denied/i.test(error.message)
      ? 403
      : 500;

    return NextResponse.json(
      { error: `Mitglied konnte nicht deaktiviert werden: ${error.message}` },
      { status },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Mitglied nicht gefunden." },
      { status: 404 },
    );
  }

  // ✅ Erfolgsresponse hat bei dir gefehlt
  return NextResponse.json({ member: data }, { status: 200 });
}
