/** Deals module paths, permissions, and copy. */
export const dealModuleConfig = {
  permissionRoute: "/deals",
  listPath: "/deals",
  newPath: "/deals/new",
  detailPath: "/deals/$id",
  queryKey: ["deals"] as const,
  labels: {
    moduleTitle: "Deals",
    entity: "deal",
    entityTitle: "Deal",
    addTitle: "Create Deal",
    editTitle: "Edit Deal",
    viewTitle: "Deal dossier",
    createButton: "Create deal",
    editButton: "Edit deal",
    addButton: "Create Deal",
    backLabel: "Back to deals",
    emptyTitle: "No deals yet",
    itemLabel: "deals",
    searchPlaceholder: "Search by VIN, name, stock #…",
    loadingList: "Loading deals…",
    loadingDetail: "Loading deal…",
    deleteConfirm: "This soft-deletes the deal from the logbook.",
    deleteButton: "Delete",
  },
} as const;

export type DealModuleConfig = typeof dealModuleConfig;
