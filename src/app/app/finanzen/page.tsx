"use client";

import * as React from "react";

type TxType = "INCOME" | "EXPENSE";

type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  type: TxType;
  title: string;
  category: string;
  amountCents: number; // always positive
  note?: string;
};

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatEur(cents: number) {
  return EUR.format(cents / 100);
}

function monthKey(date: string) {
  // "2026-01-05" -> "2026-01"
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  // "2026-01" -> "Januar 2026"
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function sumByType(txs: Transaction[], type: TxType) {
  return txs
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amountCents, 0);
}

function groupByCategory(txs: Transaction[]) {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of txs) {
    const cur = map.get(t.category) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") cur.income += t.amountCents;
    else cur.expense += t.amountCents;
    map.set(t.category, cur);
  }
  const rows = Array.from(map.entries()).map(([category, v]) => ({
    category,
    incomeCents: v.income,
    expenseCents: v.expense,
    netCents: v.income - v.expense,
  }));

  // Sort: highest absolute spend first
  rows.sort((a, b) => Math.abs(b.expenseCents) - Math.abs(a.expenseCents));
  return rows;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return clamp((part / total) * 100, 0, 100);
}

const DEMO_TX: Transaction[] = [
  // Jan 2026
  {
    id: "t1",
    date: "2026-01-02",
    type: "INCOME",
    title: "Mitgliedsbeiträge",
    category: "Beiträge",
    amountCents: 124500,
  },
  {
    id: "t2",
    date: "2026-01-03",
    type: "INCOME",
    title: "Spende (anonym)",
    category: "Spenden",
    amountCents: 50000,
  },
  {
    id: "t3",
    date: "2026-01-04",
    type: "EXPENSE",
    title: "Strom / Nebenkosten",
    category: "Betriebskosten",
    amountCents: 38990,
  },
  {
    id: "t4",
    date: "2026-01-05",
    type: "EXPENSE",
    title: "Reinigung",
    category: "Betriebskosten",
    amountCents: 22000,
  },
  {
    id: "t5",
    date: "2026-01-08",
    type: "EXPENSE",
    title: "Kinderprogramm Material",
    category: "Gemeindearbeit",
    amountCents: 15850,
  },
  {
    id: "t6",
    date: "2026-01-10",
    type: "INCOME",
    title: "Veranstaltung Einnahmen",
    category: "Events",
    amountCents: 78000,
  },
  {
    id: "t7",
    date: "2026-01-12",
    type: "EXPENSE",
    title: "Catering / Eventkosten",
    category: "Events",
    amountCents: 41200,
  },
  {
    id: "t8",
    date: "2026-01-16",
    type: "EXPENSE",
    title: "IT / Software",
    category: "IT",
    amountCents: 9900,
  },
  {
    id: "t9",
    date: "2026-01-22",
    type: "EXPENSE",
    title: "Instandhaltung",
    category: "Instandhaltung",
    amountCents: 145000,
    note: "Kleinreparaturen + Material",
  },

  // Dec 2025 (für Monatswechsel-Demo)
  {
    id: "t10",
    date: "2025-12-05",
    type: "INCOME",
    title: "Mitgliedsbeiträge",
    category: "Beiträge",
    amountCents: 118200,
  },
  {
    id: "t11",
    date: "2025-12-12",
    type: "EXPENSE",
    title: "Heizung",
    category: "Betriebskosten",
    amountCents: 57250,
  },
  {
    id: "t12",
    date: "2025-12-18",
    type: "INCOME",
    title: "Spende",
    category: "Spenden",
    amountCents: 25000,
  },
  {
    id: "t13",
    date: "2025-12-21",
    type: "EXPENSE",
    title: "Jugendarbeit",
    category: "Gemeindearbeit",
    amountCents: 18900,
  },
];

function Card({
  title,
  value,
  hint,
  tone = "neutral",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-md",
        "bg-white/70 dark:bg-white/5",
        "border-black/5 dark:border-white/10",
        "shadow-sm"
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="text-xs font-medium tracking-wide text-black/55 dark:text-white/55">
          {title}
        </div>
        <div
          className={cn(
            "mt-1 text-2xl sm:text-3xl font-semibold",
            tone === "good" && "text-emerald-700 dark:text-emerald-400",
            tone === "bad" && "text-rose-700 dark:text-rose-400",
            tone === "neutral" && "text-black dark:text-white"
          )}
        >
          {value}
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-black/50 dark:text-white/45">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-black/5 text-black/70 dark:bg-white/10 dark:text-white/70"
      )}
    >
      {children}
    </span>
  );
}

function ToneTag({ type }: { type: TxType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        type === "INCOME"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
      )}
    >
      {type === "INCOME" ? "Einnahme" : "Ausgabe"}
    </span>
  );
}

function ProgressBar({
  valuePct,
  tone,
}: {
  valuePct: number;
  tone: "good" | "bad" | "neutral";
}) {
  return (
    <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "good" && "bg-emerald-500/70",
          tone === "bad" && "bg-rose-500/70",
          tone === "neutral" && "bg-black/30 dark:bg-white/30"
        )}
        style={{ width: `${clamp(valuePct, 0, 100)}%` }}
      />
    </div>
  );
}

export default function FinanceDashboardPage() {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    // Default: latest month in demo data
    const months = Array.from(new Set(DEMO_TX.map((t) => monthKey(t.date))));
    months.sort((a, b) => (a > b ? -1 : 1));
    return months[0] ?? monthKey(new Date().toISOString().slice(0, 10));
  });

  const months = React.useMemo(() => {
    const m = Array.from(new Set(DEMO_TX.map((t) => monthKey(t.date))));
    m.sort((a, b) => (a > b ? -1 : 1));
    return m;
  }, []);

  const monthTx = React.useMemo(() => {
    const filtered = DEMO_TX.filter((t) => monthKey(t.date) === selectedMonth);
    filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
    return filtered;
  }, [selectedMonth]);

  const incomeCents = React.useMemo(
    () => sumByType(monthTx, "INCOME"),
    [monthTx]
  );
  const expenseCents = React.useMemo(
    () => sumByType(monthTx, "EXPENSE"),
    [monthTx]
  );
  const netCents = incomeCents - expenseCents;

  const categoryRows = React.useMemo(() => groupByCategory(monthTx), [monthTx]);

  const biggestExpense = React.useMemo(() => {
    const ex = monthTx.filter((t) => t.type === "EXPENSE");
    ex.sort((a, b) => b.amountCents - a.amountCents);
    return ex[0];
  }, [monthTx]);

  const biggestIncome = React.useMemo(() => {
    const inc = monthTx.filter((t) => t.type === "INCOME");
    inc.sort((a, b) => b.amountCents - a.amountCents);
    return inc[0];
  }, [monthTx]);

  const spendRatePct = React.useMemo(
    () => pct(expenseCents, incomeCents),
    [expenseCents, incomeCents]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
              Finanzen
            </h1>
            <div className="mt-1 text-sm text-black/55 dark:text-white/55">
              Überblick über Einnahmen & Ausgaben (Beispieldaten)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Pill>Mandant: Demo-Gemeinde</Pill>

            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={cn(
                  "h-10 rounded-xl border px-3 pr-10 text-sm outline-none",
                  "bg-white/80 dark:bg-white/5",
                  "border-black/10 dark:border-white/10",
                  "text-black dark:text-white",
                  "focus:border-black/20 dark:focus:border-white/20"
                )}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/45 dark:text-white/45">
                ▾
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Einnahmen (Monat)"
            value={formatEur(incomeCents)}
            hint={biggestIncome ? `Top: ${biggestIncome.title}` : undefined}
            tone="good"
          />
          <Card
            title="Ausgaben (Monat)"
            value={formatEur(expenseCents)}
            hint={biggestExpense ? `Top: ${biggestExpense.title}` : undefined}
            tone="bad"
          />
          <Card
            title="Saldo (Monat)"
            value={formatEur(netCents)}
            hint={netCents >= 0 ? "positiv" : "negativ"}
            tone={netCents >= 0 ? "good" : "bad"}
          />
          <Card
            title="Ausgabenquote"
            value={`${Math.round(spendRatePct)}%`}
            hint="Ausgaben / Einnahmen"
            tone={
              spendRatePct <= 85
                ? "good"
                : spendRatePct <= 100
                ? "neutral"
                : "bad"
            }
          />
        </div>

        {/* Middle section */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Category breakdown */}
          <div
            className={cn(
              "rounded-2xl border shadow-sm",
              "bg-white/70 dark:bg-white/5",
              "border-black/5 dark:border-white/10",
              "backdrop-blur-md",
              "lg:col-span-1"
            )}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-black dark:text-white">
                  Kategorien
                </div>
                <Pill>{categoryRows.length} Kategorien</Pill>
              </div>

              <div className="mt-4 space-y-4">
                {categoryRows.length === 0 ? (
                  <div className="text-sm text-black/55 dark:text-white/55">
                    Keine Buchungen in diesem Monat.
                  </div>
                ) : (
                  categoryRows.map((r) => {
                    const expensePct = pct(r.expenseCents, expenseCents);
                    const incomePct = pct(r.incomeCents, incomeCents);
                    const tone = r.netCents >= 0 ? "good" : "bad";

                    return (
                      <div key={r.category} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-black dark:text-white">
                              {r.category}
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/45">
                              Einnahmen {formatEur(r.incomeCents)} · Ausgaben{" "}
                              {formatEur(r.expenseCents)}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "shrink-0 text-sm font-semibold",
                              tone === "good"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400"
                            )}
                          >
                            {formatEur(r.netCents)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-black/50 dark:text-white/45">
                            <span>Ausgabenanteil</span>
                            <span>{Math.round(expensePct)}%</span>
                          </div>
                          <ProgressBar valuePct={expensePct} tone="bad" />

                          <div className="flex items-center justify-between text-[11px] text-black/50 dark:text-white/45">
                            <span>Einnahmenanteil</span>
                            <span>{Math.round(incomePct)}%</span>
                          </div>
                          <ProgressBar valuePct={incomePct} tone="good" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div
            className={cn(
              "rounded-2xl border shadow-sm",
              "bg-white/70 dark:bg-white/5",
              "border-black/5 dark:border-white/10",
              "backdrop-blur-md",
              "lg:col-span-2"
            )}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-black dark:text-white">
                  Buchungen
                </div>
                <Pill>{monthTx.length} Einträge</Pill>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-black/5 dark:border-white/10">
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-white/90 dark:bg-[#0b0f1a]/90 backdrop-blur-md">
                      <tr className="text-xs text-black/55 dark:text-white/55">
                        <th className="px-3 py-2 font-medium">Datum</th>
                        <th className="px-3 py-2 font-medium">Typ</th>
                        <th className="px-3 py-2 font-medium">Titel</th>
                        <th className="px-3 py-2 font-medium">Kategorie</th>
                        <th className="px-3 py-2 font-medium text-right">
                          Betrag
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/10">
                      {monthTx.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-10 text-center text-sm text-black/55 dark:text-white/55"
                          >
                            Keine Buchungen vorhanden.
                          </td>
                        </tr>
                      ) : (
                        monthTx.map((t) => (
                          <tr
                            key={t.id}
                            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                          >
                            <td className="px-3 py-2 text-black/70 dark:text-white/70 tabular-nums">
                              {new Date(t.date).toLocaleDateString("de-DE")}
                            </td>
                            <td className="px-3 py-2">
                              <ToneTag type={t.type} />
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-black dark:text-white font-medium">
                                {t.title}
                              </div>
                              {t.note ? (
                                <div className="text-xs text-black/50 dark:text-white/45">
                                  {t.note}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-black/70 dark:text-white/70">
                              {t.category}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2 text-right font-semibold tabular-nums",
                                t.type === "INCOME"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-rose-700 dark:text-rose-400"
                              )}
                            >
                              {t.type === "INCOME" ? "+" : "-"}
                              {formatEur(t.amountCents)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                <div className="text-black/55 dark:text-white/55">
                  Tipp: Später ersetzen wir{" "}
                  <span className="font-medium">DEMO_TX</span> durch echte Daten
                  aus Supabase.
                </div>
                <div className="flex items-center gap-2">
                  <Pill>
                    Einnahmen:{" "}
                    <span className="ml-1 font-semibold">
                      {formatEur(incomeCents)}
                    </span>
                  </Pill>
                  <Pill>
                    Ausgaben:{" "}
                    <span className="ml-1 font-semibold">
                      {formatEur(expenseCents)}
                    </span>
                  </Pill>
                  <Pill>
                    Saldo:{" "}
                    <span
                      className={cn(
                        "ml-1 font-semibold",
                        netCents >= 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      )}
                    >
                      {formatEur(netCents)}
                    </span>
                  </Pill>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-6 text-xs text-black/45 dark:text-white/45">
          Beispielansicht: Für ein echtes Produkt würden wir zusätzlich
          Rechte/Rollen prüfen (z. B. nur Kassierer/Admin), Export (CSV/PDF),
          Beleg-Upload und ein echtes Kontenmodell ergänzen.
        </div>
      </div>
    </div>
  );
}
