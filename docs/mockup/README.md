# Mockup

[index.html](index.html) is the clickable prototype of lastWorche: one file with no build step, which opens directly in a browser. It has one view per role: consultant (Berater), project lead (Projektleitung) and purchasing (Einkauf).

The mockup shows the full product idea, including parts that are not built yet, such as the forecast and proof of work approval. See the status table in the [README](../../README.md#status).

## Visual direction

DIN/Bauhaus minimalism: calm and precise, for people who check numbers. Square edges, no decoration, and one strong signal colour for what needs attention.

| Token | Colour | Used for |
|---|---|---|
| Paper | `#F4F3EF` | Page background |
| Ink | `#16181D` | Text and primary buttons |
| Signal red | `#E3000F` | Logo, active tab, main action, warnings |
| Green | `#187B4B` | Confirmation |

The font is Helvetica Neue, falling back to Helvetica and Arial. The real client uses the same direction, with its tokens defined in [client/src/index.css](../../client/src/index.css).
