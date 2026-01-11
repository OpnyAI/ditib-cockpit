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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">Hinweise</div>
          <div className="mt-1 text-xs text-white/55">
            Automatisch – regelbasiert, ohne KI.
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          {uiHints.length} aktiv
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {uiHints.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-white/70">
            Sieht sauber aus – keine Hinweise für{" "}
            <span className="text-white/85">
              {monthLabelDE(year, monthIndex0)}
            </span>
            .
          </div>
        ) : (
          uiHints.map((h) => {
            const toneCls =
              h.tone === "warn"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                : h.tone === "info"
                ? "border-white/10 bg-black/10 text-white/80"
                : "border-white/10 bg-white/5 text-white/80";

            const titleCls =
              h.tone === "warn" ? "text-rose-100" : "text-white/85";

            return (
              <div
                key={h.id}
                className={`rounded-xl border px-3 py-3 text-sm ${toneCls}`}
              >
                <div className={`text-sm font-medium ${titleCls}`}>
                  {h.title}
                </div>
                <div className="mt-1 text-xs text-white/65">{h.body}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3 text-xs text-white/60">
        Tipp: Die Buchungen-Liste unten ist deine Arbeitsfläche (Suchen /
        Filtern / Archivieren).
      </div>
    </div>
  );
}
