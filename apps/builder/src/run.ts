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

export class StepError extends Error {}

/**
 * Runs a program with an argument array (never a shell, so nothing in a
 * request can become shell syntax) and an explicit environment (so the
 * builder's own secrets never reach a site's build scripts).
 */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd: string; env: Record<string, string>; log?: Log; timeoutMs?: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, env: opts.env, stdio: ["ignore", "pipe", "pipe"] });
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
      else reject(new StepError(`${cmd} ${args[0] ?? ""} ${signal ? `was killed (${signal})` : `exited with ${code}`}`));
    });
  });
}

/** Environment for a site's npm and astro steps: no builder secrets. */
export function buildEnv(): Record<string, string> {
  return {
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: process.env.HOME ?? "/tmp",
    CI: "1",
    ASTRO_TELEMETRY_DISABLED: "1",
    npm_config_update_notifier: "false",
  };
}
