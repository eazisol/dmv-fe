import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { FormPageCard } from "@/components/FormPageCard";
import { Button } from "@/components/ui/button";
import { Form, SubmitButton } from "@/components/form";
import { Can, RequirePermission, usePermission } from "@/components/Permission";
import { DealFormFields } from "@/components/deals/DealFormFields";
import {
  createDealFormSchema,
  dealToFormValues,
  emptyDealFormValues,
  toCreateDealPayload,
  type DealFormValues,
} from "@/lib/deal-form";
import { dealModuleConfig as cfg } from "@/lib/deal-module";
import { dealsService, type ApiDeal } from "@/lib/api/services/deals";
import { notifyApiError, type ApiError } from "@/lib/api/axios";
import { formatDateTime } from "@/lib/module-ui";
import { cn } from "@/lib/utils";

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function ownerName(deal: ApiDeal) {
  return (
    [deal.firstName, deal.middleName, deal.lastName].map((p) => p?.trim()).filter(Boolean).join(" ") ||
    "Untitled deal"
  );
}

function fullName(last?: string | null, first?: string | null, middle?: string | null) {
  const parts = [first, middle, last].map((p) => p?.trim()).filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

function dash(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function FlagChip({
  active,
  label,
  tone = "neutral",
}: {
  active: boolean;
  label: string;
  tone?: "neutral" | "warn" | "accent";
}) {
  if (!active) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tone === "warn" && "border-amber-400/50 bg-amber-100 text-amber-950",
        tone === "accent" && "border-accent/25 bg-accent/10 text-foreground",
        tone === "neutral" && "border-border bg-muted text-foreground",
      )}
    >
      {label}
    </span>
  );
}

function Field({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <div className="text-[13px] font-bold tracking-[0.02em] text-foreground/90">
        {label}
      </div>
      <div
        className={cn(
          "whitespace-normal break-words text-[12px] font-normal text-muted-foreground",
          mono && "font-mono text-[11px]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DossierSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b border-border/60 bg-gradient-to-r from-accent/10 via-muted/30 to-transparent px-4 py-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent">{icon}</span>
        <h3 className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
          {title}
        </h3>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function DealDetailPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const search = useSearch({ strict: false }) as { mode?: "edit" | "view" };
  const id = String(params.id ?? "");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canModify = usePermission({ route: cfg.permissionRoute, action: "modify" });
  const canDelete = usePermission({ route: cfg.permissionRoute, action: "delete" });
  const [confirmDel, setConfirmDel] = useState(false);
  const isEditing = search.mode === "edit" && canModify;

  function openEdit() {
    navigate({ to: "/deals/$id", params: { id }, search: { mode: "edit" }, replace: true });
  }

  function openView() {
    navigate({ to: "/deals/$id", params: { id }, search: {}, replace: true });
  }

  const dealQuery = useQuery({
    queryKey: [...cfg.queryKey, id],
    queryFn: async () => (await dealsService.get(id)).data,
    enabled: Boolean(id),
  });
  const deal = dealQuery.data;

  const defaults = useMemo<DealFormValues>(
    () => (deal ? dealToFormValues(deal) : emptyDealFormValues),
    [deal],
  );

  const form = useForm<DealFormValues>({
    resolver: zodResolver(createDealFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!deal) return;
    form.reset(defaults);
  }, [deal, defaults, form]);

  const updateMutation = useMutation({
    mutationFn: (values: DealFormValues) => dealsService.update(id, toCreateDealPayload(values)),
    onSuccess: (res) => {
      toast.success(res.message || `${cfg.labels.entityTitle} updated`);
      queryClient.setQueryData([...cfg.queryKey, id], res.data);
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      openView();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => dealsService.remove(id),
    onSuccess: (res) => {
      toast.success(res.message || `${cfg.labels.entityTitle} deleted`);
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      navigate({ to: cfg.listPath });
    },
    onError: (err) => notifyApiError(err, `Failed to delete ${cfg.labels.entity}`),
  });

  async function submit(values: DealFormValues) {
    try {
      await updateMutation.mutateAsync(values);
    } catch (err) {
      notifyApiError(err, `Failed to update ${cfg.labels.entity}`);
    }
  }

  function handleCancel() {
    form.reset(defaults);
    openView();
  }

  if (dealQuery.isLoading) {
    return (
      <div className="card-elevated grid place-items-center p-12 text-sm text-muted-foreground">
        <Loader2 className="mb-2 h-5 w-5 animate-spin" />
        {cfg.labels.loadingDetail}
      </div>
    );
  }

  if (dealQuery.isError || !deal) {
    return (
      <div className="card-elevated p-12 text-center">
        <AlertCircle className="mx-auto mb-2 h-5 w-5 text-destructive" />
        <h2 className="font-display text-lg font-semibold">Unable to load {cfg.labels.entity}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {(dealQuery.error as unknown as ApiError)?.message ||
            "This deal may have been deleted."}
        </p>
        <Button className="mt-4" asChild>
          <Link to={cfg.listPath}>{cfg.labels.backLabel}</Link>
        </Button>
      </div>
    );
  }

  const saving = updateMutation.isPending;
  const titleName = ownerName(deal);
  const vehicleLine = [deal.modelYear, deal.make, deal.vehicleTypeName, deal.bodyTypeModel]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <RequirePermission route={cfg.permissionRoute} action="read">
      <div className="space-y-5">
        {isEditing ? (
          <Form form={form} onSubmit={submit} className="w-full">
            <FormPageCard
              title={cfg.labels.editTitle}
              onBack={{ label: "Back to details", onClick: handleCancel }}
              maxWidth="w-full"
              className="space-y-2.5 p-3 sm:p-4"
              footer={
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <SubmitButton size="sm" loadingText="Saving…" disabled={saving}>
                    {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    Save changes
                  </SubmitButton>
                </div>
              }
            >
              <DealFormFields embedded disabled={saving} applyDefaults={false} />
            </FormPageCard>
          </Form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link
                to={cfg.listPath}
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {cfg.labels.backLabel}
              </Link>
              <span className="text-border" aria-hidden>
                /
              </span>
              <span className="text-foreground">{cfg.labels.viewTitle}</span>
            </div>

            <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                      {titleName}
                    </h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      {vehicleLine || "Vehicle details on file"}
                      {deal.purchaseOrLeaseName ? ` · ${deal.purchaseOrLeaseName}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canModify ? (
                      <Button variant="outline" size="sm" onClick={openEdit}>
                        <Pencil className="h-4 w-4" />
                        {cfg.labels.editButton}
                      </Button>
                    ) : null}
                    <Can route={cfg.permissionRoute} action="delete">
                      <Button variant="default" size="sm" onClick={() => setConfirmDel(true)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </Can>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <FlagChip active label={deal.dealTypeName || "Deal"} tone="accent" />
                  <FlagChip active={deal.voidUnwind} label="Void / Unwind" tone="warn" />
                  <FlagChip active={deal.outOfStateDelivery} label="Out of state Delivery" />
                  <FlagChip active={deal.customerDemand} label="Customer demand" />
                  <FlagChip active={deal.priorRdf} label="Prior RDF" />
                </div>

                <div className="flex flex-wrap items-center gap-x-0 gap-y-2 border-t border-border/70 pt-3 text-sm">
                  <HeroMeta label="Purchase price" value={formatMoney(deal.purchasePrice)} />
                  <span className="mx-3 hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
                  <HeroMeta label="Date of sale" value={dash(deal.dateOfSale)} />
                  <span className="mx-3 hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
                  <HeroMeta label="VIN" value={deal.vin} mono />
                  <span className="mx-3 hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
                  <HeroMeta label="Stock #" value={dash(deal.stockNumber)} mono />
                </div>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
              <div className="space-y-4">
                <DossierSection title="Buyer" icon={<UserRound className="h-3.5 w-3.5" />}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Full name" value={fullName(deal.lastName, deal.firstName, deal.middleName)} />
                    <Field label="Buyer type" value={dash(deal.buyerTypeName)} />
                    <Field label="Driver license" value={dash(deal.driverLicense)} mono />
                  </div>
                </DossierSection>

                <DossierSection title="Second buyer" icon={<Shield className="h-3.5 w-3.5" />}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Relation" value={dash(deal.secondOwnerRelationName)} />
                    <Field
                      label="Full name"
                      value={fullName(deal.secondLastName, deal.secondFirstName, deal.secondMiddleName)}
                    />
                    <Field label="Buyer type" value={dash(deal.secondBuyerTypeName)} />
                    <Field label="Driver license" value={dash(deal.secondDriverLicense)} mono />
                  </div>
                </DossierSection>

                <DossierSection title="Vehicle" icon={<Car className="h-3.5 w-3.5" />}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="VIN" value={deal.vin} mono />
                    <Field label="Stock #" value={dash(deal.stockNumber)} mono />
                    <Field label="Make" value={dash(deal.make)} />
                    <Field label="Model year" value={dash(deal.modelYear)} />
                    <Field label="Vehicle type" value={dash(deal.vehicleTypeName)} />
                    <Field label="Body type / model" value={dash(deal.bodyTypeModel)} />
                    <Field
                      label="Odometer"
                      value={
                        [deal.odometer, deal.odometerUnitName, deal.odometerStatusName]
                          .filter(Boolean)
                          .join(" · ") || "—"
                      }
                    />
                    <Field label="Equip #" value={dash(deal.equipNumber)} mono />
                    <Field label="Engine #" value={dash(deal.engineNumber)} mono />
                  </div>
                </DossierSection>
              </div>

              <div className="space-y-4">
                <DossierSection title="Registered address" icon={<MapPin className="h-3.5 w-3.5" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Street line 1" value={dash(deal.streetLine1)} className="sm:col-span-2" />
                    <Field label="Street line 2" value={dash(deal.streetLine2)} className="sm:col-span-2" />
                    <Field label="City" value={dash(deal.city)} />
                    <Field label="Zip" value={dash(deal.zip)} />
                    <Field label="State" value={dash(deal.state)} />
                    <Field label="Country" value={dash(deal.country)} />
                    <Field label="Phone" value={dash(deal.phone)} />
                    <Field label="Email" value={dash(deal.email)} />
                  </div>
                </DossierSection>

                <DossierSection title="Deal & lienholder" icon={<FileText className="h-3.5 w-3.5" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Deal type" value={dash(deal.dealTypeName)} />
                    <Field label="RS number" value={dash(deal.rsNumber)} mono />
                    <Field label="Salesperson #" value={dash(deal.salespersonNumber)} mono />
                    <Field label="Customer #" value={dash(deal.customerNumber)} mono />
                    <Field label="ELT #" value={dash(deal.eltNumber)} mono />
                    <Field label="Lienholder" value={dash(deal.lienholderName)} />
                  </div>
                  <div className="mt-4 grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                    <Field
                      label="Street line 1"
                      value={dash(deal.lienholderStreetLine1)}
                      className="sm:col-span-2"
                    />
                    <Field
                      label="Street line 2"
                      value={dash(deal.lienholderStreetLine2)}
                      className="sm:col-span-2"
                    />
                    <Field label="City" value={dash(deal.lienholderCity)} />
                    <Field label="State" value={dash(deal.lienholderState)} />
                    <Field label="Zip" value={dash(deal.lienholderZip)} />
                  </div>
                </DossierSection>

                <DossierSection title="Dates & pricing" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date of sale" value={dash(deal.dateOfSale)} />
                    <Field label="First operated" value={dash(deal.dateFirstOperated)} />
                    <Field label="RS received" value={dash(deal.rsReceivedDate)} />
                    <Field label="Dealer inventory" value={dash(deal.dealerInventoryDate)} />
                    <Field label="Repossession" value={dash(deal.dateOfRepossession)} />
                    <Field label="Purchase price" value={formatMoney(deal.purchasePrice)} />
                    <Field
                      label="Fees collected"
                      value={deal.feesCollected != null ? formatMoney(deal.feesCollected) : "—"}
                    />
                    <Field label="Created" value={formatDateTime(deal.createdDate)} />
                  </div>
                  {deal.comments?.trim() ? (
                    <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                      {deal.comments}
                    </div>
                  ) : null}
                </DossierSection>
              </div>
            </div>
          </>
        )}

        {confirmDel && canDelete ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => setConfirmDel(false)}
          >
            <div
              className="w-full max-w-md rounded-lg border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-semibold">Delete {titleName}?</h3>
              <p className="mt-2 text-sm text-muted-foreground">{cfg.labels.deleteConfirm}</p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDel(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {cfg.labels.deleteButton}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}

function HeroMeta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-semibold text-foreground", mono && "font-mono text-[13px]")}>{value}</span>
    </span>
  );
}
