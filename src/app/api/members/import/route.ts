import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

export const runtime = "nodejs";

type Profile = {
  tenant_id: string | null;
  role: string | null;
};

type ImportError = {
  row: number;
  error: string;
};

type CsvRow = {
  full_name: string;
  function_title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_HEADERS = [
  "full_name",
  "function_title",
  "email",
  "phone",
  "notes",
  "is_active",
] as const;

function toNullableTrimmed(value: string | undefined) {
  if (!value) return null;
  const v = value.trim();
  return v.length > 0 ? v : null;
}

function parseBoolean(value: string | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return { ok: true as const, value: true };
  if (["true", "1", "yes", "ja"].includes(raw)) {
    return { ok: true as const, value: true };
  }
  if (["false", "0", "no", "nein"].includes(raw)) {
    return { ok: true as const, value: false };
  }
  return { ok: false as const, value: true };
}

function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];

  const counts = candidates.map((delimiter) => ({
    delimiter,
    count: (firstLine.match(new RegExp(`\\${delimiter}`, "g")) ?? []).length,
  }));

  counts.sort((a, b) => b.count - a.count);

  return counts[0].count > 0 ? counts[0].delimiter : ",";
}

function parseCsv(content: string) {
  const delimiter = detectDelimiter(content);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const normalized = content.replace(/^\uFEFF/, "");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && normalized[i + 1] === "\n") {
        i++;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    const allEmpty = last.every((c) => c.trim() === "");
    if (!allEmpty) break;
    rows.pop();
  }

  return rows;
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
    .select("tenant_id, role")
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

  if (profile.role !== "ADMIN" && profile.role !== "VORSTAND") {
    return {
      error: NextResponse.json(
        { error: "Keine Berechtigung für CSV-Import." },
        { status: 403 }
      ),
    };
  }

  return { supabase, userId: user.id, tenantId: profile.tenant_id };
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Upload-Request." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Bitte eine CSV-Datei hochladen." },
      { status: 400 }
    );
  }

  let csvText = "";
  try {
    csvText = await file.text();
  } catch {
    return NextResponse.json(
      { error: "CSV-Datei konnte nicht gelesen werden." },
      { status: 400 }
    );
  }

  if (!csvText.trim()) {
    return NextResponse.json(
      { error: "CSV-Datei ist leer." },
      { status: 400 }
    );
  }

  const parsed = parseCsv(csvText);
  if (parsed.length < 1) {
    return NextResponse.json(
      { error: "CSV enthält keine Daten." },
      { status: 400 }
    );
  }

  const headers = parsed[0].map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `CSV-Kopfzeile unvollständig. Fehlende Spalten: ${missing.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i])) as Record<
    string,
    number
  >;

  const validRows: CsvRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    const rowNo = i + 1;

    const full_name_raw = row[idx.full_name] ?? "";
    const function_title_raw = row[idx.function_title] ?? "";
    const email_raw = row[idx.email] ?? "";
    const phone_raw = row[idx.phone] ?? "";
    const notes_raw = row[idx.notes] ?? "";
    const is_active_raw = row[idx.is_active] ?? "";

    const allEmpty = [
      full_name_raw,
      function_title_raw,
      email_raw,
      phone_raw,
      notes_raw,
      is_active_raw,
    ].every((v) => v.trim() === "");

    if (allEmpty) {
      continue;
    }

    const full_name = full_name_raw.trim();
    if (full_name.length < 2) {
      errors.push({
        row: rowNo,
        error: "full_name muss mindestens 2 Zeichen haben.",
      });
      continue;
    }

    const email = toNullableTrimmed(email_raw);
    if (email && !EMAIL_REGEX.test(email)) {
      errors.push({
        row: rowNo,
        error: "email ist ungültig.",
      });
      continue;
    }

    const isActiveParsed = parseBoolean(is_active_raw);
    if (!isActiveParsed.ok) {
      errors.push({
        row: rowNo,
        error: "is_active muss true/false (oder 1/0, yes/no, ja/nein) sein.",
      });
      continue;
    }

    validRows.push({
      full_name,
      function_title: toNullableTrimmed(function_title_raw),
      email,
      phone: toNullableTrimmed(phone_raw),
      notes: toNullableTrimmed(notes_raw),
      is_active: isActiveParsed.value,
    });
  }

  if (validRows.length > 0) {
    const payload = validRows.map((r) => ({
      tenant_id: ctx.tenantId,
      full_name: r.full_name,
      function_title: r.function_title,
      email: r.email,
      phone: r.phone,
      notes: r.notes,
      is_active: r.is_active,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    }));

    const { error: insertErr } = await ctx.supabase
      .from("tenant_members")
      .insert(payload);

    if (insertErr) {
      const status = /row-level security|permission denied/i.test(insertErr.message)
        ? 403
        : 500;

      return NextResponse.json(
        { error: `Import fehlgeschlagen: ${insertErr.message}` },
        { status }
      );
    }
  }

  return NextResponse.json(
    {
      importedCount: validRows.length,
      errors,
    },
    { status: 200 }
  );
}
