# Excalidraw Diagram Skill

A coding agent skill that generates beautiful and practical Excalidraw diagrams from natural language descriptions. Not just boxes-and-arrows - diagrams that **argue visually**.

Vendored from [coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill) and adapted for pi (`~/.agents/skills/`). See [Local changes](#local-changes) for the diffs against upstream.

**Status on this machine: installed and set up.** The Python venv and Chromium are already in place, so the render loop works out of the box.

## What Makes This Different

- **Diagrams that argue, not display.** Every shape/group of shapes mirrors the concept it represents — fan-outs for one-to-many, timelines for sequences, convergence for aggregation. No uniform card grids.
- **Evidence artifacts.** As an example, technical diagrams include real code snippets and actual JSON payloads.
- **Built-in visual validation.** A Playwright-based render pipeline lets the agent see its own output, catch layout issues (overlapping text, misaligned arrows, unbalanced spacing), and fix them in a loop before delivering.
- **Brand-customizable.** All colors and brand styles live in a single file (`references/color-palette.md`). Swap it out and every diagram follows your palette.

## Setup

Already done. Only needed if the venv is wiped or the renderer starts failing:

```bash
cd ~/.agents/skills/excalidraw-diagram/references
uv sync
uv run playwright install chromium
```

## Usage

Ask your coding agent to create a diagram:

> "Create an Excalidraw diagram showing how the AG-UI protocol streams events from an AI agent to a frontend UI"

The skill handles the rest — concept mapping, layout, JSON generation, rendering, and visual validation.

## Local changes

Two changes were made after vendoring upstream:

1. **Pinned the Excalidraw CDN import** in `references/render_template.html` to `@excalidraw/excalidraw@0.18.0`. The unpinned esm.sh bundle 404s on a transitive dependency (`@braintree/sanitize-url`), which surfaces as an opaque 30-second Playwright `wait_for_function` timeout rather than a useful error.
2. **Rewrote skill paths** from `.claude/skills/...` to `~/.agents/skills/...` across `SKILL.md`, this README, and the help text in `references/render_excalidraw.py`.

## Customize Colors

Edit `references/color-palette.md` to match your brand. Everything else in the skill is universal design methodology.

## File Structure

```
excalidraw-diagram/
  SKILL.md                          # Design methodology + workflow
  references/
    color-palette.md                # Brand colors (edit this to customize)
    element-templates.md            # JSON templates for each element type
    json-schema.md                  # Excalidraw JSON format reference
    render_excalidraw.py            # Render .excalidraw to PNG
    render_template.html            # Browser template for rendering
    pyproject.toml                  # Python dependencies (playwright)
```
