import { z } from "zod";
import type { ApiDeal, DealPayload } from "@/lib/api/services/deals";

const optionalString = z.string().trim();

function requiredText(label: string) {
  return z.string().trim().min(1, `${label} is required`);
}

export type DealFormValues = {
  voidUnwind: boolean;
  outOfStateDelivery: boolean;
  customerDemand: boolean;
  purchaseOrLeaseId: string;
  shortcut: string;
  buyerTypeId: string;
  driverLicense: string;
  lastName: string;
  firstName: string;
  middleName: string;

  secondOwnerRelationId: string;
  secondShortcut: string;
  secondBuyerTypeId: string;
  secondDriverLicense: string;
  secondLastName: string;
  secondFirstName: string;
  secondMiddleName: string;

  showRegisteredOwnerAddress: boolean;
  streetLine1: string;
  streetLine2: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;

  eltNumber: string;
  lienholderName: string;
  showLienholderAddress: boolean;
  lienholderStreetLine1: string;
  lienholderStreetLine2: string;
  lienholderZip: string;
  lienholderCity: string;
  lienholderState: string;

  rsNumber: string;
  dealTypeId: string;
  salespersonNumber: string;
  customerNumber: string;
  make: string;
  modelYear: string;
  vehicleTypeId: string;
  bodyTypeModel: string;

  vin: string;
  stockNumber: string;
  odometer: string;
  odometerUnitId: string;
  odometerStatusId: string;
  equipNumber: string;
  engineNumber: string;

  dateOfSale: string;
  dateFirstOperated: string;
  rsReceivedDate: string;
  dealerInventoryDate: string;
  dateOfRepossession: string;
  purchasePrice: string;
  feesCollected: string;
  priorRdf: boolean;
  comments: string;
};

export const emptyDealFormValues: DealFormValues = {
  voidUnwind: false,
  outOfStateDelivery: false,
  customerDemand: false,
  purchaseOrLeaseId: "",
  shortcut: "",
  buyerTypeId: "",
  driverLicense: "",
  lastName: "",
  firstName: "",
  middleName: "",

  secondOwnerRelationId: "",
  secondShortcut: "",
  secondBuyerTypeId: "",
  secondDriverLicense: "",
  secondLastName: "",
  secondFirstName: "",
  secondMiddleName: "",

  showRegisteredOwnerAddress: true,
  streetLine1: "",
  streetLine2: "",
  zip: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  email: "",

  eltNumber: "",
  lienholderName: "",
  showLienholderAddress: true,
  lienholderStreetLine1: "",
  lienholderStreetLine2: "",
  lienholderZip: "",
  lienholderCity: "",
  lienholderState: "",

  rsNumber: "",
  dealTypeId: "",
  salespersonNumber: "",
  customerNumber: "",
  make: "",
  modelYear: "",
  vehicleTypeId: "",
  bodyTypeModel: "",

  vin: "",
  stockNumber: "",
  odometer: "",
  odometerUnitId: "",
  odometerStatusId: "",
  equipNumber: "",
  engineNumber: "",

  dateOfSale: "",
  dateFirstOperated: "",
  rsReceivedDate: "",
  dealerInventoryDate: "",
  dateOfRepossession: "",
  purchasePrice: "",
  feesCollected: "",
  priorRdf: false,
  comments: "",
};

export const createDealFormSchema = z.object({
  voidUnwind: z.boolean(),
  outOfStateDelivery: z.boolean(),
  customerDemand: z.boolean(),
  purchaseOrLeaseId: requiredText("Purchase or lease"),
  shortcut: optionalString,
  buyerTypeId: requiredText("Buyer type"),
  driverLicense: optionalString,
  lastName: requiredText("Last name"),
  firstName: requiredText("First name"),
  middleName: optionalString,

  secondOwnerRelationId: requiredText("Second owner relation"),
  secondShortcut: optionalString,
  secondBuyerTypeId: requiredText("Second buyer type"),
  secondDriverLicense: optionalString,
  secondLastName: optionalString,
  secondFirstName: optionalString,
  secondMiddleName: optionalString,

  showRegisteredOwnerAddress: z.boolean(),
  streetLine1: optionalString,
  streetLine2: optionalString,
  zip: optionalString,
  city: optionalString,
  state: optionalString,
  country: optionalString,
  phone: optionalString,
  email: z
    .string()
    .trim()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Enter a valid email",
    }),

  eltNumber: optionalString,
  lienholderName: optionalString,
  showLienholderAddress: z.boolean(),
  lienholderStreetLine1: optionalString,
  lienholderStreetLine2: optionalString,
  lienholderZip: optionalString,
  lienholderCity: optionalString,
  lienholderState: optionalString,

  rsNumber: optionalString,
  dealTypeId: requiredText("Deal type"),
  salespersonNumber: optionalString,
  customerNumber: optionalString,
  make: optionalString,
  modelYear: optionalString,
  vehicleTypeId: optionalString,
  bodyTypeModel: optionalString,

  vin: requiredText("VIN"),
  stockNumber: optionalString,
  odometer: optionalString,
  odometerUnitId: optionalString,
  odometerStatusId: optionalString,
  equipNumber: optionalString,
  engineNumber: optionalString,

  dateOfSale: requiredText("Date of sale"),
  dateFirstOperated: optionalString,
  rsReceivedDate: optionalString,
  dealerInventoryDate: optionalString,
  dateOfRepossession: optionalString,
  purchasePrice: requiredText("Purchase price"),
  feesCollected: optionalString,
  priorRdf: z.boolean(),
  comments: optionalString.max(500, "Comments must be at most 500 characters"),
});

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function toCreateDealPayload(values: DealFormValues): DealPayload {
  const purchasePrice = Number(values.purchasePrice.trim());
  return {
    voidUnwind: values.voidUnwind,
    outOfStateDelivery: values.outOfStateDelivery,
    customerDemand: values.customerDemand,
    purchaseOrLeaseId: values.purchaseOrLeaseId,
    shortcut: emptyToNull(values.shortcut),
    buyerTypeId: values.buyerTypeId,
    driverLicense: emptyToNull(values.driverLicense),
    lastName: values.lastName.trim(),
    firstName: values.firstName.trim(),
    middleName: emptyToNull(values.middleName),
    secondOwnerRelationId: values.secondOwnerRelationId,
    secondShortcut: emptyToNull(values.secondShortcut),
    secondBuyerTypeId: values.secondBuyerTypeId,
    secondDriverLicense: emptyToNull(values.secondDriverLicense),
    secondLastName: emptyToNull(values.secondLastName),
    secondFirstName: emptyToNull(values.secondFirstName),
    secondMiddleName: emptyToNull(values.secondMiddleName),
    showRegisteredOwnerAddress: values.showRegisteredOwnerAddress,
    streetLine1: emptyToNull(values.streetLine1),
    streetLine2: emptyToNull(values.streetLine2),
    zip: emptyToNull(values.zip),
    city: emptyToNull(values.city),
    state: emptyToNull(values.state),
    country: emptyToNull(values.country),
    phone: emptyToNull(values.phone),
    email: emptyToNull(values.email),
    eltNumber: emptyToNull(values.eltNumber),
    lienholderName: emptyToNull(values.lienholderName),
    showLienholderAddress: values.showLienholderAddress,
    lienholderStreetLine1: emptyToNull(values.lienholderStreetLine1),
    lienholderStreetLine2: emptyToNull(values.lienholderStreetLine2),
    lienholderZip: emptyToNull(values.lienholderZip),
    lienholderCity: emptyToNull(values.lienholderCity),
    lienholderState: emptyToNull(values.lienholderState),
    rsNumber: emptyToNull(values.rsNumber),
    dealTypeId: values.dealTypeId,
    salespersonNumber: emptyToNull(values.salespersonNumber),
    customerNumber: emptyToNull(values.customerNumber),
    make: emptyToNull(values.make),
    modelYear: emptyToNull(values.modelYear),
    vehicleTypeId: emptyToNull(values.vehicleTypeId),
    bodyTypeModel: emptyToNull(values.bodyTypeModel),
    vin: values.vin.trim(),
    stockNumber: emptyToNull(values.stockNumber),
    odometer: emptyToNull(values.odometer),
    odometerUnitId: emptyToNull(values.odometerUnitId),
    odometerStatusId: emptyToNull(values.odometerStatusId),
    equipNumber: emptyToNull(values.equipNumber),
    engineNumber: emptyToNull(values.engineNumber),
    dateOfSale: values.dateOfSale,
    dateFirstOperated: emptyToNull(values.dateFirstOperated),
    rsReceivedDate: emptyToNull(values.rsReceivedDate),
    dealerInventoryDate: emptyToNull(values.dealerInventoryDate),
    dateOfRepossession: emptyToNull(values.dateOfRepossession),
    purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
    feesCollected: parseOptionalDecimal(values.feesCollected),
    priorRdf: values.priorRdf,
    comments: emptyToNull(values.comments),
  };
}

function dateOrEmpty(value: string | null | undefined): string {
  return value?.trim() || "";
}

export function dealToFormValues(deal: ApiDeal): DealFormValues {
  return {
    voidUnwind: deal.voidUnwind,
    outOfStateDelivery: deal.outOfStateDelivery,
    customerDemand: deal.customerDemand,
    purchaseOrLeaseId: deal.purchaseOrLeaseId ?? "",
    shortcut: deal.shortcut ?? "",
    buyerTypeId: deal.buyerTypeId ?? "",
    driverLicense: deal.driverLicense ?? "",
    lastName: deal.lastName ?? "",
    firstName: deal.firstName ?? "",
    middleName: deal.middleName ?? "",
    secondOwnerRelationId: deal.secondOwnerRelationId ?? "",
    secondShortcut: deal.secondShortcut ?? "",
    secondBuyerTypeId: deal.secondBuyerTypeId ?? "",
    secondDriverLicense: deal.secondDriverLicense ?? "",
    secondLastName: deal.secondLastName ?? "",
    secondFirstName: deal.secondFirstName ?? "",
    secondMiddleName: deal.secondMiddleName ?? "",
    showRegisteredOwnerAddress: deal.showRegisteredOwnerAddress,
    streetLine1: deal.streetLine1 ?? "",
    streetLine2: deal.streetLine2 ?? "",
    zip: deal.zip ?? "",
    city: deal.city ?? "",
    state: deal.state ?? "",
    country: deal.country ?? "",
    phone: deal.phone ?? "",
    email: deal.email ?? "",
    eltNumber: deal.eltNumber ?? "",
    lienholderName: deal.lienholderName ?? "",
    showLienholderAddress: deal.showLienholderAddress,
    lienholderStreetLine1: deal.lienholderStreetLine1 ?? "",
    lienholderStreetLine2: deal.lienholderStreetLine2 ?? "",
    lienholderZip: deal.lienholderZip ?? "",
    lienholderCity: deal.lienholderCity ?? "",
    lienholderState: deal.lienholderState ?? "",
    rsNumber: deal.rsNumber ?? "",
    dealTypeId: deal.dealTypeId ?? "",
    salespersonNumber: deal.salespersonNumber ?? "",
    customerNumber: deal.customerNumber ?? "",
    make: deal.make ?? "",
    modelYear: deal.modelYear ?? "",
    vehicleTypeId: deal.vehicleTypeId ?? "",
    bodyTypeModel: deal.bodyTypeModel ?? "",
    vin: deal.vin ?? "",
    stockNumber: deal.stockNumber ?? "",
    odometer: deal.odometer ?? "",
    odometerUnitId: deal.odometerUnitId ?? "",
    odometerStatusId: deal.odometerStatusId ?? "",
    equipNumber: deal.equipNumber ?? "",
    engineNumber: deal.engineNumber ?? "",
    dateOfSale: dateOrEmpty(deal.dateOfSale),
    dateFirstOperated: dateOrEmpty(deal.dateFirstOperated),
    rsReceivedDate: dateOrEmpty(deal.rsReceivedDate),
    dealerInventoryDate: dateOrEmpty(deal.dealerInventoryDate),
    dateOfRepossession: dateOrEmpty(deal.dateOfRepossession),
    purchasePrice: deal.purchasePrice != null ? String(deal.purchasePrice) : "",
    feesCollected: deal.feesCollected != null ? String(deal.feesCollected) : "",
    priorRdf: deal.priorRdf,
    comments: deal.comments ?? "",
  };
}
