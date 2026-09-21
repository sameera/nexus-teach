// @vitest-environment jsdom
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { ROADMAP, approve, committedPlan, gate, io, planned, teach, type Captured, type Planned } from "./plan-commit-fixtures.js";
import { writePlanDraft, type PlanStub } from "./plan-draft.js";
import { rewritePlan } from "./plan-rewrite.js";
import { writeRoadmap, type Roadmap } from "./roadmap.js";
import { type SessionResult } from "./teaching-session.js";
import { runWorkbookCli } from "./workbook-cli.js";
import { lessonsDir } from "./workbook-store.js";
import { type PlanSliceRecord, type WorkbookPlan } from "./workbook-plan.js";

/**
 * The seam this epic makes — the boundary verdict at one end, the re-approval at the other — crosses
 * the session, the planning command and the approval gate, and no unit test of either half shows
 * that they meet. So this spec drives the committed chain end to end across one real sitting: teach
 * the plan out, reach the boundary, flip the roadmap member the brief named from unplanned to
 * planned, re-run the chain, and teach again (record #95's second ADDRESS risk).
 *
 * The planning command itself is outside this package, so what it does is represented the only way
 * a hermetic test can represent it: the roadmap the chain re-resolves now carries that member as
 * planned, with the stories planning it filed. Everything after that point is this repository's own
 * code, running for real.
 */

/** The roadmap at the first approval: one planned epic with one story, two epics nobody has planned. */
const GROWING: Roadmap = {
    ...ROADMAP,
    members: [
        { number: 100, title: "Alpha", kind: "planned" },
        { number: 250, title: "Teach the drill from the hint log", kind: "unplanned", body: "UNPLANNED-BODY-250" },
        { number: 150, title: "Render the dependency graph", kind: "unplanned", body: "UNPLANNED-BODY-150" },
    ],
    stories: [ROADMAP.stories[0]],
};

/** The same roadmap after the learner planned #250: its two stories are filed, and #150 is still unplanned. */
const EXTENDED: Roadmap = {
    ...GROWING,
    members: GROWING.members.map((member) => (member.number === 250 ? { number: 250, title: member.title, kind: "planned" as const } : member)),
    stories: [
        ...GROWING.stories,
        { number: 31, title: "Rank the drill", body: "Choose the concept the learner has asked for most help on.", epic: 250, blockedBy: [11], external: [] },
        { number: 32, title: "Log the hint", body: "Record the hint against the concept it was taken on.", epic: 250, blockedBy: [31], external: [] },
    ],
};

const FIRST_STUBS: PlanStub[] = [{ story: 11, builds: "learner", concepts: ["pinned-state"], assumes: [] }];
const EXTENDED_STUBS: PlanStub[] = [
    ...FIRST_STUBS,
    { story: 31, builds: "learner", concepts: ["drill-ranking"], assumes: ["pinned-state"] },
    { story: 32, builds: "learner", concepts: ["hint-log"], assumes: ["drill-ranking"] },
];

function draftFrom(stubs: PlanStub[], roadmap: Roadmap) {
    return rewritePlan({ slices: stubs }, { edges: roadmap.stories.map((story) => ({ story: story.number, blockedBy: story.blockedBy })) });
}

function lessonText(p: Planned, lesson: string): string {
    return fs.readFileSync(path.join(lessonsDir(p.repo, "alpha"), lesson), "utf8");
}

/** Teach the slice the session is up to, write the pinning test it asks for, and finish its exercise. */
function teachSlice(p: Planned, story: number, file: string): void {
    const briefed: SessionResult = teach(p);
    if (briefed.outcome.kind !== "brief") throw new Error(`expected a brief for #${story}, got ${briefed.outcome.kind}`);
    expect(briefed.outcome.brief.story).toBe(story);
    const slice: string = briefed.outcome.brief.writeTest?.slice as string;
    const written: SessionResult = teach(p, {
        theory: `What #${story} teaches, in prose.`,
        drill: { question: "What was that idea?", answer: "This idea." },
        pinningTests: [{ slice, file, text: `it("pins #${story}", () => {});\n` }],
    });
    expect(written.outcome.kind).toBe("written");
    fs.mkdirSync(path.join(p.repo, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(p.repo, file), `it("pins #${story}", () => {});\n`);
}

/** Run the planning chain again over the roadmap as it now stands, as far as a rewritten draft. */
function replan(p: Planned, roadmap: Roadmap, stubs: PlanStub[]): void {
    writeRoadmap(p.repo, roadmap);
    writePlanDraft(p.repo, "alpha", { slices: stubs });
    const captured: Captured = io(p.repo);
    expect(runWorkbookCli(["rewrite", "alpha", "--root", p.repo], captured, p.run)).toBe(0);
}

function reapprove(p: Planned): void {
    expect(gate(p).code).toBe(0);
    const again = gate(p, "--approve");
    expect(again.captured.err).toEqual([]);
    expect(again.code).toBe(0);
}

/** A workbook taught to the end of a plan whose roadmap was still growing: the boundary, reached for real. */
function atTheBoundary(): Planned {
    const p: Planned = planned(draftFrom(FIRST_STUBS, GROWING), GROWING);
    expect(approve(p).code).toBe(0);
    teachSlice(p, 11, "tests/pin.spec.ts");
    const boundary: SessionResult = teach(p);
    expect(boundary.outcome.kind).toBe("plan-next");
    if (boundary.outcome.kind !== "plan-next") throw new Error("expected the boundary verdict");
    expect(boundary.outcome.epic).toBe(250);
    return p;
}

describe("the newly planned epic extends the plan and keeps every taught lesson (story #94)", () => {
    it("plans that epic's stories after every slice already taught, and changes no lesson written before", () => {
        const p: Planned = atTheBoundary();
        const before: WorkbookPlan = committedPlan(p);
        const taught: string = before.slices[0].lesson;
        const written: string = lessonText(p, taught);
        p.fake.live[31] = { title: "Rank the drill", body: EXTENDED.stories[1].body, closed: false };
        p.fake.live[32] = { title: "Log the hint", body: EXTENDED.stories[2].body, closed: false };
        replan(p, EXTENDED, EXTENDED_STUBS);

        reapprove(p);

        const after: WorkbookPlan = committedPlan(p);
        expect(after.slices.map((slice: PlanSliceRecord) => slice.story)).toEqual([11, 31, 32]);
        expect(after.slices[0]).toEqual(before.slices[0]);
        expect(lessonText(p, taught)).toBe(written);
        expect(fs.readdirSync(lessonsDir(p.repo, "alpha"))).toEqual([taught]);
    });

    it("teaches the first slice of the newly planned epic instead of naming the boundary again", () => {
        const p: Planned = atTheBoundary();
        p.fake.live[31] = { title: "Rank the drill", body: EXTENDED.stories[1].body, closed: false };
        p.fake.live[32] = { title: "Log the hint", body: EXTENDED.stories[2].body, closed: false };
        replan(p, EXTENDED, EXTENDED_STUBS);
        reapprove(p);

        const next: SessionResult = teach(p);

        expect(next.outcome.kind).toBe("brief");
        if (next.outcome.kind !== "brief") throw new Error("expected a brief");
        expect(next.outcome.brief.story).toBe(31);
    });

    it("records the epics still unplanned past the boundary, and names the next of them once the new slices are taught", () => {
        const p: Planned = atTheBoundary();
        p.fake.live[31] = { title: "Rank the drill", body: EXTENDED.stories[1].body, closed: false };
        p.fake.live[32] = { title: "Log the hint", body: EXTENDED.stories[2].body, closed: false };
        replan(p, EXTENDED, EXTENDED_STUBS);
        reapprove(p);

        expect(committedPlan(p).unplanned).toEqual([{ epic: 150, title: "Render the dependency graph" }]);

        teachSlice(p, 31, "tests/rank.spec.ts");
        teachSlice(p, 32, "tests/log.spec.ts");
        const boundary: SessionResult = teach(p);

        if (boundary.outcome.kind !== "plan-next") throw new Error(`expected the boundary verdict, got ${boundary.outcome.kind}`);
        expect(boundary.outcome.epic).toBe(150);
        expect(boundary.outcome.remaining).toBe(1);
        expect(boundary.outcome.briefPath).toContain("epic-150.md");
    });
});
