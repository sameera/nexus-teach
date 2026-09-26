# Nexus Teach

The teaching stage for [Nexus](https://github.com/sameera/nexus): it turns a roadmap of stories into a workbook a person learns the codebase from, one lesson per sitting.

It ships as a second package beside Nexus, into the same component root, under its own `nxsx`
namespace. Installing or removing either package leaves the other's components exactly where they
are.

## What it is

Two adopter-facing stages and one executable.

- **`/nxsx.teach-plan <name>`** — the planning phase. It resolves a roadmap from an epic issue or a
  backlog query, creates the workbook, runs one bounded interview about what the learner already
  knows, reads each story through its own extraction subagent, then orders and rewrites the plan so
  each concept is taught exactly once. It ends at an approval gate.
- **`/nxsx.teach <name>`** — the lesson phase. One sitting checks the fences, writes the theory for
  the slice the learner has reached, and renders it to a page.

The two are separate invocations on purpose: a context window only appends, so a reference loaded
for planning cannot be unloaded before a lesson is written. The phase boundary is the invocation
boundary, and a check in the suite reads both bodies to prove neither names the other's material.

`nxsx workbook <subverb>` is the executable underneath them. It resolves roadmaps, runs the
interview, renders pages, checks a committed page against its lesson, and teaches one lesson.

## Install

```bash
npm install -g @sameeraperera/nexus-teach
nxsx install
```

`nxsx install` places the four components at your Claude configuration directory — `~/.claude` by
default, or `$CLAUDE_CONFIG_DIR` when you set it. Run it once per account; it is not a package
lifecycle script, because those are commonly disabled and a silent no-op here would leave you with
no components and no error.

`nxsx uninstall` takes back exactly the files this package placed. Run it **before** removing the
package: the verb ships inside the package, and your package manager has no record of a component
set copied into a configuration directory.

## It needs Nexus

This is a stage of the Nexus pipeline, not a standalone tool. It reads roadmaps out of Nexus epic
issues, resolves the Nexus delivery config, and verifies decision-record digests — and
`/nxsx.teach-plan` loads Nexus's own `nxs-epic-resolve` skill. Install
[`@sameeraperera/nexus`](https://www.npmjs.com/package/@sameeraperera/nexus) too.

At **run** time the two packages share no code: each executable is one self-contained bundle, so
they cannot reach different versions of anything. At **build** time this repository compiles
against the library sources the Nexus package publishes under
`@sameeraperera/nexus/lib/<library>/<module>` — one definition of workspace and epic resolution,
rather than a copy here that would drift.

## Sharing a component root

Both packages install into the same directory, and each records what it placed in
`.nexus-install.json` there, under its own package name. A package removes only what its own record
claims. If both ever ship a file at the same path, the install says so and names the paths, because
whichever package installed last is the body that runs — that is not something an installer can
resolve on your behalf.

The namespaces are separate for the same reason: Nexus matches on `nxs.`/`nxs-`, this package owns
`nxsx.`/`nxsx-`, and neither prefix matches the other.

## Where a workbook lives

`.nexus/workbook/<slug>/` in the repository whose roadmap it teaches, committed. The learner's own
folder inside it is ignored, and nothing writes to it unguarded.

## Contributing

`CONTRIBUTING.md`.
