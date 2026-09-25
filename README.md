# skills

Agent skills I use day to day. This repo is cloned to `~/.agents/skills`, the path
agents read global skills from. `~/.claude/skills` is a symlink to it, so every agent
reads the same library.

Most of these are not mine. They come from other people's repos and are vendored
here (sometimes lightly edited). Attribution is below; licenses of the original
projects apply to those directories.

Each vendored `SKILL.md` pins its upstream commit in `metadata.source`.
`.agents/skills/upstream-sync/status.sh` lists the upstream commits since then, and the
`upstream-sync` skill reviews them and proposes what to port.

## Install

```bash
git clone git@github.com:joelazar/skills.git ~/.agents/skills
```

My [dotfiles](https://github.com/joelazar/dotfiles) do this during first-run setup.

## Attribution

### Matt Pocock ([mattpocock/skills](https://github.com/mattpocock/skills))

`grilling`, `improve-codebase-architecture`, `writing-for-agents`

(`grilling` is made user-invoked here, replacing upstream's `grill-me` wrapper, and asks
through an ask-user tool when one is available.)

Docs: <https://www.aihero.dev/skills>

### Anthropic ([anthropics/skills](https://github.com/anthropics/skills))

`pdf`: see `pdf/LICENSE.txt`; use is governed by your agreement with Anthropic.

### Dillon Mulroy ([dmmulroy/skills](https://github.com/dmmulroy/skills))

`bro`

### Geoffrey Litt ([explain-diff gist](https://gist.github.com/geoffreylitt/a29df1b5f9865506e8952488eac3d524))

`explain-diff-html`

### ogulcancelik ([ogulcancelik/herdr](https://github.com/ogulcancelik/herdr))

`herdr`: extracted from `herdr --skill` (herdr 0.9.1), regenerated as the tool updates.

### blader ([blader/humanizer](https://github.com/blader/humanizer))

`humanizer` (MIT). Based on Wikipedia's
[Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

### Cole Medin ([coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill))

`excalidraw-diagram`: Excalidraw import pinned to `@0.18.0`, paths rewritten to `~/.agents/skills`.

### Cursor ([cursor/plugins](https://github.com/cursor/plugins))

`unslop`, from the `pstack` plugin.

### Paul Bakaus ([pbakaus/impeccable](https://github.com/pbakaus/impeccable))

`impeccable` (Apache 2.0). Docs: <https://impeccable.style>

## Mine

- `simplify`: behavior-preserving cleanup of recently touched code.
- `web-research`: Kagi-backed search/summarize helper (`web-research.sh`).
