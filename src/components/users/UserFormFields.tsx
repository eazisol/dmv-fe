import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import {
  TextField,
  PasswordField,
  PhoneNumberField,
  SearchableMultiSelectField,
  type SearchableSelectOption,
} from "@/components/form";
import { PasswordRequirements } from "@/lib/password";
import type { UserFormValues } from "@/lib/user-form";
import { rolesService } from "@/lib/api/services/system-config";
import { DROPDOWN_FETCH_SIZE } from "@/lib/dropdown-fetch";
import { cn } from "@/lib/utils";

async function fetchRoleOptions(search: string): Promise<SearchableSelectOption[]> {
  const res = await rolesService.list({
    page: 1,
    pageSize: DROPDOWN_FETCH_SIZE,
    search,
    sortBy: "name",
    sortDir: "asc",
  });
  return (res.data?.items ?? [])
    .filter((row) => row.isActive !== false)
    .map((row) => ({
      value: String(row.id),
      label: row.name?.trim() || `Role ${row.id}`,
      description: row.description?.trim() || undefined,
    }));
}

/** Core account fields only: name, email, phone, DOB, password, roles. */
export function UserFormFields({
  variant,
  disabled = false,
  embedded = false,
  autoFocusFirstName = false,
  roleSelectedLabels,
}: {
  variant: "create" | "edit";
  disabled?: boolean;
  embedded?: boolean;
  autoFocusFirstName?: boolean;
  /** `{ [roleId]: roleName }` so selected roles render before the options list loads. */
  roleSelectedLabels?: Record<string, string>;
}) {
  const password = useWatch<UserFormValues, "password">({ name: "password" }) ?? "";

  return (
    <div className="space-y-4">
      <Section title="Personal Information" embedded={embedded}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <TextField<UserFormValues>
            name="firstName"
            label="First name"
            required
            autoFocus={autoFocusFirstName}
            maxLength={50}
            disabled={disabled}
          />
          <TextField<UserFormValues>
            name="lastName"
            label="Last name"
            required
            maxLength={50}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <TextField<UserFormValues>
            name="email"
            label="Email"
            required
            type="email"
            placeholder="name@example.com"
            disabled={disabled}
          />
          <PhoneNumberField<UserFormValues>
            name="phone"
            label="Phone"
            placeholder="Phone number"
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <PasswordField<UserFormValues>
              name="password"
              label="Password"
              required={variant === "create"}
              autoComplete="new-password"
              placeholder={
                variant === "edit" ? "Leave blank to keep current password" : undefined
              }
              disabled={disabled}
            />
            {(variant === "create" || password) && <PasswordRequirements password={password} />}
          </div>
          <TextField<UserFormValues>
            name="dateOfBirth"
            label="Date of birth"
            type="date"
            disabled={disabled}
          />
        </div>
      </Section>

      <Section
        title="Access"
        embedded={embedded}
        separated={embedded}
      >
        <SearchableMultiSelectField<UserFormValues>
          name="roleIds"
          label="Roles"
          required
          description="Roles control which screens and actions this user can access."
          placeholder="Select roles…"
          searchPlaceholder="Search roles…"
          disabled={disabled}
          queryKey={["lookups", "roles"]}
          selectedLabels={roleSelectedLabels}
          fetchOptions={fetchRoleOptions}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  embedded,
  separated,
  children,
}: {
  title: string;
  embedded?: boolean;
  separated?: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return (
      <div className={cn("space-y-2", separated && "border-t border-border pt-3")}>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {children}
      </div>
    );
  }
  return (
    <div className="card-elevated space-y-2 p-4 sm:p-6">
      <h3 className="font-display font-semibold">{title}</h3>
      {children}
    </div>
  );
}
