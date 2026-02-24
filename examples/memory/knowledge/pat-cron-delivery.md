# Cron Delivery Best Practices

## Metadata
- Applicable: OpenClaw cron jobs delivering long content to messaging channels
- Not applicable: Short messages (<500 chars) where reliability doesn't matter
- Confidence: High (real failures + community validation)
- Last verified: 2025-09-01

---

## Core Conclusion

Don't use `delivery.mode: "announce"` for long content. It's unreliable for messages >4096 characters and fails silently.

Use `delivery.mode: "none"` + have the agent send reports directly via messaging tools.

## Why

1. Announce delivery uses internal message splitting that's unstable for long content
2. Announce mode suppresses the agent's own messaging tool calls (no fallback)
3. Failures are silent — no error, no retry, no notification
4. Behavior is non-deterministic — same config works today, fails tomorrow

## Recommended Setup

```json
{
  "delivery": { "mode": "none" },
  "payload": {
    "kind": "agentTurn",
    "message": "... include delivery rules in prompt ..."
  }
}
```

## Splitting Threshold

Messaging platforms have character limits (e.g., Telegram: 4096). Account for formatting overhead:
- Safe split threshold: ~3800 characters
- Each chunk must be semantically complete
- Don't break URLs or formatting markers across chunks

---
*Source: Multiple delivery failures over 2 weeks, confirmed by community reports*
