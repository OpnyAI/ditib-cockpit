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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className="text-xs font-medium text-white/55">Einnahmen</div>
        <div className="mt-1 text-3xl font-semibold text-emerald-300">
          {formatEURFromCents(incomeCents)}
        </div>
        <div className="mt-1 text-sm text-white/45">
          {monthLabelDE(year, monthIndex0)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className="text-xs font-medium text-white/55">Ausgaben</div>
        <div className="mt-1 text-3xl font-semibold text-rose-300">
          {formatEURFromCents(expenseCents)}
        </div>
        <div className="mt-1 text-sm text-white/45">
          {monthLabelDE(year, monthIndex0)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className="text-xs font-medium text-white/55">Saldo</div>
        <div className="mt-1 text-3xl font-semibold text-white/90">
          {formatEURFromCents(saldoCents)}
        </div>
        <div className="mt-1 text-sm text-white/45">Einnahmen – Ausgaben</div>
      </div>
    </div>
  );
}
