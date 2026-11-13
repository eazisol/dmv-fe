import { createFileRoute } from "@tanstack/react-router";
import { ScansListPage } from "@/components/scans/ScansListPage";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/scans/")({
  head: () => ({ meta: [{ title: pageTitle("Scans") }] }),
  component: ScansListPage,
});
