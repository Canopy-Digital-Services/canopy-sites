"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, Plus, Trash2, Check, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormContext } from "@/components/forms/form-context";

const MAX_NOTIFY_EMAILS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AfterSubmissionSectionProps = {
  ownerEmail: string;
};

export function AfterSubmissionSection({ ownerEmail }: AfterSubmissionSectionProps) {
  const { state, saveStatus, updateSubmissionSettings } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);

  // UI-only state
  const [afterSubmissionType, setAfterSubmissionType] = useState<"message" | "redirect">(
    state.redirectUrl ? "redirect" : "message"
  );
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailInputTouched, setEmailInputTouched] = useState(false);

  // Derived validation for the new email input
  const trimmedNewEmail = newEmailInput.trim().toLowerCase();
  const newEmailError = emailInputTouched && trimmedNewEmail
    ? !EMAIL_REGEX.test(trimmedNewEmail)
      ? "Enter a valid email address"
      : state.notifyEmails.map(e => e.toLowerCase()).includes(trimmedNewEmail)
        ? "This email is already in the list"
        : state.notifyEmails.length >= MAX_NOTIFY_EMAILS
          ? `Maximum ${MAX_NOTIFY_EMAILS} recipients allowed`
          : null
    : null;

  const canAddEmail =
    trimmedNewEmail !== "" &&
    EMAIL_REGEX.test(trimmedNewEmail) &&
    !state.notifyEmails.map(e => e.toLowerCase()).includes(trimmedNewEmail) &&
    state.notifyEmails.length < MAX_NOTIFY_EMAILS;

  // Handle toggle on — auto-populate owner email if list is empty
  const handleToggleNotifications = (checked: boolean) => {
    if (checked && state.notifyEmails.length === 0 && ownerEmail) {
      updateSubmissionSettings({ emailNotificationsEnabled: checked, notifyEmails: [ownerEmail] });
    } else {
      updateSubmissionSettings({ emailNotificationsEnabled: checked });
    }
  };

  const handleAddEmail = () => {
    if (!canAddEmail) return;
    updateSubmissionSettings({ notifyEmails: [...state.notifyEmails, trimmedNewEmail] });
    setNewEmailInput("");
    setEmailInputTouched(false);
  };

  const handleRemoveEmail = (index: number) => {
    updateSubmissionSettings({ notifyEmails: state.notifyEmails.filter((_, i) => i !== index) });
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleAddOrigin = () => {
    updateSubmissionSettings({ allowedOrigins: [...state.allowedOrigins, ""] });
  };

  const handleRemoveOrigin = (index: number) => {
    updateSubmissionSettings({ allowedOrigins: state.allowedOrigins.filter((_, i) => i !== index) });
  };

  const handleOriginChange = (index: number, value: string) => {
    const updated = [...state.allowedOrigins];
    updated[index] = value;
    updateSubmissionSettings({ allowedOrigins: updated });
  };

  const handleAfterSubmissionTypeChange = (value: "message" | "redirect") => {
    setAfterSubmissionType(value);
    // Clear the inactive field
    if (value === "message") {
      updateSubmissionSettings({ redirectUrl: null });
    } else {
      updateSubmissionSettings({ successMessage: null });
    }
  };

  // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDatetimeLocal = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer hover:bg-transparent" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Submission Settings</CardTitle>
                <CardDescription>Control responses, notifications, and access</CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saveStatus === "saving" && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Save className="h-4 w-4 animate-pulse" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-sm text-success flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* After Submission */}
            <div className="space-y-3">
              <Label>After submission</Label>
              <RadioGroup
                value={afterSubmissionType}
                onValueChange={(v) => handleAfterSubmissionTypeChange(v as "message" | "redirect")}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="message" id="afterSubmission-message" />
                    <Label htmlFor="afterSubmission-message" className="font-normal cursor-pointer">
                      Show a message
                    </Label>
                  </div>
                  {afterSubmissionType === "message" && (
                    <Textarea
                      id="successMessage"
                      value={state.successMessage ?? ""}
                      onChange={(e) => updateSubmissionSettings({ successMessage: e.target.value || null })}
                      rows={2}
                      className="resize-none ml-6"
                      placeholder="Thank you for your submission!"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="redirect" id="afterSubmission-redirect" />
                    <Label htmlFor="afterSubmission-redirect" className="font-normal cursor-pointer">
                      Redirect to a URL
                    </Label>
                  </div>
                  {afterSubmissionType === "redirect" && (
                    <div className="ml-6 space-y-2">
                      <Input
                        id="redirectUrl"
                        value={state.redirectUrl ?? ""}
                        onChange={(e) => updateSubmissionSettings({ redirectUrl: e.target.value || null })}
                        placeholder="https://example.com/thanks"
                      />
                      <p className="text-xs text-muted-foreground">
                        Redirect after a successful submission.
                      </p>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>

            <div className="border-t" />

            {/* Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="emailNotifications"
                  checked={state.emailNotificationsEnabled}
                  onCheckedChange={(checked) => handleToggleNotifications(checked === true)}
                />
                <Label htmlFor="emailNotifications" className="cursor-pointer font-normal">
                  Email notifications
                </Label>
              </div>

              {state.emailNotificationsEnabled && (
                <div className="space-y-3">
                  {/* Email list */}
                  {state.notifyEmails.length > 0 && (
                    <div className="space-y-2">
                      {state.notifyEmails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm flex-1 truncate">{email}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemoveEmail(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove recipient</TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add email input */}
                  {state.notifyEmails.length < MAX_NOTIFY_EMAILS && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                          onBlur={() => setEmailInputTouched(true)}
                          onKeyDown={handleEmailInputKeyDown}
                          placeholder="recipient@example.com"
                          type="email"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAddEmail}
                          disabled={!canAddEmail}
                        >
                          Add
                        </Button>
                      </div>
                      {newEmailError && (
                        <p className="text-sm text-destructive">{newEmailError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Access & Limits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Allowed Origins</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOrigin}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Origin
                </Button>
              </div>
              {state.allowedOrigins.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No origins configured. Submissions will be blocked unless you add allowed domains.
                </p>
              ) : (
                <div className="space-y-2">
                  {state.allowedOrigins.map((origin, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={origin}
                        onChange={(e) => handleOriginChange(index, e.target.value)}
                        placeholder="example.com"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveOrigin(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove origin</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Enter domains that can embed this form (e.g., example.com, staging.example.com).
                Localhost is always allowed for development.
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stopAt">Stop accepting submissions after</Label>
                  <Input
                    id="stopAt"
                    type="datetime-local"
                    value={formatDatetimeLocal(state.stopAt)}
                    onChange={(e) => updateSubmissionSettings({ stopAt: e.target.value ? new Date(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to accept submissions indefinitely
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSubmissions">Maximum number of submissions</Label>
                  <Input
                    id="maxSubmissions"
                    type="number"
                    min="1"
                    value={state.maxSubmissions?.toString() ?? ""}
                    onChange={(e) => updateSubmissionSettings({ maxSubmissions: e.target.value ? parseInt(e.target.value, 10) : null })}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no limit. Spam submissions are not counted.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
