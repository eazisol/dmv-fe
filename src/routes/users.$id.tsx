import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { UserDetailPage } from "@/components/users/UserDetailPage";
import { pageTitle } from "@/lib/app-config";

const detailSearchSchema = z.object({
  mode: z.enum(["edit", "view"]).optional(),
});

export const Route = createFileRoute("/users/$id")({
  head: () => ({ meta: [{ title: pageTitle("User") }] }),
  validateSearch: detailSearchSchema,
  component: UserDetailPage,
});
