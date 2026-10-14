# Obsidian Excalidraw skill

Agent skill for the [Obsidian Excalidraw plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin): creating, editing, exporting, repairing and converting `.excalidraw.md` drawings. Diagram design and rendering live in the `excalidraw` skill.

## Setup

Already done on this machine. Only needed if `node_modules` is wiped:

```bash
cd ~/.agents/skills/obsidian-excalidraw/scripts && npm i
```

The plugin CLI needs Obsidian 1.12.2+ with its CLI enabled, and plugin 2.29.0+.

## Files

```
obsidian-excalidraw/
  SKILL.md                     # rules, task router, plugin CLI, script
  scripts/excalidraw-md.mjs    # .excalidraw <-> .excalidraw.md, check, repair (mirrors the plugin's parser and compressor)
  references/obsidian.md       # file format, hazards, embeds, frontmatter, note structure
```
