"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Plus, Trash2, Check, Save } from "lucide-react";
import { updateAfterSubmission } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SettingsSection } from "@/components/patterns/settings-section";

type AfterSubmissionSectionProps = {
  formId: string;
  successMessage: string | null;
  redirectUrl: string | null;
  emailNotificationsEnabled: boolean;
  allowedOrigins: string[];
  stopAt: Date | null;
  maxSubmissions: number | null;
};

export function AfterSubmissionSection({
  formId,
  successMessage: initialSuccessMessage,
  redirectUrl: initialRedirectUrl,
  emailNotificationsEnabled: initialEmailNotificationsEnabled,
  allowedOrigins: initialAllowedOrigins,
  stopAt: initialStopAt,
  maxSubmissions: initialMaxSubmissions,
}: AfterSubmissionSectionProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Determine initial radio selection based on existing data
  const [afterSubmissionType, setAfterSubmissionType] = useState<"message" | "redirect">(
    initialRedirectUrl ? "redirect" : "message"
  );
  
  const [successMessage, setSuccessMessage] = useState(initialSuccessMessage || "");
  const [redirectUrl, setRedirectUrl] = useState(initialRedirectUrl || "");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(initialEmailNotificationsEnabled);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>(initialAllowedOrigins || []);
  
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
  
  const [stopAt, setStopAt] = useState(formatDatetimeLocal(initialStopAt));
  const [maxSubmissions, setMaxSubmissions] = useState(initialMaxSubmissions?.toString() || "");

  // Auto-save with debouncing
  useEffect(() => {
    // Don't save on initial mount
    // Only check the active field based on afterSubmissionType
    const activeFieldChanged = afterSubmissionType === "message"
      ? successMessage !== (initialSuccessMessage || "")
      : redirectUrl !== (initialRedirectUrl || "");
    
    const hasChanges = 
      activeFieldChanged ||
      emailNotificationsEnabled !== initialEmailNotificationsEnabled ||
      JSON.stringify(allowedOrigins) !== JSON.stringify(initialAllowedOrigins) ||
      stopAt !== formatDatetimeLocal(initialStopAt) ||
      maxSubmissions !== (initialMaxSubmissions?.toString() || "");

    if (!hasChanges) return;

    setSaveStatus("saving");

    const timeoutId = setTimeout(() => {
      startTransition(() => {
        void (async () => {
          try {
            await updateAfterSubmission(formId, {
              successMessage: afterSubmissionType === "message" ? (successMessage || null) : null,
              redirectUrl: afterSubmissionType === "redirect" ? (redirectUrl || null) : null,
              emailNotificationsEnabled,
              allowedOrigins: allowedOrigins.filter(o => o.trim() !== ""),
              stopAt: stopAt ? new Date(stopAt) : null,
              maxSubmissions: maxSubmissions ? parseInt(maxSubmissions, 10) : null,
            });
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          } catch (error) {
            console.error("Failed to save after submission settings:", error);
            toast.error("Failed to save settings");
            setSaveStatus("idle");
          }
        })();
      });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [
    formId,
    // Note: afterSubmissionType is intentionally NOT in deps
    // We only want to save when field values change, not when tabs switch
    // The effect uses the current afterSubmissionType value to decide what to send
    successMessage,
    redirectUrl,
    emailNotificationsEnabled,
    allowedOrigins,
    stopAt,
    maxSubmissions,
    initialSuccessMessage,
    initialRedirectUrl,
    initialEmailNotificationsEnabled,
    initialAllowedOrigins,
    initialStopAt,
    initialMaxSubmissions,
    toast,
  ]);

  const handleAddOrigin = () => {
    setAllowedOrigins([...allowedOrigins, ""]);
  };

  const handleRemoveOrigin = (index: number) => {
    setAllowedOrigins(allowedOrigins.filter((_, i) => i !== index));
  };

  const handleOriginChange = (index: number, value: string) => {
    const updated = [...allowedOrigins];
    updated[index] = value;
    setAllowedOrigins(updated);
  };

  const handleAfterSubmissionTypeChange = (value: "message" | "redirect") => {
    setAfterSubmissionType(value);
  };
  
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle>After Submission</CardTitle>
              <div className="flex items-center gap-2">
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
            {/* Security Section */}
            <SettingsSection
              label="Security"
              description="Control which domains can embed and submit to this form"
            >
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
                {allowedOrigins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No origins configured. Submissions will be blocked unless you add allowed domains.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allowedOrigins.map((origin, index) => (
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
                <p className="text-sm text-muted-foreground">
                  Enter domains that can embed this form (e.g., example.com, staging.example.com). 
                  Localhost is always allowed for development.
                </p>
              </div>
            </SettingsSection>

            {/* After Submission Section */}
            <SettingsSection
              label="After Submission"
              description="Choose what happens when users submit this form"
            >
              <div className="space-y-3">
                <Tabs
                  value={afterSubmissionType}
                  onValueChange={(v) => handleAfterSubmissionTypeChange(v as "message" | "redirect")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="message">Message</TabsTrigger>
                    <TabsTrigger value="redirect">Redirect</TabsTrigger>
                  </TabsList>

                  <div className="rounded-md border bg-muted/30 p-4 min-h-[7.5rem]">
                    <TabsContent value="message" className="m-0 space-y-2 data-[state=inactive]:hidden">
                      <Label htmlFor="successMessage">Success message</Label>
                      <Textarea
                        id="successMessage"
                        value={successMessage}
                        onChange={(e) => setSuccessMessage(e.target.value)}
                        rows={2}
                        className="resize-none"
                        placeholder="Thank you for your submission!"
                      />
                    </TabsContent>

                    <TabsContent value="redirect" className="m-0 space-y-2 data-[state=inactive]:hidden">
                      <Label htmlFor="redirectUrl">Redirect URL</Label>
                      <Input
                        id="redirectUrl"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://example.com/thanks"
                      />
                      <p className="text-sm text-muted-foreground">
                        Redirect after a successful submission.
                      </p>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </SettingsSection>

            {/* Notifications Section */}
            <SettingsSection
              label="Notifications"
              description="Get notified when someone submits this form"
            >
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="emailNotifications" className="cursor-pointer font-normal">
                  Notify me on new submission
                </Label>
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={emailNotificationsEnabled}
                  onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>
            </SettingsSection>

            {/* Limits Section */}
            <SettingsSection
              label="Submission Limits"
              description="Optionally restrict when or how many times this form can be submitted"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stopAt">Stop accepting submissions after</Label>
                  <Input
                    id="stopAt"
                    type="datetime-local"
                    value={stopAt}
                    onChange={(e) => setStopAt(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to accept submissions indefinitely
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSubmissions">Maximum number of submissions</Label>
                  <Input
                    id="maxSubmissions"
                    type="number"
                    min="1"
                    value={maxSubmissions}
                    onChange={(e) => setMaxSubmissions(e.target.value)}
                    placeholder="Unlimited"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for no limit. Spam submissions are not counted.
                  </p>
                </div>
              </div>
            </SettingsSection>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
