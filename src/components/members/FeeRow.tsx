"use client";

import * as React from "react";
import { FeeStatusBadge } from "@/components/members/FeeStatusBadge";
import type { MembershipFeeInvoice } from "@/lib/membership-fees/types";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString("de-DE");
}

export function FeeRow({
  invoice,
  canWrite,
  onMarkPaid,
  loading,
}: {
  invoice: MembershipFeeInvoice;
  canWrite: boolean;
  onMarkPaid: (invoice: MembershipFeeInvoice) => Promise<void>;
  loading?: boolean;
}) {
  const isOpen = invoice.status === "OPEN" || invoice.status === "PARTIAL" || invoice.status === "OVERDUE";

  return (
    <tr className="border-b border-[rgb(var(--border))]/40 last:border-0">
      <td className="px-3 py-2">{formatDate(invoice.due_date)}</td>
      <td className="px-3 py-2 tabular-nums">{formatEuro(invoice.amount_cents)}</td>
      <td className="px-3 py-2">
        <FeeStatusBadge kind="invoice" status={invoice.status} />
      </td>
      <td className="px-3 py-2 ui-muted">{formatDate(invoice.paid_at)}</td>
      <td className="px-3 py-2 text-right">
        {canWrite && isOpen ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void onMarkPaid(invoice)}
            className="ui-btn h-8 px-2 text-xs disabled:opacity-60"
          >
            Als bezahlt markieren
          </button>
        ) : (
          <span className="text-xs ui-muted">-</span>
        )}
      </td>
    </tr>
  );
}
