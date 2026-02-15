// src/components/finance/FinanceKpis.tsx
"use client";

import * as React from "react";
import { formatEURFromCents, monthLabelDE } from "./finance.utils";

export function FinanceKpis({
  incomeCents,
  expenseCents,
  saldoCents,
  year,
  monthIndex0,
}: {
  incomeCents: number;
  expenseCents: number;
  saldoCents: number;
  year: number;
  monthIndex0: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="ui-card p-5">
        <div className="text-xs font-medium ui-muted">Einnahmen</div>
        <div className="mt-1 text-3xl font-semibold text-emerald-600 dark:text-emerald-300">
          {formatEURFromCents(incomeCents)}
        </div>
        <div className="mt-1 text-sm ui-muted">
          {monthLabelDE(year, monthIndex0)}
        </div>
      </div>

      <div className="ui-card p-5">
        <div className="text-xs font-medium ui-muted">Ausgaben</div>
        <div className="mt-1 text-3xl font-semibold text-rose-600 dark:text-rose-300">
          {formatEURFromCents(expenseCents)}
        </div>
        <div className="mt-1 text-sm ui-muted">
          {monthLabelDE(year, monthIndex0)}
        </div>
      </div>

      <div className="ui-card p-5">
        <div className="text-xs font-medium ui-muted">Saldo</div>
        <div className="mt-1 text-3xl font-semibold">
          {formatEURFromCents(saldoCents)}
        </div>
        <div className="mt-1 text-sm ui-muted">Einnahmen – Ausgaben</div>
      </div>
    </div>
  );
}
