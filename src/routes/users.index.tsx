import { createFileRoute } from "@tanstack/react-router";
import { UsersListPage } from "@/components/users/UsersListPage";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/users/")({
  head: () => ({ meta: [{ title: pageTitle("User Management") }] }),
  component: UsersListPage,
});

/** @deprecated Prefer userModuleConfig(mode).queryKey */
export const usersQueryKey = ["users"] as const;
