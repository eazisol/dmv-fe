import { http } from "@/lib/api/axios";
import type { ApiEnvelope } from "./auth";

/** Core `CurrentSessionAccessDto`. */
export interface ApiCurrentAccess {
  isPrivileged: boolean;
  roleCodes: string[];
  /** Active role ids only (encoded). */
  roleIds?: string[];
  capabilities: string[];
}

export interface ApiCapabilityDefinition {
  code: string;
  label: string;
  description: string;
  isGranted: boolean;
  isExplicit?: boolean;
}

export interface ApiCapabilitySet {
  roleId?: string | null;
  roleCode?: string | null;
  userId?: string | null;
  capabilities: ApiCapabilityDefinition[];
}

export const accessService = {
  me: () => http.get<ApiEnvelope<ApiCurrentAccess>>("Access/me"),
};

export const capabilitiesService = {
  getByRole: (roleId: string) =>
    http.get<ApiEnvelope<ApiCapabilitySet>>(`Permissions/capabilities/role/${roleId}`),
  assignForRole: (roleId: string, capabilities: { code: string; isGranted: boolean }[]) =>
    http.put<ApiEnvelope<ApiCapabilitySet>>(`Permissions/capabilities/role/${roleId}`, {
      capabilities,
    }),
  getCatalogByRole: (roleId: string) =>
    http.get<ApiEnvelope<ApiCapabilitySet>>(`Permissions/capabilities/role/${roleId}`),
  getByUser: (userId: string) =>
    http.get<ApiEnvelope<ApiCapabilitySet>>(`Permissions/capabilities/user/${userId}`),
  assignForUser: (userId: string, capabilities: { code: string; isGranted: boolean }[]) =>
    http.put<ApiEnvelope<ApiCapabilitySet>>(`Permissions/capabilities/user/${userId}`, {
      capabilities,
    }),
};
