// @vitest-environment jsdom
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { writeRoadmap } from "./roadmap.js";
import { planDraftPath, readPlanDraft, writePlanDraft, type PlanDraft } from "./plan-draft.js";
import { DRAFT, ROADMAP, approve, committedPlan, committedText, gate, planned, type Planned } from "./plan-commit-fixtures.js";
import { type LiveStory } from "./teaching-plan.js";
import { runTeachingSession, type SessionResult } from "./teaching-session.js";
import { PLAN_FILENAME, parsePlan, type WorkbookPlan } from "./workbook-plan.js";
import { lessonsDir, readWorkbookPlan, workbookRoot } from "./workbook-store.js";

describe("approval writes a committed plan the shipped teaching session reads (story #587)", () => {
    it("writes a plan whose every slice the shipped plan reader accepts", () => {
        const p: Planned = planned();

        const { code, captured } = approve(p);

        expect(captured.err).toEqual([]);
        expect(code).toBe(0);
        const text: string = fs.readFileSync(path.join(workbookRoot(p.repo, "alpha"), PLAN_FILENAME), "utf8");
        expect(parsePlan(text).slices).toHaveLength(DRAFT.slices.length);
    });

    it("fills every field the session acts on from the graph and the workspace, and no placeholder", () => {
        const p: Planned = planned();
        approve(p);

        const plan: WorkbookPlan = committedPlan(p);
        expect(plan.repo).toBe("acme/widgets");
        expect(plan.suite).toEqual(["fake-suite", "--all"]);
        expect(plan.grading).toEqual(["fake-grade"]);
        const [first, scaffold, partOne, partTwo, handedOff] = plan.slices;
        expect(first.epic).toBe(100);
        expect(handedOff.epic).toBe(200);
        expect(partOne.branch).toBe(partTwo.branch);
        expect(partOne.branch).toMatch(/alpha/);
        expect(first.branch).not.toBe(partOne.branch);
        expect(scaffold.branch).toBe("");
        expect(new Set(plan.slices.map((slice) => slice.lesson).filter((lesson) => lesson !== "")).size).toBe(4);
        expect(handedOff.lesson).toBe("");
        expect(plan.slices.every((slice) => slice.pinningTest === null)).toBe(true);
    });

    it("records the dependency edges between slices: the story edges, part to part, and scaffold to the slice it serves", () => {
        const p: Planned = planned();
        approve(p);

        const plan: WorkbookPlan = committedPlan(p);
        const id = (index: number): string => plan.slices[index].lesson.replace(/\.md$/, "") || "story-21";
        expect(plan.slices[2].dependsOn).toEqual(expect.arrayContaining([id(0), id(1)]));
        expect(plan.slices[3].dependsOn).toEqual([id(2)]);
        expect(plan.slices[4].dependsOn).toEqual([id(3)]);
        expect(plan.slices[0].dependsOn).toEqual([]);
    });

    it("teaches from the approved plan at once, writing a slice's pinning test when the learner arrives at it", () => {
        const p: Planned = planned();
        approve(p);
        const session = (prose?: Parameters<typeof runTeachingSession>[0]["prose"]): SessionResult =>
            runTeachingSession({ repoRoot: p.repo, slug: "alpha", read: (story) => p.fake.live[story] ?? null, run: p.run, prose, now: () => "2026-09-13T00:00:00.000Z" });

        const briefed: SessionResult = session();
        if (briefed.outcome.kind !== "brief") throw new Error(`expected a brief, got ${briefed.outcome.kind}: ${briefed.outcome.report}`);
        expect(briefed.outcome.brief.writeTest?.story).toBe(11);
        expect(committedPlan(p).slices[0].pinningTest).toBeNull();

        const written: SessionResult = session({
            theory: "Pinning records what a story said.",
            pinningTests: [{ slice: briefed.outcome.brief.writeTest?.slice as string, file: "tests/pin.spec.ts", text: "it('pins #11', () => {});\n" }],
        });

        expect(written.outcome.kind).toBe("written");
        expect(committedPlan(p).slices[0].pinningTest).toEqual({ file: "tests/pin.spec.ts", text: "it('pins #11', () => {});\n" });
        expect(fs.readFileSync(path.join(lessonsDir(p.repo, "alpha"), committedPlan(p).slices[0].lesson), "utf8")).toContain("it('pins #11', () => {});");
    });

    it("refuses to write the lesson for a slice whose pinning test the prose does not carry, and records nothing", () => {
        const p: Planned = planned();
        approve(p);

        expect(() => runTeachingSession({ repoRoot: p.repo, slug: "alpha", read: (story) => p.fake.live[story] ?? null, run: p.run, prose: { theory: "Theory." } })).toThrow(/pinning test/);
        expect(committedPlan(p).slices[0].pinningTest).toBeNull();
        expect(fs.readdirSync(lessonsDir(p.repo, "alpha"))).toEqual([]);
    });

    it("writes the handed-off slice's test and the next story slice's test before it writes a handoff prompt", () => {
        const draft: PlanDraft = {
            slices: [
                { story: 11, builds: "handoff", concepts: [], assumes: [] },
                { story: 12, builds: "learner", concepts: ["drift"], assumes: [] },
            ],
            coverage: { clean: true, gaps: [] },
        };
        // The draft plans #100's stories alone, so the roadmap it was planned from holds #100 alone.
        const p: Planned = planned(draft, { ...ROADMAP, members: [ROADMAP.members[0]], stories: ROADMAP.stories.filter((story) => story.epic === 100) });
        approve(p);
        const session = (prose?: Parameters<typeof runTeachingSession>[0]["prose"]): SessionResult =>
            runTeachingSession({ repoRoot: p.repo, slug: "alpha", read: (story) => p.fake.live[story] ?? null, run: p.run, prose, now: () => "2026-09-13T00:00:00.000Z" });

        const asked: SessionResult = session();
        if (asked.outcome.kind !== "tests") throw new Error(`expected a request for tests, got ${asked.outcome.kind}`);
        expect(asked.outcome.requests.map((request) => request.story)).toEqual([11, 12]);

        const paused: SessionResult = session({
            theory: "",
            pinningTests: asked.outcome.requests.map((request) => ({ slice: request.slice, file: `tests/${request.slice}.spec.ts`, text: `it('pins #${request.story}', () => {});\n` })),
        });

        expect(paused.outcome.kind).toBe("handoff");
        expect(committedPlan(p).slices.map((slice) => slice.pinningTest?.file)).toEqual(["tests/story-11.spec.ts", "tests/story-12.spec.ts"]);
    });

    it("approves a story whose issue body is empty into a plan the session still reads", () => {
        const emptied = { ...ROADMAP, stories: ROADMAP.stories.map((story) => (story.number === 11 ? { ...story, body: "" } : story)) };
        const p: Planned = planned(DRAFT, emptied);
        p.fake.live[11] = { title: "Pin the plan", body: "", closed: false };

        expect(approve(p).code).toBe(0);

        expect(committedPlan(p).slices[0].pinned).toEqual({ title: "Pin the plan", body: "", closed: false });
        expect(runTeachingSession({ repoRoot: p.repo, slug: "alpha", read: (story) => p.fake.live[story] ?? null, run: p.run }).outcome.kind).toBe("brief");
    });

    it("writes the plan and its pages together or not at all", () => {
        const p: Planned = planned();
        fs.mkdirSync(path.join(workbookRoot(p.repo, "alpha"), "index.html"));

        const { code } = approve(p);

        expect(code).toBe(1);
        expect(fs.readdirSync(workbookRoot(p.repo, "alpha")).filter((name) => name.startsWith(PLAN_FILENAME))).toEqual([]);
    });

    it("pins every story to its state on the issue graph at the moment of approval, closure included", () => {
        const p: Planned = planned();
        p.fake.live[11] = { ...(p.fake.live[11] as LiveStory), closed: true };

        expect(approve(p).code).toBe(0);

        const plan: WorkbookPlan = committedPlan(p);
        expect(plan.slices[0].pinned).toEqual({ title: "Pin the plan", body: "Record the state a story had at approval.", closed: true });
        expect(plan.slices[4].pinned).toEqual({ title: "Hand a story off", body: "Write the prompt a coding agent runs.", closed: false });
        expect(p.fake.calls.filter((call) => call[0] === "gh" && call[1] === "issue" && call[3] === "12")).toHaveLength(1);
    });

    it("refuses when a story moved since the draft was planned, names each one, and writes nothing", () => {
        const p: Planned = planned();
        p.fake.live[12] = { title: "Report drift, loudly", body: "Compare the pinned state with the live one.", closed: false };
        p.fake.live[21] = null;

        const { code, captured } = approve(p);

        expect(code).toBe(1);
        expect(captured.err.join("\n")).toMatch(/#12/);
        expect(captured.err.join("\n")).toMatch(/#21/);
        expect(readWorkbookPlan(p.repo, "alpha")).toBeNull();
    });

    it("carries none of the learner's own words into the committed workbook", () => {
        const p: Planned = planned();
        approve(p);

        const committed: string = committedText(p.repo);
        expect(committed).not.toContain("vitest suites every day");
        expect(committed).not.toContain("kubernetes");
        expect(committed).not.toContain("flaky retry loop");
        expect(committed).not.toContain("How do you test?");
    });

    it("leaves the committed workbook unchanged and the draft in place when the reviewer does not approve", () => {
        const p: Planned = planned();
        const before: string = fs.readFileSync(planDraftPath(p.repo, "alpha"), "utf8");

        expect(gate(p).code).toBe(0);

        expect(readWorkbookPlan(p.repo, "alpha")).toBeNull();
        expect(fs.readdirSync(workbookRoot(p.repo, "alpha"))).toEqual(["lessons"]);
        expect(fs.readFileSync(planDraftPath(p.repo, "alpha"), "utf8")).toBe(before);
    });

    it("keeps the draft in place after approval, for a later re-plan to reuse", () => {
        const p: Planned = planned();

        approve(p);

        expect(readPlanDraft(p.repo, "alpha")).not.toBeNull();
    });

    it("refuses approval the reviewer was never shown, and approval of a draft that changed after it was shown", () => {
        const p: Planned = planned();

        expect(gate(p, "--approve", "--commands", p.commands).code).toBe(1);
        expect(gate(p).code).toBe(0);
        writePlanDraft(p.repo, "alpha", { ...DRAFT, slices: DRAFT.slices.filter((stub) => stub.story !== 21) });
        const { code, captured } = gate(p, "--approve", "--commands", p.commands);

        expect(code).toBe(1);
        expect(captured.err.join("\n")).toMatch(/shown|changed/);
        expect(readWorkbookPlan(p.repo, "alpha")).toBeNull();
    });

    it("refuses a first approval that declares no suite and grading commands, rather than inferring them", () => {
        const p: Planned = planned();
        expect(gate(p).code).toBe(0);

        const { code, captured } = gate(p, "--approve");

        expect(code).toBe(1);
        expect(captured.err.join("\n")).toMatch(/suite/);
        expect(readWorkbookPlan(p.repo, "alpha")).toBeNull();
    });

    it("runs the coverage refusal again at approval, and writes nothing for a draft with a gap", () => {
        const gap: PlanDraft = { ...DRAFT, coverage: { clean: false, gaps: [{ concept: "drift", story: 12 }] } };
        const p: Planned = planned();
        expect(gate(p).code).toBe(0);
        writePlanDraft(p.repo, "alpha", gap);

        const { code, captured } = gate(p, "--approve", "--commands", p.commands);

        expect(code).toBe(1);
        expect(captured.err.join("\n")).toMatch(/refused/);
        expect(readWorkbookPlan(p.repo, "alpha")).toBeNull();
    });
});

/** The approval roadmap, still growing: #250 was pulled ahead of #200, so roadmap order is not issue order. */
const MIXED = {
    ...ROADMAP,
    members: [
        ROADMAP.members[0],
        { number: 250, title: "Not planned yet", kind: "unplanned" as const, body: "UNPLANNED-BODY-250" },
        ROADMAP.members[1],
        { number: 150, title: "Also not planned", kind: "unplanned" as const, body: "UNPLANNED-BODY-150" },
    ],
};

/** The committed plan file as YAML, so a field the reader does not know about still shows. */
function rawPlan(p: Planned): Record<string, unknown> {
    return parseYaml(fs.readFileSync(path.join(workbookRoot(p.repo, "alpha"), PLAN_FILENAME), "utf8")) as Record<string, unknown>;
}

describe("the committed plan records the members it did not plan, in roadmap order (story #86)", () => {
    it("holds exactly one entry per member with no stories, carrying its issue number and title", () => {
        const p: Planned = planned(DRAFT, MIXED);
        expect(approve(p).code).toBe(0);
        const unplanned: unknown[] = rawPlan(p)["unplanned"] as unknown[];
        expect(unplanned).toHaveLength(2);
        expect(unplanned).toEqual(expect.arrayContaining([{ epic: 150, title: "Also not planned" }, { epic: 250, title: "Not planned yet" }]));
    });

    it("holds those entries in the roadmap's own member order, not issue order", () => {
        const p: Planned = planned(DRAFT, MIXED);
        approve(p);
        expect(committedPlan(p).unplanned?.map((member) => member.epic)).toEqual([250, 150]);
    });

    it("gives an entry no slice, no concept, no source and nothing else", () => {
        const p: Planned = planned(DRAFT, MIXED);
        approve(p);
        for (const entry of rawPlan(p)["unplanned"] as Record<string, unknown>[]) expect(Object.keys(entry).sort()).toEqual(["epic", "title"]);
        const plan: WorkbookPlan = committedPlan(p);
        expect(plan.slices.map((slice) => slice.epic).filter((epic) => epic === 150 || epic === 250)).toEqual([]);
        expect(plan.slices).toHaveLength(DRAFT.slices.length);
        expect(committedText(p.repo)).not.toContain("UNPLANNED-BODY");
    });

    it("keeps an entry out of every page the workbook renders", () => {
        const p: Planned = planned(DRAFT, MIXED);
        approve(p);
        const pages: string = fs
            .readdirSync(workbookRoot(p.repo, "alpha"))
            .filter((name) => name.endsWith(".html"))
            .map((name) => fs.readFileSync(path.join(workbookRoot(p.repo, "alpha"), name), "utf8"))
            .join("\n");
        expect(pages).not.toContain("Not planned yet");
        expect(pages).not.toContain("Also not planned");
    });

    it("writes no such list on a roadmap whose members all have stories", () => {
        const whole: Planned = planned();
        const mixed: Planned = planned(DRAFT, MIXED);
        approve(whole);
        approve(mixed);
        expect(rawPlan(whole)).not.toHaveProperty("unplanned");
        expect(committedPlan(whole).unplanned).toBeUndefined();
        const { unplanned: _boundary, ...rest } = committedPlan(mixed);
        expect(rest).toEqual(committedPlan(whole));
    });

    it("keeps the list through a teaching session that rewrites the plan in place", () => {
        const p: Planned = planned(DRAFT, MIXED);
        approve(p);
        const briefed: SessionResult = runTeachingSession({ repoRoot: p.repo, slug: "alpha", read: (story) => p.fake.live[story] ?? null, run: p.run, now: () => "2026-09-13T00:00:00.000Z" });
        if (briefed.outcome.kind !== "brief") throw new Error(`expected a brief, got ${briefed.outcome.kind}`);
        const written: SessionResult = runTeachingSession({
            repoRoot: p.repo,
            slug: "alpha",
            read: (story) => p.fake.live[story] ?? null,
            run: p.run,
            prose: { theory: "Pinning records what a story said.", pinningTests: [{ slice: briefed.outcome.brief.writeTest?.slice as string, file: "tests/pin.spec.ts", text: "it('pins', () => {});\n" }] },
            now: () => "2026-09-13T00:00:00.000Z",
        });
        expect(written.outcome.kind).toBe("written");
        expect(committedPlan(p).slices[0].pinningTest).not.toBeNull();
        expect(committedPlan(p).unplanned).toEqual([
            { epic: 250, title: "Not planned yet" },
            { epic: 150, title: "Also not planned" },
        ]);
    });

    it("recomputes the list on a re-approval rather than carrying the previous one forward", () => {
        const p: Planned = planned(DRAFT, MIXED);
        approve(p);
        // #250 has since been planned; its stories were withdrawn, so it contributes none and is planned all the same.
        writeRoadmap(p.repo, { ...MIXED, members: MIXED.members.map((m) => (m.number === 250 ? { number: 250, title: m.title, kind: "planned" as const } : m)) });
        expect(gate(p).code).toBe(0);
        const again = gate(p, "--approve");
        expect(again.captured.err).toEqual([]);
        expect(committedPlan(p).unplanned).toEqual([{ epic: 150, title: "Also not planned" }]);
    });

    it("refuses a draft missing a story the roadmap holds, so the list is never a false complement", () => {
        const p: Planned = planned(DRAFT, MIXED);
        expect(gate(p).code).toBe(0);
        // A member planned after the draft was written: its story is on the roadmap and in no slice.
        writeRoadmap(p.repo, {
            ...MIXED,
            members: MIXED.members.map((m) => (m.number === 150 ? { number: 150, title: m.title, kind: "planned" as const } : m)),
            stories: [...MIXED.stories, { number: 31, title: "Late", body: "Planned after the draft.", epic: 150, blockedBy: [], external: [] }],
        });
        const refused = gate(p, "--approve", "--commands", p.commands);
        expect(refused.code).toBe(1);
        expect(refused.captured.err.join("\n")).toContain("#31");
        expect(readWorkbookPlan(p.repo, "alpha")).toBeNull();
    });

    it("refuses a committed entry carrying anything beyond its number and title", () => {
        const p: Planned = planned(DRAFT, MIXED);
        approve(p);
        const file: string = path.join(workbookRoot(p.repo, "alpha"), PLAN_FILENAME);
        const text: string = fs.readFileSync(file, "utf8").replace("title: Not planned yet", "title: Not planned yet\n      lesson: story-250.md");
        expect(() => parsePlan(text)).toThrow(/number and title and nothing else/);
    });
});
