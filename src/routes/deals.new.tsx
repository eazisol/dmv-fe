import { createFileRoute } from "@tanstack/react-router";
import { DealCreatePage } from "@/components/deals/DealCreatePage";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/deals/new")({
  head: () => ({ meta: [{ title: pageTitle("Create Deal") }] }),
  component: DealCreatePage,
});
