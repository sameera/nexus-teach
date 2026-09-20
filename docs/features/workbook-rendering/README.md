---
feature: "Workbook Rendering"
---

# Workbook Rendering

The committed workbook a learner opens: the store it occupies, the pages rendered into it from
authored lesson markdown, and the reading surface those pages share.

## Epics

- **The workbook store, and the renderer that turns lesson markdown into pages** — [#2](https://github.com/sameera/nexus-teach/issues/2) (filed in Nexus as #405)
- **The compressed pages a learner returns to** — [#34](https://github.com/sameera/nexus-teach/issues/34) (filed in Nexus as #481)

## Notes

The renderer's contract covers the widget seam as well as the prose, so the fenced declaration and
the first component shipped under #2. Everything else about components belongs to
[Interactive Exercises](../interactive-exercises/README.md), whose epic came out of the same stub
as #34.

The theme tokens a page reads were not built here. They arrived with a reading surface Nexus
already had, under Nexus issues #15, #669 and #673; the concept page says which part of that
vocabulary a workbook page takes.

## Concepts

Nine pages, under the `workbook-rendering` domain in [the atlas](../../concepts.md) — `store`,
`pages` and `reading-surface`.
