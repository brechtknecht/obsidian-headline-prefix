# Section Prefix — Obsidian Plugin

Renders numeric section prefixes in headings as small, muted badges instead of full-size text.

**Before:** `2.3 Lists` renders as one giant headline
**After:** a tiny `2.3` floats above the heading, and `Lists` renders at full size

## Behavior

| Filename / Heading | Rendered as |
|--------------------|-------------|
| `0. Start`         | `Start` (prefix hidden entirely) |
| `1. What is FieteOS` | small `1.` + large `What is FieteOS` |
| `2.3 Lists`        | small `2.3` + large `Lists` |
| `3.1.2 Something`  | small `3.1.2` + large `Something` |

Works on both the **inline title** (the filename-based note header) and **h1–h6** headings inside the note body. Compatible with reading view and live preview.

## Installation

Drop the `section-prefix` folder into your vault's `.obsidian/plugins/` directory, then enable it under Settings → Community plugins.

## Author

Felix Tesche
