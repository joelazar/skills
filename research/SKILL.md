---
name: research
description: "Research a question on the web for a synthesized, sourced answer: a fact, a comparison or multi-step question, docs or API facts, findings to save as a note, or a second opinion (\"use google\", \"ask claude\"). Raw result links or one URL: use websearch or webfetch."
allowed-tools: [Bash, Read]
---

# Research

Someone else does the synthesis. Plain retrieval belongs to the agent's own web
search and web fetch tools: result links → web search, one page → web fetch.

```bash
~/.agents/skills/research/research.sh <mode> "<question>" [flags]
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

## Primary sources

Trust **primary sources**: official docs, source code, specs, first-party APIs.
A synthesized answer is a lead, not a citation: follow each claim back to the
source that owns it (webfetch the page, read the code) before relying on it.
Done when every claim you report names its owning source.

## Saving findings

When the user wants the research kept, write one Markdown file with every claim
citing its source. Save it where the repo already keeps notes; with no
convention, pick a sensible spot and say where.

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
