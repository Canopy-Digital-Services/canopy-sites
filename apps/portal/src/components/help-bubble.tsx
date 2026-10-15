// UI: see docs/UX_PATTERNS.md for layout and component conventions.
"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HelpCircle, BookOpen, Library, Mail, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getHelpHref } from "@/lib/docs-route-map";
import { ContactDialog } from "@/components/contact-dialog";
import type { ContactKind } from "@/actions/contact";

const DOCS_INDEX = "/docs";

function extractIds(pathname: string) {
  const formMatch = pathname.match(/^\/forms\/([^/]+)(?:\/.*)?$/);
  const formId = formMatch && formMatch[1] !== "new" ? formMatch[1] : undefined;
  const submissionMatch = pathname.match(/\/submissions\/([^/]+)$/);
  const submissionId = submissionMatch ? submissionMatch[1] : undefined;
  return { formId, submissionId };
}

type HelpBubbleProps = {
  /** Passed from the admin layout's session; prefills the support reply address. */
  accountEmail: string;
};

export function HelpBubble({ accountEmail }: HelpBubbleProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams?.toString();
  const href = getHelpHref(pathname, search);
  const [contactKind, setContactKind] = useState<ContactKind | null>(null);

  const { formId, submissionId } = useMemo(() => extractIds(pathname), [pathname]);

  if (!href) return null;

  // On routes with no specific doc page, `getHelpHref` falls back to the index —
  // which is where "Browse documentation" already goes. Drop the duplicate.
  const showContextualHelp = href !== DOCS_INDEX;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open help menu"
              className="group inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            {showContextualHelp && (
              <DropdownMenuItem onSelect={() => router.push(href)}>
                <BookOpen className="h-4 w-4" />
                Help with this page
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => router.push(DOCS_INDEX)}>
              <Library className="h-4 w-4" />
              Browse documentation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setContactKind("support")}>
              <Mail className="h-4 w-4" />
              Contact support
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setContactKind("feedback")}>
              <MessageSquare className="h-4 w-4" />
              Give feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ContactDialog
        kind={contactKind}
        onClose={() => setContactKind(null)}
        accountEmail={accountEmail}
        context={{ pathname, search, formId, submissionId }}
      />
    </>
  );
}
