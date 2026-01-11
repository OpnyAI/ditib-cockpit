// src/components/finance/FinanceHeader.tsx
"use client";

import * as React from "react";

export function FinanceHeader({
  monthIndex0,
  year,
  monthOptions,
  yearOptions,
  refreshing,
  exportDisabled,
  showArchived,
  onChangeMonth,
  onChangeYear,
  onRefresh,
  onExportCsv,
  onCreate,
  onToggleArchived,
}: {
  monthIndex0: number;
  year: number;
  monthOptions: { value: number; label: string }[];
  yearOptions: number[];
  refreshing: boolean;
  exportDisabled: boolean;
  showArchived: boolean;
  onChangeMonth: (v: number) => void;
  onChangeYear: (v: number) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onCreate: () => void;
  onToggleArchived: (v: boolean) => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <div className="text-lg font-semibold text-white/90">Finanzen</div>
        </div>

        {/* Desktop controls */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            Monat
          </div>

          <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={monthIndex0}
              onChange={(e) => onChangeMonth(Number(e.target.value))}
              className="h-10 bg-transparent text-sm text-white/85 outline-none"
              aria-label="Monat wählen"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="h-5 w-px bg-white/10" />

            <select
              value={year}
              onChange={(e) => onChangeYear(Number(e.target.value))}
              className="h-10 bg-transparent text-sm text-white/85 outline-none"
              aria-label="Jahr wählen"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
          >
            {refreshing ? "..." : "Refresh"}
          </button>

          <button
            onClick={onExportCsv}
            disabled={exportDisabled}
            title={
              exportDisabled
                ? "Keine Buchungen im Monat zum Export."
                : showArchived
                ? "CSV Export (aktueller Monat, inkl. Archiv)."
                : "CSV Export (aktueller Monat, ohne Archiv)."
            }
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            CSV Export
          </button>

          <button
            onClick={onCreate}
            className="h-10 rounded-xl bg-white/85 px-3 text-sm font-medium text-black hover:bg-white active:bg-white/90"
          >
            + Buchung
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Monat
            </div>

            <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
              <select
                value={monthIndex0}
                onChange={(e) => onChangeMonth(Number(e.target.value))}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white/85 outline-none"
                aria-label="Monat wählen"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="h-5 w-px bg-white/10" />

              <select
                value={year}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="h-10 bg-transparent text-sm text-white/85 outline-none"
                aria-label="Jahr wählen"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={onRefresh}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15"
            >
              {refreshing ? "..." : "Refresh"}
            </button>

            <button
              onClick={onExportCsv}
              disabled={exportDisabled}
              title={
                exportDisabled
                  ? "Keine Buchungen im Monat zum Export."
                  : showArchived
                  ? "CSV Export (aktueller Monat, inkl. Archiv)."
                  : "CSV Export (aktueller Monat, ohne Archiv)."
              }
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              CSV Export
            </button>

            <button
              onClick={onCreate}
              className="col-span-2 h-11 rounded-xl bg-white/85 px-3 text-sm font-semibold text-black hover:bg-white active:bg-white/90"
            >
              + Buchung
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleArchived(e.target.checked)}
            className="h-4 w-4 accent-white"
          />
          Archiv anzeigen
        </label>
      </div>
    </div>
  );
}
