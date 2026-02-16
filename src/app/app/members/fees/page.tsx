import MembersFeesOverviewClient from "@/components/members/MembersFeesOverviewClient";

export default function MembersFeesOverviewPage() {
  return (
    <div className="space-y-4">
      <div className="ui-card p-4 md:p-5">
        <h1 className="text-xl font-semibold">Beiträge Übersicht</h1>
        <p className="mt-1 text-sm ui-muted">
          Offene Mitgliedsbeiträge je Mitglied auf Basis der aktuellen
          Rechnungsstände.
        </p>
      </div>

      <MembersFeesOverviewClient />
    </div>
  );
}
