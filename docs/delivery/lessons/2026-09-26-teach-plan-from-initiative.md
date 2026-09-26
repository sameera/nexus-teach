---
date: 2026-09-26
epic: "Teaching planning starts from an initiative"
source: "#108"
---

# Lesson: A story that skips its pull request cannot close cleanly

The estimate held. The epic was sized S: one story, one command file. It shipped as one commit
touching five files, and the conformance check found every acceptance criterion met.

The friction came after the code, and it came from how the story shipped. #109 was committed
directly to main, with no pull request. The close stage's ledger records one entry per merged
pull request. With none to record, the ledger blocked the close as `story-unrecorded`. Its usual
remedy is to analyse the merged pull request that shipped the story, and here there was none.
Unblocking the close took a waiver: the story was marked `no-pull-request`. That label did not
yet exist in this repository, so the first attempt failed. The close range was then taken by hand
from the shipping commit and its parent. A trunk-based range would have been empty, and the
close would have looked clean without checking anything.

What the next epic in this area should do differently:

- **Ship every story through a pull request, even an S story.** The pipeline's gates are keyed on
  pull requests. A direct commit to main saves a minute and costs a waiver at close.
- **Fix low findings before closing the story.** Analysis reported two low findings. L1: the
  command never says where the name comes from when none was given. L2: the skill's usage line
  shows the name as required. Both are one-line doc fixes. Once the story is closed they have no
  issue to live on, and nothing tracks them.
- **When a command's usage changes, update the skill's usage summary in the same change.** L2
  happened because the skill line was added to match the command, but by copying the neighbouring
  line rather than the new optional-name form.
