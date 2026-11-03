import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormPageCard } from "@/components/FormPageCard";
import { DetailProfileHero, type DetailProfileHighlight } from "@/components/DetailProfileHero";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  underlineTabListClass,
  underlineTabTriggerClass,
} from "@/components/ui/tabs";
import { AlertCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Form, SwitchField } from "@/components/form";
import { Can, usePermission } from "@/components/Permission";
import {
  UserAccessOverridesPanel,
  type UserAccessOverridesHandle,
} from "@/components/users/UserAccessOverridesPanel";
import { UserFormFields } from "@/components/users/UserFormFields";
import { displayUserName } from "@/components/users/UsersListPage";
import { resolveProfileImageUrl, usersService, toDateInputValue } from "@/lib/api/services/users";
import { notifyApiError, type ApiError } from "@/lib/api/axios";
import { ActiveStatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/module-ui";
import { formatUkDate } from "@/lib/week-ending";
import { userModuleConfig as cfg } from "@/lib/user-module";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION_UPDATED_STORAGE_KEY, usePermissions } from "@/contexts/PermissionContext";
import {
  editUserFormSchema,
  emptyUserFormValues,
  toUpdateUserPayload,
  userToFormValues,
  type UserFormValues,
} from "@/lib/user-form";
import { cn } from "@/lib/utils";

type EditTab = "details" | "permissions";

export function UserDetailPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const search = useSearch({ strict: false }) as { mode?: "edit" | "view" };
  const id = String(params.id ?? "");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: sessionUser } = useAuth();
  const { refreshPermissions } = usePermissions();
  const canModify = usePermission({ route: cfg.permissionRoute, action: "modify" });
  const canDelete = usePermission({ route: cfg.permissionRoute, action: "delete" });
  const [confirmDel, setConfirmDel] = useState(false);
  const [editTab, setEditTab] = useState<EditTab>("details");
  const [overridesDirty, setOverridesDirty] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const overridesRef = useRef<UserAccessOverridesHandle>(null);
  const isEditing = search.mode === "edit" && canModify;

  function openEdit() {
    setEditTab("details");
    navigate({ to: "/users/$id", params: { id }, search: { mode: "edit" }, replace: true });
  }

  function openView() {
    navigate({ to: "/users/$id", params: { id }, search: {}, replace: true });
  }

  const userQuery = useQuery({
    queryKey: [...cfg.queryKey, id],
    queryFn: async () => (await usersService.get(id)).data,
    enabled: Boolean(id),
  });
  const user = userQuery.data;

  const defaults = useMemo<UserFormValues>(
    () => (user ? userToFormValues(user) : emptyUserFormValues),
    [user],
  );

  const form = useForm<UserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: defaults,
  });
  useEffect(() => {
    if (!user) return;
    form.reset(defaults);
  }, [user, defaults, form]);

  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      usersService.update(id, toUpdateUserPayload(values, user?.userTypeId)),
    onSuccess: (res) => {
      queryClient.setQueryData([...cfg.queryKey, id], res.data);
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      if (sessionUser?.id === id) {
        window.localStorage.setItem(PERMISSION_UPDATED_STORAGE_KEY, String(Date.now()));
        void refreshPermissions();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersService.remove(id),
    onSuccess: (res) => {
      toast.success(res.message || `${cfg.labels.entityTitle} deleted`);
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      navigate({ to: "/users" });
    },
    onError: (err) => notifyApiError(err, `Failed to delete ${cfg.labels.entity}`),
  });

  const onOverridesDirtyChange = useCallback((dirty: boolean) => {
    setOverridesDirty(dirty);
  }, []);

  const detailsDirty = form.formState.isDirty;
  const anyDirty = detailsDirty || overridesDirty;
  const busy = savingAll || updateMutation.isPending || Boolean(overridesRef.current?.isSaving);

  async function handleSaveAll() {
    if (!anyDirty || busy) return;
    setSavingAll(true);
    try {
      let savedSomething = false;
      if (detailsDirty) {
        const valid = await form.trigger();
        if (!valid) {
          setEditTab("details");
          return;
        }
        const values = form.getValues();
        const res = await updateMutation.mutateAsync(values);
        form.reset(userToFormValues(res.data!));
        savedSomething = true;
      }
      if (overridesRef.current?.isDirty) {
        await overridesRef.current.save();
        savedSomething = true;
      }
      if (savedSomething) {
        toast.success(`${cfg.labels.entityTitle} saved`);
      }
    } catch (err) {
      notifyApiError(err, `Failed to save ${cfg.labels.entity}`);
    } finally {
      setSavingAll(false);
    }
  }

  function handleCancel() {
    form.reset(defaults);
    overridesRef.current?.reset();
    openView();
  }

  if (userQuery.isLoading) {
    return (
      <div className="card-elevated grid place-items-center p-12 text-sm text-muted-foreground">
        <Loader2 className="mb-2 h-5 w-5 animate-spin" />
        {cfg.labels.loadingDetail}
      </div>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <div className="card-elevated p-12 text-center">
        <AlertCircle className="mx-auto mb-2 h-5 w-5 text-destructive" />
        <h2 className="font-display text-lg font-semibold">Unable to load {cfg.labels.entity}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {(userQuery.error as unknown as ApiError)?.message ||
            "This account may have been deleted."}
        </p>
        <Button className="mt-4" asChild>
          <Link to="/users">{cfg.labels.backLabel}</Link>
        </Button>
      </div>
    );
  }

  const profileImageUrl = resolveProfileImageUrl(user.profileImagePath, user.editDate);
  const name = displayUserName(user);
  const roleLabels = Object.fromEntries(
    (user.roleIds ?? []).map((roleId, index) => [String(roleId), user.roleNames?.[index] ?? String(roleId)]),
  );

  const roles = (user.roleNames ?? []).map((n) => n.trim()).filter(Boolean);
  const highlights: DetailProfileHighlight[] = [];
  const loginUsername = user.username?.trim();
  if (loginUsername && loginUsername.toLowerCase() !== user.email?.trim().toLowerCase()) {
    highlights.push({ label: "Username", value: loginUsername });
  }
  if (user.userTypeName) highlights.push({ label: "User type", value: user.userTypeName });
  if (user.createdDate) {
    highlights.push({ label: "Member since", value: formatDateTime(user.createdDate) });
  }

  const dobRaw = toDateInputValue(user.dateOfBirth);

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="w-full max-w-5xl">
          <Form
            form={form}
            onSubmit={() => {
              void handleSaveAll();
            }}
            className="min-w-0 w-full"
          >
            <FormPageCard
              title={cfg.labels.editTitle}
              onBack={{ label: "Back to details", onClick: handleCancel }}
              headerActions={<SwitchField<UserFormValues> name="isActive" label="Active" />}
              maxWidth="w-full max-w-5xl"
              footer={
                <>
                  <span className="text-xs text-muted-foreground sm:mr-auto">
                    {anyDirty ? "Unsaved changes" : "All changes saved"}
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!anyDirty || busy}
                      onClick={() => void handleSaveAll()}
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {busy ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </>
              }
            >
              <Tabs
                value={editTab}
                onValueChange={(v) => setEditTab(v as EditTab)}
                className="w-full"
              >
                <TabsList className={cn(underlineTabListClass, "mb-1 w-full border-b border-border")}>
                  <TabsTrigger value="details" className={underlineTabTriggerClass}>
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className={underlineTabTriggerClass}>
                    Permissions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 focus-visible:ring-0">
                  <UserFormFields
                    embedded
                    variant="edit"
                    disabled={busy}
                    roleSelectedLabels={roleLabels}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="mt-4 focus-visible:ring-0">
                  <UserAccessOverridesPanel
                    ref={overridesRef}
                    userId={id}
                    canModify={canModify}
                    onDirtyChange={onOverridesDirtyChange}
                  />
                </TabsContent>
              </Tabs>
            </FormPageCard>
          </Form>
        </div>
      ) : (
        <DetailProfileHero
          className="w-full"
          title={cfg.labels.viewTitle}
          backLabel={cfg.labels.backLabel}
          backTo="/users"
          headerActions={
            <>
              {canModify && (
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Pencil className="h-4 w-4" />
                  {cfg.labels.editButton}
                </Button>
              )}
              <Can route={cfg.permissionRoute} action="delete">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={() => setConfirmDel(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </Can>
            </>
          }
          name={name}
          tags={roles.length ? roles.map((label) => ({ label })) : undefined}
          imageUrl={profileImageUrl || undefined}
          imageAlt={`${cfg.labels.entityTitle} profile`}
          status={<ActiveStatusBadge isActive={user.isActive} />}
          email={user.email}
          phone={user.phone}
          dateOfBirth={dobRaw ? formatUkDate(dobRaw) : undefined}
          highlights={highlights.length ? highlights : undefined}
        />
      )}

      {confirmDel && canDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setConfirmDel(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold">Delete {name}?</h3>
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
      )}
    </div>
  );
}
