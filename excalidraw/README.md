# Excalidraw skill

Agent skill for Excalidraw: designing diagrams that **argue visually**, and creating, editing, repairing, and converting `.excalidraw` and Obsidian `.excalidraw.md` files.

Vendored from [coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill) (the design methodology and renderer) and extended for Obsidian. See [Local changes](#local-changes).

## Setup

Already done on this machine. Only needed if the venv or `node_modules` is wiped:

```bash
cd ~/.agents/skills/excalidraw/references && uv sync && uv run playwright install chromium
cd ~/.agents/skills/excalidraw/scripts && npm i
```

## Local changes

1. **Renamed** `excalidraw-diagram` → `excalidraw`, made model-invoked, and restructured:
   - `SKILL.md` is now a task router.
   - The upstream methodology moved to `references/design.md`.
   - The render loop is shared by all tasks.
2. **Obsidian support**:
   - `scripts/excalidraw-md.mjs` (`extract`/`pack`/`check`/`repair`) mirrors the plugin's own parser and compressor.
   - `references/obsidian.md` covers the file format, hazards, embedding syntax, frontmatter keys, and the plugin author's note-structuring practices.
3. **8-char ids everywhere.** Upstream's descriptive ids (`trigger_rect`) corrupt drawings in Obsidian, so the templates and design guidance now use exactly 8 chars `[A-Za-z0-9]`. `design.md` also gives the exact text-width formula for Cascadia.
4. **Pinned the Excalidraw CDN import** in `references/render_template.html` to `@excalidraw/excalidraw@0.18.0`. The unpinned esm.sh bundle 404s on a transitive dependency.
5. **Paths** rewritten from `.claude/skills/...` to `~/.agents/skills/...`.

## Customize colors

Edit `references/color-palette.md`.

## Files

```
excalidraw/
  SKILL.md                     # rules, task router, tools, render loop
  scripts/excalidraw-md.mjs    # .excalidraw <-> .excalidraw.md, check, repair
  references/
    design.md                  # diagram design methodology (upstream)
    obsidian.md                # plugin format, embeds, frontmatter, note structure
    color-palette.md           # colors (edit to customize)
    element-templates.md       # JSON templates per element type
    json-schema.md             # element properties
    render_excalidraw.py       # .excalidraw -> PNG (Playwright)
    render_template.html
```
