"use client";

import * as React from "react";

export type NewInvoicePayload = {
  due_date: string;
  amount_cents: number;
};

function toCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

export function NewInvoiceModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: NewInvoicePayload) => Promise<void>;
  loading?: boolean;
}) {
  const [dueDate, setDueDate] = React.useState("");
  const [amountEuro, setAmountEuro] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setDueDate("");
      setAmountEuro("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    setError(null);
    if (!dueDate) {
      setError("Fälligkeitsdatum fehlt.");
      return;
    }
    const cents = toCents(amountEuro);
    if (!cents) {
      setError("Betrag ist ungültig.");
      return;
    }
    await onSubmit({ due_date: dueDate, amount_cents: cents });
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="ui-backdrop" onClick={onClose} aria-label="Schließen" />
      <div className="absolute inset-0 flex items-end justify-center p-0 md:items-center md:p-4">
        <div className="ui-card ui-sheet-in w-full rounded-t-2xl p-4 md:max-w-md md:rounded-2xl md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Neue Rechnung erstellen</h3>
              <p className="text-sm ui-muted">Bitte Fälligkeit und Betrag eintragen.</p>
            </div>
            <button type="button" onClick={onClose} className="ui-btn h-9 w-9 p-0">
              ×
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs ui-muted">Fällig am</label>
              <input
                type="date"
                className="ui-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs ui-muted">Betrag (EUR)</label>
              <input
                className="ui-input"
                inputMode="decimal"
                placeholder="z.B. 25,00"
                value={amountEuro}
                onChange={(e) => setAmountEuro(e.target.value)}
              />
            </div>
            {error ? (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="ui-btn h-10 px-3 text-sm" onClick={onClose}>
              Abbrechen
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="ui-btn ui-btn-primary h-10 px-3 text-sm disabled:opacity-60"
            >
              {loading ? "Speichert…" : "Rechnung erstellen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
