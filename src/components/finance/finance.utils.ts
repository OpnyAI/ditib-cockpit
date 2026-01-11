// src/components/finance/finance.utils.ts

export function formatEURFromCents(cents: number) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export function formatEuroPlainFromCents(cents: number) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function clampCentsFromEuroInput(raw: string) {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (cents <= 0) return null;
  return cents;
}

export function monthKeyFromDateISO(isoDate: string) {
  return isoDate.slice(0, 7);
}

export function monthLabelDE(year: number, monthIndex0: number) {
  const d = new Date(year, monthIndex0, 1);
  return d.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

export function toInputMonthValue(year: number, monthIndex0: number) {
  const mm = String(monthIndex0 + 1).padStart(2, "0");
  return `${year}-${mm}`;
}

export function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadTextFile(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
