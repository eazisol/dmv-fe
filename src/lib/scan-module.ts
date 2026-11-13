/** Document scans module paths, permissions, and copy. */
export const scanModuleConfig = {
  permissionRoute: "/scans",
  listPath: "/scans",
  detailPath: "/scans/$id",
  queryKey: ["document-scans"] as const,
  labels: {
    moduleTitle: "Scans",
    entity: "scan",
    entityTitle: "Document scan",
    addButton: "Scan document",
    viewTitle: "Scan detail",
    backLabel: "Back to scans",
    emptyTitle: "No scans yet",
    itemLabel: "scans",
    searchPlaceholder: "Search by VIN, buyer, file name…",
    loadingList: "Loading scans…",
    loadingDetail: "Loading scan…",
    deleteConfirm: "This soft-deletes the scanned document entry.",
    deleteButton: "Delete",
  },
} as const;

export type ScanModuleConfig = typeof scanModuleConfig;
