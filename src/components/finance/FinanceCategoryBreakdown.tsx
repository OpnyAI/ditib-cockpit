// src/components/finance/FinanceCategoryBreakdown.tsx
"use client";

import * as React from "react";
import { formatEURFromCents } from "./finance.utils";

export function FinanceCategoryBreakdown({
  monthExpenseCount,
  expenseByCategory,
  expenseCents,
}: {
  monthExpenseCount: number;
  expenseByCategory: { categoryId: string; name: string; cents: number }[];
  expenseCents: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white/90">
            Ausgaben nach Kategorie
          </div>
          <div className="text-xs text-white/50">
            Fokus auf die größten Kostentreiber im gewählten Monat.
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          {monthExpenseCount} Buchungen
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {expenseByCategory.length === 0 ? (
          <div className="text-sm text-white/55">Keine Ausgaben im Monat.</div>
        ) : (
          expenseByCategory.slice(0, 6).map((row) => {
            const pct =
              expenseCents > 0
                ? Math.min(100, Math.round((row.cents / expenseCents) * 100))
                : 0;

            return (
              <div key={row.categoryId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/80">{row.name}</div>
                  <div className="text-sm font-medium text-white/85">
                    {formatEURFromCents(row.cents)}
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-white/25"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
