#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

root=$(git config --global --get gj.root)
root="${root/#\~/$HOME}"

fetch=1
if [[ ${1:-} == --no-fetch ]]; then
    fetch=0
    shift
fi

pattern='^\s+source: https://([^/\s]+)/([^/\s]+/[^/\s]+)/(?:(?:tree|blob)/)?([0-9a-f]{7,40})(?:/(\S+))?'
fetched=" "

rg --no-heading --no-line-number -P -o -r '$1 $2 $3 $4' "$pattern" \
    -g '*/SKILL.md' --max-depth 2 . |
    sort |
    while IFS=: read -r file match; do
        read -r host repo base path <<<"$match"
        skill=${file#./}
        skill=${skill%%/*}

        if [[ $# -gt 0 && " $* " != *" $skill "* ]]; then
            continue
        fi

        dir="$root/$host/$repo"
        if [[ ! -d "$dir/.git" ]]; then
            gj get "$host/$repo" >/dev/null </dev/null
        elif [[ $fetch == 1 && "$fetched" != *" $host/$repo "* ]]; then
            git -C "$dir" fetch --quiet origin </dev/null
            fetched+="$host/$repo "
        fi

        if [[ -n "$path" ]] && ! git -C "$dir" cat-file -e "origin/HEAD:$path" 2>/dev/null; then
            printf '%-30s removed upstream  %s\n' "$skill" "$(git -C "$dir" log -1 --format='%h %s' origin/HEAD -- "$path")"
            continue
        fi

        commits=$(git -C "$dir" log --oneline "$base..origin/HEAD" -- ${path:+"$path"})
        if [[ -z "$commits" ]]; then
            printf '%-30s up to date\n' "$skill"
            continue
        fi

        printf '%-30s %s new  git -C %s log -p %s..origin/HEAD -- %s\n' \
            "$skill" "$(wc -l <<<"$commits" | tr -d ' ')" "$dir" "$base" "${path:-.}"
        sed 's/^/    /' <<<"$commits"
    done
