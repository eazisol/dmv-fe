import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { AppTooltip } from "@/components/AppTooltip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { capabilitiesService, type ApiCapabilityDefinition } from "@/lib/api/services/access";
import { menusService } from "@/lib/api/services/menus";
import { permissionsService } from "@/lib/api/services/permissions";
import { notifyApiError } from "@/lib/api/axios";
import { hasCapability } from "@/lib/access";
import { usePermissions } from "@/contexts/PermissionContext";
import {
  buildPermissionTree,
  collectExpandableMenuIds,
  findPermissionNode,
  flattenTreeForSave,
  mergePermissions,
  samePermissionTree,
  setPermissionFlag,
  type PermissionFlag,
  type PermissionTreeNode,
} from "@/lib/permission-tree";
import { cn } from "@/lib/utils";

const gridClass = "grid grid-cols-[1fr_2.75rem_2.75rem_2.75rem]";

export type UserAccessOverridesHandle = {
  isDirty: boolean;
  isSaving: boolean;
  save: () => Promise<void>;
  reset: () => void;
};

type Props = {
  userId: string;
  canModify: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

/**
 * Embeddable menu + capability overrides for Edit User → Permissions tab.
 * Save/reset is driven by the parent via ref (shared footer with Details).
 */
export const UserAccessOverridesPanel = forwardRef<UserAccessOverridesHandle, Props>(
  function UserAccessOverridesPanel({ userId, canModify, onDirtyChange }, ref) {
    const queryClient = useQueryClient();
    const { access, refreshPermissions } = usePermissions();
    const [draft, setDraft] = useState<PermissionTreeNode[]>([]);
    const [capabilityDraft, setCapabilityDraft] = useState<ApiCapabilityDefinition[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const menusQuery = useQuery({
      queryKey: ["menus", "tree"],
      queryFn: async () => (await menusService.tree()).data ?? [],
    });

    const permsQuery = useQuery({
      queryKey: ["permissions", "user", userId],
      queryFn: async () => (await permissionsService.getByUser(userId)).data ?? [],
      enabled: Boolean(userId),
    });

    const capQuery = useQuery({
      queryKey: ["permissions", "capabilities", "user", userId],
      queryFn: async () => (await capabilitiesService.getByUser(userId)).data,
      enabled: Boolean(userId),
    });

    const serverTree = useMemo(() => {
      const menus = menusQuery.data ?? [];
      const perms = permsQuery.data ?? [];
      if (menus.length === 0) return [];
      return mergePermissions(buildPermissionTree(menus), perms);
    }, [menusQuery.data, permsQuery.data]);

    const serverCapabilities = capQuery.data?.capabilities ?? [];

    const resetToServer = useCallback(() => {
      setDraft(serverTree);
      setExpandedIds(new Set(collectExpandableMenuIds(serverTree)));
      setCapabilityDraft(serverCapabilities);
    }, [serverTree, serverCapabilities]);

    useEffect(() => {
      resetToServer();
    }, [resetToServer]);

    const isDirty =
      (draft.length > 0 && !samePermissionTree(draft, serverTree)) ||
      (capabilityDraft.length > 0 &&
        (capabilityDraft.length !== serverCapabilities.length ||
          capabilityDraft.some(
            (item, index) => item.isGranted !== serverCapabilities[index]?.isGranted,
          )));

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const saveMutation = useMutation({
      mutationFn: async () => {
        const menuDirty = draft.length > 0 && !samePermissionTree(draft, serverTree);
        const capDirty =
          capabilityDraft.length > 0 &&
          (capabilityDraft.length !== serverCapabilities.length ||
            capabilityDraft.some(
              (item, index) => item.isGranted !== serverCapabilities[index]?.isGranted,
            ));

        await Promise.all([
          menuDirty
            ? permissionsService.assignForUser(userId, flattenTreeForSave(draft))
            : Promise.resolve(null),
          capDirty
            ? capabilitiesService.assignForUser(
                userId,
                capabilityDraft.map((item) => ({ code: item.code, isGranted: item.isGranted })),
              )
            : Promise.resolve(null),
        ]);
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["permissions", "user", userId] }),
          queryClient.invalidateQueries({
            queryKey: ["permissions", "capabilities", "user", userId],
          }),
        ]);
        void refreshPermissions({ background: true });
      },
      onError: (err) => notifyApiError(err, "Failed to save permissions"),
    });

    const saveOverrides = useCallback(async () => {
      if (!isDirty) return;
      await saveMutation.mutateAsync();
    }, [isDirty, saveMutation]);

    useImperativeHandle(
      ref,
      () => ({
        isDirty,
        isSaving: saveMutation.isPending,
        save: saveOverrides,
        reset: resetToServer,
      }),
      [isDirty, resetToServer, saveMutation.isPending, saveOverrides],
    );

    function toggle(menuId: string, flag: PermissionFlag) {
      setDraft((prev) => {
        const node = findPermissionNode(prev, menuId);
        if (!node) return prev;
        return setPermissionFlag(prev, menuId, flag, !node[flag]);
      });
    }

    const loading =
      menusQuery.isLoading ||
      permsQuery.isLoading ||
      ((menusQuery.isFetching || permsQuery.isFetching) && draft.length === 0);
    const loadError = menusQuery.isError || permsQuery.isError;
    const saving = saveMutation.isPending;
    const showTree = draft.length > 0 && !loading && !loadError;

    const toggleableCaps = capabilityDraft.filter((item) =>
      hasCapability(access?.capabilities, item.code),
    );
    const allCapsGranted =
      toggleableCaps.length > 0 && toggleableCaps.every((item) => item.isGranted);

    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Menu access</h3>
          {loading ? (
            <div className="grid place-items-center rounded-md border border-border p-8 text-sm text-muted-foreground">
              <Loader2 className="mb-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-border p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-5 w-5 text-destructive" />
              <div className="text-sm font-medium">Unable to load menu access</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  void menusQuery.refetch();
                  void permsQuery.refetch();
                }}
              >
                Retry
              </Button>
            </div>
          ) : !showTree ? (
            <div className="rounded-md border border-border p-8 text-center text-sm text-muted-foreground">
              No menus available.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <div
                className={cn(
                  gridClass,
                  "gap-0 border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                )}
              >
                <div className="px-3 py-2">Menu</div>
                <div className="px-1 py-2 text-center">R</div>
                <div className="px-1 py-2 text-center">M</div>
                <div className="px-1 py-2 text-center">D</div>
              </div>
              <div className="divide-y">
                {draft.map((node) => (
                  <OverrideTreeRow
                    key={node.menuId}
                    node={node}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggleExpanded={(menuId, open) => {
                      setExpandedIds((prev) => {
                        const next = new Set(prev);
                        if (open) next.add(menuId);
                        else next.delete(menuId);
                        return next;
                      });
                    }}
                    onToggleFlag={toggle}
                    canModify={canModify}
                    saving={saving}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {capabilityDraft.length > 0 ? (
          <aside className="w-full shrink-0 space-y-2 lg:w-72">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-foreground">Capabilities</h3>
                <AppTooltip
                  content="User-level capability grants override the role for this account."
                  side="top"
                  align="start"
                  contentClassName="max-w-xs text-xs"
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="About capabilities"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </AppTooltip>
              </div>
              {toggleableCaps.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  disabled={!canModify || saving}
                  onClick={() => {
                    const codes = new Set(toggleableCaps.map((c) => c.code.toUpperCase()));
                    setCapabilityDraft((prev) =>
                      prev.map((row) =>
                        codes.has(row.code.toUpperCase())
                          ? { ...row, isGranted: !allCapsGranted }
                          : row,
                      ),
                    );
                  }}
                >
                  {allCapsGranted ? "Deselect all" : "Select all"}
                </Button>
              ) : null}
            </div>
            <div className="space-y-0.5 rounded-md border border-border p-2">
              {capabilityDraft.map((item) => {
                const locked =
                  !canModify || saving || !hasCapability(access?.capabilities, item.code);
                return (
                  <label
                    key={item.code}
                    className={cn(
                      "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50",
                      locked && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Checkbox
                      checked={item.isGranted}
                      disabled={locked}
                      onCheckedChange={(checked) => {
                        if (!hasCapability(access?.capabilities, item.code)) return;
                        setCapabilityDraft((prev) =>
                          prev.map((row) =>
                            row.code === item.code
                              ? { ...row, isGranted: Boolean(checked) }
                              : row,
                          ),
                        );
                      }}
                    />
                    <span className="text-sm font-medium leading-none text-foreground">
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </aside>
        ) : null}
      </div>
    );
  },
);

function OverrideTreeRow({
  node,
  depth,
  expandedIds,
  onToggleExpanded,
  onToggleFlag,
  canModify,
  saving,
}: {
  node: PermissionTreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpanded: (menuId: string, open: boolean) => void;
  onToggleFlag: (menuId: string, flag: PermissionFlag) => void;
  canModify: boolean;
  saving: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const open = expandedIds.has(node.menuId);
  const baseDisabled = saving || !canModify;
  const modifyDeleteDisabled = baseDisabled || !node.read;

  const row = (
    <div
      className={cn(
        gridClass,
        "items-center hover:bg-muted/30",
        depth === 0 && hasChildren && "bg-muted/10",
      )}
    >
      <div
        className="flex min-w-0 items-center gap-1 px-3 py-2"
        style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={open ? `Collapse ${node.menuName}` : `Expand ${node.menuName}`}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="inline-flex h-6 w-6 shrink-0" aria-hidden />
        )}
        <div
          className={cn(
            "min-w-0 truncate text-xs font-medium text-muted-foreground",
            hasChildren && "text-foreground/90",
          )}
          title={node.menuName}
        >
          {node.menuName}
        </div>
      </div>
      {(["read", "modify", "delete"] as const).map((flag) => (
        <div key={flag} className="px-1 py-2 text-center">
          <div className="inline-flex justify-center">
            <Checkbox
              checked={node[flag]}
              disabled={flag === "read" ? baseDisabled : modifyDeleteDisabled}
              onCheckedChange={() => onToggleFlag(node.menuId, flag)}
              aria-label={`${node.menuName} ${flag}`}
            />
          </div>
        </div>
      ))}
    </div>
  );

  if (!hasChildren) {
    return row;
  }

  return (
    <Collapsible open={open} onOpenChange={(next) => onToggleExpanded(node.menuId, next)}>
      {row}
      <CollapsibleContent>
        {node.children.map((child) => (
          <OverrideTreeRow
            key={child.menuId}
            node={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggleExpanded={onToggleExpanded}
            onToggleFlag={onToggleFlag}
            canModify={canModify}
            saving={saving}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
