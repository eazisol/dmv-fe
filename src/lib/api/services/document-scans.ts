import { http } from "@/lib/api/axios";
import { appConfig } from "@/lib/app-config";
import type { ApiEnvelope } from "./auth";
import type { PagedResult } from "./users";

export interface ApiReg397Fields {
  dateFirstSoldAsNew: string | null;
  dateFirstOperated: string | null;
  temporaryLicensePlate: string | null;
  nrmInd: boolean | null;
  make: string | null;
  yearModel: string | null;
  bodyType: string | null;
  motivePower: string | null;
  numberOfAxles: string | null;
  unladenWeight: string | null;
  vin: string | null;
  motorcycleEngineNumber: string | null;
  ohvMcDealersOnly: string | null;
  lengthInches: string | null;
  widthInches: string | null;
  gvwr: string | null;
  countyOfResidence: string | null;
  buyerFullName: string | null;
  coOwnerAndOr: string | null;
  equipmentNumber: string | null;
  driverLicenseOrId: string | null;
  driverLicenseState: string | null;
  purchaserPhysicalAddress: string | null;
  purchaserMailingAddress: string | null;
  lienholderOrLegalOwner: string | null;
  lienholderAddress: string | null;
  electronicLienholderId: string | null;
  soldToDate: string | null;
  buyerSignaturePresent: boolean | null;
  costLine: string | null;
  datePurchasedAcquired: string | null;
  costAmount: string | null;
  odometerReading: string | null;
  dealerNumber: string | null;
  odometerDate: string | null;
  buyerPrintedName: string | null;
  buyerOdometerSignaturePresent: boolean | null;
  sellerPrintedName: string | null;
  sellerAddress: string | null;
  sellerOdometerSignaturePresent: boolean | null;
  unladenWeightCertificate: string | null;
  dealerCertificationCompleted: boolean | null;
}

export interface ApiDocumentScanListItem {
  id: string;
  documentType: string;
  documentTypeLabel: string;
  status: string;
  originalFileName: string;
  vin: string | null;
  buyerName: string | null;
  make: string | null;
  modelYear: string | null;
  sourcePageStart: number;
  sourcePageEnd: number;
  createdDate: string;
}

export interface ApiDocumentScan {
  id: string;
  documentType: string;
  documentTypeLabel: string;
  status: string;
  originalFileName: string;
  filePath: string;
  previewImagePath: string | null;
  sourcePageStart: number;
  sourcePageEnd: number;
  sourcePageCount: number;
  vin: string | null;
  buyerName: string | null;
  make: string | null;
  modelYear: string | null;
  extractionNotes: string | null;
  rawOcrText: string | null;
  fields: ApiReg397Fields;
  createdDate: string;
  editDate: string | null;
}

export function resolveUploadUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = appConfig.apiBaseUrl.replace(/\/api\/?$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export const documentScansService = {
  list: (params: { page: number; pageSize: number; search?: string; status?: string }) =>
    http.get<ApiEnvelope<PagedResult<ApiDocumentScanListItem>>>("DocumentScans", {
      params: {
        Page: params.page,
        PageSize: params.pageSize,
        Search: params.search ?? "",
        ...(params.status ? { Status: params.status } : {}),
      },
    }),

  getById: (id: string) =>
    http.get<ApiEnvelope<ApiDocumentScan>>(`DocumentScans/${id}`),

  scan: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<ApiEnvelope<ApiDocumentScan>>("DocumentScans/scan", form, {
      timeout: 120_000,
    });
  },

  rescan: (id: string) =>
    http.post<ApiEnvelope<ApiDocumentScan>>(`DocumentScans/${id}/rescan`, undefined, {
      timeout: 120_000,
    }),

  remove: (id: string) => http.delete<ApiEnvelope<null>>(`DocumentScans/${id}`),
};
