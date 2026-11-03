import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { BrandingColumn } from "@/components/manage-forms/BrandingColumn";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/branding")({
  head: () => ({ meta: [{ title: pageTitle("Branding") }] }),
  component: BrandingPage,
});

function BrandingPage() {
  return (
    <div>
      <PageHeader title="Branding" />
      <BrandingColumn />
    </div>
  );
}
