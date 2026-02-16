"use client";

import * as React from "react";
import { FeeStatusBadge } from "@/components/members/FeeStatusBadge";
import type { MembershipFeeSummary, MembershipFeeSummaryStatus } from "@/lib/membership-fees/types";

type Member = {
  id: string;
  full_name: string;
};

type SummaryRow = {
  member_id: string;
  status: MembershipFeeSummaryStatus;
  openAmountCents: number;
  openCount: number;
};

function toEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function MembersFeesOverviewClient() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Array<{ member: Member; summary: MembershipFeeSummary }>>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [membersRes, summariesRes] = await Promise.all([
          fetch("/api/members?active=1", { cache: "no-store" }),
          fetch("/api/members/fees/summaries", { cache: "no-store" }),
        ]);

        const membersJson = await membersRes.json().catch(() => null);
        const summariesJson = await summariesRes.json().catch(() => null);

        if (!membersRes.ok) {
          throw new Error(
            typeof membersJson?.error === "string"
              ? membersJson.error
              : "Mitglieder konnten nicht geladen werden.",
          );
        }
        if (!summariesRes.ok || !summariesJson?.ok) {
          throw new Error(
            typeof summariesJson?.error === "string"
              ? summariesJson.error
              : "Beitragsdaten konnten nicht geladen werden.",
          );
        }

        const members = Array.isArray(membersJson?.members)
          ? (membersJson.members as Array<{ id: string; full_name: string }>)
          : [];
        const summaries = Array.isArray(summariesJson?.data?.summaries)
          ? (summariesJson.data.summaries as SummaryRow[])
          : [];

        const summaryMap = new Map<string, MembershipFeeSummary>(
          summaries.map((summary) => [
            summary.member_id,
            {
              status: summary.status,
              openAmountCents: Number(summary.openAmountCents) || 0,
              openCount: Number(summary.openCount) || 0,
            },
          ]),
        );

        const merged = members.map((member) => ({
          member: { id: member.id, full_name: member.full_name },
          summary: summaryMap.get(member.id) ?? {
            status: "UNKNOWN",
            openAmountCents: 0,
            openCount: 0,
          },
        }));

        if (!cancelled) setRows(merged);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unbekannter Fehler");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="ui-card p-5 text-sm ui-muted">Lade Beitragsübersicht…</div>;
  }

  if (error) {
    return (
      <div className="ui-card p-5">
        <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="ui-card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[rgb(var(--border))]/70 text-left ui-muted">
            <th className="px-4 py-3 font-medium">Mitglied</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Offene Summe</th>
            <th className="px-4 py-3 font-medium">Offene Anzahl</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.member.id} className="border-b border-[rgb(var(--border))]/40 last:border-0">
              <td className="px-4 py-3 font-medium">{row.member.full_name}</td>
              <td className="px-4 py-3">
                <FeeStatusBadge kind="summary" status={row.summary.status} />
              </td>
              <td className="px-4 py-3 tabular-nums">
                {toEuro(row.summary.openAmountCents)}
              </td>
              <td className="px-4 py-3 tabular-nums">{row.summary.openCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
