import { http } from "@/lib/api/axios";
import type { ApiEnvelope } from "./auth";
import type { PagedResult } from "./users";

export interface ApiDealDefinition {
  id: string;
  type: string;
  code: string;
  name: string;
  orderBy: number;
  isActive: boolean;
}

export interface ApiDealListItem {
  id: string;
  vin: string;
  stockNumber: string | null;
  lastName: string;
  firstName: string;
  dealTypeId: string;
  dealTypeName: string | null;
  vehicleTypeId: string | null;
  vehicleTypeName: string | null;
  make: string | null;
  dateOfSale: string;
  purchasePrice: number;
  purchaseOrLeaseId: string;
  purchaseOrLeaseName: string | null;
  createdDate: string;
}

export interface ApiDeal {
  id: string;
  voidUnwind: boolean;
  outOfStateDelivery: boolean;
  customerDemand: boolean;
  purchaseOrLeaseId: string;
  purchaseOrLeaseName?: string | null;
  purchaseOrLeaseCode?: string | null;
  shortcut: string | null;
  buyerTypeId: string;
  buyerTypeName?: string | null;
  buyerTypeCode?: string | null;
  driverLicense: string | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
  secondOwnerRelationId: string;
  secondOwnerRelationName?: string | null;
  secondOwnerRelationCode?: string | null;
  secondShortcut: string | null;
  secondBuyerTypeId: string;
  secondBuyerTypeName?: string | null;
  secondBuyerTypeCode?: string | null;
  secondDriverLicense: string | null;
  secondLastName: string | null;
  secondFirstName: string | null;
  secondMiddleName: string | null;
  showRegisteredOwnerAddress: boolean;
  streetLine1: string | null;
  streetLine2: string | null;
  zip: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  eltNumber: string | null;
  lienholderName: string | null;
  showLienholderAddress: boolean;
  lienholderStreetLine1: string | null;
  lienholderStreetLine2: string | null;
  lienholderZip: string | null;
  lienholderCity: string | null;
  lienholderState: string | null;
  rsNumber: string | null;
  dealTypeId: string;
  dealTypeName?: string | null;
  dealTypeCode?: string | null;
  salespersonNumber: string | null;
  customerNumber: string | null;
  make: string | null;
  modelYear: string | null;
  vehicleTypeId: string | null;
  vehicleTypeName?: string | null;
  bodyTypeModel: string | null;
  vin: string;
  stockNumber: string | null;
  odometer: string | null;
  odometerUnitId: string | null;
  odometerUnitName?: string | null;
  odometerStatusId: string | null;
  odometerStatusName?: string | null;
  equipNumber: string | null;
  engineNumber: string | null;
  dateOfSale: string;
  dateFirstOperated: string | null;
  rsReceivedDate: string | null;
  dealerInventoryDate: string | null;
  dateOfRepossession: string | null;
  purchasePrice: number;
  feesCollected: number | null;
  priorRdf: boolean;
  comments: string | null;
  createdBy?: number | null;
  createdDate?: string;
  editBy?: number | null;
  editDate?: string | null;
}

export interface DealPayload {
  voidUnwind: boolean;
  outOfStateDelivery: boolean;
  customerDemand: boolean;
  purchaseOrLeaseId: string;
  shortcut?: string | null;
  buyerTypeId: string;
  driverLicense?: string | null;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  secondOwnerRelationId: string;
  secondShortcut?: string | null;
  secondBuyerTypeId: string;
  secondDriverLicense?: string | null;
  secondLastName?: string | null;
  secondFirstName?: string | null;
  secondMiddleName?: string | null;
  showRegisteredOwnerAddress: boolean;
  streetLine1?: string | null;
  streetLine2?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  eltNumber?: string | null;
  lienholderName?: string | null;
  showLienholderAddress: boolean;
  lienholderStreetLine1?: string | null;
  lienholderStreetLine2?: string | null;
  lienholderZip?: string | null;
  lienholderCity?: string | null;
  lienholderState?: string | null;
  rsNumber?: string | null;
  dealTypeId: string;
  salespersonNumber?: string | null;
  customerNumber?: string | null;
  make?: string | null;
  modelYear?: string | null;
  vehicleTypeId?: string | null;
  bodyTypeModel?: string | null;
  vin: string;
  stockNumber?: string | null;
  odometer?: string | null;
  odometerUnitId?: string | null;
  odometerStatusId?: string | null;
  equipNumber?: string | null;
  engineNumber?: string | null;
  dateOfSale: string;
  dateFirstOperated?: string | null;
  rsReceivedDate?: string | null;
  dealerInventoryDate?: string | null;
  dateOfRepossession?: string | null;
  purchasePrice: number;
  feesCollected?: number | null;
  priorRdf: boolean;
  comments?: string | null;
}

export interface DealListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateOfSaleFrom?: string;
  dateOfSaleTo?: string;
  dealTypeId?: string;
  vehicleTypeId?: string;
}

export const DEAL_DEFINITION_TYPES = {
  purchaseOrLease: "PURCHASE_OR_LEASE",
  buyerType: "BUYER_TYPE",
  secondOwnerRelation: "SECOND_OWNER_RELATION",
  dealType: "DEAL_TYPE",
  vehicleType: "VEHICLE_TYPE",
  odometerUnit: "ODOMETER_UNIT",
  odometerStatus: "ODOMETER_STATUS",
} as const;

const listQuery = (params: DealListParams) => ({
  Page: params.page ?? 1,
  PageSize: params.pageSize ?? 10,
  Search: params.search ?? "",
  ...(params.dateOfSaleFrom ? { DateOfSaleFrom: params.dateOfSaleFrom } : {}),
  ...(params.dateOfSaleTo ? { DateOfSaleTo: params.dateOfSaleTo } : {}),
  ...(params.dealTypeId ? { DealTypeId: params.dealTypeId } : {}),
  ...(params.vehicleTypeId ? { VehicleTypeId: params.vehicleTypeId } : {}),
});

export const dealsService = {
  definitions: (type?: string) =>
    http.get<ApiEnvelope<ApiDealDefinition[]>>("Deals/definitions", {
      params: type ? { type } : undefined,
    }),
  list: (params: DealListParams = {}) =>
    http.get<ApiEnvelope<PagedResult<ApiDealListItem>>>("Deals", { params: listQuery(params) }),
  get: (id: string) => http.get<ApiEnvelope<ApiDeal>>(`Deals/${id}`),
  create: (payload: DealPayload) => http.post<ApiEnvelope<ApiDeal>>("Deals", payload),
  update: (id: string, payload: DealPayload) =>
    http.put<ApiEnvelope<ApiDeal>>(`Deals/${id}`, payload),
  remove: (id: string) => http.delete<ApiEnvelope<null>>(`Deals/${id}`),
};
