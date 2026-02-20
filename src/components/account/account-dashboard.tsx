"use client";

import { useState } from "react";
import { PageHeader } from "@/components/patterns/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { changePassword, signOutAction } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";

type AccountDashboardProps = {
  email: string;
};

export function AccountDashboard({ email }: AccountDashboardProps) {
  return (
    <div className="max-w-[640px] mx-auto space-y-6">
      <PageHeader
        title="Account"
        description="Manage your account settings"
      />
      <EmailSection email={email} />
      <PasswordSection />
      <DeleteAccountSection />
    </div>
  );
}

function EmailSection({ email }: { email: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>
          Your email address is used for signing in and receiving notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{email}</p>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const errors = {
    currentPassword: !currentPassword ? "Current password is required" : "",
    newPassword: !newPassword
      ? "New password is required"
      : newPassword.length < 8
        ? `Password must be at least 8 characters (currently ${newPassword.length})`
        : "",
    confirmPassword: !confirmPassword
      ? "Confirm your new password"
      : confirmPassword !== newPassword
        ? "Passwords do not match"
        : "",
  };

  const showError = (field: keyof typeof errors) =>
    (touched[field] || submitted) && errors[field];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);

      const result = await changePassword(formData);

      if (result?.error) {
        setServerError(result.error);
      } else {
        toast.success("Password changed. Signing you out...");
        setTimeout(() => signOutAction(), 1500);
      }
    } catch {
      setServerError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Change your password. You&apos;ll be signed out of all sessions
          shortly after.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onBlur={() =>
                setTouched((t) => ({ ...t, currentPassword: true }))
              }
              aria-invalid={!!showError("currentPassword")}
              disabled={isLoading}
            />
            {showError("currentPassword") && (
              <p className="text-sm text-destructive">
                {errors.currentPassword}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
              aria-invalid={!!showError("newPassword")}
              disabled={isLoading}
            />
            {showError("newPassword") ? (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() =>
                setTouched((t) => ({ ...t, confirmPassword: true }))
              }
              aria-invalid={!!showError("confirmPassword")}
              disabled={isLoading}
            />
            {showError("confirmPassword") && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Changing password..." : "Change Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function DeleteAccountSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="destructive" disabled>
          Delete Account (coming soon)
        </Button>
      </CardFooter>
    </Card>
  );
}
