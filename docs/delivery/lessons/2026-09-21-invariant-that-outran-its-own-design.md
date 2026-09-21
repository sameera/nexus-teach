---
date: 2026-09-21
epic: "The decision record is written before the lesson needs it"
source: "#68"
---

# Lesson: the summarising invariant outran the design it summarised

Decision record #100 made a careful decision and then wrote an invariant that contradicted it.

The decision was the whole point of the epic. A session must stop before teaching a slice whose theory has no source, but it must not stop merely because a slice has no pinned sources: pinning is a manual step nothing in the pipeline invokes, so most existing workbooks have slices with no sources and epics that shipped long ago. The stop therefore turns on the epic having no approved decision record. That is argued at length in the record, and the epic's own acceptance criteria were corrected before implementation to say it.

Then the invariant list, written after the decisions, said the stop clears "when and only when the slice carries pinned sources". Read strictly, that is the rejected design. An approved record with nothing pinned clears the stop too, and has to. The conformance gate caught the contradiction between two parts of the same record.

Nothing shipped wrong, because the decisions came first and the code followed them. But an invariant is not a summary. Later stages check code against the invariant list, not against the prose above it, so a loose invariant is a future false finding at best and a future wrong fix at worst — the fix that "restores" the invariant is the outage the decisions rejected.

**For the next epic in this area.** When the invariants are written, read each one back against the decision it comes from and ask whether a reader who had only the invariant would rebuild the same system. An invariant carrying "only when" or "never" is where to look hardest: those words are the ones that quietly narrow a decision into something it did not say. Invariant 3 of this same record was written the other way — it names the step the answer comes from rather than restating the answer — and it survived contact with the code unchanged.
