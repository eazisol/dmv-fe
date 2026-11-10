import type { ReactNode } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: ReactNode;
  required?: boolean;
  options: RadioOption[];
  layout?: "stack" | "grid" | "row";
  /** `cards` = bordered pills; `plain` = simple radio + text (compact). */
  variant?: "cards" | "plain";
  disabled?: boolean;
  className?: string;
}

export function RadioGroupField<T extends FieldValues>({
  name,
  label,
  required,
  options,
  layout = "stack",
  variant = "cards",
  disabled,
  className,
}: RadioGroupFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const submitting = formState.isSubmitting;
  const plain = variant === "plain";
  const inlineRow = plain && layout === "row";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            inlineRow && "flex flex-row flex-wrap items-center gap-x-3 gap-y-1 space-y-0",
            className,
          )}
        >
          {label && (
            <FormLabel className={cn(inlineRow && "shrink-0 font-normal")}>
              {label}
              {required && <span className="text-destructive ml-0.5" aria-hidden>*</span>}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              value={field.value ?? ""}
              onValueChange={field.onChange}
              disabled={disabled || submitting}
              className={cn(
                layout === "grid" && "grid grid-cols-1 sm:grid-cols-3 gap-3",
                layout === "row" &&
                  (plain
                    ? "!flex flex-row flex-wrap items-center gap-x-3 gap-y-1"
                    : "!flex flex-row flex-wrap gap-3"),
                layout === "stack" && (plain ? "space-y-1.5" : "space-y-2"),
              )}
            >
              {options.map((o) => {
                const id = `${name}-${o.value}`;
                return (
                  <label
                    key={o.value}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      plain
                        ? "min-h-8 py-0.5"
                        : "items-start gap-2.5 rounded-md border border-input p-3 transition-colors hover:bg-accent/5",
                      !plain && field.value === o.value && "border-accent bg-accent/5",
                      o.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <RadioGroupItem
                      id={id}
                      value={o.value}
                      disabled={o.disabled}
                      className={plain ? undefined : "mt-0.5"}
                    />
                    <div className="min-w-0">
                      <div className={cn("text-sm", plain ? "font-normal" : "font-medium")}>
                        {o.label}
                      </div>
                      {o.description && !plain ? (
                        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {o.description}
                        </div>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
