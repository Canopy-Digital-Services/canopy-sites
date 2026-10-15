"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type FormTabNavProps = {
  formId: string;
  activeTab: string;
  /** When provided, tabs use client-side switching instead of navigation */
  onTabChange?: (tab: string) => void;
};

const TABS = [
  { key: "editor", label: "Editor" },
  { key: "publish", label: "Publish" },
  { key: "submissions", label: "Submissions" },
] as const;

const TAB_HREF: Record<string, (formId: string) => string> = {
  editor: (id) => `/forms/${id}?mode=edit`,
  submissions: (id) => `/forms/${id}?mode=submissions`,
  publish: (id) => `/forms/${id}?mode=publish`,
};

export function FormTabNav({ formId, activeTab, onTabChange }: FormTabNavProps) {
  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const styles = cn(
          "px-4 py-2 text-sm font-medium transition-colors",
          isActive
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground",
        );

        if (onTabChange) {
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={styles}
            >
              {tab.label}
            </button>
          );
        }

        return (
          <Link key={tab.key} href={TAB_HREF[tab.key](formId)} className={styles}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
