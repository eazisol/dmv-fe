import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { FormPageCard } from "@/components/FormPageCard";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/Permission";
import { scanModuleConfig as cfg } from "@/lib/scan-module";
import {
  documentScansService,
  resolveUploadUrl,
  type ApiDocumentScan,
  type ApiReg397Fields,
} from "@/lib/api/services/document-scans";
import type { ApiError } from "@/lib/api/axios";
import { formatDateTime } from "@/lib/module-ui";
import { cn } from "@/lib/utils";

function dash(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | boolean | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-[12px] font-semibold tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-sm text-foreground break-words", mono && "font-mono text-xs")}>
        {dash(value)}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function FieldsView({ fields }: { fields: ApiReg397Fields }) {
  return (
    <div className="space-y-4">
      <Section title="Vehicle & sale dates">
        <Field label="Date first sold as new" value={fields.dateFirstSoldAsNew} />
        <Field label="Date first operated" value={fields.dateFirstOperated} />
        <Field label="NRM / IND" value={fields.nrmInd} />
        <Field label="Make" value={fields.make} />
        <Field label="Year model" value={fields.yearModel} />
        <Field label="Body type" value={fields.bodyType} />
        <Field label="Motive power" value={fields.motivePower} />
        <Field label="Number of axles" value={fields.numberOfAxles} />
        <Field label="Unladen weight" value={fields.unladenWeight} />
        <Field label="VIN" value={fields.vin} mono />
        <Field label="M/C engine / additional ID" value={fields.motorcycleEngineNumber} />
        <Field label="OHV/MC dealers only" value={fields.ohvMcDealersOnly} />
        <Field label="Length (in)" value={fields.lengthInches} />
        <Field label="Width (in)" value={fields.widthInches} />
        <Field label="GVWR" value={fields.gvwr} />
        <Field label="County of residence" value={fields.countyOfResidence} />
      </Section>

      <Section title="Sold to / owner">
        <Field label="Buyer full name" value={fields.buyerFullName} />
        <Field label="AND / OR" value={fields.coOwnerAndOr} />
        <Field label="Equipment number" value={fields.equipmentNumber} />
        <Field label="Driver license / ID" value={fields.driverLicenseOrId} mono />
        <Field label="DL state" value={fields.driverLicenseState} />
        <Field label="Physical address" value={fields.purchaserPhysicalAddress} />
        <Field label="Mailing address" value={fields.purchaserMailingAddress} />
        <Field label="Lienholder / legal owner" value={fields.lienholderOrLegalOwner} />
        <Field label="Lienholder address" value={fields.lienholderAddress} />
        <Field label="Electronic lienholder ID" value={fields.electronicLienholderId} mono />
        <Field label="Date" value={fields.soldToDate} />
        <Field label="Buyer signature present" value={fields.buyerSignaturePresent} />
      </Section>

      <Section title="Certificate of cost">
        <Field label="Cost line (1A / 1B)" value={fields.costLine} />
        <Field label="Date purchased / acquired" value={fields.datePurchasedAcquired} />
        <Field label="Cost amount" value={fields.costAmount} />
      </Section>

      <Section title="Odometer disclosure">
        <Field label="Odometer reading" value={fields.odometerReading} />
        <Field label="Dealer number" value={fields.dealerNumber} />
        <Field label="Date" value={fields.odometerDate} />
        <Field label="Buyer printed name" value={fields.buyerPrintedName} />
        <Field label="Buyer signature present" value={fields.buyerOdometerSignaturePresent} />
        <Field label="Seller printed name" value={fields.sellerPrintedName} />
        <Field label="Seller signature present" value={fields.sellerOdometerSignaturePresent} />
      </Section>

      <Section title="Commercial / dealer">
        <Field label="Unladen weight certificate" value={fields.unladenWeightCertificate} />
        <Field label="Dealer certification completed" value={fields.dealerCertificationCompleted} />
      </Section>
    </div>
  );
}

export function ScanDetailPage() {
  const { id } = useParams({ from: "/scans/$id" });
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...cfg.queryKey, id],
    queryFn: async () => (await documentScansService.getById(id)).data,
  });

  return (
    <RequirePermission route={cfg.permissionRoute} action="read">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={cfg.listPath}>
              <ArrowLeft className="h-4 w-4" />
              {cfg.labels.backLabel}
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {cfg.labels.loadingDetail}
          </div>
        ) : isError || !data ? (
          <FormPageCard title="Unable to load scan">
            <p className="text-sm text-muted-foreground">
              {(error as unknown as ApiError | undefined)?.message || "Scan not found."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate({ to: cfg.listPath })}>
                Back
              </Button>
            </div>
          </FormPageCard>
        ) : (
          <ScanDetailBody scan={data} />
        )}
      </div>
    </RequirePermission>
  );
}

function ScanDetailBody({ scan }: { scan: ApiDocumentScan }) {
  const previewUrl = resolveUploadUrl(scan.previewImagePath);
  const fileUrl = resolveUploadUrl(scan.filePath);

  return (
    <>
      <FormPageCard
        title={scan.documentTypeLabel}
        subtitle={`${scan.originalFileName} · Page ${scan.sourcePageStart}${
          scan.sourcePageEnd !== scan.sourcePageStart ? `–${scan.sourcePageEnd}` : ""
        } of ${scan.sourcePageCount} · ${formatDateTime(scan.createdDate)}`}
        maxWidth="max-w-5xl"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
            {scan.status}
          </span>
          <span className="rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {scan.documentType}
          </span>
          {fileUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={fileUrl} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" />
                Open original
              </a>
            </Button>
          ) : null}
        </div>

        {scan.extractionNotes ? (
          <p className="mb-4 whitespace-pre-wrap rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            {scan.extractionNotes}
          </p>
        ) : null}

        {previewUrl ? (
          <div className="mb-6 overflow-hidden rounded-lg border bg-muted/30">
            <img
              src={previewUrl}
              alt="Scan preview"
              className="mx-auto max-h-[480px] w-auto max-w-full object-contain"
            />
          </div>
        ) : null}

        <FieldsView fields={scan.fields} />
      </FormPageCard>
    </>
  );
}
