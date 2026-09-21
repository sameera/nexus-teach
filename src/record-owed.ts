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
