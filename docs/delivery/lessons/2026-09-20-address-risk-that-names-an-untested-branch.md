---
date: 2026-09-20
epic: "A stub is planned when the learner reaches it"
source: "#67"
---

# Lesson: an ADDRESS risk that names an untested branch is a test instruction

Decision record #95 carried an ADDRESS risk that did two things at once. It named the question — which repository the planning brief tells the learner to run the planning command in — and it settled it, by deciding the brief names both repositories, labelled. Then it added that this repository is a single-repo checkout, so the workspace branch would not be exercised by the tests this epic writes.

That last sentence was read as a note about coverage. It was really a prediction, and it came true in the worst available way: the workspace branch shipped wrong. It returned the hub's checkout directory name where an `owner/repo` identity belongs, which the manifest loader guarantees can never be one. A learner in a workspace would have been shown a local folder beside their real repository, both labelled "repository", and told to plan the epic in the folder. Every test passed, because every test ran in a single-repo checkout.

The conformance gate caught it, which is the gate working. The cheaper catch was available earlier and nobody took it. Writing the missing tests afterwards cost a temporary directory and a two-line manifest file, because a hub resolves from a manifest alone. That price was never checked before the risk was accepted; the acceptance rested on the branch being awkward to reach, and it was not.

**For the next epic in this area.** When a decision record accepts that some branch of a decision will go untested, treat that clause as a task and price it before accepting it. If covering the branch is cheap, the acceptance is not a risk to carry, it is a test to write. If it is genuinely expensive, say what makes it expensive, so the next reader can tell a real constraint from an unexamined guess.

A related note on where the defect sat. The branch that broke was the one branch of the one function that no test touched, in a change of 845 lines that was otherwise well covered. The coverage gap and the defect were the same line. That is the ordinary case, not a coincidence worth remarking on — which is the point: look at what the diff leaves uncovered before the gate does.
