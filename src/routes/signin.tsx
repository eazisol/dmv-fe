import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Form, TextField, PasswordField, CheckboxField, SubmitButton } from "@/components/form";
import { canAccessPath, getDefaultHomePath } from "@/lib/authorization";
import { appConfig, pageTitle } from "@/lib/app-config";

const signinSearchSchema = z.object({ redirect: z.string().optional() });

const signinSchema = z.object({
  emailOrUsername: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});
type SignInValues = z.infer<typeof signinSchema>;

export const Route = createFileRoute("/signin")({
  head: () => ({ meta: [{ title: pageTitle("Sign in") }] }),
  validateSearch: signinSearchSchema,
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/signin" });
  const { signIn } = useAuth();
  const { menus } = usePermissions();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { emailOrUsername: "", password: "", remember: true },
  });

  async function onSubmit(values: SignInValues) {
    const result = await signIn(values.emailOrUsername.trim(), values.password);
    if (!result.ok) {
      if (!result.toasted) {
        toast.error(result.message || "Unable to sign in. Please try again.", {
          id: "api-error",
        });
      }
      return;
    }
    toast.success(
      result.message || `Welcome back, ${result.user.firstName || result.user.username}`,
    );
    const explicit =
      search.redirect && search.redirect.startsWith("/") ? search.redirect : null;
    let target: string = appConfig.defaultHomePath;

    if (explicit) {
      // Only honour return URLs the current menu set already allows; otherwise `/`
      // avoids bouncing into Access denied before permissions finish loading.
      if (menus.length === 0 || canAccessPath(menus, explicit)) {
        target = explicit;
      }
    } else if (menus.length > 0) {
      const home = getDefaultHomePath(menus, result.user.roles);
      if (canAccessPath(menus, home)) target = home;
    }

    navigate({ to: target });
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your credentials to access the dashboard."
      footer={
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Need access?{" "}
          <a
            href={`mailto:${appConfig.supportEmail}`}
            className="font-medium text-accent hover:text-accent/80 underline-offset-2 hover:underline"
          >
            Contact your administrator
          </a>
          .
        </p>
      }
    >
      <Form form={form} onSubmit={onSubmit} className="space-y-5">
        <TextField<SignInValues>
          name="emailOrUsername"
          label="Email"
          required
          type="email"
          autoComplete="email"
          placeholder={appConfig.emailPlaceholder}
          leftIcon={Mail}
        />

        <div className="space-y-1.5">
          <PasswordField<SignInValues>
            name="password"
            label="Password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={Lock}
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              search={{ email: form.getValues("emailOrUsername") } as any}
              className="text-xs font-medium text-accent hover:text-accent/80 underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="hidden">
          <CheckboxField<SignInValues> name="remember" label="Remember me for 30 days" />
        </div>

        <SubmitButton className="w-full h-10 gap-2" loadingText="Signing in…">
          Sign in
          <ArrowRight className="h-4 w-4" />
        </SubmitButton>
      </Form>
    </AuthLayout>
  );
}
