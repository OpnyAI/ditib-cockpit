// src/components/finance/EditTransactionModal.tsx
"use client";

import * as React from "react";
import type { Account, Category, Transaction, TxType } from "./finance.types";
import { formatEURFromCents } from "./finance.utils";

function toAmountCentsFromInput(input: string): number | null {
  const raw = input.replace(",", ".").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (!Number.isInteger(cents) || cents <= 0) return null;
  return cents;
}

function toInputFromCents(cents: number): string {
  const v = (cents / 100).toFixed(2);
  return v.replace(".", ",");
}

export function EditTransactionModal({
  tx,
  accounts,
  categories,
  accountNameById,
  categoryNameById,
  onClose,
  onSaved,
}: {
  tx: Transaction;
  accounts: Account[];
  categories: Category[];
  accountNameById: Map<string, string>;
  categoryNameById: Map<string, string>;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [type, setType] = React.useState<TxType>(tx.type);
  const [bookingDate, setBookingDate] = React.useState(tx.booking_date);
  const [amount, setAmount] = React.useState<string>(
    toInputFromCents(tx.amount_cents)
  );

  const [accountId, setAccountId] = React.useState(tx.account_id);
  const [categoryId, setCategoryId] = React.useState<string>(
    tx.category_id ?? ""
  ); // "" = none

  const [counterparty, setCounterparty] = React.useState(tx.counterparty ?? "");
  const [memo, setMemo] = React.useState(tx.memo ?? "");
  const [reference, setReference] = React.useState(tx.reference ?? "");

  const isArchived = Boolean(tx.is_archived);

  const filteredCategories = React.useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  const currentAccountLabel =
    accountNameById.get(tx.account_id) ??
    accountNameById.get(accountId) ??
    "Konto";

  const currentCategoryLabel =
    (tx.category_id ? categoryNameById.get(tx.category_id) : null) ??
    (categoryId ? categoryNameById.get(categoryId) : null) ??
    "Kategorie";

  async function save() {
    setError(null);

    const amountCents = toAmountCentsFromInput(amount);
    if (!amountCents) {
      setError("Bitte einen gültigen Betrag eingeben (z. B. 12,34).");
      return;
    }
    if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      setError("Bitte ein gültiges Datum wählen.");
      return;
    }
    if (!accountId) {
      setError("Bitte ein Konto wählen.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/finance/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          bookingDate,
          amountCents,
          accountId,
          categoryId: categoryId ? categoryId : null,
          counterparty: counterparty.trim() ? counterparty.trim() : null,
          memo: memo.trim() ? memo.trim() : null,
          reference: reference.trim() ? reference.trim() : null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          typeof json?.error === "string"
            ? json.error
            : `Speichern fehlgeschlagen (${res.status})`;
        setError(msg);
        return;
      }

      await onSaved();
    } catch (e) {
      console.error(e);
      setError("Speichern fehlgeschlagen (Network).");
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/finance/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          typeof json?.error === "string"
            ? json.error
            : `Restore fehlgeschlagen (${res.status})`;
        setError(msg);
        return;
      }

      await onSaved();
    } catch (e) {
      console.error(e);
      setError("Restore fehlgeschlagen (Network).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Modal schließen"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[520px] rounded-3xl border border-white/10 bg-[#0b1220]/90 p-4 shadow-[0_18px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-white/90">
              Buchung bearbeiten
            </div>
            <div className="mt-0.5 text-xs text-white/55">
              {tx.booking_date} •{" "}
              {tx.type === "EXPENSE" ? "Ausgabe" : "Einnahme"} •{" "}
              {formatEURFromCents(tx.amount_cents)}
              {isArchived ? " • Archiviert" : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TxType)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            disabled={saving}
          >
            <option value="EXPENSE">Ausgabe</option>
            <option value="INCOME">Einnahme</option>
          </select>

          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            disabled={saving}
          />

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Betrag (z. B. 12,34)"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            disabled={saving}
          />

          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            disabled={saving}
          >
            <option value="">{currentAccountLabel}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20 sm:col-span-2"
            disabled={saving}
          >
            <option value="">{currentCategoryLabel} (optional)</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="Gegenpartei (optional)"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20 sm:col-span-2"
            disabled={saving}
          />

          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Referenz (optional)"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            disabled={saving}
          />

          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Notiz (optional)"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
            disabled={saving}
          />
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-white/45">ID: {tx.id}</div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {isArchived ? (
              <button
                type="button"
                onClick={() => void restore()}
                disabled={saving}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                {saving ? "..." : "Restore"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="h-11 rounded-xl bg-white/85 px-4 text-sm font-semibold text-black hover:bg-white disabled:opacity-50"
            >
              {saving ? "..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
