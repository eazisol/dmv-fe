import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { ManageFormsLayoutProvider } from "@/components/manage-forms/manage-forms-layout";
import { RolesColumn } from "@/components/roles/RolesColumn";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: pageTitle("Roles") }] }),
  component: RolesPage,
});

function RolesPage() {
  return (
    <div className="flex flex-col">
      <PageHeader title="Roles" />
      <ManageFormsLayoutProvider layout="split">
        <RolesColumn />
      </ManageFormsLayoutProvider>
    </div>
  );
}
