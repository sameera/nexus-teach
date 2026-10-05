# Codex skill parity assessment and plan

Evaluated 2026-10-04 against checkout `ef7a697` and the local release tree.

## Finding

Codex is not at parity with Claude. This checkout delivers no Codex-specific skill
set or installation target. This is missing delivery support, rather than an
older Codex copy that merely needs refreshing.

| Claude capability | Current delivery | Codex gap |
| --- | --- | --- |
| Plan a workbook | `components/commands/nxsx.teach-plan.md` | No discoverable planning entry skill |
| Teach one sitting | `components/commands/nxsx.teach.md` | No discoverable lesson entry skill |
| Extract concepts from one story or unplanned epic | `components/agents/nxsx-concept-extractor.md` | No Codex worker instructions or delegation adapter |
| Shared workbook surface | `components/skills/nxsx-workbook/SKILL.md` | Portable body exists, but installer delivers it only to Claude |

Evidence:

- `src/component-payload.ts` defines only `claude-components` and the authored
  `commands`, `agents`, and `skills` subtrees.
- `src/pack-release.ts` stages that single payload; local `dist/` contains the
  executable and four Claude component files.
- `src/install-location.ts` resolves only `CLAUDE_CONFIG_DIR`, defaulting to
  `~/.claude`; CLI help and README document Claude installation only.
- No tracked Codex payload, Codex adapter, or project-discovered Codex skill set
  was found. The session's generic Codex skills are not this package's delivery.
- Entry bodies depend on Claude's `Skill`, `Task`, `AskUserQuestion`, and
  `$ARGUMENTS` conventions. Copying them unchanged does not establish compatibility.
- Planning also requires Nexus's `nxs-epic-resolve` skill and, at unplanned-epic
  boundaries, its `nxs.epic` workflow. Nexus's Codex equivalents must be verified
  separately; this assessment does not establish their availability.

Official [OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills)
requires a skill directory with `SKILL.md`, `name`, and `description`. It documents
repository `.agents/skills`, user `~/.agents/skills`, `$` invocation in Codex CLI,
and plugins for reusable distribution. These are the delivery conventions to
use when implementing the port, rather than assuming Claude's commands directory
is recognized by Codex.

## Implementation plan

1. **Set the integration contract.** Verify the supported Nexus release supplies
   Codex epic resolution and epic planning. Map each dependency to its actual
   Codex name and invocation. Specify required delegation and question capabilities.
   If a dependency is absent, report that prerequisite explicitly and stop the
   affected workflow before writing a plan. Do not claim full parity until the
   in-session epic-planning paths work.

2. **Create Codex workflow adapters.** Add distinct planning and teaching skill
   directories, the shared workbook skill, and a referenced extraction worker
   specification. Use concise triggering descriptions and explicit input parsing.
   Replace Claude tool names with capability-based instructions supported by the
   target Codex runtime. Require one isolated extraction worker per item, limited
   to the CLI-provided story or epic, returning only checked output. If isolated
   workers are unavailable, report the limitation instead of silently extracting
   in the parent's context.

3. **Preserve the full behavioral contract.** Port the current Claude workflow,
   including epic/initiative/query resolution and workbook naming; bounded,
   recorded interviews; focus judgments; unplanned-epic extraction; vocabulary
   merging; scaffold ordering; approval and re-approval; drift and fence refusals;
   pinning tests; reference pages; and all three unplanned-epic planning choices.
   Keep planning and teaching as separate entry points with their existing
   boundary exception. Explicitly require a fresh session when clean context is
   needed: loading another skill cannot erase material already read. Preserve
   human decisions and the explicitly chosen agent-planning approval path.

4. **Deliver and manage the Codex payload.** Keep `nxsx install` backward compatible
   for Claude. Add an explicit Codex target, for example `--harness codex`, to
   install/uninstall/version, including checkout mode. For the existing npm-based
   installer, use the documented user skill location and show the resolved path;
   provide an explicit absolute destination override. Consider a plugin as the
   distribution alternative before committing the interface. Stage a separate
   Codex payload from an authored directory outside runtime discovery paths.
   Maintain package ownership records, stale-file cleanup, idempotence, and
   protection of Nexus and user files independently at each destination.
   Account for generated adapters in checkout mode: pointers must target valid,
   current skill files rather than raw Claude commands.

5. **Prevent future drift.** Keep shared workflow content in one authoritative
   source with thin harness adapters where practical. Otherwise record explicit
   behavioral parity checks for both payloads. Extend shipped-component validation,
   phase-reference checks, release packaging, and fingerprint identity to cover
   Codex. Inspect `fingerprint.ts`, `pin-fingerprint.ts`, and release reporting
   before changing the current two-part fingerprint schema.

6. **Validate and document.** Test install, reinstall, checkout pointers, stale
   cleanup, uninstall, and coexistence for both targets. Check Codex discovery,
   metadata, reference resolution, declared CLI verbs, and removal of Claude-only
   invocation assumptions. Exercise planning, teaching, focus/handoff behavior,
   re-approval, and each unplanned-epic choice using controlled fixtures and manual
   Codex smoke sessions. Update README and CONTRIBUTING with invocation examples,
   prerequisites, supported runtimes, and troubleshooting. Run the relevant suite,
   typecheck, lint, build, and fingerprint checks before release.

## Completion criteria

- A packaged install makes both entry skills discoverable in the supported Codex
  runtime without copying files manually.
- Planning and teaching retain Claude's inputs, gates, refusals, phase separation,
  and persisted outputs; extraction retains its isolation and data-only contract.
- All three epic-planning choices work with supported Nexus Codex dependencies.
- Installing or removing either target preserves unrelated components and the
  other harness's installation.
- Release identity and automated checks cover both payloads so a later Claude
  workflow change cannot leave Codex silently behind.

## Validation performed

The focused run covered shipped components, component deployment, installation
location, phase references, and fingerprints: **41 tests passed, 1 failed**.
The failing fingerprint test could not build because the locally linked Nexus
library under `../../nexus/dist/lib/workspace/` could not resolve `yaml`.
It did not establish a fingerprint mismatch. Resolve that dependency environment
before using fingerprint/build results as release evidence.

Only this assessment and plan were added. No skills, installer behavior, package
dependencies, or fingerprints were changed. Scope is this checkout and its local
release artifacts, not a separately fetched npm release or another machine's
installed components.
