# Obsidian Excalidraw plugin

Reference for `.excalidraw.md` files: how the plugin stores and parses them, how to embed them in notes, and how its author, Zsolt Viczián, structures visual notes. Verified against plugin 2.28.x source (`src/shared/ExcalidrawData.ts`, `src/constants/constants.ts`).

## File anatomy

~~~markdown
---
excalidraw-plugin: parsed          # required; marks the file as a drawing
tags: [excalidraw]
---
# Back of the card                  ← optional markdown notes, preserved verbatim
Anything between frontmatter and "# Excalidraw Data" is yours.

%%                                  ← here only in "fade out" mode; otherwise it sits above ## Drawing
# Excalidraw Data

## Text Elements
Claude Code, Oct 2026 ^s1Title0

Multi-line
text block ^s1Sub000

## Element Links                    ← optional: id: [[link]]
## Embedded Files                   ← optional: fileId: [[image.png]]
%%
## Drawing
```compressed-json
N4KAkARALgngDgUwgLgAQQQDwMYEMA2AlgCYBOuA7hADTgQBuCpAzoQPYB2KqATLZMzYBXUtiRoIACyh
```
%%
~~~

- `## Drawing` holds the scene JSON, LZ-string base64 in 256-char chunks (`compressed-json`) or plain (`json`, when Settings → Saving → compress is off). The plugin reads both and writes whichever the setting says on the next save.
- `## Text Elements` is the source of truth for text: on load, each block **overwrites** `rawText` of the element with that id. Editing a block edits the drawing.
- Text is parsed with `/\s\^(.{8})[\n]+/` and an 8-char id length is hard-coded. Any other id length makes a block's text stick to the next block. The symptom is giant text elements holding several sections, and containers growing around them. New text elements with ids longer than 8 chars get renamed by the plugin; shorter ones never do.
- Text parsing is sensitive to blank lines: a blank line after `## Text Elements` becomes part of the first element.
- Vault images are referenced in `## Embedded Files`, not inlined in the JSON `files` map.

## Hazards

- **Formatters and linters.** Obsidian Linter (heading blank lines, `remove-multiple-spaces`, `ordered-list-style`, and so on) corrupts `## Text Elements`. Exclude drawings with the Linter's "Files to ignore" regex `\.excalidraw\.md$`; in `.obsidian/plugins/obsidian-linter/data.json` that's `filesToIgnore: [{"label":"Excalidraw","match":"\\.excalidraw\\.md$","flags":""}]`. If linting can't be avoided, turn on the plugin setting "Linter compatibility", which adds a dummy first text element.
- **Open tabs autosave.** The plugin holds the scene in memory and saves it over the file. Before editing a drawing on disk, close its tab, or after editing run "Reload app without saving".
- **Excalidraw view vs markdown view.** "Toggle between Excalidraw and Markdown mode" flips one file between views. "Decompress current Excalidraw file" makes `## Drawing` readable for a human.

## Embedding and linking

| Syntax | Shows |
|---|---|
| `![[drawing]]` / `![[drawing\|600]]` / `![[drawing\|600x400\|right-wrap]]` | whole drawing, sized/aligned |
| `![[drawing#^frame=Name]]` | one frame, by name or frame id |
| `![[drawing#^clippedframe=Name]]` | frame with elements clipped to its border |
| `![[drawing#^area=id]]` | cutout around one element; `,padding=N` widens it |
| `![[drawing#^group=id]]` | the element's whole group |
| `![[drawing#Section]]` | area around a text element starting with `# Section` |
| `[[drawing#^textId]]` / `![[drawing#^textId]]` | link to / transclude one text element as text |
| `![[drawing#^as-image]]` | force image when `excalidraw-embed-md: true` |

- Frame names: letters, digits, spaces, `-`, `_` only. Other characters (`·`, `|`, `#`, `^`) break hover previews or the link itself.
- Inside the Excalidraw view, "Copy 'frame=' ![[link]] for selected element to clipboard" (and the `area=`, `group=`, `clippedframe=` variants) produces these links.
- Inside a drawing, text like `[[note]]` becomes a clickable link and shows up in backlinks and graph view. `![[note#^block]]` transcludes live text, and `{40}` after it wraps at 40 chars.

## Frontmatter keys

| Key | Effect |
|---|---|
| `excalidraw-open-md: true` | file opens in markdown view (back of the card first) |
| `excalidraw-embed-md: true` | embedding it shows the markdown side, not the image |
| `excalidraw-autoexport: none\|svg\|png\|both` | export a sibling image on every save |
| `excalidraw-default-mode: view\|zen` | open read-only / zen: good for presenting |
| `excalidraw-export-dark`, `-transparent`, `-padding`, `-pngscale` | per-file export overrides |
| `excalidraw-link-prefix`, `excalidraw-url-prefix`, `excalidraw-link-brackets` | how links render on canvas |
| `excalidraw-font`, `excalidraw-font-color`, `excalidraw-css` | look of this note when embedded *into* a drawing |

## How the plugin's author structures visual notes

From Zsolt Viczián's plugin docs, his Sketch Your Mind community, and Visual PKM videos. Apply these when deciding *where* a drawing goes and *how* it's cut up:

- **Hybrid notes: one file, two sides.** The drawing is the front of a card, the markdown above `# Excalidraw Data` is the back. Keep the sources, transcript, and prose explanation on the back, so text search finds the drawing and the note stays one unit. His template sets `excalidraw-open-md: true`, `excalidraw-embed-md: true`, and `excalidraw-autoexport: svg`, then embeds the SVG on the back: open as text, flip to draw. ([template](https://community.sketch-your-mind.com/t/hybrid-markdown-excalidraw-note-template/320))
- **The drawing is the atomic note.** In a visual Zettelkasten the sketch *is* the permanent note: one idea per drawing, linked like any note, not a picture inside a separate text note.
- **Compose atomic drawings upward.** For "book on a page" summaries he draws one-pagers per section, then distills them into one overview. Embedded drawings dropped with the "anchor to 100%" modifier keep their true size and update when the source changes.
- **Frames are sections.** Frame each section so it can be embedded alone (`#^frame=`), presented with the Slideshow script (one frame = one slide), and reused from other notes without duplication. Text elements starting with `# ` act as headings and anchor `#Section` references.
- **Templates carry style.** A template drawing (Settings → Basic → template) sets the default stroke, font, fill, and palette (`appState.colorPalette`, `topPicks`), so new drawings start on-brand without per-element styling.
- **Portability by export.** Excalidraw doesn't render in Obsidian Publish, other apps, or GitHub: use `excalidraw-autoexport` and embed the SVG/PNG where the reader isn't Obsidian.

## Moving drawings in and out

- **To excalidraw.com:** `scripts/excalidraw-md.mjs extract`, or from Obsidian on desktop: "Export Image" → **Excalidraw** button. Drawings with vault images must use the plugin export, because `extract` doesn't inline `## Embedded Files`.
- **From excalidraw.com or a generated `.excalidraw`:** `scripts/excalidraw-md.mjs pack`. It renames ids to the 8-char alphabet and writes `## Text Elements`. The plugin can also open a plain `.excalidraw` file, but in compatibility mode with fewer features.
- **Every save as `.excalidraw` too:** Settings → "Auto-export Excalidraw". This puts a duplicate file in the vault for each drawing.
