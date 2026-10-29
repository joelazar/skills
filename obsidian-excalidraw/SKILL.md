---
name: obsidian-excalidraw
description: Obsidian Excalidraw plugin drawings (`.excalidraw.md`). Use to create, edit, render, repair or embed drawings in an Obsidian vault, or convert between `.excalidraw` and `.excalidraw.md`.
disable-model-invocation: true
---

# Obsidian Excalidraw

`.excalidraw.md` is the plugin's format: frontmatter, optional markdown notes, a `## Text Elements` list, and the scene compressed in `## Drawing`. The plugin parses it with regexes, so a hand edit or a markdown linter corrupts the layout. Diagram design, the render loop and Excalidraw+ live in the `excalidraw` skill at `~/Code/onomondo/.pi/skills/excalidraw/`. It only loads inside `~/Code/onomondo`, so read its files by path:

- `SKILL.md` → Render loop, and the `excalidraw` CLI (render, upload)
- `references/design.md` for designing a diagram

Two ways to change a drawing:

- **Plugin CLI**, when Obsidian is running: the plugin itself creates, edits and exports, including drawings open in a tab.
- **`scripts/excalidraw-md.mjs`**, when Obsidian is closed, for a full hand-designed `.excalidraw` scene, or to repair a broken file.

## Rules

1. **Every element `id` is unique and exactly 8 characters from `[A-Za-z0-9]`**, e.g. `s2Title0`. The plugin hard-codes the 8-char length. Any other length, or two elements sharing an id, glues text blocks together: giant text elements, swollen containers, a scrambled layout. When generating ids from a counter, pad to the full width (`"t" + String(i).padStart(7, "0")`). The plugin CLI assigns ids itself.
2. **Change `.excalidraw.md` only through the plugin CLI or `excalidraw-md.mjs`.**
3. **A drawing open in a tab gets autosaved over disk writes.** Edit it with the plugin CLI (`apply`), or close the tab before `pack`/`repair`.
4. **Done means rendered and looked at**, with the `excalidraw` skill's render loop.

## Tasks

| Task | Path |
|---|---|
| New diagram | Design per `references/design.md` of the `excalidraw` skill. Simple boxes and arrows: plugin CLI `create`. A full hand-laid scene: write `.excalidraw`, then `pack` it to `<name>.excalidraw.md`. |
| Edit a drawing | Plugin CLI loop below. Obsidian closed: `extract` to `/tmp`, edit the JSON (find elements by `text`/position), render, `pack` onto the original: frontmatter and notes stay. |
| Look at a drawing | Plugin CLI `export`, or `extract` + `excalidraw render`. |
| Layout looks broken | `check`, then `repair`, then render. The cause is almost always rule 1 or a linter: fix the cause too, see [`references/obsidian.md`](references/obsidian.md) → Hazards. |
| Embeds, frames, frontmatter, how to structure visual notes | [`references/obsidian.md`](references/obsidian.md) |
| To Excalidraw+ / excalidraw.com | `extract <file.excalidraw.md> <name>.excalidraw`, then upload per the `excalidraw` skill or drag it onto the canvas. |
| Into a vault | `pack` it to `<name>.excalidraw.md`; a plain `.excalidraw` in the vault opens in compatibility mode. |

## Plugin CLI

```bash
X() { obsidian vault="$1" "obsidian-excalidraw-plugin:$2" "${@:3}"; }   # vaults: private, work, shared, journal, archive, hermes
X private status
X private schema action=create            # exact fields and a runnable example per command
X private list folder=Drawings
X private read path="Drawings/Flow.excalidraw.md" source=disk detail=elements
X private create json='{"apiVersion":1,"requestId":"flow-1","path":"Drawings/Flow.excalidraw.md","elements":[...]}'
X private export path="Drawings/Flow.excalidraw.md" out="Drawings/Flow.png" theme=light requestId=flow-2
X private result requestId=flow-2
```

Edit loop: `open path=…` (opens a tab in Joe's Obsidian) → `read source=live detail=elements` → `apply` with `expectedRevision` from that read, actual ids, and a new `requestId` → `result` → `export` → Read the PNG at `~/Obsidian/<vault>/<out>`. Operations: `add`, `update`, `delete`, `connect`, `group`, `ungroup`, `image`, `latex`.

- **Write commands (`create`, `apply`, `export`, `script`) print nothing.** Run `result requestId=<id>` and check `ok: true` and `persistence: "saved"`. Exit code 0 alone proves nothing.
- Every write needs a fresh `requestId`; reusing one with different content fails.
- `create` takes skeletons (`label`, arrow `start`/`end` by local id); real ids come back in `data.idMap`. Use those in `apply`.
- Paths are vault-relative and exact, with extension. `export` writes inside the vault: delete preview PNGs afterwards. Its theme follows Obsidian unless `theme=light`.
- Big requests: write the JSON to a visible vault file and pass `input=<file>`; delete the file afterwards.
- `STALE_REVISION`: read again, then reapply.
- `Command "obsidian-excalidraw-plugin:…" not found`: Obsidian still runs an older plugin build. `obsidian vault=<v> plugin:reload id=obsidian-excalidraw-plugin`, then `status`.
- Full reference: `~/Code/github.com/zsviczian/obsidian-excalidraw-plugin/docs/CLI.md`.

## Script

```bash
S=~/.agents/skills/obsidian-excalidraw/scripts/excalidraw-md.mjs
node $S extract <in.excalidraw.md> [out.excalidraw]   # scene JSON, stdout without out
node $S pack    <in.excalidraw> <out.excalidraw.md>   # creates, or rewrites keeping out's head
node $S check   <file.excalidraw[.md]>                # ids on both; .md also simulates the plugin's parse; exit 1 on problems
node $S repair  <file.excalidraw.md>                  # unglues text, renames ids, rewrites; backup in /tmp
```

Run `check` before rendering: the render does not show id problems. If a command says lz-string is missing: `cd scripts && npm i`.
