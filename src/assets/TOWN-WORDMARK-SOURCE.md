# Town outline asset

- Source: town-site/node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2.
- Typeface: Manrope, variable wght axis instantiated at **800**.
- Manrope official project: https://github.com/sharanda/manrope . Distribution: https://github.com/fontsource/font-files/tree/main/fonts/manrope .
- Source WOFF2 SHA-256: a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972.
- Source outlines are read by fontTools 4.68.0 with Brotli 1.2.1. Only the four glyph outlines were extracted; no font file was modified or redistributed here.
- Overlapping contours are truly boolean-merged using skia-pathops 0.9.2 simplify with corrected winding before SVG export. Every letter is checked by an empty XOR against the original filled region and by preserved original ink bounds. This removes the n shoulder's internal overlapping diagonal and stem edge from stroke-only drawing.
- The merged n has exactly one closed outer contour, whose concave outline retains the open space between the stems. The o retains two contours: outer edge and inner counter. Use fill-rule: nonzero (default).
- All coordinates share one origin, top-left (0, 0), with SVG's downward y-axis. The overall ink height is normalized to 1000 units. Adjacent ink bounding boxes have a 12-unit gap; no letters intersect.
- ViewBox: 0 0 3325.795918 1000; aspect ratio: **3.3258:1**.
- cx, cy are each letter's ink-bounds center in this shared coordinate space, suitable for transform origins.
- SVG paths contain closed outer and inner contours. An outline draw can set strokeDasharray and strokeDashoffset using each DOM SVGPathElement.getTotalLength(). This follows glyph outlines, not a single-stroke handwriting skeleton. For a mask, fill each path white; the o counter remains transparent under nonzero fill.
- License: SIL Open Font License 1.1, copied unchanged as MANROPE-LICENSE.txt. Retain it with distributed assets and third-party notices. This file is a wordmark outline graphic, not a modified font distribution.
- The viewBox follows exact fill bounds. For an outer stroke, use overflow: visible or add half the stroke width as SVG viewBox padding so the stroke is not clipped.
- Files: town-paths.json (renderable paths), preview.svg (all-black fill preview), stroke-only-preview.svg (white outline on black with 40-unit stroke-safe margin), bounds.json and boolean-checks.json (verification), make_wordmark.py (reproducible extraction).
