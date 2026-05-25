import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getPassword, savePassword } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, KeyRound, CheckCircle2 } from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Settings() {
  const [success, setSuccess] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: PasswordFormValues) => {
    const current = getPassword();
    if (values.currentPassword !== current) {
      form.setError("currentPassword", { message: "Current password is incorrect" });
      return;
    }
    savePassword(values.newPassword);
    setSuccess(true);
    form.reset();
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin password and account security.</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="bg-primary/10 rounded-lg p-2 mt-1">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Access Control</CardTitle>
            <CardDescription className="mt-1">
              This dashboard is only accessible to Oxford Science admin. Only someone with the correct
              username and password can log in. No one else can view or change any school data.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              All data is stored only on this device
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Login is blocked after 5 wrong password attempts (15 min lockout)
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              No one can access without your username and password
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="bg-primary/10 rounded-lg p-2 mt-1">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription className="mt-1">
              Set a strong private password. Use a mix of letters and numbers.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Password changed successfully. Use your new password next time you log in.
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter current password" data-testid="input-current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 6 characters" data-testid="input-new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat new password" data-testid="input-confirm-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" data-testid="button-change-password">
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
