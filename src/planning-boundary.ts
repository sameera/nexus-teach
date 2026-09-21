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

import { type Runner, defaultRunner } from "@nexus/workspace/run";
import { resolveWorkspace, type ResolveResult } from "@nexus/workspace/resolve";
import { writeLearnerRecord } from "./learner-store.js";
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

/**
 * Where the epic to plan lives, and where the workbook lives — two repositories that are the same
 * one only outside a workspace.
 *
 * A roadmap's epics are resolved from the workspace hub when there is one, so in a workspace the
 * epic the learner must plan does not live in the repository the plan names. The brief therefore
 * names both, labelled, and says which of the two the planning command is run in (record #95).
 *
 * The question is answered from files already in the checkout — the one workspace resolver, which
 * reads a manifest or a pointer and stats sibling paths — so it costs no network and two renders of
 * the same checkout answer identically (invariant 7).
 */
export interface EpicHome {
    /** How the answer was reached. `unresolved` when the checkout declares a workspace it cannot read. */
    mode: "single-repo" | "workspace" | "unresolved";
    /** The repository the epic issue lives in, or null when the workspace could not be read. */
    repo: string | null;
}

/**
 * Resolve where the epic to plan lives. Outside a workspace it is the workbook's own repository;
 * inside one it is the hub, which is where roadmap resolution queries for epics. A workspace that
 * cannot be read is said so rather than guessed at: naming the wrong repository would send the
 * learner to run the planning command in the wrong place, which is exactly the risk this answer
 * exists to close.
 */
export function epicHome(repoRoot: string, workbookRepo: string): EpicHome {
    const resolved: ResolveResult = resolveWorkspace(repoRoot);
    if (!resolved.ok) return { mode: "unresolved", repo: null };
    if (resolved.workspace.mode === "single-repo") return { mode: "single-repo", repo: workbookRepo };
    return { mode: "workspace", repo: resolved.workspace.hub.name };
}

/** Everything a planning brief states, all of it read off the committed plan and the checkout. */
export interface PlanningBriefContext {
    /** The epic to plan, as the plan records it: its number and the title recorded at approval. */
    epic: UnplannedMember;
    /** How many epics sit past the boundary, the named one included. */
    remaining: number;
    /** The workbook the plan belongs to. */
    workbook: string;
    /** The repository the workbook lives in, as the plan names it. */
    workbookRepo: string;
    /** Where the epic issue itself lives. */
    home: EpicHome;
}

/** The record one epic's brief is written to, named from the epic's issue number and nothing else. */
export function planningBriefName(epic: number): string {
    return `epic-${epic}.md`;
}

/**
 * The recorded title as one labelled field. A title is issue text, and issue text is data: it is
 * collapsed onto a single line so it cannot run past its own label and stand where one of the
 * brief's own instructions would be read (invariant 8).
 */
function oneLine(title: string): string {
    return title.replace(/\s+/g, " ").trim();
}

/** How the brief names the repository the planning command is run in. */
function whereToRun(home: EpicHome): string {
    if (home.mode === "workspace") return `${home.repo} — the workspace hub, where this roadmap's epics live, not the workbook's own repository`;
    if (home.mode === "single-repo") return `${home.repo} — the same repository the workbook lives in`;
    return "unresolved: this checkout declares a workspace that could not be read, so run it wherever this roadmap's epics are filed";
}

/**
 * The brief, rendered from the committed plan, the checkout's workspace shape and fixed text — and
 * from nothing else (invariant 7). No issue is read, so the title it states is the one recorded at
 * approval and may be months old; the epic is therefore identified first by its number, which is
 * what the planning command takes.
 *
 * The facts come first as labelled fields, and every rule the brief states stands after them, in
 * the brief's own words (invariant 8).
 */
export function renderPlanningBrief(ctx: PlanningBriefContext): string {
    const { epic, remaining, workbook, workbookRepo, home } = ctx;
    const behind: number = remaining - 1;
    return [
        `# Plan epic #${epic.epic}`,
        "",
        `Every slice the workbook ${workbook} plans has been taught and finished. The plan was`,
        "approved from a roadmap that was still growing, and this epic is the first on it that nobody",
        "has planned yet. Planning it is what comes next, and it is yours to do: the session that",
        "wrote this brief planned nothing, filed nothing and changed nothing in the workbook.",
        "",
        "## The facts, as the plan records them",
        "",
        `- Epic to plan: #${epic.epic}`,
        `- Title recorded for it at approval: ${oneLine(epic.title)}`,
        `- Repository the epic issue lives in: ${home.repo ?? "(could not be resolved from this checkout)"}`,
        `- Workbook: ${workbook}`,
        `- Repository the workbook lives in: ${workbookRepo}`,
        `- Epics past the planning boundary: ${remaining}` + (behind === 0 ? " (this one and no others)" : `, of which ${behind} sit behind this one`),
        "",
        "## What plans it",
        "",
        `Run \`/nxs.epic ${epic.epic}\` in: ${whereToRun(home)}.`,
        "",
        "The title above is what the plan recorded when it was approved, and nothing here re-read the",
        "issue, so it may be out of date. The number is what the planning command takes, and the",
        "number is what identifies the epic.",
        "",
        "## What you decide while planning it",
        "",
        "Planning an epic is where somebody decides what the work actually is, and that is the point",
        "of your sitting through it rather than being handed the result. You decide:",
        "",
        "- which user stories the epic breaks into, and how big each one is;",
        "- what each story's acceptance criteria are — what would have to be true for it to be done;",
        "- which stories block which, so the order is a consequence of the work and not of the typing;",
        "- what is out of scope, and which of that becomes an epic of its own.",
        "",
        "The stories you are taught next are the stories you write here. That is why the lesson you",
        "would otherwise be reading is this brief instead.",
        "",
        "## What you do afterwards",
        "",
        "1. Plan the epic with the command above. It files the epic's stories as issues.",
        `2. Run the planning chain over this workbook's roadmap again (\`/nxsx.teach-plan\`), the same`,
        "   way this roadmap was resolved the first time.",
        "3. Approve the plan at the gate. The approval carries every slice you have already been",
        "   taught forward unchanged and plans the new epic's stories after them, so nothing you have",
        "   read is rewritten and nothing is taught twice.",
        "4. Teach the next slice as usual. It will be the first slice of the epic you just planned.",
        "",
        "Nothing removes this brief. If you plan the epic, the next approval simply moves it out of",
        "the boundary and into the plan, and this file is a leftover note about a decision you made.",
    ].join("\n") + "\n";
}

/**
 * Write the brief as a personal record under the learner folder, at a path derived from the epic's
 * issue number. Written on every boundary run, overwriting any earlier copy: the content is a pure
 * function of the plan, so a rewrite changes nothing in substance, and the learner folder's write
 * guard — which asks git per write, because an ignore rule can be removed between two writes — is
 * then asked every time as it is meant to be.
 */
export function writePlanningBrief(repoRoot: string, ctx: PlanningBriefContext, run: Runner = defaultRunner): string {
    return writeLearnerRecord(repoRoot, "planning-briefs", planningBriefName(ctx.epic.epic), renderPlanningBrief(ctx), run);
}
