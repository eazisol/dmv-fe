import { createFileRoute } from "@tanstack/react-router";
import { ScanDetailPage } from "@/components/scans/ScanDetailPage";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/scans/$id")({
  head: () => ({ meta: [{ title: pageTitle("Scan") }] }),
  component: ScanDetailPage,
});
