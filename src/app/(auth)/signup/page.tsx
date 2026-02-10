"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signUp } from "@/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Derived validation errors (computed every render)
  const errors = {
    email: !email
      ? "Email is required"
      : !/\S+@\S+\.\S+/.test(email)
      ? "Enter a valid email address"
      : "",
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    // Check for client-side validation errors
    if (errors.email || errors.password || errors.confirmPassword) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await signUp(formData);

      if (result.error) {
        setServerError(result.error);
      } else {
        // Success - redirect to forms page
        router.push("/forms");
        router.refresh();
      }
    } catch (err) {
      setServerError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-center py-2">
          <BrandMark size="md" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={!!showError("email")}
              disabled={isLoading}
            />
            {showError("email") && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
