// src/components/finance/FinanceDashboardPage.tsx
"use client";

import * as React from "react";
import type { Account, Category, Transaction, UiHint } from "./finance.types";
import {
  formatEURFromCents,
  formatEuroPlainFromCents,
  monthKeyFromDateISO,
  monthLabelDE,
  toInputMonthValue,
  csvEscape,
  downloadTextFile,
} from "./finance.utils";
import { TransactionsTable } from "./TransactionsTable";
import { CreateTransactionModal } from "./CreateTransactionModal";

export default function FinanceDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const now = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = React.useState(now.getMonth());

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = React.useState(false);

  // UI: Archiv anzeigen (steuert auch includeArchived beim Laden)
  const [showArchived, setShowArchived] = React.useState(false);

  // Toast nach CSV Export
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const monthOptions = React.useMemo(
    () => [
      { value: 0, label: "Januar" },
      { value: 1, label: "Februar" },
      { value: 2, label: "März" },
      { value: 3, label: "April" },
      { value: 4, label: "Mai" },
      { value: 5, label: "Juni" },
      { value: 6, label: "Juli" },
      { value: 7, label: "August" },
      { value: 8, label: "September" },
      { value: 9, label: "Oktober" },
      { value: 10, label: "November" },
      { value: 11, label: "Dezember" },
    ],
    []
  );

  const yearOptions = React.useMemo(() => {
    const current = now.getFullYear();
    const ys: number[] = [];
    for (let y = current + 5; y >= current - 5; y--) ys.push(y);
    return ys;
  }, [now]);

  async function loadAll() {
    setLoading(true);
    try {
      const [accRes, catRes, txRes] = await Promise.all([
        fetch("/api/finance/accounts", { cache: "no-store" }),
        fetch("/api/finance/categories", { cache: "no-store" }),
        fetch(
          `/api/finance/transactions?limit=200&offset=0${
            showArchived ? "&includeArchived=1" : ""
          }`,
          { cache: "no-store" }
        ),
      ]);

      const accJson = await accRes.json().catch(() => null);
      const catJson = await catRes.json().catch(() => null);
      const txJson = await txRes.json().catch(() => null);

      setAccounts(Array.isArray(accJson?.accounts) ? accJson.accounts : []);
      setCategories(Array.isArray(catJson?.categories) ? catJson.categories : []);
      setTransactions(
        Array.isArray(txJson?.transactions) ? txJson.transactions : []
      );
    } finally {
      setLoading(false);
    }
  }

  async function refresh(includeArchived?: boolean) {
    setRefreshing(true);
    try {
      const inc =
        typeof includeArchived === "boolean" ? includeArchived : showArchived;

      const txRes = await fetch(
        `/api/finance/transactions?limit=200&offset=0${
          inc ? "&includeArchived=1" : ""
        }`,
        { cache: "no-store" }
      );
      const txJson = await txRes.json().catch(() => null);
      setTransactions(
        Array.isArray(txJson?.transactions) ? txJson.transactions : []
      );
    } finally {
      setRefreshing(false);
    }
  }

  React.useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    void refresh(showArchived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const selectedMonthKey = React.useMemo(() => {
    return toInputMonthValue(year, monthIndex0); // "YYYY-MM"
  }, [year, monthIndex0]);

  const monthTx = React.useMemo(() => {
    const key = selectedMonthKey;
    return transactions.filter((t) => monthKeyFromDateISO(t.booking_date) === key);
  }, [transactions, selectedMonthKey]);

  const incomeCents = React.useMemo(() => {
    return monthTx
      .filter((t) => !t.is_archived)
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + (t.amount_cents ?? 0), 0);
  }, [monthTx]);

  const expenseCents = React.useMemo(() => {
    return monthTx
      .filter((t) => !t.is_archived)
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + (t.amount_cents ?? 0), 0);
  }, [monthTx]);

  const saldoCents = incomeCents - expenseCents;

  const categoryNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const accountNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, a.name);
    return m;
  }, [accounts]);

  const expenseByCategory = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTx) {
      if (t.is_archived) continue;
      if (t.type !== "EXPENSE") continue;
      const prev = m.get(t.category_id) ?? 0;
      m.set(t.category_id, prev + (t.amount_cents ?? 0));
    }
    const rows = Array.from(m.entries()).map(([categoryId, cents]) => ({
      categoryId,
      name: categoryNameById.get(categoryId) ?? "Unbekannte Kategorie",
      cents,
    }));
    rows.sort((a, b) => b.cents - a.cents);
    return rows;
  }, [monthTx, categoryNameById]);

  const uiHints = React.useMemo<UiHint[]>(() => {
    const hints: UiHint[] = [];

    if (monthTx.length === 0) {
      hints.push({
        id: "no-bookings",
        title: "Keine Buchungen im Monat",
        body: "Für den gewählten Monat liegen noch keine Buchungen vor.",
        tone: "info",
      });
      return hints;
    }

    if (incomeCents === 0 && expenseCents > 0) {
      hints.push({
        id: "no-income",
        title: "Keine Einnahmen erfasst",
        body: "Im gewählten Monat wurden Ausgaben erfasst, aber keine Einnahmen.",
        tone: "info",
      });
    }

    if (saldoCents < 0) {
      hints.push({
        id: "negative-saldo",
        title: "Saldo ist negativ",
        body: "Die Ausgaben übersteigen die Einnahmen im gewählten Monat.",
        tone: "warn",
      });
    }

    const top = expenseByCategory[0];
    if (top && expenseCents > 0) {
      const pct = Math.round((top.cents / expenseCents) * 100);
      if (pct >= 50) {
        hints.push({
          id: "dominant-category",
          title: "Eine Kategorie dominiert",
          body: `Mehr als die Hälfte der Ausgaben entfällt auf „${top.name}“ (${pct}%).`,
          tone: "neutral",
        });
      }
    }

    if (showArchived) {
      hints.push({
        id: "archive-visible",
        title: "Archiv ist aktiv",
        body: "Archivierte Buchungen sind sichtbar. Je nach Auswertung kann das deine Ansicht beeinflussen.",
        tone: "info",
      });
    }

    const hasArchivedInMonth = monthTx.some((t) => !!t.is_archived);
    if (hasArchivedInMonth) {
      hints.push({
        id: "has-archived",
        title: "Archivierte Buchungen vorhanden",
        body: showArchived
          ? "In diesem Monat gibt es archivierte Buchungen (sie sind aktuell sichtbar)."
          : "In diesem Monat gibt es archivierte Buchungen (sie sind aktuell ausgeblendet).",
        tone: "neutral",
      });
    }

    return hints;
  }, [monthTx, incomeCents, expenseCents, saldoCents, expenseByCategory, showArchived]);

  async function archiveTransaction(id: string) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_archived: true } : t))
    );

    try {
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Archive failed:", res.status, json);
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_archived: false } : t))
        );
        alert(
          json?.error
            ? String(json.error)
            : `Archivieren fehlgeschlagen (${res.status})`
        );
        return;
      }

      await refresh(showArchived);
    } catch (e) {
      console.error(e);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_archived: false } : t))
      );
      alert("Archivieren fehlgeschlagen (Network).");
    }
  }

  function exportMonthCsv() {
    const exportRows = showArchived ? monthTx : monthTx.filter((t) => !t.is_archived);

    const header = [
      "Datum",
      "Typ",
      "Betrag_EUR",
      "Kategorie",
      "Konto",
      "Gegenpartei",
      "Notiz",
      "Referenz",
      "Archiviert",
      "ID",
    ];

    const lines: string[] = [];
    lines.push(header.map(csvEscape).join(";"));

    const sorted = [...exportRows].sort((a, b) =>
      a.booking_date > b.booking_date ? 1 : -1
    );

    for (const t of sorted) {
      const category = categoryNameById.get(t.category_id) ?? "";
      const account = accountNameById.get(t.account_id) ?? "";
      const typeLabel = t.type === "EXPENSE" ? "AUSGABE" : "EINNAHME";
      const archived = t.is_archived ? "JA" : "NEIN";

      lines.push(
        [
          t.booking_date,
          typeLabel,
          formatEuroPlainFromCents(t.amount_cents),
          category,
          account,
          t.counterparty ?? "",
          t.memo ?? "",
          t.reference ?? "",
          archived,
          t.id,
        ]
          .map(csvEscape)
          .join(";")
      );
    }

    const bom = "\uFEFF";
    const csv = bom + lines.join("\r\n") + "\r\n";
    const filename = `ditib-finance-${selectedMonthKey}${showArchived ? "-inkl-archiv" : ""}.csv`;

    downloadTextFile(filename, csv, "text/csv;charset=utf-8");
    setToast("CSV heruntergeladen");
  }

  const exportDisabled = React.useMemo(() => {
    const count = (showArchived ? monthTx : monthTx.filter((t) => !t.is_archived)).length;
    return loading || refreshing || count === 0;
  }, [monthTx, showArchived, loading, refreshing]);

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[200]">
          <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
            {toast}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div>
            <div className="text-lg font-semibold text-white/90">Finanzen</div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Monat
            </div>

            <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
              <select
                value={monthIndex0}
                onChange={(e) => setMonthIndex0(Number(e.target.value))}
                className="h-10 bg-transparent text-sm text-white/85 outline-none"
                aria-label="Monat wählen"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="h-5 w-px bg-white/10" />

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 bg-transparent text-sm text-white/85 outline-none"
                aria-label="Jahr wählen"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => void refresh(showArchived)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
            >
              {refreshing ? "..." : "Refresh"}
            </button>

            <button
              onClick={() => exportMonthCsv()}
              disabled={exportDisabled}
              title={
                exportDisabled
                  ? "Keine Buchungen im Monat zum Export."
                  : showArchived
                  ? "CSV Export (aktueller Monat, inkl. Archiv)."
                  : "CSV Export (aktueller Monat, ohne Archiv)."
              }
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              CSV Export
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="h-10 rounded-xl bg-white/85 px-3 text-sm font-medium text-black hover:bg-white active:bg-white/90"
            >
              + Buchung
            </button>
          </div>

          <div className="md:hidden">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                Monat
              </div>

              <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                <select
                  value={monthIndex0}
                  onChange={(e) => setMonthIndex0(Number(e.target.value))}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white/85 outline-none"
                  aria-label="Monat wählen"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <div className="h-5 w-px bg-white/10" />

                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-10 bg-transparent text-sm text-white/85 outline-none"
                  aria-label="Jahr wählen"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => void refresh(showArchived)}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
              >
                {refreshing ? "..." : "Refresh"}
              </button>

              <button
                onClick={() => exportMonthCsv()}
                disabled={exportDisabled}
                title={
                  exportDisabled
                    ? "Keine Buchungen im Monat zum Export."
                    : showArchived
                    ? "CSV Export (aktueller Monat, inkl. Archiv)."
                    : "CSV Export (aktueller Monat, ohne Archiv)."
                }
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                CSV Export
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="col-span-2 h-11 rounded-xl bg-white/85 px-3 text-sm font-semibold text-black hover:bg-white active:bg-white/90"
              >
                + Buchung
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 accent-white"
            />
            Archiv anzeigen
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <div className="text-xs font-medium text-white/55">Einnahmen</div>
          <div className="mt-1 text-3xl font-semibold text-emerald-300">
            {formatEURFromCents(incomeCents)}
          </div>
          <div className="mt-1 text-sm text-white/45">
            {monthLabelDE(year, monthIndex0)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <div className="text-xs font-medium text-white/55">Ausgaben</div>
          <div className="mt-1 text-3xl font-semibold text-rose-300">
            {formatEURFromCents(expenseCents)}
          </div>
          <div className="mt-1 text-sm text-white/45">
            {monthLabelDE(year, monthIndex0)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <div className="text-xs font-medium text-white/55">Saldo</div>
          <div className="mt-1 text-3xl font-semibold text-white/90">
            {formatEURFromCents(saldoCents)}
          </div>
          <div className="mt-1 text-sm text-white/45">Einnahmen – Ausgaben</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90">
                Ausgaben nach Kategorie
              </div>
              <div className="text-xs text-white/50">
                Fokus auf die größten Kostentreiber im gewählten Monat.
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {monthTx.filter((t) => !t.is_archived && t.type === "EXPENSE").length}{" "}
              Buchungen
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {expenseByCategory.length === 0 ? (
              <div className="text-sm text-white/55">Keine Ausgaben im Monat.</div>
            ) : (
              expenseByCategory.slice(0, 6).map((row) => {
                const pct =
                  expenseCents > 0
                    ? Math.min(100, Math.round((row.cents / expenseCents) * 100))
                    : 0;

                return (
                  <div key={row.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/80">{row.name}</div>
                      <div className="text-sm font-medium text-white/85">
                        {formatEURFromCents(row.cents)}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5">
                      <div
                        className="h-2 rounded-full bg-white/25"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Hinweise</div>
              <div className="mt-1 text-xs text-white/55">
                Automatisch – regelbasiert, ohne KI.
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {uiHints.length} aktiv
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {uiHints.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-white/70">
                Sieht sauber aus – keine Hinweise für{" "}
                <span className="text-white/85">
                  {monthLabelDE(year, monthIndex0)}
                </span>
                .
              </div>
            ) : (
              uiHints.map((h) => {
                const toneCls =
                  h.tone === "warn"
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                    : h.tone === "info"
                    ? "border-white/10 bg-black/10 text-white/80"
                    : "border-white/10 bg-white/5 text-white/80";

                const titleCls =
                  h.tone === "warn" ? "text-rose-100" : "text-white/85";

                return (
                  <div
                    key={h.id}
                    className={`rounded-xl border px-3 py-3 text-sm ${toneCls}`}
                  >
                    <div className={`text-sm font-medium ${titleCls}`}>
                      {h.title}
                    </div>
                    <div className="mt-1 text-xs text-white/65">{h.body}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3 text-xs text-white/60">
            Tipp: Die Buchungen-Liste unten ist deine Arbeitsfläche (Suchen / Filtern / Archivieren).
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <TransactionsTable
          monthKey={selectedMonthKey}
          monthTx={monthTx}
          accounts={accounts}
          categories={categories}
          accountNameById={accountNameById}
          categoryNameById={categoryNameById}
          onArchive={archiveTransaction}
          showArchived={showArchived}
          onToggleArchived={(v) => setShowArchived(v)}
        />
      </div>

      {modalOpen && (
        <CreateTransactionModal
          monthKey={selectedMonthKey}
          accounts={accounts}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onCreated={async () => {
            setModalOpen(false);
            await refresh(showArchived);
          }}
        />
      )}

      {loading && (
        <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
            Laden…
          </div>
        </div>
      )}
    </div>
  );
}
