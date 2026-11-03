import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import type { ReactNode } from "react";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { FormFieldLabel } from "@/components/form/FormFieldLabel";
import { shouldShowFieldError } from "@/components/form/shouldShowFieldError";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

function toPickerValue(raw: string, fallback: string): string {
  const v = raw.trim();
  return HEX6.test(v) ? v.toUpperCase() : fallback;
}

export interface ColorFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Used by the native color input when the field is empty. */
  fallbackHex?: string;
}

export function ColorField<T extends FieldValues>({
  name,
  label,
  description,
  required,
  disabled,
  className,
  fallbackHex = "#0D9488",
}: ColorFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const submitting = formState.isSubmitting;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const invalid = shouldShowFieldError(fieldState.error, formState.isSubmitted);
        const textValue = String(field.value ?? "");
        const pickerValue = toPickerValue(textValue, fallbackHex);

        return (
          <FormItem className={className}>
            {label && (
              <FormFieldLabel label={label} description={description} required={required} />
            )}
            <div className="flex items-center gap-2">
              <FormControl>
                <input
                  type="color"
                  aria-label={typeof label === "string" ? label : "Color"}
                  value={pickerValue}
                  disabled={disabled || submitting}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  onBlur={field.onBlur}
                  className={cn(
                    "h-9 w-11 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1 disabled:cursor-not-allowed disabled:opacity-50",
                    invalid && "border-destructive",
                  )}
                />
              </FormControl>
              <Input
                name={field.name}
                value={textValue}
                placeholder={fallbackHex}
                maxLength={7}
                disabled={disabled || submitting}
                onBlur={field.onBlur}
                onChange={(e) => {
                  const next = e.target.value.trim();
                  field.onChange(next.startsWith("#") || next === "" ? next : `#${next}`);
                }}
                className={cn(
                  "font-mono uppercase",
                  invalid && "border-destructive focus-visible:ring-destructive",
                )}
                aria-invalid={invalid || undefined}
              />
            </div>
            {invalid && fieldState.error?.message ? (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            ) : null}
          </FormItem>
        );
      }}
    />
  );
}
