"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useState, useTransition } from "react";
import Link from "next/link";
import { AuthBrandMark } from "@/components/auth-brand-mark";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { claimAccount, resendClaimLink } from "@/actions/claim";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

export function ClaimForm({ token, email, siteName }: { token: string; email: string; siteName: string | null }) {
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const error = !password
    ? "Password is required"
    : password.length < PASSWORD_MIN_LENGTH
      ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters. (Your current entry is only ${password.length})`
      : "";
  const showError = (touched || submitted) && error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (error) return;
    startTransition(async () => {
      const result = await claimAccount({ token, password });
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      // Home resolves on the server; the new session is already set.
      window.location.assign("/");
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-center py-2">
          <AuthBrandMark />
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="mb-4 space-y-1 text-center">
            <h2 className="text-xl font-heading font-semibold">{siteName ?? "Your account"}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          {/* The email as the username, so the phone's password manager saves the pair. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={email}
            readOnly
            aria-hidden="true"
            tabIndex={-1}
            className="absolute h-0 w-0 opacity-0 pointer-events-none"
          />
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!showError}
              aria-describedby="password-error"
              disabled={isPending}
            />
            {showError ? (
              <p id="password-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : (
              <p id="password-error" className="text-xs text-muted-foreground">
                At least {PASSWORD_MIN_LENGTH} characters
              </p>
            )}
          </div>
          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Setting password..." : "Set password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

const PROBLEMS = {
  expired: { title: "This link has expired", resend: true },
  claimed: { title: "This account is set up", resend: false },
  invalid: { title: "This link isn't valid", resend: false },
} as const;

/**
 * An expired link offers a new one by email and nothing else: its owner has
 * no password yet, so sign-in leads nowhere. A used one points to sign-in.
 */
export function ClaimProblem({ state, token }: { state: keyof typeof PROBLEMS; token: string }) {
  const { title, resend } = PROBLEMS[state];
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function sendNew() {
    setError("");
    startTransition(async () => {
      const result = await resendClaimLink(token);
      if ("error" in result) setError(result.error);
      else setMessage(result.message);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-center py-2">
          <AuthBrandMark />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-heading font-semibold">{message ? "Check your email" : title}</h2>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </CardContent>
      {resend ? (
        message ? null : (
          <CardFooter className="flex justify-center">
            <Button onClick={sendNew} disabled={isPending}>
              {isPending ? "Sending..." : "Email me a new link"}
            </Button>
          </CardFooter>
        )
      ) : (
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
