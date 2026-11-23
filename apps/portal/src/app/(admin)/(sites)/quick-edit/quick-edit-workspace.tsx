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
import { announceDraft } from "@/components/sites/draft-status";
import { blockedNotice, SiteNotice, useSiteHold } from "@/components/sites/site-hold";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { discardQuestion, theirChanges } from "@/lib/site-hold-policy";
import { LocalTime } from "@/components/local-time";

/** `by` is who last changed the draft, when that isn't the person looking (PRD D64). */
type Pending = { id: string; summary: string; status: string; buildStatus: string | null; version: number; error: string | null; by: string | null };
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
  // Why this person can't edit, where the chat would be (PRD D64). While someone else is making
  // edits, the draft is theirs to preview and discard, and is offered only as a Preview beside
  // their name. Once they have stopped, their draft's card is back with Preview and Discard: it
  // has to be published or discarded before anyone else edits. The chat stays mounted
  // underneath, so a conversation is still there when the site is free.
  const hold = useSiteHold();
  const blocked = blockedNotice(hold);
  const previewHref = `/preview/${siteId}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        {blocked ? <SiteNotice title={blocked} previewHref={hold.by && hold.hasDraft ? previewHref : undefined} /> : null}
        <div hidden={blocked !== null}>
          <QuickEdit examples={examples} previewHref={previewHref} pendingId={pending?.id ?? null} />
        </div>
      </div>
      <div className="space-y-6">
        {/* Each version of the draft is its own build, so a new one starts the card over. */}
        {pending && !hold.by ? <PendingChange key={`${pending.id}:${pending.version}`} pending={pending} siteId={siteId} /> : null}
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
  const { refused } = useSiteHold();
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
        refused(result);
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
      if (result.changeSetId) {
        // The Sites chrome shows the draft, and the page knows this change as its own.
        announceDraft("changed");
        router.refresh();
      }
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
                <a href={previewHref} target="_blank" rel="opener">
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

type CardState = { status: string; buildStatus: string | null; error: string | null };

/** A draft whose build failed stays a draft, and waits for its next edit (site-tools refreshChange). */
const buildFailed = (s: CardState) => s.status === "DRAFT" && s.buildStatus === "FAILED";

function StatusLine({ state }: { state: CardState }) {
  if (state.status === "PREVIEWED") {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-success" />
        Preview ready
      </span>
    );
  }
  if (state.status === "FAILED" || buildFailed(state)) {
    // A failed draft's error says why on its own; a failed build's is what to do next.
    const text =
      state.status === "FAILED"
        ? (state.error ?? "The preview couldn't be built.")
        : ["The preview couldn't be built.", state.error].filter(Boolean).join(" ");
    return (
      <span className="flex items-start gap-2 text-sm text-destructive">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
        {text}
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
  const { refused } = useSiteHold();
  const [state, setState] = useState<CardState>({ status: pending.status, buildStatus: pending.buildStatus, error: pending.error });
  const [isPending, startTransition] = useTransition();
  const waiting = state.status === "DRAFT" && !buildFailed(state);

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(async () => {
      const result = await refreshPendingChange(pending.id);
      if ("error" in result) return;
      const next = { status: result.status, buildStatus: result.buildStatus, error: result.reason };
      if (next.status !== "DRAFT") {
        setState(next);
        router.refresh();
      } else if (buildFailed(next)) {
        setState(next);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [pending.id, waiting, router]);

  function discard() {
    startTransition(async () => {
      const result = await discardPendingChange(pending.id);
      if ("error" in result) {
        toast.error(result.error);
        refused(result);
      } else {
        announceDraft("published");
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">{pending.by ? theirChanges(pending.by) : "Change waiting for you"}</CardTitle>
        <CardDescription>{pending.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusLine state={state} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={`/preview/${siteId}`} target="_blank" rel="opener">
            Preview
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        {/* Asks first, as the Sites chrome's Discard does, and says whose when it's someone else's work. */}
        <ConfirmDialog
          {...discardQuestion(pending.by)}
          onConfirm={discard}
          destructive
          trigger={
            <Button variant="ghost" disabled={isPending}>
              Discard
            </Button>
          }
        />
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
