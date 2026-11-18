import { spawn } from "node:child_process";

/** A capped build log: the last lines of every step, for the operator. */
export class Log {
  lines: string[] = [];
  private readonly max: number;
  constructor(max = 400) {
    this.max = max;
  }
  add(text: string) {
    for (const line of text.split("\n")) {
      if (line.trim() === "") continue;
      this.lines.push(line);
    }
    if (this.lines.length > this.max) this.lines.splice(0, this.lines.length - this.max);
  }
  toString() {
    return this.lines.join("\n");
  }
}

export class StepError extends Error {
  /** The last lines a failed program wrote (git's "fatal: ..."), for the builder's log only: never in a response. */
  output?: string;
  constructor(message: string, output?: string) {
    super(message);
    this.output = output;
  }
}

/** The last few lines of a program's output, for a log line. */
export function lastLines(text: string, lines = 5, chars = 1000): string {
  return text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "")
    .slice(-lines)
    .join("\n")
    .slice(-chars);
}

/**
 * A failure as the builder logs it: its message, which is also what the
 * portal hears, and the failed program's last lines when there are any. git
 * gets the repo's token only through its environment (git.ts), so neither
 * carries it.
 */
export function failureFields(err: unknown): { message: string; output?: string } {
  const message = err instanceof Error ? err.message : String(err);
  return err instanceof StepError && err.output ? { message, output: err.output } : { message };
}

/**
 * Runs a program with an argument array (never a shell, so nothing in a
 * request can become shell syntax) and an explicit environment (so the
 * builder's own secrets never reach a site's build scripts). `user` runs it
 * as a site's build user (sandbox.ts).
 */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd: string; env: Record<string, string>; log?: Log; timeoutMs?: number; user?: { uid: number; gid: number } },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, env: opts.env, stdio: ["ignore", "pipe", "pipe"], uid: opts.user?.uid, gid: opts.user?.gid });
    let out = "";
    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      out += text;
      opts.log?.add(text);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    const timer = setTimeout(() => child.kill("SIGKILL"), opts.timeoutMs ?? 300_000);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new StepError(`${cmd} failed to start: ${err.message}`));
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new StepError(`${cmd} ${args[0] ?? ""} ${signal ? `was killed (${signal})` : `exited with ${code}`}`, lastLines(out) || undefined));
    });
  });
}

/**
 * Environment for a site's npm and astro steps: no builder secrets, and a
 * home, temp directory, and npm cache of the site's own. TZ is the site's
 * time zone, so a page that shows what's current on the build date
 * (announcements) uses the site's calendar, not the container's UTC.
 */
export function buildEnv(home: string, timeZone?: string): Record<string, string> {
  return {
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: home,
    TMPDIR: `${home}/tmp`,
    npm_config_cache: `${home}/.npm`,
    CI: "1",
    ASTRO_TELEMETRY_DISABLED: "1",
    npm_config_update_notifier: "false",
    ...(timeZone ? { TZ: timeZone } : {}),
  };
}
