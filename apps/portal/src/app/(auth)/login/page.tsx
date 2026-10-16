"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthBrandMark, useHostProduct } from "@/components/auth-brand-mark";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signInAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostProduct = useHostProduct();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  // Set when the account lives on the other product's host (PRD D22): a
  // Forms account gets a link, a Sites account a one-time pass (E29 D8).
  const [homeUrl, setHomeUrl] = useState("");
  const [handoff, setHandoff] = useState<{ action: string; token: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
    if (searchParams.get("deleted") === "1") {
      setSuccessMessage("Your account has been deleted.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    setHomeUrl("");
    setSuccessMessage("");

    // Check for client-side validation errors
    if (errors.email || errors.password) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInAction({ email, password, rememberMe });

      if ("handoff" in result) {
        setHandoff(result.handoff);
      } else if ("error" in result) {
        if (result.homeUrl) setHomeUrl(result.homeUrl);
        else setServerError(result.error);
      } else {
        router.push("/");
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
        <div className="flex justify-start py-2">
          <AuthBrandMark full />
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={!!showError("email")}
              aria-describedby="email-error"
              disabled={isLoading}
            />
            {showError("email") && (
              <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!showError("password")}
              aria-describedby="password-error"
              disabled={isLoading}
            />
            {showError("password") && (
              <p id="password-error" className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setRememberMe(checked === true)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-normal cursor-pointer"
            >
              Keep me signed in for 30 days
            </Label>
          </div>
          {successMessage && (
            <p role="status" className="text-sm text-success-strong">{successMessage}</p>
          )}
          {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
          {homeUrl && (
            <p role="status" className="text-sm">
              This account signs in at{" "}
              <a href={`${homeUrl}/login`} className="text-primary hover:underline">
                {new URL(homeUrl).host}
              </a>
              .
            </p>
          )}
          {hostProduct === "forms" && (
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Create account
              </Link>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
      <Dialog open={handoff !== null} onOpenChange={(open) => !open && setHandoff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You&apos;re a Canopy Sites customer</DialogTitle>
            <DialogDescription>You use Forms through your Sites dashboard.</DialogDescription>
          </DialogHeader>
          {/* A native POST, so the Sites host sees this page's Origin and sets its own cookie. */}
          <form method="post" action={handoff?.action}>
            <input type="hidden" name="token" value={handoff?.token ?? ""} />
            <DialogFooter>
              <Button type="submit">Go to Canopy Sites</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
