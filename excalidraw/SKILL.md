---
name: excalidraw
description: Excalidraw drawings. Use to design a diagram, create/edit/repair `.excalidraw` or Obsidian `.excalidraw.md` files, embed drawings in Obsidian notes, or move them to excalidraw.com.
metadata:
  source: https://github.com/coleam00/excalidraw-diagram-skill/tree/8646fcc9f74f
---

# Excalidraw

One scene, two file formats:

- **`.excalidraw`**: plain scene JSON (`{type, version, elements, appState, files}`), opened by excalidraw.com and editors.
- **`.excalidraw.md`**: the Obsidian plugin's format. It holds frontmatter, optional markdown notes, a `## Text Elements` list, and the scene compressed in `## Drawing`. The plugin parses it with regexes, so a hand edit or a markdown linter corrupts the layout.

## Rules

1. **Every element `id` is unique and exactly 8 characters from `[A-Za-z0-9]`**, e.g. `s2Title0`. The plugin hard-codes the 8-char length. Any other length, or two elements sharing an id, glues text blocks together: giant text elements, swollen containers, a scrambled layout. When generating ids from a counter, pad to the full width (`"t" + String(i).padStart(7, "0")`) and never truncate.
2. **Change `.excalidraw.md` only through `scripts/excalidraw-md.mjs`**: `extract` → edit the JSON → `pack`. `pack` writes `## Text Elements` from the JSON and verifies the result parses back exactly.
3. **Done means rendered and looked at**: the render loop below ends with no defects.

## Tasks

| Task | Path |
|---|---|
| New diagram or redesign | Read [`references/design.md`](references/design.md), write `.excalidraw` JSON, render loop. For Obsidian, `pack` it into `<name>.excalidraw.md`. |
| Edit an existing drawing | `extract` to `/tmp`, edit the JSON (find elements by `text`/position, not by id), render loop, `pack` onto the original file: frontmatter and notes stay. |
| Layout looks broken in Obsidian | `check`, then `repair`, then render loop. The cause is almost always rule 1 or a linter: fix the cause too, see [`references/obsidian.md`](references/obsidian.md) → Hazards. |
| Embeds, frames, frontmatter, how to structure visual notes | [`references/obsidian.md`](references/obsidian.md) |
| Move or copy a drawing into an Obsidian vault | `pack` it to `<name>.excalidraw.md`; never drop a plain `.excalidraw` into the vault. |
| Open in excalidraw.com | `extract <file.excalidraw.md> <name>.excalidraw`, then drag it onto the canvas. |

Before writing a `.excalidraw.md` in a vault, close its tab in Obsidian. The plugin autosaves its in-memory copy over yours.

## Tools

```bash
S=~/.agents/skills/excalidraw/scripts/excalidraw-md.mjs
node $S extract <in.excalidraw.md> [out.excalidraw]   # scene JSON, stdout without out
node $S pack    <in.excalidraw> <out.excalidraw.md>   # creates, or rewrites keeping out's head
node $S check   <file.excalidraw[.md]>                # ids on both; .md also simulates the plugin's parse; exit 1 on problems
node $S repair  <file.excalidraw.md>                  # unglues text, renames ids, rewrites; backup in /tmp

cd ~/.agents/skills/excalidraw/references && uv run python render_excalidraw.py <abs-path.excalidraw> [--output out.png]
```

Setup, only if a command says something is missing: `cd scripts && npm i` (lz-string, the plugin's own compressor); `cd references && uv sync && uv run playwright install chromium` (renderer).

## Render loop

1. Run `check` on the file: the render does not show id problems. Then render the `.excalidraw` JSON (for `.md`, `extract` first) and view the PNG with the Read tool. If Read can't open a `/tmp` path, render with `--output` under `$HOME` and delete the PNG afterwards. For renders taller than ~8000 px, crop sections: `magick in.png -crop 6500x6000+0+<y> +repage -resize 1400x part.png`.
2. Check for defects:
   - text clipped by or overflowing its container
   - overlapping elements
   - arrows crossing shapes or ending in empty space
   - labels far from what they describe
   - uneven spacing between peers
   - text too small to read
   - lopsided composition: voids next to crowded areas
3. Fix the JSON, re-render, and view again. It is done when one full pass finds nothing: typically 2–4 iterations.
