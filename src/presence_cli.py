import argparse
import asyncio
import sys

from src.presence import (
    PresenceController,
    PresenceError,
    PresenceResult,
    PresenceTarget,
    parse_duration_seconds,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="imessage-presence",
        description="Control Messages.app read/typing presence for OpenClaw without private IMCore access.",
    )
    parser.add_argument(
        "action",
        choices=["status", "focus", "mark-read", "typing-start", "typing", "typing-stop", "clear", "typing-session"],
    )
    parser.add_argument("--to", help="Phone number, Apple ID email, or recipient string accepted by Messages.app.")
    parser.add_argument("--chat-id", help="Messages chat.ROWID to resolve from ~/Library/Messages/chat.db.")
    parser.add_argument("--chat-guid", help="Messages chat.guid to resolve from ~/Library/Messages/chat.db.")
    parser.add_argument("--chat-identifier", help="Messages chat.chat_identifier to pass to Messages.app.")
    parser.add_argument("--duration", default="5s", help="Duration for the typing action. Defaults to 5s.")
    parser.add_argument("--max-duration", default="120s", help="Maximum duration for typing-session. Defaults to 120s.")
    parser.add_argument("--refresh", default="4s", help="Refresh interval for typing-session. Defaults to 4s.")
    parser.add_argument("--timeout", default="8s", help="Per-AppleScript action timeout. Defaults to 8s.")
    parser.add_argument("--json", action="store_true", help="Print stable JSON output.")
    parser.add_argument("--dry-run", action="store_true", help="Resolve inputs without controlling Messages.app.")
    return parser


def target_from_args(args: argparse.Namespace) -> PresenceTarget:
    return PresenceTarget(
        to=args.to,
        chat_id=args.chat_id,
        chat_guid=args.chat_guid,
        chat_identifier=args.chat_identifier,
    )


async def run_action(args: argparse.Namespace) -> PresenceResult:
    timeout = parse_duration_seconds(args.timeout, default=8.0)
    controller = PresenceController(dry_run=args.dry_run, timeout=timeout)
    target = target_from_args(args)

    if args.action == "status":
        return await controller.status()
    if args.action == "focus":
        return await controller.focus(target)
    if args.action == "mark-read":
        return await controller.mark_read(target)
    if args.action == "typing-start":
        return await controller.typing_start(target)
    if args.action == "typing":
        return await controller.typing(target, parse_duration_seconds(args.duration, default=5.0))
    if args.action == "typing-stop":
        return await controller.typing_stop(target)
    if args.action == "clear":
        return await controller.clear()
    if args.action == "typing-session":
        return await controller.typing_session(
            target,
            max_duration_seconds=parse_duration_seconds(args.max_duration, default=120.0),
            refresh_seconds=parse_duration_seconds(args.refresh, default=4.0),
        )
    raise PresenceError("unknown_action", f"Unsupported action '{args.action}'.")


def print_result(result: PresenceResult, as_json: bool) -> None:
    if as_json:
        print(result.to_json())
        return

    if result.ok:
        target = f" for {result.target}" if result.target else ""
        print(f"{result.action} succeeded{target}")
    else:
        print(result.message or result.error or f"{result.action} failed", file=sys.stderr)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        result = asyncio.run(run_action(args))
    except PresenceError as exc:
        result = PresenceResult(
            ok=False,
            action=getattr(args, "action", "unknown"),
            error=exc.code,
            message=exc.message,
            dry_run=getattr(args, "dry_run", False),
        )
    except KeyboardInterrupt:
        result = PresenceResult(ok=False, action=getattr(args, "action", "unknown"), error="interrupted", message="Interrupted.")

    print_result(result, args.json)
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
