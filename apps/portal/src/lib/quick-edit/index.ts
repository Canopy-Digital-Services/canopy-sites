/**
 * Quick edit (E32): the owner's chat, run on the Claude API with the site
 * tool layer as its tools, in-process (PRD 4.6). The model reads content and
 * proposes changes; the tool layer decides whether a proposal is allowed, and
 * only a person can publish. Every conversation records its token use and an
 * estimated cost (PRD D7: measure before optimizing).
 */

import Anthropic from "@anthropic-ai/sdk";
import { collections, jsonSchemaFor, type CollectionName } from "@canopy/site-contract";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { getContentView, proposeChange, ToolError, type ToolContext } from "@/lib/site-tools";
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
  ];
}

function systemPrompt(site: { name: string; overlay: string }, names: CollectionName[], today: string): Anthropic.TextBlockParam[] {
  const schemas = names
    .map((n) => `## ${n} (${collections[n].label})\n${JSON.stringify(jsonSchemaFor(n))}`)
    .join("\n\n");
  return [
    { type: "text", text: BASE_RUNBOOK },
    {
      type: "text",
      text: `# This site: ${site.name}\n\n${site.overlay.trim() || "(No site notes.)"}\n\n# Collections\n\n${schemas}`,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: `Today is ${today}.` },
  ];
}

export interface QuickEditReply {
  conversationId: string;
  reply: string;
  changeSetId: string | null;
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
  const site = await prisma.site.findUniqueOrThrow({ where: { id: view.site.id }, select: { id: true, name: true, runbookOverlay: true } });

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
  const system = systemPrompt({ name: site.name, overlay: site.runbookOverlay }, names, today);
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let changeSetId: string | null = null;
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
      results.push(await runTool(ctx, use, existing?.id ?? null, (id) => (changeSetId = id)));
    }
    messages.push({ role: "user", content: results });
  }
  if (!reply) reply = changeSetId ? "Your change is ready to preview." : "Sorry, I couldn't finish that. Try saying it another way.";

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
  console.log(
    JSON.stringify({ event: "quick_edit", accountId: ctx.accountId, conversationId: conversation.id, model: QUICK_EDIT_MODEL, ...usage, costUsd: cost }),
  );
  return { conversationId: conversation.id, reply, changeSetId };
}

async function runTool(
  ctx: ToolContext,
  use: Anthropic.ToolUseBlock,
  conversationId: string | null,
  onProposed: (id: string) => void,
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
      return result(`Proposed: ${proposed.summary}. The preview is building; the owner will see Preview and Publish buttons.`);
    }
    return result(`Unknown tool ${use.name}`, true);
  } catch (err) {
    if (err instanceof ToolError) return result(err.message, true);
    throw err;
  }
}
