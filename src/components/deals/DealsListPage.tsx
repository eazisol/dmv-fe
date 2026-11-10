import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
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
import { dealModuleConfig as cfg } from "@/lib/deal-module";
import { dealsService, type ApiDealListItem } from "@/lib/api/services/deals";
import { notifyApiError, type ApiError } from "@/lib/api/axios";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DealsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canModify = usePermission({ route: cfg.permissionRoute, action: "modify" });
  const canDelete = usePermission({ route: cfg.permissionRoute, action: "delete" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmDel, setConfirmDel] = useState<ApiDealListItem | null>(null);
  const { searchInput, setSearchInput, search, clearSearch } = useDebouncedSearch({
    onPageReset: () => setPage(1),
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...cfg.queryKey, { page, pageSize, search }],
    queryFn: async () => (await dealsService.list({ page, pageSize, search })).data,
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize) || 1);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dealsService.remove(id),
    onSuccess: (res) => {
      toast.success(res.message || `${cfg.labels.entityTitle} deleted`);
      setConfirmDel(null);
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
    },
  });

  const columns = useMemo<DataTableColumn<ApiDealListItem>[]>(
    () => [
      {
        id: "owner",
        header: "Owner",
        truncate: false,
        width: "16%",
        cell: (row) => (
          <Link
            to="/deals/$id"
            params={{ id: row.id }}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}
          </Link>
        ),
      },
      {
        id: "vin",
        header: "VIN",
        truncate: false,
        width: "14%",
        cell: (row) => <span className="font-mono text-xs">{row.vin}</span>,
      },
      {
        id: "stock",
        header: "Stock #",
        truncate: false,
        width: "9%",
        cell: (row) => row.stockNumber || "—",
      },
      {
        id: "dealType",
        header: "Deal type",
        truncate: false,
        width: "22%",
        cell: (row) => row.dealTypeName || "—",
      },
      {
        id: "vehicle",
        header: "Vehicle",
        truncate: false,
        width: "16%",
        cell: (row) => [row.make, row.vehicleTypeName].filter(Boolean).join(" · ") || "—",
      },
      {
        id: "sold",
        header: "Sold on",
        truncate: false,
        width: "10%",
        cell: (row) => row.dateOfSale || "—",
      },
      {
        id: "price",
        header: "Price",
        truncate: false,
        width: "9%",
        cell: (row) => formatMoney(row.purchasePrice ?? 0),
      },
    ],
    [],
  );

  const rowActions = useMemo<DataTableRowAction<ApiDealListItem>[]>(
    () => [
      {
        id: "view",
        label: "View",
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) => navigate({ to: "/deals/$id", params: { id: row.id } }),
      },
      {
        id: "edit",
        label: "Edit",
        icon: <Pencil className="h-4 w-4" />,
        hidden: () => !canModify,
        onClick: (row) =>
          navigate({ to: "/deals/$id", params: { id: row.id }, search: { mode: "edit" } }),
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
    [canDelete, canModify, navigate],
  );

  const hasActiveFilters = Boolean(search);

  return (
    <RequirePermission route={cfg.permissionRoute} action="read">
      <div>
        <PageHeader
          title={cfg.labels.moduleTitle}
          // subtitle="Vehicle deals logbook"
          actions={
            <Can route={cfg.permissionRoute} action="modify">
              <Button size="sm" asChild>
                <Link to={cfg.newPath}>
                  <Plus className="h-4 w-4" />
                  {cfg.labels.addButton}
                </Link>
              </Button>
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
              ? "Create the first deal to start the logbook."
              : "No deals match your filters.",
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
              <Button size="sm" asChild>
                <Link to={cfg.newPath}>
                  <Plus className="h-4 w-4" />
                  {cfg.labels.addButton}
                </Link>
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
              <h3 className="font-display text-lg font-semibold">Delete deal?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Soft-delete deal for{" "}
                <span className="font-medium text-foreground">
                  {[confirmDel.firstName, confirmDel.lastName].filter(Boolean).join(" ") ||
                    confirmDel.vin}
                </span>
                .
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
