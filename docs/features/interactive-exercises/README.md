---
feature: "Interactive Exercises"
---

# Interactive Exercises

The interactive half of a lesson: how a lesson declares a widget, what the shared component library
gives back, and how a learner's typed or rearranged answer is checked.

## Epics

- **The rest of the shared component library, and the answer-checking it needs** — [#33](https://github.com/sameera/nexus-teach/issues/33) (filed in Nexus as #480)

## Notes

The library did not start here. The widget seam and the first component — predict-then-reveal —
shipped under the renderer epic, [#2](https://github.com/sameera/nexus-teach/issues/2), because a
declaration is worth nothing until something renders it. #33 built the rest on that seam: Parsons
problems, the trace stepper, fill-the-signature, and the answer check they all go through.

#33 and [#34](https://github.com/sameera/nexus-teach/issues/34) came out of one stub, *The drills
beyond the first, and the pages worth revisiting*,
[#7](https://github.com/sameera/nexus-teach/issues/7). It was deliberately last: a component is
built only once a real lesson has asked for it twice, so the library grows from demand rather than
ahead of it.

## Concepts

Five pages, under the `interactive-exercises` domain in [the atlas](../../concepts.md).
