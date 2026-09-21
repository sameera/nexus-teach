---
date: 2026-09-21
epic: "A concept an unplanned epic will introduce is not scaffolded"
source: "#88"
---

# Lesson: a risk that names its own tests gets them

Epic #88 was sized M and shipped as one story in one commit. Conformance was clean on the first run: 5 of 5 acceptance criteria met, no invariant violations. The estimate held.

Two things in the decision record made that possible.

First, the record checked the epic's stated harm against the rules that already existed, and narrowed it. The epic said the learner would be taught the same concept twice. The record found that the re-approval rule already prevents a second teaching. The real harm was that the theory was taught away from the work that makes it concrete. That narrower reading is what the chosen design fixes, and it stopped the build from adding a guard against a problem that could not happen.

Second, the record's one ADDRESS risk did not stop at naming the risk. It said which fixtures to build (a thin epic that over-claims a concept, and one that under-claims) and what the gate should print for each. Both fixtures shipped as named tests. A risk written as "watch out for thin bodies" would likely have shipped with no test at all.

**For the next epic in this area.** When the epic is written, check its stated harm against the existing rules before sizing it. Here the record caught the overstatement, but only after the epic's description and success metrics were fixed. When a risk is marked ADDRESS, write it as the fixtures that would show it and the output each should produce. That turns a warning into work the build can be held to.
