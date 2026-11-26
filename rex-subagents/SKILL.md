---
name: rex-subagents
description: Run subagents as interactive pi sessions in their own Rex tabs. Use when Joe asks for subagents, parallel agents, or to hand work to agents in rex tabs.
---

# Subagents in Rex tabs

Each subagent is an interactive `pi` in its own Rex tab. Joe watches it and can type into it. Rex CLI details come from the `rex` skill (`rex __internal skill`).

## Steps

1. **Split the work.** One agent per slice that can be built and verified on its own. Done when every file the plan touches has exactly one owning agent.
2. **Write a brief per agent** to `plans/agents/<name>.md` in the repo, or to a `mktemp -d` dir for throwaway work. Shared rules go in `plans/agents/common.md`. Every brief states:
   - scope, and the files the agent owns
   - how to verify (exact commands)
   - leave changes uncommitted and unpushed; Joe reviews the diff
   - Joe may type in this tab; ask him there when something is unclear
   - when finished, write `plans/agents/<name>.done` listing changed files, how they were verified, and what is still open
3. **Pick each agent's directory.** Agents that change code in the same repo each get a worktree: `-c "$(git -C <repo> wt <branch>)"`. If they have to share one checkout (a submodule superproject, a single docker stack), name one owner per piece of shared state (stack, DB, generated files) in `common.md`. The other agents append what they need from that owner to `plans/agents/requests.md`.
4. **Launch** each agent:

   ```bash
   rex window new -s "$REX_BLOCK" <name> -c <dir> --focus=false --keep-open --json \
     -- pi -n <name> "@<brief path>" | jq -c '{window_id, block: .block_ids[0]}'
   ```

   The positional `<name>` is the tab title. `--keep-open` keeps the tab after pi exits. Pass the brief as `@file`, since inline prompts get mangled by shell quoting. Done when every agent shows up in `rex window ls -s "$REX_BLOCK"`.
5. **Hand back to Joe.** List the tabs, their block ids and where the `.done` files will land, then end your turn. Joe tells you when to collect.

## Collecting and steering

- Progress: `rex capture -s "$REX_BLOCK" -b <block> --trim | tail -20`.
- Results: read every `<name>.done`, then `requests.md`. Report any agent that has no `.done` yet as still running.
- Typing into a tab: `rex send -b <block> "<text>"`, then `rex send-key -b <block> enter`.
