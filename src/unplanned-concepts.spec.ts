// @vitest-environment jsdom
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { applyMerge, checkEpicExtraction, proposedVocabulary, recordEpicExtraction, recordExtraction, type CheckedList, type EpicList } from "./concept-extraction.js";
import { approve, committedText, gate, io, liveFromRoadmap, planned, type Captured, type Planned } from "./plan-commit-fixtures.js";
import { planDraftPath, readPlanDraft, writePlanDraft, type PlanDraft, type PlanStub } from "./plan-draft.js";
import { rewritePlan, type RewriteOptions } from "./plan-rewrite.js";
import { writeRoadmap, type Roadmap, type RoadmapMember } from "./roadmap.js";
import { runWorkbookCli } from "./workbook-cli.js";

/**
 * Epic #88: a concept an unplanned epic will introduce is left to that epic rather than scaffolded
 * (decision record #105). The chain is driven for real — extraction lists, the merge, the draft, the
 * rewrite, the gate and approval — over a roadmap still growing.
 */

/** One planned epic and two nobody has planned yet. Member order puts #400 before #300. */
const WAITING: Roadmap = {
    name: "alpha",
    members: [
        { number: 100, title: "Alpha", kind: "planned" },
        { number: 400, title: "Draw the graph", kind: "unplanned", body: "Draw the dependency graph and keep a hint log beside it." },
        { number: 300, title: "Log the hints", kind: "unplanned", body: "Record each hint the learner takes against the concept it was taken on." },
    ],
    stories: [
        { number: 11, title: "Pin the plan", body: "Record the state a story had at approval.", epic: 100, blockedBy: [], external: [] },
        { number: 12, title: "Report drift", body: "Compare the pinned state with the live one.", epic: 100, blockedBy: [11], external: [] },
    ],
};

type Pair = [string, string];

function storyList(story: number, introduces: Pair[], assumes: Pair[] = []): string {
    const entries = (pairs: Pair[]) => pairs.map(([id, gloss]) => ({ id, gloss }));
    return JSON.stringify({ story, introduces: entries(introduces), assumes: entries(assumes) });
}

function epicList(epic: number, introduces: Pair[]): string {
    return introduces.length === 0 ? JSON.stringify({ epic, nothing: true }) : JSON.stringify({ epic, introduces: introduces.map(([id, gloss]) => ({ id, gloss })) });
}

const HINTS: Pair = ["hint-record", "the record of which concepts a learner took hints on"];

/**
 * A workbook whose roadmap is WAITING, extracted and merged, drafted and rewritten through the CLI.
 * #11 assumes `hint-log`, which no planned story introduces, and `issue-graph`, which nothing does.
 * `epics` says what each unplanned epic's list introduces.
 */
function chain(epics: Record<number, Pair[]>, merge: string[][] | null = null): Planned {
    const p: Planned = planned(undefined, WAITING);
    p.fake.live = liveFromRoadmap(WAITING);
    const story11 = storyList(11, [["pinned-state", "the state a plan records at approval"]], [
        ["hint-log", "the log of hints a learner took"],
        ["issue-graph", "issues and the edges between them"],
    ]);
    expect(recordExtraction(p.repo, WAITING, 11, story11).ok).toBe(true);
    expect(recordExtraction(p.repo, WAITING, 12, storyList(12, [["drift", "a story moving after it was pinned"]], [["pinned-state", "the recorded state"]])).ok).toBe(true);
    for (const member of [400, 300]) expect(recordEpicExtraction(p.repo, WAITING, member, epicList(member, epics[member] ?? [])).ok).toBe(true);

    const vocabulary: Captured = io(p.repo);
    expect(runWorkbookCli(["vocabulary", "alpha", "--root", p.repo], vocabulary, p.run)).toBe(0);
    const ids: string[] = (JSON.parse(vocabulary.out.join("\n")) as { identifiers: { id: string }[] }).identifiers.map((entry) => entry.id);
    const groups: string[][] = merge ?? ids.map((id) => [id]);
    const mergeFile: string = path.join(p.repo, "merge.json");
    fs.writeFileSync(mergeFile, JSON.stringify({ concepts: groups }));
    const drafted: Captured = io(p.repo);
    expect(runWorkbookCli(["draft", "alpha", "--root", p.repo, "--merge", mergeFile], drafted, p.run)).toBe(0);
    const rewritten: Captured = io(p.repo);
    expect(runWorkbookCli(["rewrite", "alpha", "--root", p.repo], rewritten, p.run)).toBe(0);
    return p;
}

function draftOf(p: Planned): PlanDraft {
    return readPlanDraft(p.repo, "alpha") as PlanDraft;
}

function printed(p: Planned): string {
    const shown = gate(p);
    expect(shown.captured.err).toEqual([]);
    expect(shown.code).toBe(0);
    return shown.captured.out.join("\n");
}

describe("an unplanned epic is read once, from its own title and body", () => {
    const member: RoadmapMember = WAITING.members[2];

    it("keeps only what the epic introduces, and drops what it assumes", () => {
        const result = checkEpicExtraction(
            { epic: 300, introduces: [{ id: "Hint Log", gloss: "the hints taken" }], assumes: [{ id: "drill", gloss: "a cold question" }] },
            member,
        );
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.list.introduces).toEqual([{ id: "hint-log", gloss: "the hints taken" }]);
        expect(result.list).not.toHaveProperty("assumes");
    });

    it("accepts an explicit 'introduces nothing', and refuses a bare empty return", () => {
        expect(checkEpicExtraction({ epic: 300, nothing: true }, member).ok).toBe(true);
        const bare = checkEpicExtraction({ epic: 300 }, member);
        expect(bare.ok).toBe(false);
        if (!bare.ok) expect(bare.problem).toContain("nothing: true");
    });

    it("asks for no verdict, so a list carrying one is refused", () => {
        const result = checkEpicExtraction({ epic: 300, introduces: [{ id: "hint-log", gloss: "g" }], serves: true, reason: "because" }, member);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.problem).toContain("No verdict");
    });

    it("refuses a list naming another epic, or a story", () => {
        expect(checkEpicExtraction({ epic: 400, nothing: true }, member).ok).toBe(false);
        expect(checkEpicExtraction({ story: 300, nothing: true }, member).ok).toBe(false);
    });

    it("lists the unplanned epics still to read beside the stories, and prints one epic's text with no focus", () => {
        const p: Planned = planned(undefined, WAITING);
        const listed: Captured = io(p.repo);
        expect(runWorkbookCli(["extract", "alpha", "--root", p.repo], listed, p.run)).toBe(0);
        const shown = JSON.parse(listed.out.join("\n")) as Record<string, unknown>;
        expect(shown["extract"]).toEqual([11, 12]);
        expect(shown["extractEpics"]).toEqual([400, 300]);
        expect(listed.out.join("\n")).not.toContain("hint log");

        const one: Captured = io(p.repo);
        expect(runWorkbookCli(["extract", "alpha", "--root", p.repo, "--epic", "300"], one, p.run)).toBe(0);
        expect(JSON.parse(one.out.join("\n"))).toEqual({ epic: 300, title: "Log the hints", body: member.body });
    });

    it("checks an epic's list through the CLI and hands back only what passed", () => {
        const p: Planned = planned(undefined, WAITING);
        const file: string = path.join(p.repo, "epic-300.yml");
        fs.writeFileSync(file, "epic: 300\nintroduces:\n    - id: hint-log\n      gloss: the hints taken\n");
        const checked: Captured = io(p.repo);
        expect(runWorkbookCli(["extract", "alpha", "--root", p.repo, "--epic", "300", "--list", file], checked, p.run)).toBe(0);
        expect(JSON.parse(checked.out.join("\n"))).toEqual({ epic: 300, introduces: [{ id: "hint-log", gloss: "the hints taken" }] });

        const listed: Captured = io(p.repo);
        runWorkbookCli(["extract", "alpha", "--root", p.repo], listed, p.run);
        expect((JSON.parse(listed.out.join("\n")) as { extractEpics: number[] }).extractEpics).toEqual([400]);
    });

    it("never reads a planned member or a story as an unplanned epic", () => {
        const p: Planned = planned(undefined, WAITING);
        expect(runWorkbookCli(["extract", "alpha", "--root", p.repo, "--epic", "100"], io(p.repo), p.run)).toBe(1);
        expect(runWorkbookCli(["extract", "alpha", "--root", p.repo, "--epic", "11"], io(p.repo), p.run)).toBe(1);
    });

    it("adds nothing to the listing of a roadmap whose members are all planned", () => {
        const p: Planned = planned();
        const listed: Captured = io(p.repo);
        expect(runWorkbookCli(["extract", "alpha", "--root", p.repo], listed, p.run)).toBe(0);
        expect(Object.keys(JSON.parse(listed.out.join("\n")) as object)).toEqual(["roadmap", "extract", "checked"]);
    });

    it("reads an edited epic again, and the draft stops until it has been", () => {
        const p: Planned = planned(undefined, WAITING);
        recordExtraction(p.repo, WAITING, 11, storyList(11, [["pinned-state", "g"]]));
        recordExtraction(p.repo, WAITING, 12, storyList(12, [["drift", "g"]]));
        for (const epic of [400, 300]) recordEpicExtraction(p.repo, WAITING, epic, epicList(epic, []));
        const edited: Roadmap = { ...WAITING, members: WAITING.members.map((m) => (m.number === 300 ? { ...m, body: "Now it is about something else." } : m)) };
        writeRoadmap(p.repo, edited);
        const mergeFile: string = path.join(p.repo, "merge.json");
        fs.writeFileSync(mergeFile, JSON.stringify({ concepts: [["drift"], ["pinned-state"]] }));
        const drafted: Captured = io(p.repo);
        expect(runWorkbookCli(["draft", "alpha", "--root", p.repo, "--merge", mergeFile], drafted, p.run)).toBe(1);
        expect(drafted.err.join("\n")).toContain("unplanned epic #300");
        expect(drafted.err.join("\n")).not.toContain("#400");
    });
});

describe("an epic's names join the vocabulary only as aliases of planned names", () => {
    const lists: CheckedList[] = [{ story: 11, text: "t", introduces: [{ id: "pinned-state", gloss: "p" }], assumes: [{ id: "hint-log", gloss: "h" }] }];
    const epics: EpicList[] = [{ epic: 300, text: "t", introduces: [{ id: "hint-record", gloss: "e" }, { id: "graph-layout", gloss: "g" }] }];

    it("says which epic proposed a name, and leaves a fully planned vocabulary as it was", () => {
        const proposed = proposedVocabulary(lists, epics);
        expect(proposed.find((p) => p.id === "hint-record")).toEqual({ id: "hint-record", glosses: ["e"], stories: [], epics: [300] });
        expect(proposedVocabulary(lists)).toEqual(proposedVocabulary(lists, []));
        for (const entry of proposedVocabulary(lists)) expect(entry).not.toHaveProperty("epics");
    });

    it("keeps the planned name even when the merge lists the epic's name first", () => {
        const merged = applyMerge(proposedVocabulary(lists, epics), [["hint-record", "hint-log"], ["pinned-state"], ["graph-layout"]]);
        expect(merged.ok).toBe(true);
        if (!merged.ok) return;
        expect(merged.vocabulary).toEqual([
            { id: "hint-log", gloss: "h", aliases: ["hint-record"] },
            { id: "pinned-state", gloss: "p", aliases: [] },
        ]);
        expect(merged.mapping.get("hint-record")).toBe("hint-log");
    });

    it("drops a group of epic names alone from the draft's vocabulary, but still requires it to be grouped", () => {
        const merged = applyMerge(proposedVocabulary(lists, epics), [["hint-log", "hint-record"], ["pinned-state"], ["graph-layout"]]);
        expect(merged.ok && merged.vocabulary.map((entry) => entry.id)).toEqual(["hint-log", "pinned-state"]);
        const missing = applyMerge(proposedVocabulary(lists, epics), [["hint-log", "hint-record"], ["pinned-state"]]);
        expect(missing.ok).toBe(false);
    });
});

describe("the rewrite leaves a concept an unplanned epic will introduce to that epic (story #104)", () => {
    const edges: RewriteOptions["edges"] = [
        { story: 11, blockedBy: [] },
        { story: 12, blockedBy: [11] },
        { story: 21, blockedBy: [] },
    ];
    const learner = (story: number, concepts: string[], assumes: string[] = []): PlanStub => ({ story, builds: "learner", concepts, assumes });
    const scaffolds = (draft: PlanDraft): string[] => draft.slices.flatMap((stub) => (stub.scaffold === undefined ? [] : [stub.scaffold]));

    it("inserts no scaffold for it, and records it as waiting rather than as a gap", () => {
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log"]), learner(12, ["drift"], ["pinned-state"])] };
        const out: PlanDraft = rewritePlan(draft, { edges, unplanned: [{ epic: 300, concepts: ["hint-log"] }] });
        expect(scaffolds(out)).toEqual([]);
        expect(out.coverage).toEqual({ clean: true, gaps: [], waiting: [{ concept: "hint-log", story: 11, epic: 300 }] });
    });

    it("scaffolds a concept no member introduces, planned or unplanned, as it does today", () => {
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log", "issue-graph"])] };
        const out: PlanDraft = rewritePlan(draft, { edges, unplanned: [{ epic: 300, concepts: ["hint-log"] }] });
        expect(scaffolds(out)).toEqual(["issue-graph"]);
        expect(out.coverage?.waiting).toEqual([{ concept: "hint-log", story: 11, epic: 300 }]);
    });

    it("keeps a concept a handed-off story introduces a gap naming that story, whatever an unplanned epic says", () => {
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log"]), { story: 21, builds: "handoff", concepts: [], assumes: [] }] };
        const out: PlanDraft = rewritePlan(draft, { edges, handoffConcepts: new Map([[21, ["hint-log"]]]), unplanned: [{ epic: 300, concepts: ["hint-log"] }] });
        expect(out.coverage).toEqual({ clean: false, gaps: [{ concept: "hint-log", story: 11, handedOff: 21 }] });
    });

    it("still scaffolds a concept a planned learner story introduces too late", () => {
        // #12 introduces hint-log, and #12 is blocked by #11, which assumes it: only a scaffold is in time.
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log"]), learner(12, ["hint-log"], ["pinned-state"])] };
        const withEpic: PlanDraft = rewritePlan(draft, { edges, unplanned: [{ epic: 300, concepts: ["hint-log"] }] });
        expect(scaffolds(withEpic)).toEqual(["hint-log"]);
        expect(withEpic.coverage).toEqual({ clean: true, gaps: [] });
        expect(withEpic).toEqual(rewritePlan(draft, { edges }));
    });

    it("names the first unplanned epic in member order when several introduce the concept", () => {
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log"])] };
        const out: PlanDraft = rewritePlan(draft, {
            edges,
            unplanned: [
                { epic: 400, concepts: ["hint-log"] },
                { epic: 300, concepts: ["hint-log"] },
            ],
        });
        expect(out.coverage?.waiting).toEqual([{ concept: "hint-log", story: 11, epic: 400 }]);
    });

    it("leaves a draft with no unplanned member exactly as the rewrite produced it before", () => {
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log"]), learner(12, ["drift"], ["pinned-state"])] };
        const before: PlanDraft = rewritePlan(draft, { edges });
        expect(rewritePlan(draft, { edges, unplanned: [] })).toEqual(before);
        expect(before.coverage).toEqual({ clean: true, gaps: [] });
        expect(rewritePlan(before, { edges })).toEqual(before);
    });

    it("produces the same slices, order and waiting list when run twice with nothing changed", () => {
        const draft: PlanDraft = { slices: [learner(11, ["pinned-state"], ["hint-log", "issue-graph"]), learner(12, ["drift"], ["pinned-state", "hint-log"])] };
        const options: RewriteOptions = { edges, unplanned: [{ epic: 300, concepts: ["hint-log"] }] };
        const once: PlanDraft = rewritePlan(draft, options);
        expect(rewritePlan(once, options)).toEqual(once);
        expect(once.coverage?.waiting).toEqual([
            { concept: "hint-log", story: 11, epic: 300 },
            { concept: "hint-log", story: 12, epic: 300 },
        ]);
    });
});

describe("the gate shows each waiting concept under the epic it waits on (story #104)", () => {
    it("prints the concept under its epic with the slice that assumes it, and approves the plan", () => {
        // The merge lists the epic's name first; the planned name is the one kept.
        const p: Planned = chain({ 400: [], 300: [HINTS] }, [["hint-record", "hint-log"], ["drift"], ["issue-graph"], ["pinned-state"]]);
        const draft: PlanDraft = draftOf(p);
        expect(draft.slices.flatMap((stub) => (stub.scaffold === undefined ? [] : [stub.scaffold]))).toEqual(["issue-graph"]);
        expect(draft.coverage?.waiting).toEqual([{ concept: "hint-log", story: 11, epic: 300 }]);
        expect(draft.vocabulary?.find((entry) => entry.id === "hint-log")?.aliases).toEqual(["hint-record"]);

        const print: string = printed(p);
        expect(print).toContain(
            [
                "Past the planning boundary — epics nobody has planned yet, in roadmap order:",
                '  #400 — "Draw the graph"',
                '  #300 — "Log the hints"',
                "      waits on it: hint-log — assumed by #11, which is taught before it",
            ].join("\n"),
        );
        expect(print).toContain("A concept listed under an epic is one that epic will introduce.");

        const approved = approve(p);
        expect(approved.captured.err).toEqual([]);
        expect(approved.code).toBe(0);
        // The committed plan's boundary entries hold a number and a title, and no waiting concept.
        expect(committedText(p.repo)).not.toContain("hint-log");
        expect(committedText(p.repo)).not.toContain("waits on it");
    });

    it("over-claim: a thin epic that claims a concept defers it, and the gate names it for the reviewer to catch", () => {
        const p: Planned = chain({ 400: [["hint-log", "a log of hints"]], 300: [["hint-log", "a log of hints"]] });
        const print: string = printed(p);
        expect(print).toContain('  #400 — "Draw the graph"\n      waits on it: hint-log — assumed by #11, which is taught before it\n  #300 — "Log the hints"\n');
        expect(print).not.toContain("scaffold hint-log");
    });

    it("under-claim: an epic that claims nothing leaves the concept scaffolded, as it is today", () => {
        const p: Planned = chain({});
        const print: string = printed(p);
        expect(print).toContain("scaffold hint-log — learner — a teaching step, forced by what #11 assumes");
        expect(print).not.toContain("waits on it");
        expect(print).not.toContain("A concept listed under an epic");
        expect(draftOf(p).coverage).toEqual({ clean: true, gaps: [] });
    });

    it("refuses a recorded waiting list a fresh check contradicts, at the gate and at approval", () => {
        const p: Planned = chain({ 300: [HINTS] }, [["hint-log", "hint-record"], ["drift"], ["issue-graph"], ["pinned-state"]]);
        const tampered: PlanDraft = { ...draftOf(p), coverage: { clean: true, gaps: [] } };
        writePlanDraft(p.repo, "alpha", tampered);
        const shown = gate(p);
        expect(shown.code).toBe(1);
        expect(shown.captured.err.join("\n")).toContain("waiting on an unplanned epic");
        expect(shown.captured.err.join("\n")).toContain("#11 assumes hint-log, which the unplanned epic #300 will introduce.");
    });

    it("refuses a waiting list that no longer holds once the epic was read again", () => {
        const p: Planned = chain({ 300: [HINTS] }, [["hint-log", "hint-record"], ["drift"], ["issue-graph"], ["pinned-state"]]);
        expect(recordEpicExtraction(p.repo, WAITING, 300, epicList(300, [])).ok).toBe(true);
        const shown = gate(p);
        expect(shown.code).toBe(1);
        expect(shown.captured.err.join("\n")).toContain("A fresh check finds no concept waiting on an unplanned epic.");
    });

    it("stops the rewrite when an unplanned epic has no readable list", () => {
        const p: Planned = chain({ 300: [HINTS] });
        fs.rmSync(path.join(path.dirname(planDraftPath(p.repo, "alpha")), "extractions", "epic-400.json"));
        const rewritten: Captured = io(p.repo);
        expect(runWorkbookCli(["rewrite", "alpha", "--root", p.repo], rewritten, p.run)).toBe(1);
        expect(rewritten.err.join("\n")).toContain("unplanned epic #400");
    });

    it("drops an unwritten scaffold for a concept now waiting on the first re-approval", () => {
        const p: Planned = chain({});
        expect(draftOf(p).slices.some((stub) => stub.scaffold === "hint-log")).toBe(true);
        expect(recordEpicExtraction(p.repo, WAITING, 300, epicList(300, [["hint-log", "a log of hints"]])).ok).toBe(true);
        const rewritten: Captured = io(p.repo);
        expect(runWorkbookCli(["rewrite", "alpha", "--root", p.repo], rewritten, p.run)).toBe(0);
        expect(draftOf(p).slices.some((stub) => stub.scaffold === "hint-log")).toBe(false);
        expect(draftOf(p).coverage?.waiting).toEqual([{ concept: "hint-log", story: 11, epic: 300 }]);
    });
});
