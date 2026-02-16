"use client";

import * as React from "react";
import type {
  MembershipFeeInvoiceStatus,
  MembershipFeeSummaryStatus,
} from "@/lib/membership-fees/types";

type Props =
  | {
      kind: "summary";
      status: MembershipFeeSummaryStatus;
      title?: string;
    }
  | {
      kind: "invoice";
      status: MembershipFeeInvoiceStatus;
      title?: string;
    };

function classForStatus(status: string) {
  if (status === "ALL_PAID" || status === "PAID") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "PARTIAL_OPEN" || status === "PARTIAL") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (status === "OVERDUE_OPEN" || status === "OVERDUE") {
    return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  return "border-[rgb(var(--border))] ui-muted";
}

function summaryLabel(status: MembershipFeeSummaryStatus) {
  if (status === "ALL_PAID") return "Alles bezahlt";
  if (status === "PARTIAL_OPEN") return "Teilweise offen";
  if (status === "OVERDUE_OPEN") return "Überfällig offen";
  return "Unbekannt";
}

function invoiceLabel(status: MembershipFeeInvoiceStatus) {
  if (status === "OPEN") return "Offen";
  if (status === "PAID") return "Bezahlt";
  if (status === "PARTIAL") return "Teilweise bezahlt";
  return "Überfällig";
}

export function FeeStatusBadge(props: Props) {
  const text = props.kind === "summary" ? summaryLabel(props.status) : invoiceLabel(props.status);
  const marker =
    props.kind === "summary"
      ? props.status === "ALL_PAID"
        ? "🟢"
        : props.status === "PARTIAL_OPEN"
          ? "🟡"
          : props.status === "OVERDUE_OPEN"
            ? "🔴"
            : "⚪"
      : undefined;

  return (
    <span
      className={[
        "ui-badge",
        classForStatus(props.status),
      ].join(" ")}
      title={props.title}
    >
      {marker ? <span aria-hidden>{marker}</span> : null}
      <span>{text}</span>
    </span>
  );
}
