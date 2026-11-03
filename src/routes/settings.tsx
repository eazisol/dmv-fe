import { createFileRoute, Outlet } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-config";

/** Parent container for Settings child menus (e.g. Email SMTP) from the Menu API. */
export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: pageTitle("Settings") }] }),
  component: () => <Outlet />,
});
