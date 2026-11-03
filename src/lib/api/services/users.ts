import { API_BASE_URL, http } from "@/lib/api/axios";
import type { ApiEnvelope } from "./auth";

/** Core `UserAccountDto` (CoreHost Users API). */
export interface ApiUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  profileImagePath?: string | null;
  isActive: boolean;
  inAppNotificationsEnabled?: boolean;
  userTypeId: number;
  userTypeName: string;
  userTypeCode?: string;
  roleIds: string[];
  roleNames: string[];
  createdBy: number | null;
  createdDate: string;
  editBy: number | null;
  editDate: string | null;
}

/** Build absolute URL for a profile image returned by the API. */
export function resolveProfileImageUrl(
  path: string | null | undefined,
  version?: string | number | null,
): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  const url =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `${API_BASE_URL.replace(/\/api\/?$/, "")}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  if (version == null || version === "") return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(version))}`;
}

export interface CreateUserPayload {
  username?: string | null;
  email: string;
  password: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  isActive: boolean;
  userTypeId: number;
  roleIds: string[] | null;
}

export interface UpdateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  password?: string | null;
  isActive: boolean;
  inAppNotificationsEnabled?: boolean | null;
  userTypeId: number;
  roleIds: string[] | null;
}

/** Normalise API date values for `<input type="date">`. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return value.trim().slice(0, 10);
}

export interface UsersListParams {
  page: number;
  pageSize: number;
  search?: string;
  roleId?: string;
  userTypeId?: number;
  sortBy?: UsersSortBy;
  sortDir?: UsersSortDir;
}

export type UsersSortBy = "name" | "roles" | "usertype" | "status" | "createdDate";
export type UsersSortDir = "asc" | "desc";

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserDropdownOption {
  id: string;
  name: string;
}

export const usersService = {
  list: (params: UsersListParams) =>
    http.get<ApiEnvelope<PagedResult<ApiUser>>>("Users", {
      params: {
        Page: params.page,
        PageSize: params.pageSize,
        Search: params.search ?? "",
        ...(params.roleId != null ? { RoleId: params.roleId } : {}),
        ...(params.userTypeId != null ? { UserTypeId: params.userTypeId } : {}),
        ...(params.sortBy ? { SortBy: params.sortBy } : {}),
        ...(params.sortDir ? { SortDir: params.sortDir } : {}),
      },
    }),
  get: (id: string) => http.get<ApiEnvelope<ApiUser>>(`Users/${id}`),
  dropdown: (params: { search?: string; userTypeId?: number; roleCodes?: string; take?: number }) =>
    http.get<ApiEnvelope<UserDropdownOption[]>>("Users/dropdown", {
      params: {
        Search: params.search ?? "",
        ...(params.userTypeId != null ? { UserTypeId: params.userTypeId } : {}),
        ...(params.roleCodes != null ? { RoleCodes: params.roleCodes } : {}),
        ...(params.take != null ? { Take: params.take } : {}),
      },
    }),
  create: (payload: CreateUserPayload) => http.post<ApiEnvelope<ApiUser>>("Users", payload),
  update: (id: string, payload: UpdateUserPayload) =>
    http.put<ApiEnvelope<ApiUser>>(`Users/${id}`, payload),
  removeProfileImage: (id: string) => http.delete<ApiEnvelope<null>>(`Users/${id}/profile-image`),
  remove: (id: string) => http.delete<ApiEnvelope<null>>(`Users/${id}`),
};
