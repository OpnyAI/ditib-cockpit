import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { generateInviteCode } from "@/lib/invite-code";

export const runtime = "nodejs";

type Body = {
  name: string;
  city: string | null;
  postal_code: string | null;
  country: "DE" | "AT" | "CH";
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length > 0 ? v : null;
}

function parseBody(raw: unknown): Body | null {
  if (!isRecord(raw)) return null;

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const city = normalizeOptionalText(raw.city);
  const postal_code = normalizeOptionalText(raw.postal_code);
  const countryRaw = typeof raw.country === "string" ? raw.country.trim().toUpperCase() : "DE";
  const country = countryRaw === "AT" || countryRaw === "CH" ? countryRaw : "DE";

  if (name.length < 2) return null;

  return { name, city, postal_code, country };
}

function isUniqueInviteCodeViolation(message: string, code?: string) {
  return code === "23505" && /invite_code/i.test(message);
}

export async function POST(req: Request) {
  const supabaseAuth = await createSupabaseServerMutableClient();
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, data: null, error: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, data: null, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const body = parseBody(rawBody);
  if (!body) {
    return NextResponse.json(
      { ok: false, data: null, error: "INVALID_PAYLOAD" },
      { status: 400 },
    );
  }

  const srv = createSupabaseServiceRoleClient();

  const { data: profile, error: profileErr } = await srv
    .from("profiles")
    .select("tenant_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle<{ tenant_id: string | null; display_name: string | null }>();

  if (profileErr || !profile) {
    return NextResponse.json(
      { ok: false, data: null, error: "PROFILE_NOT_FOUND" },
      { status: 403 },
    );
  }

  if (profile.tenant_id) {
    return NextResponse.json(
      { ok: false, data: null, error: "ALREADY_SETUP" },
      { status: 409 },
    );
  }

  let tenantId: string | null = null;
  let inviteCode: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const generatedInviteCode = generateInviteCode();
    const baseSlug = slugify(body.name);
    const slugSuffix = generateInviteCode().toLowerCase().slice(0, 4);
    const slug = `${baseSlug || "ditib"}-${slugSuffix}`;

    const { data: tenant, error: tenantErr } = await srv
      .from("tenants")
      .insert({
        name: body.name,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country,
        invite_code: generatedInviteCode,
        invite_enabled: true,
        slug,
      })
      .select("id, invite_code")
      .single<{ id: string; invite_code: string }>();

    if (tenantErr) {
      if (isUniqueInviteCodeViolation(tenantErr.message, tenantErr.code)) {
        continue;
      }
      return NextResponse.json(
        { ok: false, data: null, error: `TENANT_CREATE_FAILED: ${tenantErr.message}` },
        { status: 500 },
      );
    }

    tenantId = tenant.id;
    inviteCode = tenant.invite_code;
    break;
  }

  if (!tenantId || !inviteCode) {
    return NextResponse.json(
      { ok: false, data: null, error: "INVITE_CODE_COLLISION_RETRY_EXCEEDED" },
      { status: 500 },
    );
  }

  const { error: profileUpdateErr } = await srv
    .from("profiles")
    .update({
      tenant_id: tenantId,
      role: "ADMIN",
      is_board_member: true,
    })
    .eq("user_id", user.id);

  if (profileUpdateErr) {
    return NextResponse.json(
      { ok: false, data: null, error: `PROFILE_UPDATE_FAILED: ${profileUpdateErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: { tenant_id: tenantId, invite_code: inviteCode },
      error: null,
    },
    { status: 200 },
  );
}
