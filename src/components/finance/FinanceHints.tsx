// src/components/finance/FinanceHints.tsx
"use client";

import * as React from "react";
import type { UiHint } from "./finance.types";
import { monthLabelDE } from "./finance.utils";

export function FinanceHints({
  uiHints,
  year,
  monthIndex0,
}: {
  uiHints: UiHint[];
  year: number;
  monthIndex0: number;
}) {
  return (
    <div className="ui-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Hinweise</div>
          <div className="mt-1 text-xs ui-muted">
            Automatisch – regelbasiert, ohne KI.
          </div>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 py-1 text-xs ui-muted">
          {uiHints.length} aktiv
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {uiHints.length === 0 ? (
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 py-3 text-sm">
            Sieht sauber aus – keine Hinweise für{" "}
            <span className="font-medium">
              {monthLabelDE(year, monthIndex0)}
            </span>
            .
          </div>
        ) : (
          uiHints.map((h) => {
            const toneCls =
              h.tone === "warn"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200"
                : h.tone === "info"
                ? "border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55";

            const titleCls =
              h.tone === "warn" ? "text-rose-700 dark:text-rose-200" : "";

            return (
              <div
                key={h.id}
                className={`rounded-xl border px-3 py-3 text-sm ${toneCls}`}
              >
                <div className={`text-sm font-medium ${titleCls}`}>
                  {h.title}
                </div>
                <div className="mt-1 text-xs ui-muted">{h.body}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/65 p-3 text-xs ui-muted">
        Tipp: Die Buchungen-Liste unten ist deine Arbeitsfläche (Suchen /
        Filtern / Archivieren).
      </div>
    </div>
  );
}
