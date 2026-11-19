/**
 * What the owner hears when the builder fails them: one plain sentence for
 * what didn't happen. The builder's own message (a git step's exit code, a
 * timeout) is Canopy's to read, so it goes to the server log with the site,
 * never to the owner or to Quick Edit's model, which repeats what it hears
 * (Epic 46, eval case H6: "git fetch exited with 128" in the chat).
 */
export const BUILDER_FAILED = {
  read: "Your site couldn't be loaded just now. Try again in a moment.",
  preview: "Your change is saved, but its preview couldn't be started just now.",
  publish: "Your change wasn't published. Try again in a moment.",
} as const;

const EVENTS = {
  read: "builder_read_failed",
  preview: "builder_preview_failed",
  publish: "builder_publish_failed",
} as const;

export type BuilderStep = keyof typeof BUILDER_FAILED;

/**
 * Logs a failed builder call as one JSON line (the step's event, the site's
 * slug and any ids given, and the error's message) and returns the sentence
 * the owner hears in its place. A builder message names a step and its exit
 * code, never the repo's token, which reaches git only through its
 * environment.
 */
export function builderFailure(step: BuilderStep, err: unknown, where: { slug: string } & Record<string, string>): string {
  console.error(JSON.stringify({ event: EVENTS[step], ...where, message: err instanceof Error ? err.message : String(err) }));
  return BUILDER_FAILED[step];
}
