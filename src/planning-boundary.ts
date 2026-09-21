/**
 * The planning boundary a session can reach (epic #67, decision record #95).
 *
 * A plan is written from a roadmap that is still growing, so it covers the epics somebody had
 * planned and records the rest past the planning boundary, as a number and a title each. A learner
 * who works through every slice of such a plan has not finished the workbook — they have reached
 * the point where the next thing to do is plan the next epic.
 *
 * So the session's answer there is a verdict of its own rather than the finished report, and this
 * module is what renders it. The verdict is reached from the committed plan alone: the boundary
 * list the plan already carries, in the roadmap's own member order, of which the first entry is the
 * one to plan next (invariant 3). Nothing here reads the issue graph, and nothing here decides
 * where in the chain the question is asked — the session does that, at the one point it has
 * concluded there is nothing left to teach.
 */

import { type UnplannedMember } from "./workbook-plan.js";

/**
 * The verdict a session reaches at the boundary: which epic to plan next, and how many sit past the
 * boundary behind it. Derived from the plan's own list and nothing else, so two runs over an
 * unchanged repository reach the same one (invariant 9).
 */
export interface PlanningBoundary {
    /** The epic to plan next: the first entry of the plan's boundary list, in the roadmap's order. */
    next: UnplannedMember;
    /** How many epics sit past the boundary, the named one included. */
    remaining: number;
}

/**
 * The boundary the plan records, or null when it records none. An absent list and an epic-free one
 * are the same answer, because only a plan whose boundary list is present and not empty can produce
 * the new verdict (invariant 2) — the plan reader already refuses to read an empty list back.
 */
export function planningBoundary(unplanned: readonly UnplannedMember[] | undefined): PlanningBoundary | null {
    if (unplanned === undefined || unplanned.length === 0) return null;
    return { next: unplanned[0], remaining: unplanned.length };
}

/**
 * What the session reports at the boundary. It states the count past the boundary and that the
 * named epic is the one to plan next (invariant 4), so a learner reading the verdict alone knows
 * both what to do now and how much of the roadmap is still waiting behind it.
 */
export function renderBoundaryReport(slug: string, boundary: PlanningBoundary): string {
    const { next, remaining } = boundary;
    return (
        `Every slice of ${slug} has been taught and finished, and the plan records ` +
        `${remaining} ${remaining === 1 ? "epic" : "epics"} past the planning boundary — ` +
        `${remaining === 1 ? "one nobody" : "epics nobody"} had planned when the plan was approved. ` +
        `The one to plan next is #${next.epic}, "${next.title}". The workbook is not finished: it is ` +
        `waiting on that planning decision, which is yours to make.`
    );
}
