// @vitest-environment jsdom
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type RunResult, type Runner, defaultRunner } from "@nexus/workspace/run";
import { PROBE_SCRATCH_PATH } from "./fence-probe";
import { type AuthoredProse } from "./lesson-writer";
import { type LiveStory } from "./teaching-plan";
import { runTeachingSession, type SessionResult } from "./teaching-session";
import { runWorkbookCli, type WorkbookCliIo } from "./workbook-cli";
import { PLAN_FILENAME, type UnplannedMember } from "./workbook-plan";
import { createWorkbook, workbookRoot } from "./workbook-store";

let tmpDirs: string[] = [];
function makeDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "planning-boundary-"));
    tmpDirs.push(dir);
    return dir;
}
afterEach(() => {
    for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
    tmpDirs = [];
});

const SUITE: string[] = ["fake-suite", "--all"];
const GRADING: string[] = ["fake-grade"];
const STORY: number = 810;
const PINNING_TEST: string = "tests/boundary.spec.ts";

/** The roadmap was still growing when this plan was approved: two of its epics were never planned. */
const BOUNDARY: UnplannedMember[] = [
    { epic: 250, title: "Teach the drill from the hint log" },
    { epic: 150, title: "Render the dependency graph" },
];

/** A one-slice plan, with whatever the roadmap had not planned recorded past the boundary. */
function planText(unplanned: readonly UnplannedMember[]): string {
    return (
        [
            "repo: acme/widgets",
            "epic: 67",
            `suite: ${JSON.stringify(SUITE)}`,
            `grading: ${JSON.stringify(GRADING)}`,
            "slices:",
            `  - story: ${STORY}`,
            "    lesson: 01-boundary.md",
            "    builds: learner",
            `    branch: rdl/story-${STORY}`,
            "    concepts: [the planning boundary]",
            "    pinning_test:",
            `      file: ${PINNING_TEST}`,
            "      text: |",
            `        it("pins #${STORY}", () => {});`,
            "    pinned:",
            `      title: Story ${STORY} teaches something`,
            `      body: As a learner, I want slice ${STORY}.`,
            ...(unplanned.length === 0
                ? []
                : ["unplanned:", ...unplanned.flatMap((member) => [`  - epic: ${member.epic}`, `    title: ${member.title}`])]),
        ].join("\n") + "\n"
    );
}

function makeRepo(unplanned: readonly UnplannedMember[] = BOUNDARY): string {
    const dir = makeDir();
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    fs.writeFileSync(path.join(dir, ".gitignore"), "");
    createWorkbook(dir, "rdl");
    fs.writeFileSync(path.join(workbookRoot(dir, "rdl"), PLAN_FILENAME), planText(unplanned));
    return dir;
}

/** The suite passes; the probe answers about the one file it was handed; everything else runs for real. */
function runner(): Runner {
    return (cmd, args, opts): RunResult => {
        if (cmd === SUITE[0]) return { status: 0, stdout: "", stderr: "" };
        if (cmd === GRADING[0]) {
            const named: string = args[args.length - 1];
            return { status: named.startsWith(`${PROBE_SCRATCH_PATH}/`) && fs.existsSync(path.join(opts.cwd, named)) ? 0 : 1, stdout: "", stderr: "" };
        }
        return defaultRunner(cmd, args, opts);
    };
}

const LIVE: Record<number, LiveStory> = {
    [STORY]: { title: `Story ${STORY} teaches something`, body: `As a learner, I want slice ${STORY}.`, closed: false },
};

function teach(repo: string, prose?: AuthoredProse): SessionResult {
    return runTeachingSession({
        repoRoot: repo,
        slug: "rdl",
        read: (story) => LIVE[story] ?? null,
        prose,
        run: runner(),
        now: () => "2026-09-20T12:00:00.000Z",
    });
}

/** Teach the one slice, then write the pinning test the lesson asked for, which finishes its exercise. */
function teachAndFinish(repo: string): void {
    expect(teach(repo).outcome.kind).toBe("brief");
    expect(teach(repo, { theory: "The boundary is where planning stopped.", drill: { question: "What is it?", answer: "Where planning stopped." } }).outcome.kind).toBe(
        "written",
    );
    fs.mkdirSync(path.join(repo, path.dirname(PINNING_TEST)), { recursive: true });
    fs.writeFileSync(path.join(repo, PINNING_TEST), "it('pins', () => {});\n");
}

describe("a session that runs out of taught slices while the plan records epics past the boundary (story #92)", () => {
    it("names the first recorded epic to plan next rather than reporting the workbook finished", () => {
        const repo = makeRepo();
        teachAndFinish(repo);

        const result = teach(repo);

        expect(result.outcome.kind).toBe("plan-next");
        if (result.outcome.kind !== "plan-next") throw new Error("expected the boundary verdict");
        expect(result.outcome.epic).toBe(250);
        expect(result.outcome.title).toBe("Teach the drill from the hint log");
        expect(result.outcome.report).toContain("#250");
        expect(result.outcome.report).toContain("Teach the drill from the hint log");
        expect(result.outcome.report).not.toContain("Every slice of rdl has been taught and finished.");
    });

    it("says how many epics sit past the boundary and that the named one is the one to plan next", () => {
        const repo = makeRepo();
        teachAndFinish(repo);

        const result = teach(repo);

        if (result.outcome.kind !== "plan-next") throw new Error("expected the boundary verdict");
        expect(result.outcome.remaining).toBe(2);
        expect(result.outcome.report).toMatch(/2 epics past the planning boundary/);
        expect(result.outcome.report).toMatch(/to plan next is #250/);
    });

    it("names the epic the plan records first, in the roadmap's order rather than issue order", () => {
        const repo = makeRepo([BOUNDARY[1], BOUNDARY[0]]);
        teachAndFinish(repo);

        const result = teach(repo);

        if (result.outcome.kind !== "plan-next") throw new Error("expected the boundary verdict");
        expect(result.outcome.epic).toBe(150);
    });

    it("reaches the same verdict and names the same epic on a second run over an unchanged repository", () => {
        const repo = makeRepo();
        teachAndFinish(repo);

        const first = teach(repo);
        const second = teach(repo);

        expect(second.outcome).toEqual(first.outcome);
    });

    it("writes no lesson and no page on the boundary run", () => {
        const repo = makeRepo();
        teachAndFinish(repo);
        const before: string[] = fs.readdirSync(workbookRoot(repo, "rdl"), { recursive: true }).map((entry) => String(entry)).sort();

        expect(teach(repo).outcome.kind).toBe("plan-next");

        expect(fs.readdirSync(workbookRoot(repo, "rdl"), { recursive: true }).map((entry) => String(entry)).sort()).toEqual(before);
    });
});

describe("a workbook whose plan records nothing past the boundary (story #92)", () => {
    it("reports the workbook finished, word for word as it did before the boundary verdict existed", () => {
        const repo = makeRepo([]);
        teachAndFinish(repo);

        const result = teach(repo);

        expect(result.outcome.kind).toBe("done");
        expect(result.outcome.report).toBe("Every slice of rdl has been taught and finished.");
    });
});

describe("the command line treats the boundary verdict as a normal end (story #92)", () => {
    it("reports it on standard output and exits zero, as it does for a session that asks the learner to act", () => {
        const repo = makeRepo();
        teachAndFinish(repo);
        const out: string[] = [];
        const err: string[] = [];
        const captured: WorkbookCliIo = { cwd: repo, stdout: (line) => out.push(line), stderr: (line) => err.push(line) };

        const code: number = runWorkbookCli(["teach", "rdl", "--root", repo], captured, runner());

        expect(code).toBe(0);
        expect(err).toEqual([]);
        expect(out.join("\n")).toContain("#250");
    });
});
