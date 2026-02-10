"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPassword, validateResetToken } from "@/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Derived validation errors (computed every render)
  const errors = {
    password: !password
      ? "Password is required"
      : password.length < 8
      ? `Password must be at least 8 characters. (Your current entry is only ${password.length})`
      : "",
    confirmPassword: !confirmPassword
      ? "Confirm your password"
      : confirmPassword !== password
      ? "Passwords do not match"
      : "",
  };

  // Helper: show error if field is touched or form has been submitted
  const showError = (field: keyof typeof errors) =>
    (touched[field] || submitted) && errors[field];

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenError("No reset token provided");
        setIsValidating(false);
        return;
      }

      const result = await validateResetToken(token);
      
      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenError(result.error || "Invalid reset link");
      }
      
      setIsValidating(false);
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    // Check for client-side validation errors
    if (errors.password || errors.confirmPassword) {
      return;
    }

    if (!token) {
      setServerError("No reset token provided");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);

      const result = await resetPassword(formData);

      if (result.error) {
        setServerError(result.error);
      } else {
        // Success - redirect to login
        router.push("/login?reset=success");
      }
    } catch (err) {
      setServerError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidating) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-center py-2">
            <BrandMark size="md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-1 text-center">
            <h2 className="text-xl font-semibold">Reset your password</h2>
            <p className="text-sm text-muted-foreground">Validating reset link...</p>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-center py-2">
            <BrandMark size="md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-1 text-center">
            <h2 className="text-xl font-semibold">Invalid reset link</h2>
            <p className="text-sm text-muted-foreground">{tokenError}</p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This reset link may have expired or already been used.
            </p>
            <div className="flex gap-2">
              <Link href="/forgot-password">
                <Button variant="default">Request new link</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Back to login</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-center py-2">
          <BrandMark size="md" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-1 text-center">
          <h2 className="text-xl font-semibold">Set new password</h2>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!showError("password")}
              disabled={isLoading}
            />
            {showError("password") ? (
              <p className="text-sm text-destructive">{errors.password}</p>
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
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              aria-invalid={!!showError("confirmPassword")}
              disabled={isLoading}
            />
            {showError("confirmPassword") && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting password..." : "Reset password"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
