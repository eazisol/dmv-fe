import { http } from "@/lib/api/axios";
import type { ApiEnvelope } from "./auth";

export interface ApiPermission {
  id: string | null;
  menuId: string;
  menuName: string | null;
  menuCode: string | null;
  roleId?: string | null;
  roleName?: string | null;
  userId?: string | null;
  read: boolean;
  modify: boolean;
  delete: boolean;
  createdBy?: number | null;
  createdDate?: string;
  editBy?: number | null;
  editDate?: string | null;
}

export interface UpsertPermission {
  menuId: string;
  read: boolean;
  modify: boolean;
  delete: boolean;
}

export interface AssignRolePermissionsPayload {
  roleId: string;
  permissions: UpsertPermission[];
}

export interface ApiRolePermissionCatalog {
  roleId: string;
  roleCode?: string | null;
  roleName?: string | null;
  permissions: ApiPermission[];
}

export const permissionsService = {
  getByRole: (roleId: string) =>
    http.get<ApiEnvelope<ApiPermission[]>>(`Permissions/role/${roleId}`),
  assign: (payload: AssignRolePermissionsPayload) =>
    http.post<ApiEnvelope<ApiPermission[]>>("Permissions/assign", payload),
  getByUser: (userId: string) =>
    http.get<ApiEnvelope<ApiPermission[]>>(`Permissions/user/${userId}`),
  assignForUser: (userId: string, permissions: UpsertPermission[]) =>
    http.put<ApiEnvelope<ApiPermission[]>>(`Permissions/user/${userId}`, permissions),
};
