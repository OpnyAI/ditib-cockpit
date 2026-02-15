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
    <div className="ui-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Ausgaben nach Kategorie</div>
          <div className="text-xs ui-muted">
            Fokus auf die größten Kostentreiber im gewählten Monat.
          </div>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 py-1 text-xs ui-muted">
          {monthExpenseCount} Buchungen
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {expenseByCategory.length === 0 ? (
          <div className="text-sm ui-muted">Keine Ausgaben im Monat.</div>
        ) : (
          expenseByCategory.slice(0, 6).map((row) => {
            const pct =
              expenseCents > 0
                ? Math.min(100, Math.round((row.cents / expenseCents) * 100))
                : 0;

            return (
              <div key={row.categoryId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">{row.name}</div>
                  <div className="text-sm font-medium">
                    {formatEURFromCents(row.cents)}
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-[rgb(var(--surface-2))]">
                  <div
                    className="h-2 rounded-full bg-[rgb(var(--muted))]/45"
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
