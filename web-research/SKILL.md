---
name: web-research
description: "Synthesized answers from the web: a fact with sources, a comparison or multi-step question, or a second opinion when the user says \"use google\" or \"ask claude\". For raw result links or reading one URL, use the websearch and webfetch tools instead."
allowed-tools: [Bash, Read]
disable-model-invocation: true
---

# Web research

Someone else does the synthesis. Plain retrieval belongs to the pi `web-tools`
extension: result links → `websearch`, one page → `webfetch`, one page or
YouTube URL condensed → `webfetch` with `summarize=summary`.

```bash
~/.agents/skills/web-research/web-research.sh <mode> "<question>" [flags]
```

| Mode     | Backend            | Use when                                                                                             |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `quick`  | `kagi quick`       | **Default.** A fact or short answer; prints ranked source links. `--followups` adds Kagi's follow-ups. |
| `ask`    | `kagi assistant`   | The answer needs reasoning or synthesis across sources. `--thread-id <id>` continues a prior thread.   |
| `google` | `agy -p`           | User says "use google" / "google it".                                                                 |
| `claude` | `claude -p`        | User says "use claude" / "ask claude".                                                                |

Start at `quick`; escalate to `ask` only when a fact lookup cannot answer it.
For a question worth cross-checking, run several modes and reconcile: they
surface different sources, and disagreement is itself a finding.

`--model <name>` overrides the model for `google` and `claude`. Reach for
`--model opus` when `claude` hits a quota wall on its default model, or when
the question needs depth.

## Timeouts

| Mode | Typical | Tool timeout |
| --- | --- | --- |
| `quick` | ~10s | 60s |
| `ask` | seconds to 3 min | 400s |
| `google` | 1–5 min | 600s |
| `claude` | 1–5 min | 600s |

Long waits are normal, not hangs. Let them finish; aborting wastes the whole
call.

## Failures

All modes retry transient failures 3 times with backoff — Kagi Assistant 5xx
and agent quota walls both happen and both usually clear. Errors go to stderr
and exit non-zero, so a failure never reads like an answer.

## Setup

`kagi auth` once, with a Kagi subscription. `google` and `claude` modes need an
authenticated `agy` or `claude` on `PATH`. The script names any missing
dependency and exits.

kagi-cli's other tools (translate, news, batch, lenses, bangs) are deliberately
absent — run `kagi` directly for those.
