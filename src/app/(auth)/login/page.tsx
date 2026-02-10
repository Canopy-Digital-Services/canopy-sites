"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Derived validation errors (computed every render)
  const errors = {
    email: !email ? "Email is required" : "",
    password: !password ? "Password is required" : "",
  };

  // Helper: show error if field is touched or form has been submitted
  const showError = (field: keyof typeof errors) =>
    (touched[field] || submitted) && errors[field];

  useEffect(() => {
    // Check for success message from password reset
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Password reset successful! You can now sign in.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    setSuccessMessage("");

    // Check for client-side validation errors
    if (errors.email || errors.password) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password");
      } else {
        router.push("/forms");
        router.refresh();
      }
    } catch {
      setServerError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-center py-2">
          <img
            src="/brand/forms-logo-full.svg"
            alt=""
            className="h-16 w-auto"
          />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!showError("password")}
              disabled={isLoading}
            />
            {showError("password") && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
          )}
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
