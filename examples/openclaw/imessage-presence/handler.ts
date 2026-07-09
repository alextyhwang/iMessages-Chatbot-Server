import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { execFile as execFileCb } from "node:child_process";

const execFile = promisify(execFileCb);

const CLI = process.env.IMESSAGE_PRESENCE_CLI || "imessage-presence";
const MAX_TYPING_SECONDS = process.env.IMESSAGE_PRESENCE_TYPING_MAX || "120s";
const TYPING_REFRESH = process.env.IMESSAGE_PRESENCE_TYPING_REFRESH || "4s";

function isIMessageEvent(event: any): boolean {
  const channel = String(event?.context?.channelId || event?.context?.channel || "").toLowerCase();
  return channel === "imessage" || channel === "imessage-channel" || channel.includes("imessage");
}

function resolveTarget(event: any): string | null {
  const ctx = event?.context || {};
  const meta = ctx.metadata || {};
  const candidates = [
    ctx.from,
    meta.senderId,
    meta.chatIdentifier,
    meta.chat_identifier,
    meta.handle,
    ctx.to,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

async function runPresence(args: string[]): Promise<void> {
  try {
    const { stdout, stderr } = await execFile(CLI, args, {
      timeout: 20_000,
      env: process.env,
    });
    if (stdout?.trim()) {
      console.log(`[imessage-presence] ${stdout.trim()}`);
    }
    if (stderr?.trim()) {
      console.warn(`[imessage-presence] ${stderr.trim()}`);
    }
  } catch (error: any) {
    const detail = error?.stderr || error?.stdout || error?.message || String(error);
    console.warn(`[imessage-presence] command failed (${args.join(" ")}): ${detail}`);
  }
}

function startTypingSession(target: string): void {
  const child = spawn(
    CLI,
    [
      "typing-session",
      "--to",
      target,
      "--max-duration",
      MAX_TYPING_SECONDS,
      "--refresh",
      TYPING_REFRESH,
      "--json",
    ],
    {
      detached: true,
      stdio: "ignore",
      env: process.env,
    },
  );
  child.unref();
}

const handler = async (event: any) => {
  if (!isIMessageEvent(event)) {
    return;
  }

  const target = resolveTarget(event);
  if (!target) {
    console.warn("[imessage-presence] skipped: no iMessage target on event");
    return;
  }

  if (event.type === "message" && event.action === "received") {
    // Fire-and-forget so OpenClaw dispatch is never blocked on UI automation.
    void (async () => {
      await runPresence(["mark-read", "--to", target, "--json"]);
      startTypingSession(target);
    })();
    return;
  }

  if (event.type === "message" && event.action === "sent") {
    void (async () => {
      await runPresence(["typing-stop", "--to", target, "--json"]);
      await runPresence(["clear", "--json"]);
    })();
  }
};

export default handler;
