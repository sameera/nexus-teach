/**
 * The record a slice's lesson is owed (epic #68, decision record #100).
 *
 * A lesson's theory is written from the sources pinned on its slice, and those sources come from
 * the epic's decision record. A learner who plans an epic in their own sitting arrives at its first
 * slice immediately: the record does not exist yet, nothing has pinned anything, and a lesson
 * written there would fall back to searching the repository — the very thing pinned sources
 * replaced. So a session stops at such a slice and says what is owed.
 *
 * The stop turns on the epic's record and never on the absence of sources. "No sources" is the
 * union of two situations: a record that does not exist yet, which is what this module is for, and
 * a record that exists while nobody ever ran the pinning step, which is most of the installed base
 * — pinning is a manual step nothing in the pipeline invokes. Stopping on absent sources alone
 * would take every existing workbook down on the day it shipped.
 *
 * The question asked is literally the pinning step's own: `pinSources` is called for the slice's
 * epic and asked whether it would still report it is waiting. There is therefore one definition of
 * "this epic has an approved record" rather than two that can drift, and a learner can never be
 * stopped by this check and refused by that step over one epic (invariant 3).
 *
 * A question that cannot be answered is not a stop (invariant 4). An unresolved epic, a slice that
 * records no epic, or a record read that failed leaves the session teaching exactly what yesterday's
 * release taught, and says the check could not run.
 *
 * Pure, and it reaches nothing: the record's existence and approval arrive through a reader handed
 * in, the way the story reader already does (invariant 5).
 */

import { type Runner, defaultRunner } from "@nexus/workspace/run";
import { writeLearnerRecord } from "./learner-store.js";
import { type EpicHome } from "./planning-boundary.js";
import { pinSources, type DecisionRecordState, type PinningResult } from "./source-pinning.js";
import { sliceId, sliceLabel, type PlanSliceRecord, type WorkbookPlan } from "./workbook-plan.js";

/**
 * What this checkout finds about one epic's decision record. `read` carries the record itself, or
 * null for an epic that has none; `unreadable` is the answer the checkout could not reach, which is
 * never a stop.
 */
export type RecordLookup =
    | { kind: "read"; record: DecisionRecordState | null }
    | { kind: "unreadable"; detail: string };

/** Reads one epic's decision record. The same seam the story reader uses: the session never fetches. */
export type RecordReader = (epic: number) => RecordLookup;

/**
 * What the session does at the one slice it arrived at. `owed` is the new terminal verdict; `teach`
 * is every other answer, carrying what the check found — or null when the slice carries sources and
 * the question was never asked, which is what keeps a fully pinned plan reporting exactly as before.
 */
export type RecordVerdict =
    | { kind: "owed"; slice: string; story: number; epic: number; record: number | null }
    | { kind: "teach"; note: string | null };

/** Nothing to say: this slice is not one the check is asked about at all. */
const SILENT: RecordVerdict = { kind: "teach", note: null };

/**
 * Whether the step that pins sources would still report it is waiting for this epic — asked by
 * calling that step rather than by restating its rule. It answers "waiting" for an epic with no
 * record and for one whose record nobody approved, and for nothing else; an approved record with no
 * sources offered is refused by it instead, which is not waiting.
 */
function pinningStepWaiting(plan: WorkbookPlan, epic: number, record: DecisionRecordState | null): string | null {
    const result: PinningResult = pinSources({ plan, epic, record, authored: [], isFile: () => false });
    return result.ok ? result.waiting : null;
}

/**
 * Ask the one question, about the one slice the session arrived at, and only once that slice is
 * known to carry no sources (invariant 6).
 */
export function recordOwed(plan: WorkbookPlan, slice: PlanSliceRecord, read: RecordReader): RecordVerdict {
    // A scaffold builds no story and so belongs to no epic; a handoff slice teaches nothing, so no
    // lesson of it is ever written from a record. Neither is ever gated (invariant 1).
    if (slice.scaffold !== undefined || !slice.learnerBuilds || slice.story === undefined) return SILENT;
    // Sources already pinned: the lesson has what it is written from, so nothing is asked and
    // nothing new is reported.
    if (slice.sources !== undefined) return SILENT;

    const epic: number | undefined = slice.epic;
    if (epic === undefined) {
        return {
            kind: "teach",
            note:
                `${sliceLabel(slice)} records no epic and the plan declares none, so whether a decision ` +
                `record is owed for it could not be checked, and the lesson is written as it was before.`,
        };
    }

    let lookup: RecordLookup;
    try {
        lookup = read(epic);
    } catch (e) {
        lookup = { kind: "unreadable", detail: e instanceof Error ? e.message : String(e) };
    }
    if (lookup.kind === "unreadable") {
        return {
            kind: "teach",
            note:
                `whether epic #${epic} owes a decision record could not be checked — ${lookup.detail} — so ` +
                `the lesson is written as it was before.`,
        };
    }

    if (pinningStepWaiting(plan, epic, lookup.record) === null) {
        return {
            kind: "teach",
            note:
                `epic #${epic} has an approved decision record` +
                (lookup.record === null ? "" : ` (#${lookup.record.number})`) +
                `, so nothing is owed — but nobody has pinned ${sliceLabel(slice)}'s sources, so its lesson ` +
                `is written from the repository rather than from what that record says.`,
        };
    }

    return {
        kind: "owed",
        slice: sliceId(slice),
        story: slice.story,
        epic,
        record: lookup.record === null ? null : lookup.record.number,
    };
}

/**
 * What the learner reads at the stop. It names the slice, the story it builds, the epic that story
 * belongs to and the record that epic owes; where a record exists and nobody approved it, it names
 * that record's number and says approval is what is missing (invariant 9).
 *
 * It says what *this checkout* finds rather than asserting no record exists anywhere. The record's
 * number is read from the epic as this checkout resolved it, and that artifact may have been
 * materialized before the record was written — so a learner who has just filed one and not
 * re-resolved would otherwise read a flat contradiction of what they had just done (record #100's
 * first ADDRESS risk).
 */
export function renderRecordOwedReport(slice: PlanSliceRecord, epic: number, record: number | null): string {
    const finding: string =
        record === null
            ? `this checkout finds no decision record for it`
            : `this checkout finds decision record #${record} for it, and nobody has approved it — approval is what is missing`;
    return (
        `No lesson is written for ${sliceLabel(slice)}. Its theory is written from the decision record of ` +
        `epic #${epic}, the epic #${slice.story} belongs to, and ${finding}. Nothing has pinned this ` +
        `slice's sources, so a lesson written now would be written from a search of the repository.\n\n` +
        `Writing that record is yours to do, and it is where the reasons behind the stories you are about ` +
        `to be taught get written down. Approving it and pinning epic #${epic}'s sources is what clears ` +
        `this; the next session then teaches ${sliceLabel(slice)} from what the record says.`
    );
}

/**
 * A story of the epic this plan teaches: its number, and the title pinned to it at approval. The
 * plan records no epic title, so the stories are how the brief lets the learner recognise which
 * epic this is without reading an issue — and they are exactly the stories the record has to cover.
 */
export interface BriefedStory {
    story: number;
    title: string;
}

/** Everything a record brief states, all of it read off the committed plan and the checkout. */
export interface RecordBriefContext {
    /** The epic that owes the record. */
    epic: number;
    /** The record this checkout finds for it, or null when it finds none. */
    record: number | null;
    /** The story whose slice the session stopped at. */
    story: number;
    /** Every story of that epic the plan teaches, in plan order. */
    stories: readonly BriefedStory[];
    /** The workbook the plan belongs to. */
    workbook: string;
    /** The repository the workbook lives in, as the plan names it. */
    workbookRepo: string;
    /** Where the epic issue itself lives — the same answer the planning brief resolves. */
    home: EpicHome;
}

/** The record one epic's brief is written to, named from the epic's issue number and nothing else. */
export function recordBriefName(epic: number): string {
    return `epic-${epic}.md`;
}

/**
 * Issue text as one labelled field. A title is data, so it is collapsed onto a single line: it
 * cannot then run past its own label and stand where one of the brief's own instructions would be
 * read (invariant 13).
 */
function oneLine(title: string): string {
    return title.replace(/\s+/g, " ").trim();
}

/** How the brief names the repository the record command is run in. */
function whereToRun(home: EpicHome): string {
    if (home.mode === "workspace") return `${home.repo} — the workspace hub, where this roadmap's epics live, not the workbook's own repository`;
    if (home.mode === "single-repo") return `${home.repo} — the same repository the workbook lives in`;
    return "unresolved: this checkout declares a workspace that could not be read, so run it wherever this roadmap's epics are filed";
}

/**
 * The brief, rendered from the committed plan, the checkout's workspace shape and fixed text — and
 * from nothing else (invariant 12). No issue is read, so the story titles it states are the ones
 * recorded at approval and may be months old; every one of them is identified first by its number.
 *
 * The facts come first as labelled fields, and every instruction the brief states stands after
 * them, in the brief's own words (invariant 13).
 */
export function renderRecordBrief(ctx: RecordBriefContext): string {
    const { epic, record, story, stories, workbook, workbookRepo, home } = ctx;
    return [
        `# Write the decision record for epic #${epic}`,
        "",
        `The next slice ${workbook} teaches is one you build, and its lesson's theory is written from`,
        `epic #${epic}'s decision record. This checkout finds ${record === null ? "no such record" : `record #${record}, which nobody has approved`},`,
        "so nothing has pinned the sources that lesson would be written from. Writing that record is",
        "what comes next, and it is yours to do: the session that wrote this brief wrote no record,",
        "approved nothing and changed nothing in the workbook.",
        "",
        "## The facts, as the plan records them",
        "",
        `- Epic that owes a decision record: #${epic}`,
        `- Decision record this checkout finds: ${record === null ? "none" : `#${record}, filed and not approved`}`,
        `- Story whose lesson is waiting: #${story}`,
        `- Repository the epic issue lives in: ${home.repo ?? "(could not be resolved from this checkout)"}`,
        `- Workbook: ${workbook}`,
        `- Repository the workbook lives in: ${workbookRepo}`,
        "",
        `The stories of #${epic} this plan teaches, which are the stories the record has to cover:`,
        "",
        ...stories.map((each) => `- Story #${each.story}, titled at approval: ${oneLine(each.title)}`),
        "",
        "Those titles are what the plan recorded when it was approved, and nothing here re-read an",
        "issue, so they may be out of date. The numbers are what identify them.",
        "",
        "## What writes it",
        "",
        `Run \`/nxs.decision-record ${epic}\` in: ${whereToRun(home)}.`,
        "",
        "It files the record as a sub-issue of the epic issue, which is where the record lives.",
        "",
        "## What you decide while writing it",
        "",
        "A decision record is the focused 'why' behind an epic, and writing it is the half of this",
        "sitting that decides what the stories you are about to be taught actually mean. You decide:",
        "",
        "- which decisions the design turns on, and what each one chose;",
        "- which alternatives you refused for each, and what each of them lost on;",
        "- the invariants the implementation must hold, which is what conformance is later checked against;",
        "- the risks worth recording, and which of them somebody has to address before the work starts.",
        "",
        "The lessons you are taught next are written from exactly that: a lesson's theory names a",
        "section of this record, one file in the codebase that demonstrates it, and an alternative you",
        "refuted with what it lost on. That is why the lesson you would otherwise be reading is this",
        "brief instead.",
        "",
        "## What you do afterwards",
        "",
        "1. Write the record with the command above.",
        "2. Approve it by closing that sub-issue. Approval is the close and nothing else.",
        `3. Re-resolve the epic where the pipeline runs: \`nexus epic-resolve --epic ${epic}\`. The`,
        "   record's number is read from the epic as this checkout resolved it, and that file was",
        "   written before your record existed — skip this step and the next session will tell you the",
        "   epic has no record, right after you wrote one.",
        `4. Pin the epic's sources: \`nxsx workbook pin ${workbook} --epic ${epic} --sources <file>\`. It`,
        "   refuses an unapproved record and pins nothing, so step 2 is what makes this one work.",
        `5. Teach the next slice as usual. It will be #${story}, and its theory will be written from what`,
        "   you decided in the record rather than from a search of the repository.",
        "",
        "Nothing removes this brief. Once the sources are pinned the stop clears by itself, and this",
        "file is a leftover note about a decision you made.",
    ].join("\n") + "\n";
}

/**
 * Every story of one epic the plan teaches, in plan order and once each — a story split into parts
 * is one story to the record that covers it.
 */
export function briefedStories(plan: WorkbookPlan, epic: number): BriefedStory[] {
    const seen: Set<number> = new Set();
    const stories: BriefedStory[] = [];
    for (const slice of plan.slices) {
        if (slice.story === undefined || slice.epic !== epic || slice.pinned === null) continue;
        if (seen.has(slice.story)) continue;
        seen.add(slice.story);
        stories.push({ story: slice.story, title: slice.pinned.title });
    }
    return stories;
}

/**
 * Write the brief as a personal record under the learner folder, at a path derived from the epic's
 * issue number. Written on every run that reaches the verdict, overwriting any earlier copy: the
 * content is a pure function of the plan, so a rewrite changes nothing in substance, and the learner
 * folder's write guard — which asks git per write, because an ignore rule can be removed between two
 * writes — is then asked every time as it is meant to be.
 */
export function writeRecordBrief(repoRoot: string, ctx: RecordBriefContext, run: Runner = defaultRunner): string {
    return writeLearnerRecord(repoRoot, "record-briefs", recordBriefName(ctx.epic), renderRecordBrief(ctx), run);
}
