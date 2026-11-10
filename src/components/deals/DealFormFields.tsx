import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { Eraser, Eye, EyeOff, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TextField,
  TextareaField,
  SearchableSelectField,
  CheckboxField,
  RadioGroupField,
  PhoneNumberField,
  type SearchableSelectOption,
  type SelectOption,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import type { DealFormValues } from "@/lib/deal-form";
import {
  DEAL_DEFINITION_TYPES,
  dealsService,
  type ApiDealDefinition,
} from "@/lib/api/services/deals";

/** Equal-width cells — 5 fields per row from lg up. */
const fieldGrid =
  "grid grid-cols-1 gap-x-2.5 gap-y-1.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 [&>*]:min-w-0";

function toSelectOptions(rows: ApiDealDefinition[]): SelectOption[] {
  return rows.map((row) => ({
    value: row.id,
    label: row.name,
  }));
}

function filterOptions(options: SelectOption[]) {
  return async (search: string): Promise<SearchableSelectOption[]> => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    );
  };
}

function selectedLabel(options: SelectOption[], value: string | undefined) {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function findIdByCode(rows: ApiDealDefinition[], code: string) {
  return rows.find((row) => row.code === code)?.id ?? "";
}

function lookupSoon(label: string) {
  toast.message(`${label} lookup`, {
    description: "Lookup will connect when the related service is ready.",
  });
}

function groupByType(rows: ApiDealDefinition[]) {
  const map: Record<string, ApiDealDefinition[]> = {};
  for (const row of rows) {
    (map[row.type] ??= []).push(row);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.orderBy - b.orderBy || a.name.localeCompare(b.name));
  }
  return map;
}

export function DealFormFields({
  disabled = false,
  embedded = false,
  applyDefaults = true,
}: {
  disabled?: boolean;
  embedded?: boolean;
  /** When true, empty definition fields get seeded defaults (create form). */
  applyDefaults?: boolean;
}) {
  const { watch, setValue, getValues } = useFormContext<DealFormValues>();
  const showRegisteredOwnerAddress = watch("showRegisteredOwnerAddress");
  const showLienholderAddress = watch("showLienholderAddress");
  const secondOwnerRelationId = watch("secondOwnerRelationId");
  const dealTypeId = watch("dealTypeId");
  const vehicleTypeId = watch("vehicleTypeId");
  const odometerUnitId = watch("odometerUnitId");
  const odometerStatusId = watch("odometerStatusId");

  const { data: definitions = [] } = useQuery({
    queryKey: ["deals", "definitions"],
    queryFn: async () => (await dealsService.definitions()).data ?? [],
    staleTime: 5 * 60_000,
  });

  const byType = useMemo(() => groupByType(definitions), [definitions]);

  const purchaseOrLeaseOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.purchaseOrLease] ?? []),
    [byType],
  );
  const buyerTypeOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.buyerType] ?? []),
    [byType],
  );
  const secondOwnerRelationOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.secondOwnerRelation] ?? []),
    [byType],
  );
  const dealTypeOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.dealType] ?? []),
    [byType],
  );
  const vehicleTypeOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.vehicleType] ?? []),
    [byType],
  );
  const odometerUnitOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.odometerUnit] ?? []),
    [byType],
  );
  const odometerStatusOptions = useMemo(
    () => toSelectOptions(byType[DEAL_DEFINITION_TYPES.odometerStatus] ?? []),
    [byType],
  );

  const noneRelationId = useMemo(
    () => findIdByCode(byType[DEAL_DEFINITION_TYPES.secondOwnerRelation] ?? [], "NONE"),
    [byType],
  );

  useEffect(() => {
    if (!applyDefaults || !definitions.length) return;
    const values = getValues();

    const defaults: Array<[keyof DealFormValues, string]> = [
      ["purchaseOrLeaseId", findIdByCode(byType[DEAL_DEFINITION_TYPES.purchaseOrLease] ?? [], "purchase")],
      ["buyerTypeId", findIdByCode(byType[DEAL_DEFINITION_TYPES.buyerType] ?? [], "person")],
      ["secondBuyerTypeId", findIdByCode(byType[DEAL_DEFINITION_TYPES.buyerType] ?? [], "person")],
      ["secondOwnerRelationId", noneRelationId],
      ["dealTypeId", findIdByCode(byType[DEAL_DEFINITION_TYPES.dealType] ?? [], "REGISTER_USED_VEHICLE_REG511")],
      ["vehicleTypeId", findIdByCode(byType[DEAL_DEFINITION_TYPES.vehicleType] ?? [], "AUTOMOBILE")],
      ["odometerUnitId", findIdByCode(byType[DEAL_DEFINITION_TYPES.odometerUnit] ?? [], "MILES")],
      ["odometerStatusId", findIdByCode(byType[DEAL_DEFINITION_TYPES.odometerStatus] ?? [], "ACTUAL")],
    ];

    for (const [field, id] of defaults) {
      if (!id) continue;
      if (!values[field]) {
        setValue(field, id, { shouldDirty: false });
      }
    }
  }, [applyDefaults, definitions, byType, noneRelationId, getValues, setValue]);

  return (
    <div className="space-y-2.5">
      <Section title="Deal flags" embedded={embedded}>
        <div className={fieldGrid}>
          <CheckboxField<DealFormValues>
            name="voidUnwind"
            label="Void (Unwind)?"
            disabled={disabled}
            className="min-h-9 items-center"
          />
          <CheckboxField<DealFormValues>
            name="outOfStateDelivery"
            label="Out of State Delivery?"
            disabled={disabled}
            className="min-h-9 items-center"
          />
          <CheckboxField<DealFormValues>
            name="customerDemand"
            label="Customer Demand?"
            disabled={disabled}
            className="min-h-9 items-center"
          />
          <RadioGroupField<DealFormValues>
            name="purchaseOrLeaseId"
            label="Purchase or Lease?"
            required
            layout="row"
            variant="plain"
            options={purchaseOrLeaseOptions}
            disabled={disabled}
            className="min-h-9 items-center lg:col-span-2"
          />
        </div>
      </Section>

      <Section title="Buyer" embedded={embedded} separated>
        <div className={fieldGrid}>
          <TextField<DealFormValues>
            name="shortcut"
            label="Shortcut"
            disabled={disabled}
            rightSlot={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={disabled}
                aria-label="Search shortcut"
                onClick={() => lookupSoon("Shortcut")}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <TextField<DealFormValues>
            name="driverLicense"
            label="Driver License"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="firstName"
            label="First Name"
            required
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="middleName"
            label="Middle Name"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="lastName"
            label="Last Name"
            required
            disabled={disabled}
          />
          <RadioGroupField<DealFormValues>
            name="buyerTypeId"
            label="Buyer Type"
            required
            layout="row"
            variant="plain"
            options={buyerTypeOptions}
            disabled={disabled}
            className="min-h-9 items-end pb-2"
          />
        </div>
      </Section>

      <Section title="Second buyer" embedded={embedded} separated>
        <div className={fieldGrid}>
          <SearchableSelectField<DealFormValues>
            name="secondOwnerRelationId"
            label="Second Owner Relation"
            required
            placeholder="Search relation…"
            searchPlaceholder="Search relation…"
            disabled={disabled}
            queryKey={["deals", "second-owner-relation"]}
            fetchOptions={filterOptions(secondOwnerRelationOptions)}
            selectedLabel={selectedLabel(secondOwnerRelationOptions, secondOwnerRelationId)}
          />
          <TextField<DealFormValues> name="secondShortcut" label="Shortcut" disabled={disabled} />
          <TextField<DealFormValues>
            name="secondDriverLicense"
            label="Driver License"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="secondFirstName"
            label="First Name"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="secondMiddleName"
            label="Middle Name"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="secondLastName"
            label="Last Name"
            disabled={disabled}
          />
          <RadioGroupField<DealFormValues>
            name="secondBuyerTypeId"
            label="Second Buyer Type"
            layout="row"
            variant="plain"
            options={buyerTypeOptions}
            disabled={disabled}
            className="min-h-9 items-end pb-2"
          />
        </div>
      </Section>

      <Section
        title="Registered owner address"
        embedded={embedded}
        separated
        actions={
          <>
            <SectionAction
              disabled={disabled}
              icon={
                showRegisteredOwnerAddress ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )
              }
              onClick={() =>
                setValue("showRegisteredOwnerAddress", !showRegisteredOwnerAddress, {
                  shouldDirty: true,
                })
              }
            >
              {showRegisteredOwnerAddress ? "Hide address" : "Show address"}
            </SectionAction>
            <SectionAction
              disabled={disabled}
              icon={<Eraser className="h-3.5 w-3.5" />}
              onClick={() => {
                setValue("streetLine1", "", { shouldDirty: true });
                setValue("streetLine2", "", { shouldDirty: true });
                setValue("zip", "", { shouldDirty: true });
                setValue("city", "", { shouldDirty: true });
                setValue("state", "", { shouldDirty: true });
                setValue("country", "", { shouldDirty: true });
              }}
            >
              Clear address
            </SectionAction>
          </>
        }
      >
        <div className={fieldGrid}>
          {showRegisteredOwnerAddress ? (
            <>
              <TextField<DealFormValues>
                name="streetLine1"
                label="Street line 1"
                disabled={disabled}
              />
              <TextField<DealFormValues>
                name="streetLine2"
                label="Street line 2"
                disabled={disabled}
              />
              <TextField<DealFormValues> name="zip" label="Zip" disabled={disabled} />
              <TextField<DealFormValues>
                name="city"
                label="City"
                disabled={disabled}
              />
              <TextField<DealFormValues>
                name="state"
                label="State"
                disabled={disabled}
              />
              <TextField<DealFormValues>
                name="country"
                label="Country"
                disabled={disabled}
              />
            </>
          ) : null}
          <PhoneNumberField<DealFormValues>
            name="phone"
            label="Phone"
            placeholder="Phone number"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="email"
            label="Email"
            type="email"
            placeholder="name@example.com"
            disabled={disabled}
          />
        </div>
      </Section>

      <Section
        title="Lienholder"
        embedded={embedded}
        separated
        actions={
          <>
            <SectionAction
              disabled={disabled}
              icon={
                showLienholderAddress ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )
              }
              onClick={() =>
                setValue("showLienholderAddress", !showLienholderAddress, { shouldDirty: true })
              }
            >
              {showLienholderAddress ? "Hide address" : "Show address"}
            </SectionAction>
            <SectionAction
              disabled={disabled}
              icon={<Eraser className="h-3.5 w-3.5" />}
              onClick={() => {
                setValue("lienholderStreetLine1", "", { shouldDirty: true });
                setValue("lienholderStreetLine2", "", { shouldDirty: true });
                setValue("lienholderZip", "", { shouldDirty: true });
                setValue("lienholderCity", "", { shouldDirty: true });
                setValue("lienholderState", "", { shouldDirty: true });
              }}
            >
              Clear address
            </SectionAction>
            <SectionAction
              disabled={disabled}
              icon={<Save className="h-3.5 w-3.5" />}
              onClick={() =>
                toast.message("Save custom lienholder", {
                  description: "Save will connect when the related service is ready.",
                })
              }
            >
              Save custom
            </SectionAction>
          </>
        }
      >
        <div className={fieldGrid}>
          <TextField<DealFormValues>
            name="eltNumber"
            label="ELT #"
            disabled={disabled}
            rightSlot={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={disabled}
                aria-label="Search ELT #"
                onClick={() => lookupSoon("ELT #")}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <TextField<DealFormValues>
            name="lienholderName"
            label="Lienholder Name"
            disabled={disabled}
          />
          {showLienholderAddress ? (
            <>
              <TextField<DealFormValues>
                name="lienholderStreetLine1"
                label="Street line 1"
                disabled={disabled}
              />
              <TextField<DealFormValues>
                name="lienholderStreetLine2"
                label="Street line 2"
                disabled={disabled}
              />
              <TextField<DealFormValues> name="lienholderZip" label="Zip" disabled={disabled} />
              <TextField<DealFormValues>
                name="lienholderCity"
                label="City"
                disabled={disabled}
              />
              <TextField<DealFormValues>
                name="lienholderState"
                label="State"
                disabled={disabled}
              />
            </>
          ) : null}
        </div>
      </Section>

      <Section title="Deal & vehicle" embedded={embedded} separated>
        <div className={fieldGrid}>
          <TextField<DealFormValues> name="rsNumber" label="RS Number" disabled={disabled} />
          <SearchableSelectField<DealFormValues>
            name="dealTypeId"
            label="Deal Type"
            required
            placeholder="Search deal type…"
            searchPlaceholder="Search deal type…"
            disabled={disabled}
            queryKey={["deals", "deal-type"]}
            fetchOptions={filterOptions(dealTypeOptions)}
            selectedLabel={selectedLabel(dealTypeOptions, dealTypeId)}
          />
          <TextField<DealFormValues>
            name="salespersonNumber"
            label="Salesperson #"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="customerNumber"
            label="Customer #"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="make"
            label="Make"
            disabled={disabled}
          />
          <TextField<DealFormValues> name="modelYear" label="Model Year" disabled={disabled} />
          <SearchableSelectField<DealFormValues>
            name="vehicleTypeId"
            label="Vehicle Type"
            placeholder="Search vehicle type…"
            searchPlaceholder="Search vehicle type…"
            disabled={disabled}
            queryKey={["deals", "vehicle-type"]}
            fetchOptions={filterOptions(vehicleTypeOptions)}
            selectedLabel={selectedLabel(vehicleTypeOptions, vehicleTypeId)}
          />
          <TextField<DealFormValues>
            name="bodyTypeModel"
            label="Body Type Model"
            disabled={disabled}
          />
        </div>
      </Section>

      <Section title="Vehicle identifiers" embedded={embedded} separated>
        <div className={fieldGrid}>
          <TextField<DealFormValues>
            name="vin"
            label="VIN"
            required
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="stockNumber"
            label="STOCK #"
            disabled={disabled}
          />
          <TextField<DealFormValues> name="odometer" label="ODOMETER" disabled={disabled} />
          <SearchableSelectField<DealFormValues>
            name="odometerUnitId"
            label="Odometer unit"
            placeholder="Search unit…"
            searchPlaceholder="Search unit…"
            disabled={disabled}
            queryKey={["deals", "odometer-unit"]}
            fetchOptions={filterOptions(odometerUnitOptions)}
            selectedLabel={selectedLabel(odometerUnitOptions, odometerUnitId)}
          />
          <SearchableSelectField<DealFormValues>
            name="odometerStatusId"
            label="Odometer status"
            placeholder="Search status…"
            searchPlaceholder="Search status…"
            disabled={disabled}
            queryKey={["deals", "odometer-status"]}
            fetchOptions={filterOptions(odometerStatusOptions)}
            selectedLabel={selectedLabel(odometerStatusOptions, odometerStatusId)}
          />
          <TextField<DealFormValues>
            name="equipNumber"
            label="EQUIP #"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="engineNumber"
            label="ENGINE # (MOTORCYCLE)"
            disabled={disabled}
          />
        </div>
      </Section>

      <Section title="Dates & pricing" embedded={embedded} separated>
        <div className={fieldGrid}>
          <TextField<DealFormValues>
            name="dateOfSale"
            label="Date Of Sale"
            type="date"
            required
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="dateFirstOperated"
            label="Date First Operated"
            type="date"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="rsReceivedDate"
            label="RS Received Date"
            type="date"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="dealerInventoryDate"
            label="Dealer Inventory Date"
            type="date"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="dateOfRepossession"
            label="Date of repossession"
            type="date"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="purchasePrice"
            label="Purchase Price"
            required
            inputMode="decimal"
            disabled={disabled}
          />
          <TextField<DealFormValues>
            name="feesCollected"
            label="Fees Collected"
            inputMode="decimal"
            disabled={disabled}
          />
          <CheckboxField<DealFormValues>
            name="priorRdf"
            label="Prior RDF?"
            disabled={disabled}
            className="min-h-9 items-end pb-2"
          />
        </div>
        <TextareaField<DealFormValues>
          name="comments"
          label="Comments"
          rows={2}
          maxLength={500}
          disabled={disabled}
        />
      </Section>
    </div>
  );
}

function SectionAction({
  children,
  icon,
  disabled,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="h-7 gap-1.5 border-border/80 bg-background/80 px-2.5 text-[11px] font-medium text-foreground shadow-none hover:bg-accent/10 hover:text-foreground"
    >
      <span className="text-muted-foreground [&_svg]:size-3.5">{icon}</span>
      {children}
    </Button>
  );
}

function Section({
  title,
  embedded: _embedded,
  separated: _separated,
  actions,
  children,
}: {
  title: string;
  embedded?: boolean;
  separated?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <header
        className={cn(
          "flex flex-wrap items-center gap-2 border-b border-border/70 bg-gradient-to-r from-accent/12 via-muted/40 to-transparent px-3 py-2",
          actions ? "justify-between" : undefined,
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-4 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
            {title}
          </h3>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
        ) : null}
      </header>
      <div className="space-y-2 p-2.5 sm:p-3">{children}</div>
    </section>
  );
}
