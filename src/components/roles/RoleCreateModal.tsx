import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Form, TextField, TextareaField, SwitchField, SubmitButton } from "@/components/form";
import { rolesService, type ApiRole, type RolePayload } from "@/lib/api/services/system-config";
import { notifyApiError } from "@/lib/api/axios";
import {
  CODE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  codeSchema,
  descriptionSchema,
  nameSchema,
  normalizeCodeInput,
} from "@/lib/field-validation";
import { rolesQueryKey } from "@/lib/roles";

const schema = z.object({
  name: nameSchema("Name", 50),
  code: codeSchema("Code", CODE_MAX_LENGTH),
  description: descriptionSchema(),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function RoleCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (role: ApiRole) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: RolePayload) => rolesService.create(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Role created");
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["lookups", "roles"] });
      if (res.data) onCreated?.(res.data);
      form.reset({
        name: "",
        code: "",
        description: "",
        isActive: true,
      });
      onClose();
    },
    onError: (err) => notifyApiError(err, "Failed to create role"),
  });

  async function submit(values: Values) {
    await mutation.mutateAsync({
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim(),
      isActive: values.isActive,
    });
  }

  if (!open) return null;

  return (
    <Form form={form} onSubmit={submit} className="contents">
      <Modal
        open={open}
        onClose={() => {
          if (mutation.isPending) return;
          onClose();
        }}
        title="Add role"
        size="md"
        headerActions={<SwitchField<Values> name="isActive" label="Active" />}
      >
        <div className="space-y-3">
          <fieldset disabled={mutation.isPending} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField<Values> name="name" label="Name" required autoFocus maxLength={50} />
              <TextField<Values>
                name="code"
                label="Code"
                required
                maxLength={CODE_MAX_LENGTH}
                transformValue={normalizeCodeInput}
              />
              <TextareaField<Values>
                name="description"
                label="Description"
                rows={2}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className="sm:col-span-2"
              />
            </div>
          </fieldset>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <SubmitButton size="sm" loadingText="Saving…">
              {mutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Create role
            </SubmitButton>
          </div>
        </div>
      </Modal>
    </Form>
  );
}
