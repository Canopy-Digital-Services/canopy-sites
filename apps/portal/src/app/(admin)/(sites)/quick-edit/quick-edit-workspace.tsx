"use client";

// UI: see docs/UX_PATTERNS.md for layout and component conventions.
import { Suspense, use, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { discardPendingChange, refreshPendingChange, sendQuickEdit } from "@/actions/site-editor";
import { HelpRequestCard, type DraftedRequest } from "@/components/sites/help-request-card";
import { LocalTime } from "@/components/local-time";

type Pending = { id: string; summary: string; status: string; error: string | null };
type Recent = { id: string; summary: string; publishedAt: string | null; by: string | null };
export type SentRequest = { id: string; summary: string; status: "OPEN" | "DONE" | "DECLINED"; sentAt: string | null; note: string | null };
type ChatMessage = { id: number; role: "owner" | "assistant"; text: string; helpRequest?: DraftedRequest; changeSetId?: string };

export function QuickEditWorkspace({
  siteId,
  examples,
  pagesCard,
  pending,
  recent,
  requests,
}: {
  siteId: string;
  /** Example requests from the site's own content (src/lib/quick-edit/examples.ts), streamed with it. */
  examples: Promise<string[]>;
  /** Streamed by the server: listing pages waits on the site's content. */
  pagesCard: React.ReactNode;
  pending: Pending | null;
  recent: Recent[];
  /** What the owner sent Canopy (PRD D34), newest first. */
  requests: SentRequest[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <QuickEdit examples={examples} previewHref={`/preview/${siteId}`} pendingId={pending?.id ?? null} />
      <div className="space-y-6">
        {pending ? <PendingChange key={pending.id} pending={pending} siteId={siteId} /> : null}
        <SentRequests requests={requests} />
        {pagesCard}
        <RecentChanges recent={recent} />
      </div>
    </div>
  );
}

function QuickEdit({
  examples,
  previewHref,
  pendingId,
}: {
  examples: Promise<string[]>;
  previewHref: string;
  /** The site's draft, so the reply that last changed it can open its preview. */
  pendingId: string | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Preview under the newest reply that changed the draft, where the draft's own card is stacked
  // out of view below the chat; it goes once the draft is published or discarded.
  const previewAt = pendingId ? messages.findLast((m) => m.changeSetId === pendingId)?.id : undefined;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, isPending, previewAt]);

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
      setMessages((m) => [
        ...m,
        {
          id: ++seq.current,
          role: "assistant",
          text: result.reply,
          helpRequest: result.helpRequest ?? undefined,
          changeSetId: result.changeSetId ?? undefined,
        },
      ]);
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
          <Suspense fallback={null}>
            {/* An example names a real class or price, so it goes into the box
                for the owner to change, never straight to the model. */}
            <Examples
              examples={examples}
              onPick={(text) => {
                setDraft(text);
                inputRef.current?.focus();
              }}
            />
          </Suspense>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "owner" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
            <p
              className={
                m.role === "owner"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm"
              }
            >
              {m.text}
            </p>
            {m.id === previewAt ? (
              <Button size="sm" className="lg:hidden" asChild>
                <a href={previewHref} target="_blank" rel="noopener">
                  Preview
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {m.helpRequest ? <HelpRequestCard request={m.helpRequest} onSent={() => router.refresh()} /> : null}
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
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
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

function Examples({ examples, onPick }: { examples: Promise<string[]>; onPick: (text: string) => void }) {
  const list = use(examples);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((s) => (
        <Button key={s} variant="outline" size="sm" className="h-auto max-w-full whitespace-normal py-1.5 text-left font-normal" onClick={() => onPick(s)}>
          {s}
        </Button>
      ))}
    </div>
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

const REQUEST_STATUS: Record<SentRequest["status"], { label: string; dot: string }> = {
  OPEN: { label: "With Michael", dot: "bg-primary" },
  DONE: { label: "Done", dot: "bg-success" },
  DECLINED: { label: "Not done", dot: "bg-muted-foreground" },
};

/** What the owner sent Canopy and where each stands, with Michael's note when he left one (PRD D34). */
function SentRequests({ requests }: { requests: SentRequest[] }) {
  if (requests.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Sent to Michael</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="space-y-1 text-sm">
              <p>{r.summary}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`h-2 w-2 shrink-0 rounded-full ${REQUEST_STATUS[r.status].dot}`} />
                <span>
                  {REQUEST_STATUS[r.status].label}
                  {r.sentAt ? (
                    <>
                      {" · "}
                      <LocalTime value={r.sentAt} format="date" />
                    </>
                  ) : null}
                </span>
              </p>
              {r.note ? <p className="whitespace-pre-wrap text-muted-foreground">{r.note}</p> : null}
            </li>
          ))}
        </ul>
      </CardContent>
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
              <p className="text-xs text-muted-foreground">
                {c.publishedAt ? <LocalTime value={c.publishedAt} /> : null}
                {c.by ? ` · ${c.by}` : null}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
