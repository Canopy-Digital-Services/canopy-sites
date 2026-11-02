"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
//
// Experimental progressive-disclosure editor flow: instead of stacking all
// section cards in an accordion, show one card at a time. Cards swoop in
// from below and swoop out sideways when the user moves on (left = forward,
// right = back). Keyframes live in globals.css (editor-swoop-*).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/components/forms/form-context";
import { HeaderSection } from "@/components/forms/header-section";
import { FieldsSection } from "@/components/forms/fields-section";
import { AfterSubmissionSection } from "@/components/forms/after-submission-section";
import { EDITOR_STEPS, STEP_TITLES } from "@/components/forms/editor-steps";

type EditorFlowProps = {
  formId: string;
  ownerEmail: string;
};

export function EditorFlow({ formId, ownerEmail }: EditorFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState<"forward" | "back" | null>(null);

  const current = EDITOR_STEPS[step];
  const last = step === EDITOR_STEPS.length - 1;
  const { setEditorStep } = useFormContext();

  // The preview picks its stand-ins by step.
  useEffect(() => {
    setEditorStep(current);
    return () => setEditorStep(null);
  }, [current, setEditorStep]);

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
        aria-valuemax={EDITOR_STEPS.length}
        aria-valuenow={step + 1}
        aria-label={`Step ${step + 1} of ${EDITOR_STEPS.length}`}
      >
        {EDITOR_STEPS.map((key, index) => {
          const active = index === step;
          const complete = index < step;
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
        {current === "settings" && (
          <AfterSubmissionSection ownerEmail={ownerEmail} variant="flow" />
        )}
      </div>

      {/* Flow controls: they name where they go (a bare "Continue" read as
          "done with this field" and wasn't). */}
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => go("back")} disabled={exiting !== null}>
            <ArrowLeft className="h-4 w-4" />
            {STEP_TITLES[EDITOR_STEPS[step - 1]]}
          </Button>
        ) : (
          <span aria-hidden />
        )}
        {last ? (
          <Button onClick={() => router.push(`/forms/${formId}?mode=publish`)}>
            Publish
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => go("forward")} disabled={exiting !== null}>
            {STEP_TITLES[EDITOR_STEPS[step + 1]]}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
