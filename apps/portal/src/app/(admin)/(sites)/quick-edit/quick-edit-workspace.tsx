"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { discardPendingChange, refreshPendingChange, sendQuickEdit } from "@/actions/site-editor";

type Pending = { id: string; summary: string; status: string; error: string | null };
type Recent = { id: string; summary: string; publishedAt: string | null; by: string | null };
type ChatMessage = { id: number; role: "owner" | "assistant"; text: string };

const SUGGESTIONS = ["We're closed Saturday the 24th for a wedding", "Raise the haircut price to $90", "Add a review from Jenna: \"Best color I've ever had.\""];

export function QuickEditWorkspace({
  siteId,
  pagesCard,
  pending,
  recent,
}: {
  siteId: string;
  /** Streamed by the server: listing pages waits on the site's content. */
  pagesCard: React.ReactNode;
  pending: Pending | null;
  recent: Recent[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <QuickEdit />
      <div className="space-y-6">
        {pending ? <PendingChange key={pending.id} pending={pending} siteId={siteId} /> : null}
        {pagesCard}
        <RecentChanges recent={recent} />
      </div>
    </div>
  );
}

function QuickEdit() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, isPending]);

  function send(text: string) {
    const message = text.trim();
    if (!message || isPending) return;
    setMessages((m) => [...m, { id: ++seq.current, role: "owner", text: message }]);
    setDraft("");
    startTransition(async () => {
      const result = await sendQuickEdit({ conversationId, message });
      if ("error" in result) {
        setMessages((m) => [...m, { id: ++seq.current, role: "assistant", text: result.error }]);
        return;
      }
      setConversationId(result.conversationId);
      setMessages((m) => [...m, { id: ++seq.current, role: "assistant", text: result.reply }]);
      if (result.changeSetId) router.refresh();
    });
  }

  return (
    <Card className="flex min-h-[28rem] flex-col">
      <CardHeader>
        <CardTitle className="font-heading">What would you like to change?</CardTitle>
        <CardDescription>Say it in your own words. You&apos;ll see a preview before anything goes live.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} variant="outline" size="sm" className="h-auto whitespace-normal py-1.5 text-left font-normal" onClick={() => send(s)}>
                {s}
              </Button>
            ))}
          </div>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "owner" ? "flex justify-end" : "flex justify-start"}>
            <p
              className={
                m.role === "owner"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm"
              }
            >
              {m.text}
            </p>
          </div>
        ))}
        {isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Working on it…
          </div>
        ) : null}
        <div ref={endRef} />
      </CardContent>
      <CardFooter>
        <form
          className="flex w-full items-end gap-2"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder="e.g. Raise the blowout to $55"
            maxLength={2000}
            rows={2}
            className="min-h-[2.75rem] resize-none"
            aria-label="What would you like to change?"
          />
          <Button type="submit" disabled={isPending || !draft.trim()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function StatusLine({ status, error }: { status: string; error: string | null }) {
  if (status === "PREVIEWED") {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-success" />
        Preview ready
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="flex items-start gap-2 text-sm text-destructive">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
        {error ?? "The preview couldn't be built."}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Building preview…
    </span>
  );
}

/** The draft, with Preview (a new tab, where Publish lives, PRD D47) and Discard. */
function PendingChange({ pending, siteId }: { pending: Pending; siteId: string }) {
  const router = useRouter();
  const [state, setState] = useState({ status: pending.status, error: pending.error });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status !== "DRAFT") return;
    const timer = setInterval(async () => {
      const result = await refreshPendingChange(pending.id);
      if ("error" in result) return;
      if (result.status !== "DRAFT") {
        setState({ status: result.status, error: result.reason });
        router.refresh();
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [pending.id, state.status, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Change waiting for you</CardTitle>
        <CardDescription>{pending.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusLine status={state.status} error={state.error} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={`/preview/${siteId}`} target="_blank" rel="noopener">
            Preview
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await discardPendingChange(pending.id);
              if ("error" in result) toast.error(result.error);
              router.refresh();
            })
          }
        >
          Discard
        </Button>
      </CardFooter>
    </Card>
  );
}

function RecentChanges({ recent }: { recent: Recent[] }) {
  if (recent.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Recently published</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recent.map((c) => (
            <li key={c.id} className="text-sm">
              <p>{c.summary}</p>
              {/* Local time in the browser; the server renders UTC. */}
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {c.publishedAt ? new Date(c.publishedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : null}
                {c.by ? ` · ${c.by}` : null}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
