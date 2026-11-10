import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DealDetailPage } from "@/components/deals/DealDetailPage";
import { pageTitle } from "@/lib/app-config";

const detailSearchSchema = z.object({
  mode: z.enum(["edit", "view"]).optional(),
});

export const Route = createFileRoute("/deals/$id")({
  head: () => ({ meta: [{ title: pageTitle("Deal") }] }),
  validateSearch: detailSearchSchema,
  component: DealDetailPage,
});
