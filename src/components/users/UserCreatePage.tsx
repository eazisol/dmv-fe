import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormPageCard } from "@/components/FormPageCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, SubmitButton, SwitchField } from "@/components/form";
import { RequirePermission } from "@/components/Permission";
import { UserFormFields } from "@/components/users/UserFormFields";
import { usersService } from "@/lib/api/services/users";
import { notifyApiError } from "@/lib/api/axios";
import { userModuleConfig as cfg } from "@/lib/user-module";
import {
  createUserFormSchema,
  emptyUserFormValues,
  toCreateUserPayload,
  type UserFormValues,
} from "@/lib/user-form";

export function UserCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: emptyUserFormValues,
  });

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => usersService.create(toCreateUserPayload(values)),
    onSuccess: (res) => {
      toast.success(
        res.message ||
          `${res.data?.firstName || res.data?.username || cfg.labels.entityTitle} created`,
      );
      queryClient.invalidateQueries({ queryKey: cfg.queryKey });
      navigate({ to: "/users" });
    },
  });

  async function submit(values: UserFormValues) {
    try {
      await createMutation.mutateAsync(values);
    } catch (err) {
      notifyApiError(err, `Failed to create ${cfg.labels.entity}`);
    }
  }

  return (
    <RequirePermission route={cfg.permissionRoute} action="modify">
      <Form form={form} onSubmit={submit} className="w-full max-w-3xl">
        <FormPageCard
          title={cfg.labels.addTitle}
          back={{ to: cfg.listPath, label: cfg.labels.backLabel }}
          headerActions={<SwitchField<UserFormValues> name="isActive" label="Active" />}
          maxWidth="w-full max-w-3xl"
          footer={
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/users" })}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <SubmitButton size="sm" loadingText="Saving…">
                {createMutation.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                {cfg.labels.createButton}
              </SubmitButton>
            </div>
          }
        >
          <UserFormFields
            embedded
            variant="create"
            disabled={createMutation.isPending}
            autoFocusFirstName
          />
        </FormPageCard>
      </Form>
    </RequirePermission>
  );
}
