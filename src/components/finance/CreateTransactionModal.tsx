// src/components/finance/CreateTransactionModal.tsx
"use client";

import * as React from "react";
import type { Account, Category, TxType } from "./finance.types";
import { clampCentsFromEuroInput } from "./finance.utils";

export function CreateTransactionModal({
  monthKey,
  accounts,
  categories,
  onClose,
  onCreated,
}: {
  monthKey: string; // "YYYY-MM"
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const todayISO = React.useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const defaultDate = React.useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    if (currentMonthKey === monthKey) return todayISO;
    return `${monthKey}-01`;
  }, [monthKey, todayISO]);

  const [type, setType] = React.useState<TxType>("EXPENSE");
  const [bookingDate, setBookingDate] = React.useState(defaultDate);
  const [amountEuro, setAmountEuro] = React.useState("");
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = React.useState("");
  const [counterparty, setCounterparty] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [reference, setReference] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filteredCategories = React.useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  React.useEffect(() => {
    if (filteredCategories.length > 0) {
      setCategoryId((prev) =>
        filteredCategories.some((c) => c.id === prev)
          ? prev
          : filteredCategories[0].id
      );
    } else {
      setCategoryId("");
    }
  }, [filteredCategories]);

  async function submit() {
    setError(null);

    const cents = clampCentsFromEuroInput(amountEuro);
    if (!cents) {
      setError("Bitte einen gültigen Betrag eingeben (z.B. 12,34).");
      return;
    }
    if (!bookingDate || bookingDate.length !== 10) {
      setError("Bitte ein gültiges Buchungsdatum wählen.");
      return;
    }
    if (!accountId) {
      setError("Bitte ein Konto auswählen.");
      return;
    }
    if (!categoryId) {
      setError("Bitte eine Kategorie auswählen.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string | number | null> = {
        type,
        booking_date: bookingDate,
        bookingDate,
        amount_cents: cents,
        amountCents: cents,
        account_id: accountId,
        accountId,
        category_id: categoryId,
        categoryId,
        counterparty: counterparty.trim() || null,
        memo: memo.trim() || null,
        reference: reference.trim() || null,
      };

      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ? String(json.error) : `Fehler (${res.status})`);
        return;
      }

      await onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="absolute inset-0 flex items-end md:items-center md:justify-center">
        <div
          className={[
            "relative w-full md:w-[720px] md:max-w-[720px] md:rounded-3xl",
            "rounded-t-3xl md:rounded-3xl",
            "border border-white/12 bg-[#0b1220] shadow-[0_18px_80px_rgba(0,0,0,0.65)]",
            "max-h-[88svh] md:max-h-[85vh]",
            "overflow-hidden",
            "flex flex-col",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1220] px-4 pt-3 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold text-white/90">
                  Neue Buchung
                </div>
                <div className="mt-0.5 text-xs text-white/55">
                  Schnell erfassen – sauber genug für späteres Audit.
                </div>
              </div>

              <button
                onClick={onClose}
                className="h-10 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/75 hover:bg-white/10 active:bg-white/15"
              >
                Schließen
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-white/55">Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TxType)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                >
                  <option value="EXPENSE">Ausgabe</option>
                  <option value="INCOME">Einnahme</option>
                </select>
              </div>

              <div className="space-y-1 overflow-hidden">
                <label className="text-xs text-white/55">Buchungsdatum</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="h-11 w-full max-w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/55">Betrag (€)</label>
                <input
                  inputMode="decimal"
                  placeholder="z.B. 12,34"
                  value={amountEuro}
                  onChange={(e) => setAmountEuro(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/55">Konto</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                >
                  <option value="" disabled>
                    Konto wählen…
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-white/55">Kategorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                >
                  <option value="" disabled>
                    Kategorie wählen…
                  </option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/55">Gegenpartei</label>
                <input
                  placeholder="z.B. Bäcker"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/55">Referenz</label>
                <input
                  placeholder="z.B. BELEG-003"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/85 outline-none focus:border-white/20"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-white/55">Notiz</label>
                <textarea
                  rows={4}
                  placeholder="z.B. Test Brezeln"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-white/10 bg-[#0b1220]/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/75 hover:bg-white/10 active:bg-white/15"
              >
                Abbrechen
              </button>
              <button
                onClick={() => void submit()}
                disabled={saving}
                className="h-11 rounded-xl bg-white/90 px-5 text-sm font-semibold text-black hover:bg-white disabled:opacity-60"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15 md:hidden" />
        </div>
      </div>
    </div>
  );
}
