import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormPageCard } from "@/components/FormPageCard";
import { Button } from "@/components/ui/button";
import { Form, SubmitButton } from "@/components/form";
import { RequirePermission } from "@/components/Permission";
import { DealFormFields } from "@/components/deals/DealFormFields";
import {
  createDealFormSchema,
  emptyDealFormValues,
  toCreateDealPayload,
  type DealFormValues,
} from "@/lib/deal-form";
import { dealModuleConfig as cfg } from "@/lib/deal-module";
import { dealsService } from "@/lib/api/services/deals";
import { notifyApiError } from "@/lib/api/axios";

export function DealCreatePage() {
  const navigate = useNavigate();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(createDealFormSchema),
    defaultValues: emptyDealFormValues,
  });

  const createMutation = useMutation({
    mutationFn: (values: DealFormValues) => dealsService.create(toCreateDealPayload(values)),
    onSuccess: (res) => {
      const owner = [res.data?.firstName, res.data?.lastName].filter(Boolean).join(" ");
      toast.success(res.message || `Deal${owner ? ` for ${owner}` : ""} created`);
      navigate({ to: cfg.listPath });
    },
  });

  async function submit(values: DealFormValues) {
    try {
      await createMutation.mutateAsync(values);
    } catch (err) {
      notifyApiError(err, `Failed to create ${cfg.labels.entity}`);
    }
  }

  const saving = createMutation.isPending;

  return (
    <RequirePermission route={cfg.permissionRoute} action="modify">
      <Form form={form} onSubmit={submit} className="w-full">
        <FormPageCard
          title={cfg.labels.addTitle}
          back={{ to: cfg.listPath, label: cfg.labels.backLabel }}
          maxWidth="w-full"
          className="space-y-2.5 p-3 sm:p-4"
          footer={
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: cfg.listPath })}
                disabled={saving}
              >
                Cancel
              </Button>
              <SubmitButton size="sm" loadingText="Saving…" disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {cfg.labels.createButton}
              </SubmitButton>
            </div>
          }
        >
          <DealFormFields embedded disabled={saving} />
        </FormPageCard>
      </Form>
    </RequirePermission>
  );
}
