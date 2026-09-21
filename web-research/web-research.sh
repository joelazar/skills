#!/usr/bin/env bash
# Web research dispatcher for answers that need synthesis.
# Modes: quick | ask (kagi) | google (agy) | claude (claude-code).
# Link lists and single-URL summaries are NOT here on purpose: use the pi
# web-tools extension (websearch / webfetch summarize=...) for those.
# Every kagi mode post-processes CLI JSON down to the minimal meaningful text
# so the caller's context never sees HTML, favicons, traces, or metadata.
set -uo pipefail

MODE=""
INPUT=""
THREAD_ID=""
FOLLOWUPS=0
MODEL=""

# Transient upstream failures (Kagi 5xx, agent quota walls) are common enough
# that a single attempt is not a reliable signal. Retry, then fail loudly.
RETRIES=3

run_with_retry() {
    local attempt=1 out status
    while :; do
        out="$("$@" 2>&1)"
        status=$?
        if [[ $status -eq 0 ]] && ! grep -qiE '^(network error|error):|HTTP 5[0-9][0-9]|reached your .* limit' <<<"$out"; then
            printf '%s\n' "$out"
            return 0
        fi
        if [[ $attempt -ge $RETRIES ]]; then
            printf '%s\n' "$out" >&2
            echo "ERROR: '$1' failed after $attempt attempts" >&2
            return 1
        fi
        echo "retry $attempt/$RETRIES after transient failure" >&2
        sleep $((attempt * 3))
        ((attempt++))
    done
}

usage() {
    cat <<'EOF'
Usage:
  web-research.sh <mode> "<question>" [flags]

Modes:
  quick      Grounded answer with ranked source links. Default for facts.
  ask        Kagi Assistant for deeper synthesis / multi-step reasoning.
  google     Google-grounded answer via Antigravity CLI (agy).
  claude     Web-grounded answer via Claude Code (claude -p).

Flags:
  --thread-id <id>     ask: continue an existing assistant thread
  --followups          quick: also print follow-up questions
  --model <name>       google/claude: override the model (e.g. opus)

All modes retry transient upstream failures (5xx, quota walls) up to 3 times
and exit non-zero if every attempt fails.

Examples:
  web-research.sh quick "latest stable rust version"
  web-research.sh ask "compare uv vs poetry for monorepos"
  web-research.sh ask "now show a migration example" --thread-id "<id>"
  web-research.sh google "weather in budapest next 7 days"
  web-research.sh claude "deep comparison of X and Y" --model opus

Not this skill:
  raw result links        -> websearch tool (pi web-tools extension)
  read/summarize one URL  -> webfetch tool, optionally summarize=summary
EOF
}

[[ $# -eq 0 ]] && {
    usage
    exit 2
}
MODE="$1"
shift

while [[ $# -gt 0 ]]; do
    case "$1" in
    --thread-id)
        THREAD_ID="$2"
        shift 2
        ;;
    --followups)
        FOLLOWUPS=1
        shift
        ;;
    --model)
        MODEL="$2"
        shift 2
        ;;
    -h | --help)
        usage
        exit 0
        ;;
    -*)
        echo "Unknown flag: $1" >&2
        usage
        exit 2
        ;;
    *)
        INPUT="${INPUT:+$INPUT }$1"
        shift
        ;;
    esac
done

[[ -z "$INPUT" ]] && {
    usage
    exit 2
}

cd "$HOME" || exit 1

PROMPT="Search the web for: $INPUT. Give a compact, factual answer with source URLs."

case "$MODE" in
google)
    command -v agy >/dev/null 2>&1 || {
        echo "ERROR: agy CLI not on PATH" >&2
        exit 127
    }
    run_with_retry agy -p "$PROMPT" --print-timeout 5m ${MODEL:+--model "$MODEL"}
    exit $?
    ;;
claude)
    command -v claude >/dev/null 2>&1 || {
        echo "ERROR: claude CLI not on PATH" >&2
        exit 127
    }
    run_with_retry claude -p "$PROMPT" ${MODEL:+--model "$MODEL"} --allowedTools WebSearch WebFetch
    exit $?
    ;;
esac

command -v kagi >/dev/null 2>&1 || {
    echo "ERROR: kagi CLI not on PATH" >&2
    exit 127
}

case "$MODE" in
quick)
    out="$(run_with_retry kagi quick "$INPUT")" || exit 1
    jq -r '.message.markdown' <<<"$out"
    echo
    jq -r '.references.markdown // empty' <<<"$out"
    if [[ "$FOLLOWUPS" -eq 1 ]]; then
        jq -r '(.followup_questions // [])[] | "- " + .' <<<"$out"
    fi
    ;;

ask)
    if [[ -n "$THREAD_ID" ]]; then
        run_with_retry kagi assistant --thread-id "$THREAD_ID" --format markdown "$INPUT"
    else
        run_with_retry kagi assistant --format markdown "$INPUT"
    fi
    ;;

*)
    echo "Unknown mode: $MODE" >&2
    usage
    exit 2
    ;;
esac
