"use client";

import { useState, useTransition } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";
import { updateFormBehavior } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

type BehaviorSectionProps = {
  formId: string;
  successMessage: string | null;
  redirectUrl: string | null;
  emailNotificationsEnabled: boolean;
  notifyEmails: string[];
  honeypotField: string | null;
};

export function BehaviorSection({
  formId,
  successMessage: initialSuccessMessage,
  redirectUrl: initialRedirectUrl,
  emailNotificationsEnabled: initialEmailNotificationsEnabled,
  notifyEmails: initialNotifyEmails,
  honeypotField: initialHoneypotField,
}: BehaviorSectionProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [successMessage, setSuccessMessage] = useState(initialSuccessMessage || "");
  const [redirectUrl, setRedirectUrl] = useState(initialRedirectUrl || "");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(initialEmailNotificationsEnabled);

  const handleSave = () => {
    startTransition(() => {
      void (async () => {
        try {
          await updateFormBehavior(formId, {
            successMessage: successMessage || null,
            redirectUrl: redirectUrl || null,
            emailNotificationsEnabled,
          });
          toast.success("Behavior settings updated successfully");
        } catch (error) {
          console.error(error);
          toast.error("Failed to update behavior settings");
        }
      })();
    });
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle>Behavior</CardTitle>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="successMessage">Success Message</Label>
              <Textarea
                id="successMessage"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                rows={3}
                placeholder="Thank you for your submission!"
              />
              <p className="text-sm text-muted-foreground">
                Message shown to users after successful submission
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
              <Input
                id="redirectUrl"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://example.com/thanks"
              />
              <p className="text-sm text-muted-foreground">
                If set, users are redirected here instead of showing the success message
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications" className="cursor-pointer">
                  Email me on new submission
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email notification when someone submits this form
                </p>
              </div>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
              />
            </div>

            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Behavior"}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
