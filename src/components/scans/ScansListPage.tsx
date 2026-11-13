import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Can, RequirePermission, usePermission } from "@/components/Permission";
import {
  DataTable,
  useDebouncedSearch,
  type DataTableColumn,
  type DataTableRowAction,
} from "@/components/data-table";
import { scanModuleConfig as cfg } from "@/lib/scan-module";
import {
  documentScansService,
  type ApiDocumentScanListItem,
} from "@/lib/api/services/document-scans";
import { notifyApiError, type ApiError } from "@/lib/api/axios";
import { formatDateTime } from "@/lib/module-ui";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Extracted"
      ? "border-emerald-300/70 bg-emerald-50 text-emerald-900"
      : status === "Failed"
        ? "border-red-300/70 bg-red-50 text-red-900"
        : "border-amber-300/70 bg-amber-50 text-amber-950";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone,
      )}
    >
      {status}
    </span>
  );
}

export function ScansListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const canModify = usePermission({ route: cfg.permissionRoute, action: "modify" });
  const canDelete = usePermission({ route: cfg.permissionRoute, action: "delete" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmDel, setConfirmDel] = useState<ApiDocumentScanListItem | null>(null);
  const { searchInput, setSearchInput, search, clearSearch } = useDebouncedSearch({
    onPageReset: () => setPage(1),
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...cfg.queryKey, { page, pageSize, search }],
    queryFn: async () => (await documentScansService.list({ page, pageSize, search })).data,
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize) || 1);

  const scanMutation = useMutation({
    mutationFn: (file: File) => documentScansService.scan(file),
    onSuccess: (res) => {
      toast.success(res.message || "Document scanned");
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      const id = res.data?.id;
      if (id) {
        navigate({ to: "/scans/$id", params: { id } });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentScansService.remove(id),
    onSuccess: (res) => {
      toast.success(res.message || `${cfg.labels.entityTitle} deleted`);
      setConfirmDel(null);
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
    },
  });

  const columns = useMemo<DataTableColumn<ApiDocumentScanListItem>[]>(
    () => [
      {
        id: "type",
        header: "Document",
        truncate: true,
        width: "28%",
        accessor: (row) => row.documentTypeLabel,
        cell: (row) => (
          <Link
            to="/scans/$id"
            params={{ id: row.id }}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {row.documentTypeLabel}
          </Link>
        ),
      },
      {
        id: "buyer",
        header: "Buyer",
        truncate: true,
        width: "16%",
        cell: (row) => row.buyerName || "—",
      },
      {
        id: "vin",
        header: "VIN",
        truncate: true,
        width: "14%",
        cell: (row) =>
          row.vin ? <span className="font-mono text-xs">{row.vin}</span> : "—",
      },
      {
        id: "vehicle",
        header: "Vehicle",
        truncate: true,
        width: "12%",
        cell: (row) => [row.modelYear, row.make].filter(Boolean).join(" ") || "—",
      },
      {
        id: "status",
        header: "Status",
        width: "8rem",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "scanned",
        header: "Scanned",
        truncate: true,
        width: "12%",
        cell: (row) => formatDateTime(row.createdDate),
      },
    ],
    [],
  );

  const rowActions = useMemo<DataTableRowAction<ApiDocumentScanListItem>[]>(
    () => [
      {
        id: "view",
        label: "View",
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) => navigate({ to: "/scans/$id", params: { id: row.id } }),
      },
      {
        id: "delete",
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        hidden: () => !canDelete,
        onClick: (row) => setConfirmDel(row),
      },
    ],
    [canDelete, navigate],
  );

  const hasActiveFilters = Boolean(search);

  return (
    <RequirePermission route={cfg.permissionRoute} action="read">
      <div>
        <PageHeader
          title={cfg.labels.moduleTitle}
          actions={
            <Can route={cfg.permissionRoute} action="modify">
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    try {
                      await scanMutation.mutateAsync(file);
                    } catch (err) {
                      notifyApiError(err, "Failed to scan document");
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={scanMutation.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {scanMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanLine className="h-4 w-4" />
                  )}
                  {scanMutation.isPending ? "Scanning…" : cfg.labels.addButton}
                </Button>
              </>
            </Can>
          }
        />

        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          loading={isLoading}
          fetching={isFetching}
          loadingText={cfg.labels.loadingList}
          error={
            isError
              ? {
                  title: `Unable to load ${cfg.labels.itemLabel}`,
                  message: (error as unknown as ApiError)?.message || "Please try again.",
                  onRetry: () => {
                    void refetch();
                  },
                }
              : null
          }
          search={{
            value: searchInput,
            onChange: setSearchInput,
            placeholder: cfg.labels.searchPlaceholder,
            "aria-label": `Search ${cfg.labels.itemLabel}`,
          }}
          emptyState={{
            title: cfg.labels.emptyTitle,
            description: canModify
              ? "Scan a REG 397 (new vehicle registration) PDF to add the first entry."
              : "No scans match your filters.",
            action: hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearSearch();
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            ) : canModify ? (
              <Button size="sm" disabled={scanMutation.isPending} onClick={() => fileRef.current?.click()}>
                <ScanLine className="h-4 w-4" />
                {cfg.labels.addButton}
              </Button>
            ) : undefined,
          }}
          rowActions={rowActions}
          pagination={{
            page,
            pageSize,
            totalCount,
            totalPages,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
            itemLabel: cfg.labels.itemLabel,
            disabled: isFetching,
            controlsAlign: "center",
          }}
        />

        {confirmDel ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            onClick={() => setConfirmDel(null)}
          >
            <div
              className="w-full max-w-md rounded-lg border bg-card p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="font-display text-lg font-semibold">Delete scan?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Soft-delete scan{" "}
                <span className="font-medium text-foreground">
                  {confirmDel.buyerName || confirmDel.originalFileName}
                </span>
                . {cfg.labels.deleteConfirm}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDel(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(confirmDel.id);
                    } catch (err) {
                      notifyApiError(err, `Failed to delete ${cfg.labels.entity}`);
                    }
                  }}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}
