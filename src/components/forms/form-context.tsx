"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { updateFormBasics, updateFormHeader, updateFormAppearance, updateAfterSubmission } from "@/actions/forms";
import { useToast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type FieldState = {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  placeholder: string | null;
  helpText: string | null;
  options: unknown;
  validation: unknown;
};

export type FormState = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  description: string | null;
  fields: FieldState[];
  defaultTheme: Record<string, string | number | boolean> | null;
  successMessage: string | null;
  redirectUrl: string | null;
  emailNotificationsEnabled: boolean;
  notifyEmails: string[];
  allowedOrigins: string[];
  honeypotField: string | null;
  stopAt: Date | null;
  maxSubmissions: number | null;
};

export type SaveStatus = "idle" | "saving" | "saved";

type FormContextValue = {
  state: FormState;
  saveStatus: SaveStatus;
  updateName: (name: string) => void;
  updateHeader: (patch: { title?: string | null; description?: string | null }) => void;
  updateTheme: (theme: Record<string, string | number | boolean>) => void;
  updateSubmissionSettings: (patch: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;
    notifyEmails?: string[];
    allowedOrigins?: string[];
    stopAt?: Date | null;
    maxSubmissions?: number | null;
  }) => void;
  setFields: (fields: FieldState[]) => void;
  updateField: (fieldId: string, patch: Partial<FieldState>) => void;
  addField: (field: FieldState) => void;
  removeField: (fieldId: string) => void;
};

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useFormContext must be used within FormProvider");
  return ctx;
}

// ─── Auto-save hook ─────────────────────────────────────────────────────────────

type SaveGroup = "basics" | "header" | "theme" | "afterSubmission";

function useAutoSave(
  formId: string,
  state: FormState,
  setSaveStatus: (status: SaveStatus) => void,
  toast: ReturnType<typeof useToast>["toast"],
) {
  // Track which groups are dirty
  const dirtyRef = useRef<Set<SaveGroup>>(new Set());
  const timersRef = useRef<Map<SaveGroup, ReturnType<typeof setTimeout>>>(new Map());
  // Store "last saved" snapshot to compare against
  const savedRef = useRef({
    name: state.name,
    title: state.title,
    description: state.description,
    defaultTheme: state.defaultTheme,
    successMessage: state.successMessage,
    redirectUrl: state.redirectUrl,
    emailNotificationsEnabled: state.emailNotificationsEnabled,
    notifyEmails: state.notifyEmails,
    allowedOrigins: state.allowedOrigins,
    stopAt: state.stopAt,
    maxSubmissions: state.maxSubmissions,
  });

  const save = async (group: SaveGroup) => {
    setSaveStatus("saving");
    try {
      switch (group) {
        case "basics":
          await updateFormBasics(formId, { name: state.name });
          savedRef.current.name = state.name;
          break;
        case "header":
          await updateFormHeader(formId, {
            title: state.title,
            description: state.description,
          });
          savedRef.current.title = state.title;
          savedRef.current.description = state.description;
          break;
        case "theme":
          await updateFormAppearance(formId, { defaultTheme: state.defaultTheme });
          savedRef.current.defaultTheme = state.defaultTheme;
          break;
        case "afterSubmission":
          await updateAfterSubmission(formId, {
            successMessage: state.successMessage,
            redirectUrl: state.redirectUrl,
            emailNotificationsEnabled: state.emailNotificationsEnabled,
            notifyEmails: state.notifyEmails,
            allowedOrigins: state.allowedOrigins.filter(o => o.trim() !== ""),
            stopAt: state.stopAt,
            maxSubmissions: state.maxSubmissions,
          });
          savedRef.current.successMessage = state.successMessage;
          savedRef.current.redirectUrl = state.redirectUrl;
          savedRef.current.emailNotificationsEnabled = state.emailNotificationsEnabled;
          savedRef.current.notifyEmails = state.notifyEmails;
          savedRef.current.allowedOrigins = state.allowedOrigins;
          savedRef.current.stopAt = state.stopAt;
          savedRef.current.maxSubmissions = state.maxSubmissions;
          break;
      }
      dirtyRef.current.delete(group);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error(`Failed to save ${group}:`, error);
      toast.error(`Failed to save changes`);
      setSaveStatus("idle");
    }
  };

  const scheduleSave = (group: SaveGroup) => {
    // Clear existing timer for this group
    const existing = timersRef.current.get(group);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      timersRef.current.delete(group);
      void save(group);
    }, 1000);
    timersRef.current.set(group, timer);
  };

  // Detect changes and schedule saves
  useEffect(() => {
    if (state.name !== savedRef.current.name) {
      scheduleSave("basics");
    }
  }, [state.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      state.title !== savedRef.current.title ||
      state.description !== savedRef.current.description
    ) {
      scheduleSave("header");
    }
  }, [state.title, state.description]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.defaultTheme !== savedRef.current.defaultTheme) {
      scheduleSave("theme");
    }
  }, [state.defaultTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      state.successMessage !== savedRef.current.successMessage ||
      state.redirectUrl !== savedRef.current.redirectUrl ||
      state.emailNotificationsEnabled !== savedRef.current.emailNotificationsEnabled ||
      state.notifyEmails !== savedRef.current.notifyEmails ||
      state.allowedOrigins !== savedRef.current.allowedOrigins ||
      state.stopAt !== savedRef.current.stopAt ||
      state.maxSubmissions !== savedRef.current.maxSubmissions
    ) {
      scheduleSave("afterSubmission");
    }
  }, [state.successMessage, state.redirectUrl, state.emailNotificationsEnabled, state.notifyEmails, state.allowedOrigins, state.stopAt, state.maxSubmissions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);
}

// ─── Provider ───────────────────────────────────────────────────────────────────

type FormProviderProps = {
  initialForm: {
    id: string;
    name: string;
    slug: string;
    title: string | null;
    description: string | null;
    defaultTheme: unknown;
    successMessage: string | null;
    redirectUrl: string | null;
    emailNotificationsEnabled: boolean;
    notifyEmails: string[];
    allowedOrigins: string[];
    honeypotField: string | null;
    stopAt: Date | null;
    maxSubmissions: number | null;
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      placeholder: string | null;
      helpText: string | null;
      options: unknown;
      validation: unknown;
    }>;
  };
  children: React.ReactNode;
};

function parseTheme(theme: unknown): Record<string, string | number | boolean> | null {
  if (typeof theme === "object" && theme !== null) {
    return theme as Record<string, string | number | boolean>;
  }
  return null;
}

export function FormProvider({ initialForm, children }: FormProviderProps) {
  const { toast } = useToast();
  const [state, setState] = useState<FormState>(() => ({
    id: initialForm.id,
    name: initialForm.name,
    slug: initialForm.slug,
    title: initialForm.title,
    description: initialForm.description,
    fields: initialForm.fields.map(f => ({
      id: f.id,
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.required,
      order: f.order,
      placeholder: f.placeholder,
      helpText: f.helpText,
      options: f.options,
      validation: f.validation,
    })),
    defaultTheme: parseTheme(initialForm.defaultTheme),
    successMessage: initialForm.successMessage,
    redirectUrl: initialForm.redirectUrl,
    emailNotificationsEnabled: initialForm.emailNotificationsEnabled,
    notifyEmails: initialForm.notifyEmails,
    allowedOrigins: initialForm.allowedOrigins,
    honeypotField: initialForm.honeypotField,
    stopAt: initialForm.stopAt,
    maxSubmissions: initialForm.maxSubmissions,
  }));

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useAutoSave(initialForm.id, state, setSaveStatus, toast);

  const updateName = (name: string) => {
    setState(prev => ({ ...prev, name }));
  };

  const updateHeader = (patch: { title?: string | null; description?: string | null }) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const updateTheme = (theme: Record<string, string | number | boolean>) => {
    setState(prev => ({ ...prev, defaultTheme: theme }));
  };

  const updateSubmissionSettings = (patch: {
    successMessage?: string | null;
    redirectUrl?: string | null;
    emailNotificationsEnabled?: boolean;
    notifyEmails?: string[];
    allowedOrigins?: string[];
    stopAt?: Date | null;
    maxSubmissions?: number | null;
  }) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const setFields = (fields: FieldState[]) => {
    setState(prev => ({ ...prev, fields }));
  };

  const updateField = (fieldId: string, patch: Partial<FieldState>) => {
    setState(prev => ({
      ...prev,
      fields: prev.fields.map(f => (f.id === fieldId ? { ...f, ...patch } : f)),
    }));
  };

  const addField = (field: FieldState) => {
    setState(prev => ({ ...prev, fields: [...prev.fields, field] }));
  };

  const removeField = (fieldId: string) => {
    setState(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));
  };

  const value: FormContextValue = {
    state,
    saveStatus,
    updateName,
    updateHeader,
    updateTheme,
    updateSubmissionSettings,
    setFields,
    updateField,
    addField,
    removeField,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}
