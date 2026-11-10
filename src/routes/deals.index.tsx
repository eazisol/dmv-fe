import { createFileRoute } from "@tanstack/react-router";
import { DealsListPage } from "@/components/deals/DealsListPage";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/deals/")({
  head: () => ({ meta: [{ title: pageTitle("Deals") }] }),
  component: DealsListPage,
});
