"use client";

import * as React from "react";
import { FeeStatusBadge } from "@/components/members/FeeStatusBadge";
import { FeeRow } from "@/components/members/FeeRow";
import { NewInvoiceModal, type NewInvoicePayload } from "@/components/members/NewInvoiceModal";
import type { MembershipFeeInterval, MembershipFeeInvoice, MembershipFeeRule } from "@/lib/membership-fees/types";
import { deriveMembershipFeeSummary } from "@/lib/membership-fees/status";

type FeesApiData = {
  rule: MembershipFeeRule | null;
  invoices: MembershipFeeInvoice[];
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function asInterval(value: string): MembershipFeeInterval {
  if (value === "QUARTERLY" || value === "YEARLY") return value;
  return "MONTHLY";
}

export function FeesTab({ memberId, canWrite }: { memberId: string; canWrite: boolean }) {
  const [loading, setLoading] = React.useState(true);
  const [savingRule, setSavingRule] = React.useState(false);
  const [savingInvoice, setSavingInvoice] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<FeesApiData>({ rule: null, invoices: [] });
  const [newInvoiceOpen, setNewInvoiceOpen] = React.useState(false);

  const [ruleAmountEuro, setRuleAmountEuro] = React.useState("");
  const [ruleInterval, setRuleInterval] = React.useState<MembershipFeeInterval>("MONTHLY");
  const [ruleDueDay, setRuleDueDay] = React.useState("1");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${memberId}/fees`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === "string" ? json.error : `Laden fehlgeschlagen (${res.status}).`);
        setData({ rule: null, invoices: [] });
        return;
      }
      const payload = json.data as FeesApiData;
      setData({
        rule: payload?.rule ?? null,
        invoices: Array.isArray(payload?.invoices) ? payload.invoices : [],
      });
    } catch {
      setError("Beiträge konnten nicht geladen werden.");
      setData({ rule: null, invoices: [] });
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!data.rule) {
      setRuleAmountEuro("");
      setRuleInterval("MONTHLY");
      setRuleDueDay("1");
      return;
    }
    setRuleAmountEuro((data.rule.amount_cents / 100).toFixed(2).replace(".", ","));
    setRuleInterval(data.rule.interval);
    setRuleDueDay(String(data.rule.due_day));
  }, [data.rule]);

  const summary = React.useMemo(() => deriveMembershipFeeSummary(data.invoices), [data.invoices]);

  async function saveRule() {
    const amountNumber = Number(ruleAmountEuro.replace(",", "."));
    const amountCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : 0;
    const dueDay = Number(ruleDueDay);
    if (amountCents <= 0 || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      setError("Regel ungültig. Betrag > 0 und Fälligkeitstag 1-31 erforderlich.");
      return;
    }

    setSavingRule(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${memberId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: amountCents,
          interval: ruleInterval,
          due_day: dueDay,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === "string" ? json.error : `Speichern fehlgeschlagen (${res.status}).`);
        return;
      }
      await load();
    } finally {
      setSavingRule(false);
    }
  }

  async function createInvoice(payload: NewInvoicePayload) {
    setSavingInvoice(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${memberId}/fees/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === "string" ? json.error : `Erstellen fehlgeschlagen (${res.status}).`);
        return;
      }
      setNewInvoiceOpen(false);
      await load();
    } finally {
      setSavingInvoice(false);
    }
  }

  async function markPaid(invoice: MembershipFeeInvoice) {
    setSavingInvoice(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${memberId}/fees/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_at: new Date().toISOString() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === "string" ? json.error : `Update fehlgeschlagen (${res.status}).`);
        return;
      }
      await load();
    } finally {
      setSavingInvoice(false);
    }
  }

  if (loading) {
    return <div className="ui-card p-5 text-sm ui-muted">Beiträge werden geladen…</div>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="ui-card p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Beitragsstatus</h3>
            <p className="text-sm ui-muted">
              Offen: <span className="tabular-nums">{formatEuro(summary.openAmountCents)}</span> (
              {summary.openCount} Rechnung{summary.openCount === 1 ? "" : "en"})
            </p>
          </div>
          <FeeStatusBadge
            kind="summary"
            status={summary.status}
            title={`Offene Summe: ${formatEuro(summary.openAmountCents)}`}
          />
        </div>
      </div>

      <div className="ui-card p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Gebührenregel</h3>
          {!canWrite ? <span className="text-xs ui-muted">Nur lesend</span> : null}
        </div>
        {data.rule ? (
          <p className="mt-1 text-sm ui-muted">
            Aktuell: {formatEuro(data.rule.amount_cents)} / {data.rule.interval} am Tag {data.rule.due_day}
          </p>
        ) : (
          <p className="mt-1 text-sm ui-muted">Noch keine Regel hinterlegt.</p>
        )}

        {canWrite ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              className="ui-input md:col-span-2"
              inputMode="decimal"
              placeholder="Betrag in EUR"
              value={ruleAmountEuro}
              onChange={(e) => setRuleAmountEuro(e.target.value)}
            />
            <select
              className="ui-input"
              value={ruleInterval}
              onChange={(e) => setRuleInterval(asInterval(e.target.value))}
            >
              <option value="MONTHLY">Monatlich</option>
              <option value="QUARTERLY">Quartalsweise</option>
              <option value="YEARLY">Jährlich</option>
            </select>
            <input
              className="ui-input"
              type="number"
              min={1}
              max={31}
              value={ruleDueDay}
              onChange={(e) => setRuleDueDay(e.target.value)}
            />
            <div className="md:col-span-4">
              <button
                type="button"
                disabled={savingRule}
                onClick={() => void saveRule()}
                className="ui-btn h-10 px-3 text-sm disabled:opacity-60"
              >
                {savingRule ? "Speichert…" : "Regel speichern"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="ui-card p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Rechnungen</h3>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setNewInvoiceOpen(true)}
              className="ui-btn ui-btn-primary h-9 px-3 text-sm"
            >
              Neue Rechnung erstellen
            </button>
          ) : null}
        </div>

        {data.invoices.length === 0 ? (
          <div className="text-sm ui-muted">Noch keine Rechnungen vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]/70 text-left ui-muted">
                  <th className="px-3 py-2 font-medium">Fällig</th>
                  <th className="px-3 py-2 font-medium">Betrag</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Bezahlt am</th>
                  <th className="px-3 py-2 font-medium text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <FeeRow
                    key={invoice.id}
                    invoice={invoice}
                    canWrite={canWrite}
                    loading={savingInvoice}
                    onMarkPaid={markPaid}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewInvoiceModal
        open={newInvoiceOpen}
        onClose={() => setNewInvoiceOpen(false)}
        onSubmit={createInvoice}
        loading={savingInvoice}
      />
    </div>
  );
}
