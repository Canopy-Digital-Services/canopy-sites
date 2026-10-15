"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
//
// Experimental progressive-disclosure editor flow: instead of stacking all
// section cards in an accordion, show one card at a time. Cards swoop in
// from below and swoop out sideways when the user continues (left = forward,
// right = back). Keyframes live in globals.css (editor-swoop-*).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HeaderSection } from "@/components/forms/header-section";
import { FieldsSection } from "@/components/forms/fields-section";
import { AppearanceSection } from "@/components/forms/appearance-section";
import { AfterSubmissionSection } from "@/components/forms/after-submission-section";

const STEPS = ["header", "fields", "appearance", "settings"] as const;

type EditorFlowProps = {
  formId: string;
  ownerEmail: string;
};

export function EditorFlow({ formId, ownerEmail }: EditorFlowProps) {
  const router = useRouter();
  // 0..3 = section cards, STEPS.length = completion card
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState<"forward" | "back" | null>(null);

  const isDone = step === STEPS.length;
  const current = isDone ? "done" : STEPS[step];

  const go = (direction: "forward" | "back") => {
    if (exiting) return;
    setExiting(direction);
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    // Only advance when the wrapper's own exit animation finishes — child
    // animations (collapsibles, pulsing icons) bubble up here too.
    if (event.target !== event.currentTarget || !exiting) return;
    if (!event.animationName.startsWith("editor-swoop-out")) return;
    setStep((s) => (exiting === "forward" ? s + 1 : s - 1));
    setExiting(null);
  };

  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div
        className="flex items-center justify-center gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={Math.min(step + 1, STEPS.length)}
        aria-label={isDone ? "All steps complete" : `Step ${step + 1} of ${STEPS.length}`}
      >
        {STEPS.map((key, index) => {
          const active = index === step;
          const complete = index < step || isDone;
          return (
            <span
              key={key}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                active ? "w-6 bg-primary" : "w-1.5",
                !active && (complete ? "bg-primary/60" : "bg-border")
              )}
            />
          );
        })}
      </div>

      {/* Active card */}
      <div
        key={step}
        onAnimationEnd={handleAnimationEnd}
        className={cn(
          exiting === "forward" && "editor-swoop-out-left",
          exiting === "back" && "editor-swoop-out-right",
          !exiting && "editor-swoop-in"
        )}
      >
        {current === "header" && <HeaderSection variant="flow" />}
        {current === "fields" && <FieldsSection formId={formId} variant="flow" />}
        {current === "appearance" && <AppearanceSection variant="flow" />}
        {current === "settings" && (
          <AfterSubmissionSection ownerEmail={ownerEmail} variant="flow" />
        )}
        {current === "done" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-success-strong shrink-0" aria-hidden />
                <CardTitle>All set</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Head to Publish to put it live, or go back to keep editing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Flow controls */}
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => go("back")} disabled={exiting !== null}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <span aria-hidden />
        )}
        {isDone ? (
          <Button onClick={() => router.push(`/forms/${formId}?mode=publish`)}>
            Go to Publish
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => go("forward")} disabled={exiting !== null}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
