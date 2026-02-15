// src/components/finance/TransactionsTable.tsx
"use client";

import * as React from "react";
import type { Account, Category, Transaction, TxType } from "./finance.types";
import { formatEURFromCents } from "./finance.utils";
import { EditTransactionModal } from "./EditTransactionModal";

export function TransactionsTable({
  monthKey,
  monthTx,
  accounts,
  categories,
  accountNameById,
  categoryNameById,
  onArchive,
  showArchived,
  onToggleArchived,
  onRefresh,
}: {
  monthKey: string;
  monthTx: Transaction[];
  accounts: Account[];
  categories: Category[];
  accountNameById: Map<string, string>;
  categoryNameById: Map<string, string>;
  onArchive: (id: string) => Promise<void> | void;
  showArchived: boolean;
  onToggleArchived: (v: boolean) => void;

  // NEW: parent refresh (after edit/restore)
  onRefresh: () => Promise<void> | void;
}) {
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | TxType>("ALL");
  const [accountFilter, setAccountFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");

  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // NEW: edit modal
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null);

  React.useEffect(() => {
    setExpandedId(null);
  }, [monthKey, showArchived, typeFilter, accountFilter, categoryFilter, q]);

  const rows = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    let tx = monthTx;

    if (!showArchived) tx = tx.filter((t) => !t.is_archived);
    if (typeFilter !== "ALL") tx = tx.filter((t) => t.type === typeFilter);
    if (accountFilter !== "ALL")
      tx = tx.filter((t) => t.account_id === accountFilter);
    if (categoryFilter !== "ALL")
      tx = tx.filter((t) => t.category_id === categoryFilter);

    if (query) {
      tx = tx.filter((t) => {
        const a = accountNameById.get(t.account_id) ?? "";
        const c = t.category_id
          ? categoryNameById.get(t.category_id) ?? ""
          : "";
        const s = [
          t.booking_date,
          t.type,
          String(t.amount_cents),
          t.counterparty ?? "",
          t.memo ?? "",
          t.reference ?? "",
          a,
          c,
        ]
          .join(" ")
          .toLowerCase();
        return s.includes(query);
      });
    }

    return [...tx].sort((a, b) => (a.booking_date < b.booking_date ? 1 : -1));
  }, [
    monthTx,
    showArchived,
    typeFilter,
    accountFilter,
    categoryFilter,
    q,
    accountNameById,
    categoryNameById,
  ]);

  const totalCount = monthTx.length;
  const shownCount = rows.length;

  const activeFilterCount = React.useMemo(() => {
    let n = 0;
    if (typeFilter !== "ALL") n++;
    if (accountFilter !== "ALL") n++;
    if (categoryFilter !== "ALL") n++;
    if (showArchived) n++;
    return n;
  }, [typeFilter, accountFilter, categoryFilter, showArchived]);

  function resetFilters() {
    setQ("");
    setTypeFilter("ALL");
    setAccountFilter("ALL");
    setCategoryFilter("ALL");
  }

  async function restoreTransaction(id: string) {
    // no optimistic update here; we just refresh after success
    const res = await fetch(`/api/finance/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      alert(
        typeof json?.error === "string"
          ? json.error
          : `Restore fehlgeschlagen (${res.status})`
      );
      return;
    }

    await onRefresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold">Buchungen</div>
          <div className="text-xs ui-muted">
            {monthKey} • {shownCount} von {totalCount} (Filter aktiv)
          </div>
        </div>

        <div className="hidden flex-col gap-2 sm:flex-row sm:items-center md:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche (Text, Kategorie, Konto, Referenz)…"
            className="ui-input h-10 w-full sm:w-[320px]"
          />

          <div className="flex items-center gap-2">
            <label className="ui-btn flex h-10 items-center gap-2 px-3 text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => onToggleArchived(e.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--text))]"
              />
              Archiv
            </label>
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche…"
              className="ui-input h-10 w-full"
            />

            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="ui-btn relative h-10 shrink-0 px-3 text-sm"
              aria-label="Filter öffnen"
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-1 text-[11px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs ui-muted">
            <div>
              {shownCount} Treffer
              {q.trim() ? (
                <span className="ui-muted"> • Suche aktiv</span>
              ) : null}
            </div>
            {activeFilterCount > 0 ? (
              <button
                onClick={() => resetFilters()}
                className="ui-btn h-7 rounded-lg px-2 py-1 text-xs ui-muted"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 hidden grid-cols-1 gap-2 md:grid md:grid-cols-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "ALL" | TxType)}
          className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm outline-none focus:border-[rgb(var(--ring))]"
        >
          <option value="ALL">Typ: Alle</option>
          <option value="EXPENSE">Typ: Ausgabe</option>
          <option value="INCOME">Typ: Einnahme</option>
        </select>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm outline-none focus:border-[rgb(var(--ring))]"
        >
          <option value="ALL">Konto: Alle</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm outline-none focus:border-[rgb(var(--ring))]"
        >
          <option value="ALL">Kategorie: Alle</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => resetFilters()}
          className="ui-btn h-10 px-3 text-sm"
        >
          Filter zurücksetzen
        </button>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[150] md:hidden">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="ui-card absolute inset-x-0 bottom-0 rounded-t-3xl p-4 shadow-[0_-18px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Filter</div>
                <div className="mt-0.5 text-xs ui-muted">
                  Optional – Suche bleibt oben immer verfügbar.
                </div>
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="ui-btn h-10 px-3 text-sm"
              >
                Schließen
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <label className="flex h-10 items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm ui-muted">
                <span>Archiv anzeigen</span>
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => onToggleArchived(e.target.checked)}
                  className="h-4 w-4 accent-[rgb(var(--text))]"
                />
              </label>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "ALL" | TxType)}
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm outline-none focus:border-[rgb(var(--ring))]"
              >
                <option value="ALL">Typ: Alle</option>
                <option value="EXPENSE">Typ: Ausgabe</option>
                <option value="INCOME">Typ: Einnahme</option>
              </select>

              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm outline-none focus:border-[rgb(var(--ring))]"
              >
                <option value="ALL">Konto: Alle</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 text-sm outline-none focus:border-[rgb(var(--ring))]"
              >
                <option value="ALL">Kategorie: Alle</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => resetFilters()}
                  className="ui-btn h-10 px-3 text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="ui-btn ui-btn-primary h-10 px-3 text-sm font-semibold"
                >
                  Anwenden
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs ui-muted">
              Hinweis: Filter wirken nur auf den aktuell gewählten Monat.
            </div>
          </div>
        </div>
      )}

      {/* MOBILE */}
      <div className="mt-4 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/65 px-4 py-6 text-sm ui-muted">
            Keine Treffer für deine Filter/Suche.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((t) => {
              const isExpense = t.type === "EXPENSE";
              const title = t.memo || t.counterparty || "Buchung";
              const category = t.category_id
                ? categoryNameById.get(t.category_id) ?? "Kategorie"
                : "—";
              const account = accountNameById.get(t.account_id) ?? "Konto";
              const isOpen = expandedId === t.id;

              const chipCls = isExpense
                ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/65"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((prev) => (prev === t.id ? null : t.id))
                    }
                    className="w-full rounded-2xl p-3 text-left active:bg-[rgb(var(--surface-2))]/70"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {title}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs ui-muted">
                          <span className="ui-muted">
                            {t.booking_date}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${chipCls}`}
                          >
                            {isExpense ? "Ausgabe" : "Einnahme"}
                          </span>

                          {t.is_archived && (
                            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-2 py-0.5 text-[11px] ui-muted">
                              Archiviert
                            </span>
                          )}

                          <span className="ml-1 inline-flex items-center text-[11px] ui-muted">
                            {isOpen ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`text-sm font-semibold ${
                            isExpense ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"
                          }`}
                        >
                          {isExpense ? "-" : "+"}{" "}
                          {formatEURFromCents(t.amount_cents)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-2 py-2">
                        <div className="ui-muted">Kategorie</div>
                        <div className="mt-0.5 truncate">
                          {category}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-2 py-2">
                        <div className="ui-muted">Konto</div>
                        <div className="mt-0.5 truncate">
                          {account}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3">
                      <div className="mt-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 p-3">
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="flex items-start justify-between gap-3">
                            <div className="ui-muted">Gegenpartei</div>
                            <div className="max-w-[70%] text-right">
                              {t.counterparty ? t.counterparty : "—"}
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="ui-muted">Referenz</div>
                            <div className="max-w-[70%] text-right">
                              {t.reference ? t.reference : "—"}
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="ui-muted">Notiz</div>
                            <div className="max-w-[70%] text-right">
                              {t.memo ? t.memo : "—"}
                            </div>
                          </div>

                          <div className="pt-1 text-[11px] ui-muted">
                            ID: {t.id}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setEditingTx(t)}
                          className="ui-btn h-10 px-3 text-sm"
                        >
                          Bearbeiten
                        </button>

                        {t.is_archived ? (
                          <button
                            onClick={() => void restoreTransaction(t.id)}
                            className="ui-btn ui-btn-primary h-10 px-3 text-sm font-semibold"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => onArchive(t.id)}
                            className="ui-btn h-10 px-3 text-sm"
                          >
                            Archivieren
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="ui-card mt-4 hidden overflow-hidden md:block">
        <div className="grid grid-cols-12 gap-2 border-b border-[rgb(var(--border))] px-4 py-3 text-xs font-medium ui-muted">
          <div className="col-span-2">Datum</div>
          <div className="col-span-2">Typ</div>
          <div className="col-span-3">Text</div>
          <div className="col-span-2">Kategorie</div>
          <div className="col-span-2">Konto</div>
          <div className="col-span-1 text-right">Betrag</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm ui-muted">
            Keine Treffer für deine Filter/Suche.
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--border))]/70">
            {rows.map((t) => {
              const isExpense = t.type === "EXPENSE";
              const title = t.memo || t.counterparty || "Buchung";
              const category = t.category_id
                ? categoryNameById.get(t.category_id) ?? "Kategorie"
                : "—";
              const account = accountNameById.get(t.account_id) ?? "Konto";

              return (
                <div
                  key={t.id}
                  className="group grid grid-cols-12 items-center gap-2 px-4 py-3"
                >
                  <div className="col-span-2 text-sm ui-muted">
                    {t.booking_date}
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
                          isExpense
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                        }`}
                      >
                        {isExpense ? "Ausgabe" : "Einnahme"}
                      </span>
                      {t.is_archived && (
                        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-2 py-0.5 text-[11px] ui-muted">
                          Archiviert
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <div className="truncate text-sm font-medium">
                      {title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs ui-muted">
                      {t.reference ? (
                        <span>{t.reference}</span>
                      ) : (
                        <span className="ui-muted">—</span>
                      )}
                      {t.counterparty ? (
                        <>
                          <span>•</span>
                          <span>{t.counterparty}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-span-2 text-sm ui-muted">
                    {category}
                  </div>
                  <div className="col-span-2 text-sm ui-muted">
                    {account}
                  </div>

                  <div className="col-span-1 text-right text-sm font-semibold">
                    <span
                      className={
                        isExpense ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"
                      }
                    >
                      {isExpense ? "-" : "+"}{" "}
                      {formatEURFromCents(t.amount_cents)}
                    </span>
                  </div>

                  <div className="col-span-12 mt-2 hidden items-center justify-end gap-2 group-hover:flex">
                    <button
                      onClick={() => setEditingTx(t)}
                      className="ui-btn h-9 px-3 text-sm"
                    >
                      Bearbeiten
                    </button>

                    {!t.is_archived ? (
                      <button
                        onClick={() => onArchive(t.id)}
                        className="ui-btn h-9 px-3 text-sm"
                      >
                        Archivieren
                      </button>
                    ) : (
                      <button
                        onClick={() => void restoreTransaction(t.id)}
                        className="ui-btn ui-btn-primary h-9 px-3 text-sm font-semibold"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          accounts={accounts}
          categories={categories}
          accountNameById={accountNameById}
          categoryNameById={categoryNameById}
          onClose={() => setEditingTx(null)}
          onSaved={async () => {
            setEditingTx(null);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}
