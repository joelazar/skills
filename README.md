# skills

Agent skills I use day to day, kept in one place and installed to `~/.agents/skills`.

Most of these are not mine — they come from other people's repos and are vendored
here (sometimes lightly edited). Attribution is below; licenses of the original
projects apply to those directories.

## Install

```bash
./install.sh          # symlinks this repo to ~/.agents/skills
```

`~/.claude/skills` is a symlink to `~/.agents/skills`, so Claude Code picks them
up too.

## Attribution

### Matt Pocock — [mattpocock/skills](https://github.com/mattpocock/skills)

`ask-matt`, `code-review`, `codebase-design`, `diagnosing-bugs`,
`grill-me`, `grill-with-docs`, `grilling`, `handoff`, `implement`,
`improve-codebase-architecture`, `prototype`, `research`,
`setup-matt-pocock-skills`, `tdd`, `teach`, `to-spec`, `to-tickets`,
`wait-what`, `wayfinder`, `writing-great-skills`

(`writing-great-skills` is from an earlier version of that repo.)

Docs: <https://www.aihero.dev/skills>

### Anthropic — [anthropics/skills](https://github.com/anthropics/skills)

`pdf` — see `pdf/LICENSE.txt`; use is governed by your agreement with Anthropic.

### Dillon Mulroy — [dmmulroy/skills](https://github.com/dmmulroy/skills)

`bro`

### Geoffrey Litt — [explain-diff gist](https://gist.github.com/geoffreylitt/a29df1b5f9865506e8952488eac3d524)

`explain-diff-html`

### blader — [blader/humanizer](https://github.com/blader/humanizer)

`humanizer` (MIT). Based on Wikipedia's
[Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

### Paul Bakaus — [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

`impeccable` (Apache 2.0). Docs: <https://impeccable.style>

### tldraw — [tldraw Desktop](https://tldraw.dev)

`tldraw-offline` — installed by the tldraw Desktop agent-skills installer.

## Mine

- `simplify` — behavior-preserving cleanup of recently touched code.
- `web-research` — Kagi-backed search/summarize helper (`web-research.sh`).
