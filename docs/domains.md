<!-- The curated domain taxonomy for the concept store. Hand-authored and committed:
     `nexus generate-atlas` renders docs/concepts.md straight from this file's order, and
     `nexus validate-concepts` rejects a page filed under a path this file does not define.
     The four domains carry the same names as the four features in docs/features/, so the
     human-facing feature index and the machine-facing atlas divide the project the same way. -->

# Domain Registry

## Workbook Rendering
`workbook-rendering`

What a learner opens. A page belongs here when it describes something that outlives the session that produced it — the committed store, a rendered page, or the surface a page is read on.

### Store
`store`

The folders a workbook occupies and what each is allowed to hold, including the per-learner folder that a single ignore rule keeps out of the repository.

### Rendered Pages
`pages`

Turning authored lesson markdown into committed pages: the renderer's contract, what a page must still do with no network, and how a committed page is checked against the lesson it came from.

### Reading Surface
`reading-surface`

The colour and typography vocabulary every reading surface shares, and the subset a workbook page takes from it.

## Interactive Exercises
`interactive-exercises`

The interactive half of a lesson. A page belongs here when it describes the component contract — how a lesson declares a widget, what the shared library gives back, and how a learner's answer is checked — rather than the prose around it.

## Roadmap Planning
`roadmap-planning`

Turning a resolved roadmap into an approved plan of slices: what is taught, in what order, and by whom. The committed plan contract files at this parent, because every subdomain below writes into it.

### Concept Extraction
`extraction`

Reading each story for the concepts it introduces and the ones it assumes, reconciling the vocabulary that comes back, and matching it against what the learner says they already know.

### Ordering
`ordering`

Turning extracted concepts into a teachable sequence: the draft, the rewrite that orders it, the splits and scaffolds that rewrite inserts, and the coverage check that judges the result.

### Approval
`approval`

The one human checkpoint that turns a draft into the committed plan, who owns each field it writes, what a slice is taught from, and what happens when the plan must be written again.

## Teaching Sessions
`teaching-sessions`

One sitting with a learner. A page belongs here when it describes behaviour at run time — what a session verifies before teaching, what it writes on arrival, what it drills, and where it pauses.
