// src/components/finance/FinanceDashboardPage.tsx
"use client";

import * as React from "react";
import type { Account, Category, Transaction, UiHint } from "./finance.types";
import {
  formatEuroPlainFromCents,
  monthKeyFromDateISO,
  toInputMonthValue,
  csvEscape,
  downloadTextFile,
} from "./finance.utils";
import { TransactionsTable } from "./TransactionsTable";
import { CreateTransactionModal } from "./CreateTransactionModal";
import { FinanceHeader } from "./FinanceHeader";
import { FinanceKpis } from "./FinanceKpis";
import { FinanceCategoryBreakdown } from "./FinanceCategoryBreakdown";
import { FinanceHints } from "./FinanceHints";

const UNCATEGORIZED_ID = "__uncat__";
const UNCATEGORIZED_LABEL = "Ohne Kategorie";

export default function FinanceDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const now = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = React.useState(now.getMonth());

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);

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
    [],
  );

  const yearOptions = React.useMemo(() => {
    const current = now.getFullYear();
    const ys: number[] = [];
    for (let y = current + 5; y >= current - 5; y--) ys.push(y);
    return ys;
  }, [now]);

  const selectedMonthKey = React.useMemo(() => {
    return toInputMonthValue(year, monthIndex0); // "YYYY-MM"
  }, [year, monthIndex0]);

  function buildTransactionsUrl(monthKey: string, includeArchived: boolean) {
    const params = new URLSearchParams({
      limit: "200",
      offset: "0",
      month: monthKey, // ✅ WICHTIG: month muss immer gesetzt sein
    });

    if (includeArchived) params.set("includeArchived", "1");

    return `/api/finance/transactions?${params.toString()}`;
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [accRes, catRes, txRes] = await Promise.all([
        fetch("/api/finance/accounts", { cache: "no-store" }),
        fetch("/api/finance/categories", { cache: "no-store" }),
        fetch(buildTransactionsUrl(selectedMonthKey, showArchived), {
          cache: "no-store",
        }),
      ]);

      const accJson = await accRes.json().catch(() => null);
      const catJson = await catRes.json().catch(() => null);
      const txJson = await txRes.json().catch(() => null);

      setAccounts(Array.isArray(accJson?.accounts) ? accJson.accounts : []);
      setCategories(
        Array.isArray(catJson?.categories) ? catJson.categories : [],
      );
      setTransactions(
        Array.isArray(txJson?.transactions) ? txJson.transactions : [],
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

      const txRes = await fetch(buildTransactionsUrl(selectedMonthKey, inc), {
        cache: "no-store",
      });
      const txJson = await txRes.json().catch(() => null);

      setTransactions(
        Array.isArray(txJson?.transactions) ? txJson.transactions : [],
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
  }, [showArchived, selectedMonthKey]);

  const monthTx = React.useMemo(() => {
    const key = selectedMonthKey;
    return transactions.filter(
      (t) => monthKeyFromDateISO(t.booking_date) === key,
    );
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
    m.set(UNCATEGORIZED_ID, UNCATEGORIZED_LABEL);
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

      const catId = t.category_id ?? UNCATEGORIZED_ID;
      const prev = m.get(catId) ?? 0;
      m.set(catId, prev + (t.amount_cents ?? 0));
    }

    const rows = Array.from(m.entries()).map(([categoryId, cents]) => ({
      categoryId,
      name: categoryNameById.get(categoryId) ?? UNCATEGORIZED_LABEL,
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
  }, [
    monthTx,
    incomeCents,
    expenseCents,
    saldoCents,
    expenseByCategory,
    showArchived,
  ]);

  async function archiveTransaction(id: string) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_archived: true } : t)),
    );

    try {
      const res = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_archived: false } : t)),
        );
        alert(
          json?.error
            ? String(json.error)
            : `Archivieren fehlgeschlagen (${res.status})`,
        );
        return;
      }

      await refresh(showArchived);
    } catch {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_archived: false } : t)),
      );
      alert("Archivieren fehlgeschlagen (Network).");
    }
  }

  function exportMonthCsv() {
    const exportRows = showArchived
      ? monthTx
      : monthTx.filter((t) => !t.is_archived);

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
      a.booking_date > b.booking_date ? 1 : -1,
    );

    for (const t of sorted) {
      const category =
        categoryNameById.get(t.category_id ?? UNCATEGORIZED_ID) ?? "";
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
          .join(";"),
      );
    }

    const bom = "\uFEFF";
    const csv = bom + lines.join("\r\n") + "\r\n";
    const filename = `ditib-finance-${selectedMonthKey}${showArchived ? "-inkl-archiv" : ""}.csv`;

    downloadTextFile(filename, csv, "text/csv;charset=utf-8");
    setToast("CSV heruntergeladen");
  }

  const exportDisabled = React.useMemo(() => {
    const count = (
      showArchived ? monthTx : monthTx.filter((t) => !t.is_archived)
    ).length;
    return loading || refreshing || count === 0;
  }, [monthTx, showArchived, loading, refreshing]);

  const monthExpenseCount = React.useMemo(() => {
    return monthTx.filter((t) => !t.is_archived && t.type === "EXPENSE").length;
  }, [monthTx]);

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[200]">
          <div className="ui-card border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 px-4 py-3 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur">
            {toast}
          </div>
        </div>
      )}

      <FinanceHeader
        monthIndex0={monthIndex0}
        year={year}
        monthOptions={monthOptions}
        yearOptions={yearOptions}
        refreshing={refreshing}
        exportDisabled={exportDisabled}
        showArchived={showArchived}
        onChangeMonth={setMonthIndex0}
        onChangeYear={setYear}
        onRefresh={() => void refresh(showArchived)}
        onExportCsv={exportMonthCsv}
        onCreate={() => setModalOpen(true)}
        onToggleArchived={setShowArchived}
      />

      <FinanceKpis
        incomeCents={incomeCents}
        expenseCents={expenseCents}
        saldoCents={saldoCents}
        year={year}
        monthIndex0={monthIndex0}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <FinanceCategoryBreakdown
          monthExpenseCount={monthExpenseCount}
          expenseByCategory={expenseByCategory}
          expenseCents={expenseCents}
        />
        <FinanceHints uiHints={uiHints} year={year} monthIndex0={monthIndex0} />
      </div>

      <div className="ui-card mt-4 p-5">
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
          onRefresh={() => void refresh(showArchived)}
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
          <div className="ui-card border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 px-4 py-3 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur">
            Laden…
          </div>
        </div>
      )}
    </div>
  );
}
