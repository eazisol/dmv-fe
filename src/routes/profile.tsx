import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/AppShell";
import { AppTooltip } from "@/components/AppTooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form,
  TextField,
  PasswordField,
  SubmitButton,
  PhoneNumberField,
} from "@/components/form";
import { authService } from "@/lib/api/services/auth";
import {
  toDateInputValue,
  usersService,
  type ApiUser,
} from "@/lib/api/services/users";
import { notifyApiError } from "@/lib/api/axios";
import { newPasswordSchema, PasswordRequirements } from "@/lib/password";
import { getPhoneLengthError } from "@/components/form/PhoneNumberField";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { notificationsService } from "@/lib/api/services/notifications";
import { pageTitle } from "@/lib/app-config";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: pageTitle("My profile") }] }),
  component: ProfilePage,
});

function parseDobInput(value: string): Date | null {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function validatePhoneNumber(value: string) {
  return !getPhoneLengthError(value.trim(), undefined, { requireMin: true });
}

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "Must be under 80 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Must be under 80 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) return;
      if (!validatePhoneNumber(v)) {
        ctx.addIssue({ code: "custom", message: "Enter a valid phone number for the selected country." });
      }
    }),
  dateOfBirth: z
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
    }),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: newPasswordSchema,
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [prefLoading, setPrefLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: authUser?.firstName ?? "",
      lastName: authUser?.lastName ?? "",
      email: authUser?.email ?? "",
      phone: "",
      dateOfBirth: "",
    },
  });

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", password: "", confirm: "" },
  });
  const newPw = pwForm.watch("password");

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await usersService.get(authUser.id);
        if (cancelled) return;
        setApiUser(res.data);
        profileForm.reset({
          firstName: res.data.firstName ?? "",
          lastName: res.data.lastName ?? "",
          email: res.data.email ?? "",
          phone: res.data.phone ?? "",
          dateOfBirth: toDateInputValue(res.data.dateOfBirth),
        });
      } catch (err) {
        notifyApiError(err, "Failed to load profile");
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationsService.getPreference();
        if (!cancelled) setInAppEnabled(res.data.inAppNotificationsEnabled);
      } catch {
        // keep default
      } finally {
        if (!cancelled) setPrefLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  async function onToggleInApp(checked: boolean) {
    setPrefSaving(true);
    try {
      const res = await notificationsService.updatePreference(checked);
      setInAppEnabled(res.data.inAppNotificationsEnabled);
      toast.success(res.message || "Notification preference updated");
    } catch (err) {
      notifyApiError(err, "Failed to update notification preference");
    } finally {
      setPrefSaving(false);
    }
  }

  const initials = useMemo(() => {
    const name =
      `${authUser?.firstName ?? ""} ${authUser?.lastName ?? ""}`.trim() || authUser?.username || "";
    return name
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [authUser]);

  if (!authUser) return null;

  const roleLabel = (apiUser?.roleNames ?? []).filter(Boolean).join(", ");

  async function onSaveProfile(values: ProfileValues) {
    if (!apiUser) return;
    try {
      const res = await usersService.update(
        apiUser.id,
        {
          email: values.email.trim(),
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phone: values.phone.trim() || null,
          dateOfBirth: values.dateOfBirth.trim() || null,
          isActive: apiUser.isActive,
          userTypeId: apiUser.userTypeId,
          roleIds: apiUser.roleIds ?? [],
        },
      );
      setApiUser(res.data);
      profileForm.reset({
        firstName: res.data.firstName ?? "",
        lastName: res.data.lastName ?? "",
        email: res.data.email ?? "",
        phone: res.data.phone ?? "",
        dateOfBirth: toDateInputValue(res.data.dateOfBirth),
      });
      updateUser({
        email: res.data.email,
        firstName: res.data.firstName ?? "",
        lastName: res.data.lastName ?? "",
      });
      queryClient.setQueryData(["users", authUser!.id], res.data);
      await queryClient.invalidateQueries({ queryKey: ["users", authUser!.id] });
      toast.success(res.message || "Profile updated");
    } catch (err) {
      notifyApiError(err, "Failed to update profile");
    }
  }

  async function onChangePassword(values: PasswordValues) {
    try {
      const res = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.password,
        confirmPassword: values.confirm,
      });
      pwForm.reset({ currentPassword: "", password: "", confirm: "" });
      toast.success(res.message || "Password changed");
    } catch (err) {
      notifyApiError(err, "Failed to change password");
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My profile"
        leading={
          <AppTooltip content="Back to dashboard" asChild>
            <Link
              to="/"
              aria-label="Back to dashboard"
              className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-md text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </AppTooltip>
        }
      />

      <Form form={profileForm} onSubmit={onSaveProfile} className="card-elevated p-6 space-y-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold">
              {`${authUser.firstName} ${authUser.lastName}`.trim() || authUser.username}
            </div>
            <div className="truncate text-sm text-muted-foreground">
              {profileForm.watch("email") || authUser.email}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <TextField<ProfileValues> name="firstName" label="First name" required maxLength={80} />
          <TextField<ProfileValues> name="lastName" label="Last name" required maxLength={80} />
          <TextField<ProfileValues>
            name="email"
            label="Email"
            required
            type="email"
            autoComplete="email"
          />
          <PhoneNumberField<ProfileValues> name="phone" label="Phone" placeholder="07700 900000" />
          <TextField<ProfileValues> name="dateOfBirth" label="Date of birth" type="date" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <AppTooltip content="Assigned by an administrator." className="w-full">
              <input
                value={roleLabel}
                disabled
                className="pointer-events-none flex h-9 w-full cursor-default rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground"
              />
            </AppTooltip>
          </div>
        </div>

        <div className="flex justify-end">
          <SubmitButton loadingText="Saving…" disabled={loadingUser || !apiUser}>
            {loadingUser ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </SubmitButton>
        </div>
      </Form>

      <div className="card-elevated mt-6 space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn off in-app notifications. You will still receive email alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {inAppEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={inAppEnabled}
              disabled={prefLoading || prefSaving}
              onCheckedChange={(checked) => void onToggleInApp(checked)}
              aria-label="In-app notifications"
            />
          </div>
        </div>
      </div>

      <Form form={pwForm} onSubmit={onChangePassword} className="card-elevated p-6 mt-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <PasswordField<PasswordValues>
            name="currentPassword"
            label="Current password"
            required
            autoComplete="current-password"
          />
          <PasswordField<PasswordValues>
            name="password"
            label="New password"
            required
            autoComplete="new-password"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <PasswordField<PasswordValues>
            name="confirm"
            label="Confirm new password"
            required
            autoComplete="new-password"
          />
        </div>
        <PasswordRequirements password={newPw} />
        <div className="flex justify-end pt-2 border-t">
          <SubmitButton variant="outline" loadingText="Updating…">
            Update password
          </SubmitButton>
        </div>
      </Form>

    </div>
  );
}
