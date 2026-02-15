"use client";

import * as React from "react";

type ImportError = {
  row: number;
  error: string;
};

type ImportResult = {
  importedCount: number;
  errors: ImportError[];
};

export function CSVImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => Promise<void> | void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setUploading(false);
      setFatalError(null);
      setResult(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    if (!file) {
      setFatalError("Bitte eine CSV-Datei auswählen.");
      return;
    }

    setUploading(true);
    setFatalError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/members/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setFatalError(
          typeof json?.error === "string"
            ? json.error
            : `Import fehlgeschlagen (${res.status}).`
        );
        return;
      }

      const parsed: ImportResult = {
        importedCount:
          typeof json?.importedCount === "number" ? json.importedCount : 0,
        errors: Array.isArray(json?.errors)
          ? (json.errors as ImportError[])
          : [],
      };

      setResult(parsed);
      await onImported();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="ui-backdrop"
        onClick={onClose}
        aria-label="CSV-Import schließen"
      />

      <div className="absolute inset-0 flex items-end justify-center p-0 md:items-center md:p-4">
        <div className="ui-card ui-sheet-in w-full rounded-t-2xl p-4 md:max-w-2xl md:rounded-2xl md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Mitglieder per CSV importieren</h2>
              <p className="text-sm ui-muted">
                Erwartete Spalten: full_name,function_title,email,phone,notes,is_active
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ui-btn h-9 w-9 p-0"
              disabled={uploading}
            >
              ×
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="ui-input h-11 file:mr-3 file:rounded-lg file:border file:border-[rgb(var(--border))] file:bg-[rgb(var(--surface-2))] file:px-3 file:py-1 file:text-sm"
            />

            {fatalError ? (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {fatalError}
              </div>
            ) : null}

            {result ? (
              <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/40 p-3 text-sm">
                <div>
                  Erfolgreich importiert: <span className="font-semibold">{result.importedCount}</span>
                </div>

                {result.errors.length > 0 ? (
                  <div className="space-y-1">
                    <div className="font-medium text-red-700 dark:text-red-300">
                      Fehler ({result.errors.length})
                    </div>
                    <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2">
                      {result.errors.map((err, idx) => (
                        <div key={`${err.row}-${idx}`} className="text-xs">
                          Zeile {err.row}: {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-emerald-700 dark:text-emerald-300">Keine Fehler.</div>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-btn h-10 px-3 text-sm"
              disabled={uploading}
            >
              Schließen
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              className="ui-btn ui-btn-primary h-10 px-4 text-sm disabled:opacity-60"
              disabled={uploading}
            >
              {uploading ? "Import läuft…" : "Import starten"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
