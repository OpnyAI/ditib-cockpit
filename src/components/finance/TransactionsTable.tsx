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
          <div className="text-sm font-semibold text-white/90">Buchungen</div>
          <div className="text-xs text-white/50">
            {monthKey} • {shownCount} von {totalCount} (Filter aktiv)
          </div>
        </div>

        <div className="hidden flex-col gap-2 sm:flex-row sm:items-center md:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche (Text, Kategorie, Konto, Referenz)…"
            className="h-10 w-full sm:w-[320px] rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-2">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => onToggleArchived(e.target.checked)}
                className="h-4 w-4 accent-white"
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
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            />

            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="relative h-10 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
              aria-label="Filter öffnen"
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/10 bg-white/10 px-1 text-[11px] text-white/85">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-white/55">
            <div>
              {shownCount} Treffer
              {q.trim() ? (
                <span className="text-white/35"> • Suche aktiv</span>
              ) : null}
            </div>
            {activeFilterCount > 0 ? (
              <button
                onClick={() => resetFilters()}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
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
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
        >
          <option value="ALL">Typ: Alle</option>
          <option value="EXPENSE">Typ: Ausgabe</option>
          <option value="INCOME">Typ: Einnahme</option>
        </select>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
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
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
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
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
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
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-white/10 bg-[#0b1220]/95 p-4 shadow-[0_-18px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/90">
                  Filter
                </div>
                <div className="mt-0.5 text-xs text-white/55">
                  Optional – Suche bleibt oben immer verfügbar.
                </div>
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/75 hover:bg-white/10"
              >
                Schließen
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <label className="flex h-10 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/75">
                <span>Archiv anzeigen</span>
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => onToggleArchived(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
              </label>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
              >
                <option value="ALL">Typ: Alle</option>
                <option value="EXPENSE">Typ: Ausgabe</option>
                <option value="INCOME">Typ: Einnahme</option>
              </select>

              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
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
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
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
                  className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="h-10 rounded-xl bg-white/85 px-3 text-sm font-semibold text-black hover:bg-white active:bg-white/90"
                >
                  Anwenden
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/45">
              Hinweis: Filter wirken nur auf den aktuell gewählten Monat.
            </div>
          </div>
        </div>
      )}

      {/* MOBILE */}
      <div className="mt-4 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-white/55">
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
                ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/10 bg-black/10"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((prev) => (prev === t.id ? null : t.id))
                    }
                    className="w-full rounded-2xl p-3 text-left active:bg-white/5"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {title}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                          <span className="text-white/60">
                            {t.booking_date}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${chipCls}`}
                          >
                            {isExpense ? "Ausgabe" : "Einnahme"}
                          </span>

                          {t.is_archived && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                              Archiviert
                            </span>
                          )}

                          <span className="ml-1 inline-flex items-center text-[11px] text-white/45">
                            {isOpen ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`text-sm font-semibold ${
                            isExpense ? "text-rose-300" : "text-emerald-300"
                          }`}
                        >
                          {isExpense ? "-" : "+"}{" "}
                          {formatEURFromCents(t.amount_cents)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                        <div className="text-white/45">Kategorie</div>
                        <div className="mt-0.5 truncate text-white/80">
                          {category}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                        <div className="text-white/45">Konto</div>
                        <div className="mt-0.5 truncate text-white/80">
                          {account}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3">
                      <div className="mt-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-white/45">Gegenpartei</div>
                            <div className="max-w-[70%] text-right text-white/80">
                              {t.counterparty ? t.counterparty : "—"}
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="text-white/45">Referenz</div>
                            <div className="max-w-[70%] text-right text-white/80">
                              {t.reference ? t.reference : "—"}
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="text-white/45">Notiz</div>
                            <div className="max-w-[70%] text-right text-white/80">
                              {t.memo ? t.memo : "—"}
                            </div>
                          </div>

                          <div className="pt-1 text-[11px] text-white/35">
                            ID: {t.id}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setEditingTx(t)}
                          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
                        >
                          Bearbeiten
                        </button>

                        {t.is_archived ? (
                          <button
                            onClick={() => void restoreTransaction(t.id)}
                            className="h-10 rounded-xl bg-white/85 px-3 text-sm font-semibold text-black hover:bg-white active:bg-white/90"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => onArchive(t.id)}
                            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
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
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/10 bg-black/10 md:block">
        <div className="grid grid-cols-12 gap-2 border-b border-white/10 px-4 py-3 text-xs font-medium text-white/60">
          <div className="col-span-2">Datum</div>
          <div className="col-span-2">Typ</div>
          <div className="col-span-3">Text</div>
          <div className="col-span-2">Kategorie</div>
          <div className="col-span-2">Konto</div>
          <div className="col-span-1 text-right">Betrag</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-white/55">
            Keine Treffer für deine Filter/Suche.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
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
                  <div className="col-span-2 text-sm text-white/75">
                    {t.booking_date}
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
                          isExpense
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        }`}
                      >
                        {isExpense ? "Ausgabe" : "Einnahme"}
                      </span>
                      {t.is_archived && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                          Archiviert
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <div className="truncate text-sm font-medium text-white/90">
                      {title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/45">
                      {t.reference ? (
                        <span>{t.reference}</span>
                      ) : (
                        <span className="text-white/35">—</span>
                      )}
                      {t.counterparty ? (
                        <>
                          <span>•</span>
                          <span>{t.counterparty}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-span-2 text-sm text-white/75">
                    {category}
                  </div>
                  <div className="col-span-2 text-sm text-white/75">
                    {account}
                  </div>

                  <div className="col-span-1 text-right text-sm font-semibold">
                    <span
                      className={
                        isExpense ? "text-rose-300" : "text-emerald-300"
                      }
                    >
                      {isExpense ? "-" : "+"}{" "}
                      {formatEURFromCents(t.amount_cents)}
                    </span>
                  </div>

                  <div className="col-span-12 mt-2 hidden items-center justify-end gap-2 group-hover:flex">
                    <button
                      onClick={() => setEditingTx(t)}
                      className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10"
                    >
                      Bearbeiten
                    </button>

                    {!t.is_archived ? (
                      <button
                        onClick={() => onArchive(t.id)}
                        className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10"
                      >
                        Archivieren
                      </button>
                    ) : (
                      <button
                        onClick={() => void restoreTransaction(t.id)}
                        className="h-9 rounded-xl bg-white/85 px-3 text-sm font-semibold text-black hover:bg-white"
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
