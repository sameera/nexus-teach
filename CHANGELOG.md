# Releases

Every release is one package carrying the executable, the component payload and this entry. What an
item says is what a person running the teaching stage will experience differently — not what a
commit was called, not which file moved.

## 0.1.0

- First release as a package of its own. The teaching stage was part of Nexus through Nexus 0.61.0;
  it now ships separately, and the two install into the same component root without either clearing
  the other's files.
- The stages are `/nxsx.teach-plan` and `/nxsx.teach`, their shared skill is `nxsx-workbook`, and the
  extraction subagent is `nxsx-concept-extractor`. The names carry this package's prefix so that
  `nexus uninstall` and `nexus migrate-components`, which match on `nxs.`/`nxs-`, leave them alone.
- The executable is `nxsx`. Its `workbook` verb is what the two stages drive, and it is the same
  surface that was `nexus workbook` up to Nexus 0.61.0 — every subverb, argument and output is
  unchanged. `nxsx install`, `nxsx uninstall` and `nxsx version` are new, and exist because a package
  that places components into a shared root has to be able to take them back.
- A workbook, a plan and a lesson page written by the stage while it lived in Nexus are read
  unchanged. Nothing in `.nexus/workbook/` needs migrating.
