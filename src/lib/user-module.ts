/**
 * Auth & User Management — single user module (Core `UserAccountDto`).
 *
 * CoreHost seeds one user type (`STAFF`, id 1). `userTypeId` is a plain integer on the
 * account DTOs (only lookup row ids are encoded), so the form sends this default.
 */
export const DEFAULT_USER_TYPE_ID = 1;

export const userModuleConfig = {
  userTypeId: DEFAULT_USER_TYPE_ID,
  permissionRoute: "/users",
  listPath: "/users",
  newPath: "/users/new",
  detailPath: "/users/$id",
  queryKey: ["users"] as const,
  labels: {
    moduleTitle: "User Management",
    entity: "user",
    entityTitle: "User",
    addTitle: "Add User",
    editTitle: "Edit user",
    viewTitle: "User details",
    createButton: "Create user",
    addButton: "Add user",
    deleteButton: "Delete user",
    editButton: "Edit user",
    backLabel: "Back to users",
    loadingList: "Loading users…",
    loadingDetail: "Loading user…",
    emptyTitle: "No users match your filters",
    itemLabel: "users",
    searchPlaceholder: "Search by name, username or email…",
    deleteConfirm:
      "This removes the account and revokes platform access. This action cannot be undone.",
  },
} as const;

export type UserModuleConfig = typeof userModuleConfig;
