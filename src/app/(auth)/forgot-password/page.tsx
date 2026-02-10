"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [validationSubmitted, setValidationSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Derived validation error (computed every render)
  const emailError = !email
    ? "Email is required"
    : !/\S+@\S+\.\S+/.test(email)
    ? "Enter a valid email address"
    : "";

  // Show error if field is touched or form has been submitted
  const showError = (touched || validationSubmitted) && emailError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationSubmitted(true);
    setServerError("");

    // Check for client-side validation error
    if (emailError) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await requestPasswordReset(formData);

      if (result.success) {
        setFormSubmitted(true);
        setSuccessMessage(result.message || "");
      } else if (result.error) {
        setServerError(result.error);
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
        <div className="mb-4 space-y-1 text-center">
          <h2 className="text-xl font-semibold">
            {formSubmitted ? "Check your email" : "Reset your password"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formSubmitted
              ? "Check your email for instructions"
              : "Enter your email address and we'll send you a reset link"}
          </p>
        </div>
        {formSubmitted ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{successMessage}</p>
            <div className="text-center">
              <Link href="/login" className="text-primary hover:underline text-sm">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={!!showError}
                  disabled={isLoading}
                />
                {showError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
