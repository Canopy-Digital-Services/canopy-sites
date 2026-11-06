/**
 * Quick edit (E32): the owner's chat, run on the Claude API with the site
 * tool layer as its tools, in-process (PRD 4.6). The model reads content and
 * proposes changes; the tool layer decides whether a proposal is allowed, and
 * only a person can publish. Every conversation records its token use and an
 * estimated cost (PRD D7: measure before optimizing).
 */

import Anthropic from "@anthropic-ai/sdk";
import { collections, jsonSchemaFor, type AvoidWarning, type CollectionName } from "@canopy/site-contract";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { getContentView, proposeChange, ToolError, type FieldChange, type ToolContext } from "@/lib/site-tools";
import { draftHelpRequest, type HelpRequestView } from "@/lib/site-tools/help-requests";
import { BASE_RUNBOOK } from "./runbook";

export const QUICK_EDIT_MODEL = process.env.QUICK_EDIT_MODEL || "claude-opus-5-5";
const MAX_ROUNDS = 8;
export const MESSAGES_PER_HOUR = 60;

/** US dollars per million tokens: input, output, cache read, cache write (5 min). */
const PRICES: Record<string, [number, number, number, number]> = {
  "claude-opus-5-5": [4, 20, 0.2, 5],
  "claude-sonnet-5-5": [2, 10, 0.2, 2.5],
  "claude-haiku-5-5": [0.1, 0.5, 0.01, 0.125],
};

export function estimateCostUsd(model: string, usage: Usage): number {
  const [i, o, r, w] = PRICES[model] ?? PRICES["claude-opus-5-5"];
  return (usage.input * i + usage.output * o + usage.cacheRead * r + usage.cacheWrite * w) / 1_000_000;
}

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export class QuickEditError extends Error {}

let client: Anthropic | null = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new QuickEditError("Quick edit isn't set up in this environment yet.");
  client ??= new Anthropic();
  return client;
}

function tools(names: CollectionName[]): Anthropic.Tool[] {
  return [
    {
      name: "get_content",
      description: "Read one collection of the site's content as JSON, including any unpublished change.",
      input_schema: {
        type: "object",
        properties: { collection: { type: "string", enum: names } },
        required: ["collection"],
        additionalProperties: false,
      },
    },
    {
      name: "propose_change",
      description:
        "Propose a change to the site's content. It is checked against the site's rules and, if it passes, builds a preview the owner can publish. Returns an error to fix if it doesn't pass.",
      input_schema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "What changed, in a few plain words the owner would use." },
          ops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                collection: { type: "string", enum: names },
                op: { type: "string", enum: ["add", "remove", "replace", "move"] },
                path: { type: "string" },
                value: {},
                from: { type: "string" },
              },
              required: ["collection", "op", "path"],
            },
          },
        },
        required: ["summary", "ops"],
        additionalProperties: false,
      },
    },
    {
      name: "request_help",
      description:
        "Draft a request to Michael at Canopy for something you can't do: anything a tool refused as Canopy's, design or layout, a new page or kind of content, new photos, or whenever the owner asks for Michael. The owner sees it as a card with Send to Michael and Not now, and sends it themselves or doesn't; nothing reaches Michael until they do. Draft one per request.",
      input_schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "What the owner wants, in their own words, with every detail they gave (days, times, quoted text). Don't rewrite it.",
          },
          summary: { type: "string", description: "One short line saying what it's about, for Michael's inbox." },
          address: { type: "string", description: "The field it's about, as an address, when there is one." },
        },
        required: ["message", "summary"],
        additionalProperties: false,
      },
    },
  ];
}

/** What the model hears after a refusal that's Canopy's call (PRD D34): offer Michael, don't look for another way. */
export const OUT_OF_LANE =
  "This is Canopy's to change, so don't try it another way. Call request_help now with what the owner asked for, in their words, then tell them in a sentence that it's Canopy's and they can send it to Michael from the card.";

/**
 * The system prompt: the base runbook (shared, cached), then this site's
 * guide, the prose of SITE_GUIDE.md from the published commit (PRD D31), and
 * the JSON Schemas of the collections it has, then the date.
 */
export function systemPrompt(site: { name: string; guide: string }, names: CollectionName[], today: string): Anthropic.TextBlockParam[] {
  const schemas = names
    .map((n) => `## ${n} (${collections[n].label})\n${JSON.stringify(jsonSchemaFor(n))}`)
    .join("\n\n");
  return [
    { type: "text", text: BASE_RUNBOOK },
    {
      type: "text",
      text: `# This site: ${site.name}\n\n${site.guide.trim() || "(This site has no guide yet.)"}\n\n# Collections\n\n${schemas}`,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: `Today is ${today}.` },
  ];
}

export interface QuickEditReply {
  conversationId: string;
  reply: string;
  changeSetId: string | null;
  /** A request the model drafted this turn, shown to the owner as a card to send or dismiss (PRD D34). */
  helpRequest: HelpRequestView | null;
}

/**
 * One owner message through the model, possibly several tool rounds, to a
 * reply. Persists the whole exchange, append-only, with usage and cost.
 */
/** The field the owner clicked on the Editor's canvas, when quick edit opens from it (PRD D37). */
export interface QuickEditScope {
  address: string;
  label: string;
  value: string;
}

export async function runQuickEdit(
  ctx: ToolContext & { userId: string },
  input: { conversationId?: string | null; message: string; scope?: QuickEditScope | null },
): Promise<QuickEditReply> {
  const message = input.message.trim();
  if (!message) throw new QuickEditError("Type what you'd like to change.");
  if (message.length > 2000) throw new QuickEditError("That's a long message. Try something shorter.");
  if (isRateLimited(`quick-edit:${ctx.accountId}`, MESSAGES_PER_HOUR, 60 * 60 * 1000)) {
    throw new QuickEditError("That's a lot of edits for one hour. Try again a little later.");
  }

  const view = await getContentView(ctx.accountId).catch((err) => {
    throw new QuickEditError(err instanceof ToolError ? err.message : "The site couldn't be loaded.");
  });
  const site = { id: view.site.id, name: view.site.name };

  const existing = input.conversationId
    ? await prisma.conversation.findFirst({ where: { id: input.conversationId, siteId: site.id } })
    : null;
  const history = (existing?.messages as unknown as Anthropic.MessageParam[] | undefined) ?? [];
  // A conversation opened from a field starts with which field it was; it goes in the
  // conversation, not the system prompt, so the cached prefix stays shared (PRD D37).
  const scope = input.scope && history.length === 0 ? input.scope : null;
  const opening = scope
    ? `[The owner clicked "${scope.label.slice(0, 80)}" on their site in the Editor (field ${scope.address.slice(0, 300)}), which currently reads: "${scope.value.slice(0, 1200)}". Their request is about that field unless they say otherwise.]\n\n${message}`
    : message;
  const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: opening }];

  const names = view.collections;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: view.site.timeZone });
  const system = systemPrompt({ name: site.name, guide: view.guide.prose }, names, today);
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let changeSetId: string | null = null;
  let helpRequest: HelpRequestView | null = null;
  let reply = "";

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let response: Anthropic.Message;
    try {
      response = await anthropic().messages.create({
        model: QUICK_EDIT_MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        cache_control: { type: "ephemeral" },
        system,
        tools: tools(names),
        messages,
      });
    } catch (err) {
      if (err instanceof QuickEditError) throw err;
      console.error(JSON.stringify({ event: "quick_edit_api_error", status: (err as { status?: number }).status, message: (err as Error).message }));
      throw new QuickEditError("Quick edit couldn't reach the model just now. Try again in a moment.");
    }
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "refusal") {
      reply = "I can't help with that one. Michael can, though: send him a text.";
      break;
    }
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      results.push(
        await runTool(
          ctx,
          use,
          existing?.id ?? null,
          (id) => (changeSetId = id),
          (request) => (helpRequest = request),
        ),
      );
    }
    messages.push({ role: "user", content: results });
  }
  if (!reply) {
    reply = helpRequest
      ? "That one's for Canopy. You can send it to Michael below."
      : changeSetId
        ? "Your change is ready to preview."
        : "Sorry, I couldn't finish that. Try saying it another way.";
  }

  const cost = estimateCostUsd(QUICK_EDIT_MODEL, usage);
  const data = {
    messages: messages as unknown as Prisma.InputJsonValue,
    inputTokens: { increment: usage.input },
    outputTokens: { increment: usage.output },
    cacheReadTokens: { increment: usage.cacheRead },
    cacheWriteTokens: { increment: usage.cacheWrite },
    costUsd: { increment: new Prisma.Decimal(cost.toFixed(6)) },
  };
  const conversation = existing
    ? await prisma.conversation.update({ where: { id: existing.id }, data })
    : await prisma.conversation.create({
        data: {
          siteId: site.id,
          userId: ctx.userId,
          model: QUICK_EDIT_MODEL,
          messages: data.messages,
          inputTokens: usage.input,
          outputTokens: usage.output,
          cacheReadTokens: usage.cacheRead,
          cacheWriteTokens: usage.cacheWrite,
          costUsd: new Prisma.Decimal(cost.toFixed(6)),
        },
      });
  if (changeSetId) {
    await prisma.changeSet.updateMany({ where: { id: changeSetId, conversationId: null }, data: { conversationId: conversation.id } });
  }
  const drafted = helpRequest as HelpRequestView | null;
  if (drafted) {
    await prisma.helpRequest.updateMany({ where: { id: drafted.id, conversationId: null }, data: { conversationId: conversation.id } });
  }
  console.log(
    JSON.stringify({ event: "quick_edit", accountId: ctx.accountId, conversationId: conversation.id, model: QUICK_EDIT_MODEL, ...usage, costUsd: cost }),
  );
  return { conversationId: conversation.id, reply, changeSetId, helpRequest: drafted };
}


/**
 * What a proposal tells the model: what it actually changed, field by field,
 * so it can check that against what the owner asked for and name each change
 * in its reply, and what in it the site's copy avoids (Epic 40, 4.2).
 */
export function proposalResult(p: { summary: string; changes: FieldChange[]; warnings: AvoidWarning[] }): string {
  const lines = [`Proposed: ${p.summary}. The preview is building; the owner opens it with Preview and publishes from there.`];
  if (p.changes.length) {
    lines.push("", "What this changed on the site:", ...p.changes.map((c) => `- ${c.text}`));
    lines.push(
      "",
      "Check this list against what the owner asked for. If it changed anything they didn't ask for, put that back with another propose_change before you reply. Name each change in your reply.",
    );
  }
  if (p.warnings.length) {
    lines.push(
      "",
      "The site's guide says its copy avoids these. The copy is the owner's, so ask whether to keep each one or what they'd like instead:",
      ...p.warnings.map((w) => `- ${w.message}`),
    );
  }
  return lines.join("\n");
}

async function runTool(
  ctx: ToolContext,
  use: Anthropic.ToolUseBlock,
  conversationId: string | null,
  onProposed: (id: string) => void,
  onHelpRequest: (request: HelpRequestView) => void,
): Promise<Anthropic.ToolResultBlockParam> {
  const result = (content: string, isError = false): Anthropic.ToolResultBlockParam => ({
    type: "tool_result",
    tool_use_id: use.id,
    content,
    ...(isError ? { is_error: true } : {}),
  });
  const input = (use.input ?? {}) as Record<string, unknown>;
  try {
    if (use.name === "get_content") {
      const view = await getContentView(ctx.accountId);
      const name = input.collection as CollectionName;
      if (!view.collections.includes(name)) return result(`This site has no "${String(name)}" collection.`, true);
      const note = view.pending ? `\n\n(Includes the unpublished change: ${view.pending.summary})` : "";
      return result(JSON.stringify(view.content[name], null, 1) + note);
    }
    if (use.name === "propose_change") {
      const proposed = await proposeChange(ctx, {
        summary: String(input.summary ?? ""),
        ops: input.ops,
        conversationId: conversationId ?? undefined,
      });
      onProposed(proposed.changeSetId);
      return result(proposalResult(proposed));
    }
    if (use.name === "request_help") {
      const drafted = await draftHelpRequest(
        { accountId: ctx.accountId, userId: ctx.userId, actAsId: ctx.actAsId ?? null },
        {
          message: String(input.message ?? ""),
          summary: String(input.summary ?? ""),
          address: typeof input.address === "string" ? input.address : null,
          conversationId,
        },
      );
      onHelpRequest(drafted);
      return result(
        "The owner now sees this request as a card with Send to Michael and Not now. It hasn't been sent: don't say it was. Tell them in a sentence that it's Canopy's and they can send it from the card.",
      );
    }
    return result(`Unknown tool ${use.name}`, true);
  } catch (err) {
    if (err instanceof ToolError) return result(err.outOfLane ? `${err.message} ${OUT_OF_LANE}` : err.message, true);
    throw err;
  }
}
