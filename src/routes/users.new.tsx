import { createFileRoute } from "@tanstack/react-router";
import { UserCreatePage } from "@/components/users/UserCreatePage";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/users/new")({
  head: () => ({ meta: [{ title: pageTitle("Add User") }] }),
  component: UserCreatePage,
});
