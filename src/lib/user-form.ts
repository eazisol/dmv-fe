import { z } from "zod";
import { getPhoneLengthError } from "@/components/form/PhoneNumberField";
import { newPasswordSchema } from "@/lib/password";
import { emailSchema, userNameSchema } from "@/lib/user-validation";
import type { ApiUser, CreateUserPayload, UpdateUserPayload } from "@/lib/api/services/users";
import { toDateInputValue } from "@/lib/api/services/users";
import { DEFAULT_USER_TYPE_ID } from "@/lib/user-module";

function parseDobInput(value: string): Date | null {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const phoneField = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    if (!v) return;
    if (getPhoneLengthError(v, undefined, { requireMin: true })) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid phone number for the selected country.",
      });
    }
  });

const dateOfBirthField = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    if (!v) return;
    const d = parseDobInput(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date of birth." });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() > today.getTime()) {
      ctx.addIssue({ code: "custom", message: "Date of birth cannot be in the future." });
    }
  });

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  roleIds: string[];
  isActive: boolean;
};

export const emptyUserFormValues: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  dateOfBirth: "",
  roleIds: [],
  isActive: true,
};

const baseShape = {
  firstName: userNameSchema("First name"),
  lastName: userNameSchema("Last name"),
  email: emailSchema(),
  phone: phoneField,
  dateOfBirth: dateOfBirthField,
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
  isActive: z.boolean(),
};

export const createUserFormSchema = z.object({
  ...baseShape,
  password: newPasswordSchema,
});

export const editUserFormSchema = z.object({
  ...baseShape,
  password: z
    .string()
    .refine((v) => v === "" || newPasswordSchema.safeParse(v).success, {
      message: "Password must be 8+ characters with upper, lower, number and special character",
    }),
});

export function userToFormValues(user: ApiUser): UserFormValues {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    password: "",
    phone: user.phone ?? "",
    dateOfBirth: toDateInputValue(user.dateOfBirth),
    roleIds: (user.roleIds ?? []).map(String),
    isActive: user.isActive,
  };
}

export function toCreateUserPayload(values: UserFormValues): CreateUserPayload {
  return {
    email: values.email.trim(),
    password: values.password,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dateOfBirth: values.dateOfBirth.trim() || null,
    phone: values.phone.trim() || null,
    isActive: values.isActive,
    userTypeId: DEFAULT_USER_TYPE_ID,
    roleIds: values.roleIds,
  };
}

export function toUpdateUserPayload(
  values: UserFormValues,
  userTypeId: number = DEFAULT_USER_TYPE_ID,
): UpdateUserPayload {
  return {
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dateOfBirth: values.dateOfBirth.trim() || null,
    phone: values.phone.trim() || null,
    password: values.password.trim() || null,
    isActive: values.isActive,
    userTypeId,
    roleIds: values.roleIds,
  };
}
