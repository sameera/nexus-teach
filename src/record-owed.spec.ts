// @vitest-environment jsdom
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type RunResult, type Runner, defaultRunner } from "@nexus/workspace/run";
import { PROBE_SCRATCH_PATH } from "./fence-probe";
import { type AuthoredProse } from "./lesson-writer";
import { learnerRecordDir, listLearnerRecords, readLearnerRecord, writeLearnerRecord } from "./learner-store";
import { epicHome, planningBriefName, type EpicHome } from "./planning-boundary";
import { recordBriefName, renderRecordBrief, type RecordLookup, type RecordReader } from "./record-owed";
import { type DecisionRecordState } from "./source-pinning";
import { type LiveStory } from "./teaching-plan";
import { runTeachingSession, type SessionResult } from "./teaching-session";
import { lookupRecord, runWorkbookCli, type WorkbookCliIo } from "./workbook-cli";
import { PLAN_FILENAME } from "./workbook-plan";
import { createWorkbook, lessonsDir, workbookRoot } from "./workbook-store";

let tmpDirs: string[] = [];
function makeDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "record-owed-"));
    tmpDirs.push(dir);
    return dir;
}
afterEach(() => {
    for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
    tmpDirs = [];
});

const SUITE: string[] = ["fake-suite", "--all"];
const GRADING: string[] = ["fake-grade"];
const EPIC: number = 68;
const STORY: number = 97;

/** The record the learner is about to write, as the pinning step would read it back. */
const RECORD_BODY: string = ["# Decision Record", "", "## The stop turns on the record", "", "Because a record is where the reasons are.", ""].join("\n");

interface SliceSpec {
    story?: number;
    scaffold?: string;
    builds: "learner" | "handoff";
    /** Whether the slice already carries pinned sources. */
    pinned?: boolean;
    /** Whether those pinned sources also name the alternative the record's decision refuted. */
    refuted?: boolean;
}

const LEARNER_SLICE: SliceSpec = { story: STORY, builds: "learner" };

function planText(slices: readonly SliceSpec[]): string {
    const lines: string[] = ["repo: acme/widgets", `suite: ${JSON.stringify(SUITE)}`, `grading: ${JSON.stringify(GRADING)}`, "slices:"];
    for (const slice of slices) {
        if (slice.scaffold !== undefined) {
            lines.push(`  - scaffold: ${slice.scaffold}`, "    builds: learner", `    lesson: 00-${slice.scaffold}.md`, `    concepts: [${slice.scaffold}]`);
            continue;
        }
        lines.push(
            `  - story: ${slice.story}`,
            `    epic: ${EPIC}`,
            `    builds: ${slice.builds}`,
            ...(slice.builds === "learner" ? [`    lesson: 0${slice.story}-slice.md`] : []),
            `    branch: rdl/story-${slice.story}`,
            "    concepts: [the record gate]",
            "    pinning_test:",
            `      file: tests/story-${slice.story}.spec.ts`,
            "      text: |",
            `        it("pins #${slice.story}", () => {});`,
            "    pinned:",
            `      title: Story ${slice.story} teaches something`,
            `      body: As a learner, I want slice ${slice.story}.`,
            ...(slice.pinned === true
                ? [
                      "    sources:",
                      "      section: The stop turns on the record",
                      "      exemplar: src/record-owed.ts",
                      ...(slice.refuted === true
                          ? [
                                "      refuted:",
                                "        decision: The stop turns on the record",
                                "        alternative: Stop on absent sources alone",
                                "        lost_on: the installed base",
                            ]
                          : []),
                  ]
                : []),
        );
    }
    return lines.join("\n") + "\n";
}

function makeRepo(slices: readonly SliceSpec[] = [LEARNER_SLICE]): string {
    const dir = makeDir();
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    fs.writeFileSync(path.join(dir, ".gitignore"), "");
    fs.mkdirSync(path.join(dir, "src"), { recursive: true });
    fs.writeFileSync(path.join(dir, "src", "record-owed.ts"), "// the exemplar a pinned slice names\n");
    createWorkbook(dir, "rdl");
    fs.writeFileSync(path.join(workbookRoot(dir, "rdl"), PLAN_FILENAME), planText(slices));
    return dir;
}

function runner(suite: boolean = true): Runner {
    return (cmd, args, opts): RunResult => {
        if (cmd === SUITE[0]) return { status: suite ? 0 : 1, stdout: "one test failed", stderr: "" };
        if (cmd === GRADING[0]) {
            const named: string = args[args.length - 1];
            return { status: named.startsWith(`${PROBE_SCRATCH_PATH}/`) && fs.existsSync(path.join(opts.cwd, named)) ? 0 : 1, stdout: "", stderr: "" };
        }
        return defaultRunner(cmd, args, opts);
    };
}

const LIVE: Record<number, LiveStory> = Object.fromEntries(
    [STORY, 98, 99].map((story) => [story, { title: `Story ${story} teaches something`, body: `As a learner, I want slice ${story}.`, closed: false }]),
);

/** A record reader answering for the one epic: no record, an unapproved one, or an approved one. */
function reads(state: DecisionRecordState | null): RecordReader {
    return (): RecordLookup => ({ kind: "read", record: state });
}

const NO_RECORD: RecordReader = reads(null);
const UNAPPROVED: RecordReader = reads({ number: 100, approved: false, body: RECORD_BODY });
const APPROVED: RecordReader = reads({ number: 100, approved: true, body: RECORD_BODY });

interface TeachOptions {
    readRecord?: RecordReader;
    prose?: AuthoredProse;
    suite?: boolean;
    run?: Runner;
}

function teach(repo: string, options: TeachOptions = {}): SessionResult {
    return runTeachingSession({
        repoRoot: repo,
        slug: "rdl",
        read: (story) => LIVE[story] ?? null,
        readRecord: options.readRecord ?? NO_RECORD,
        prose: options.prose,
        run: options.run ?? runner(options.suite ?? true),
        now: () => "2026-09-21T12:00:00.000Z",
    });
}

/** Every file under the committed workbook, the learner folder excepted, with its bytes. */
function committedBytes(repo: string): Record<string, string> {
    const root: string = workbookRoot(repo, "rdl");
    const files: Record<string, string> = {};
    const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === ".learner") continue;
            const full: string = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else files[path.relative(root, full)] = fs.readFileSync(full, "utf8");
        }
    };
    walk(root);
    return files;
}

describe("a slice whose sources have not pinned and whose epic owes a record is not taught (story #97)", () => {
    it("ends with the verdict that a record is owed, and writes no lesson and no page", () => {
        const repo = makeRepo();
        const before: Record<string, string> = committedBytes(repo);

        const result = teach(repo);

        expect(result.outcome.kind).toBe("record-owed");
        if (result.outcome.kind !== "record-owed") throw new Error("expected the record verdict");
        expect(result.outcome.epic).toBe(EPIC);
        expect(result.outcome.record).toBeNull();
        expect(fs.readdirSync(lessonsDir(repo, "rdl"))).toEqual([]);
        expect(committedBytes(repo)).toEqual(before);
    });

    it("names the slice, the story it builds, the epic that story belongs to and the record it owes", () => {
        const repo = makeRepo();

        const result = teach(repo);

        if (result.outcome.kind !== "record-owed") throw new Error("expected the record verdict");
        expect(result.outcome.slice).toBe(`story-${STORY}`);
        expect(result.outcome.story).toBe(STORY);
        expect(result.outcome.report).toContain(`#${STORY}`);
        expect(result.outcome.report).toContain(`epic #${EPIC}`);
        expect(result.outcome.report).toContain("decision record");
    });

    it("says what this checkout finds rather than asserting the record exists nowhere", () => {
        // The record's number is read from a derived artifact that may predate the record itself, so a
        // learner who has just filed one must not read a flat denial of what they just did.
        const repo = makeRepo();

        const result = teach(repo);

        expect(result.outcome.report).toContain("this checkout finds no decision record");
    });

    it("names the record's own number and says approval is what is missing, when one exists unapproved", () => {
        const repo = makeRepo();

        const result = teach(repo, { readRecord: UNAPPROVED });

        if (result.outcome.kind !== "record-owed") throw new Error("expected the record verdict");
        expect(result.outcome.record).toBe(100);
        expect(result.outcome.report).toContain("#100");
        expect(result.outcome.report).toContain("approval is what is missing");
    });

    it("reaches the same verdict on a second run over an unchanged repository", () => {
        const repo = makeRepo();

        const first = teach(repo);
        const second = teach(repo);

        expect(second.outcome).toEqual(first.outcome);
    });

    it("fires exactly where the step that pins sources would report it is still waiting", () => {
        const repo = makeRepo();
        const out: string[] = [];
        const captured: WorkbookCliIo = { cwd: repo, stdout: (line) => out.push(line), stderr: (line) => out.push(line) };
        // The pinning verb reads the record through the checkout; here it is handed the same two
        // answers the session is, so the two steps are compared on one epic rather than on two.
        for (const record of [null, { number: 100, approved: false, body: RECORD_BODY }]) {
            const session = teach(repo, { readRecord: reads(record) });
            expect(session.outcome.kind).toBe("record-owed");
        }

        expect(out).toEqual([]);
        // And the other way: an approved record is not a stop, exactly as the pinning step is not waiting for it.
        expect(teach(repo, { readRecord: APPROVED }).outcome.kind).toBe("brief");
        expect(runWorkbookCli(["render", "rdl", "--root", repo], captured, runner())).toBe(0);
    });
});

describe("what the record gate never stops (story #97)", () => {
    it("teaches a slice with no sources whose epic does have an approved record, and says they were never pinned", () => {
        const repo = makeRepo();

        const result = teach(repo, { readRecord: APPROVED });

        expect(result.outcome.kind).toBe("brief");
        expect(result.notes.join(" ")).toContain(`epic #${EPIC} has an approved decision record (#100)`);
        expect(result.notes.join(" ")).toContain("nobody has pinned");
    });

    it("teaches a slice that carries pinned sources with no new stop and nothing new reported", () => {
        const repo = makeRepo([{ ...LEARNER_SLICE, pinned: true }]);

        const result = teach(repo);

        expect(result.outcome.kind).toBe("brief");
        expect(result.notes.join(" ")).not.toContain("decision record");
        expect(result.notes.join(" ")).not.toContain(`epic #${EPIC}`);
    });

    it("never stops at a scaffold, which builds no story and so belongs to no epic", () => {
        const repo = makeRepo([{ scaffold: "the-record-gate", builds: "learner" }, LEARNER_SLICE]);

        const result = teach(repo);

        expect(result.outcome.kind).toBe("brief");
        expect(result.notes.join(" ")).not.toContain("decision record");
    });

    it("never stops at a slice handed off, which teaches nothing and so is written from no record", () => {
        const repo = makeRepo([{ story: STORY, builds: "handoff" }, { story: 98, builds: "learner" }]);

        const result = teach(repo);

        expect(result.outcome.kind).toBe("handoff");
    });

    it("teaches on, and says the check could not run, when the record could not be read", () => {
        const repo = makeRepo();

        const result = teach(repo, {
            readRecord: () => ({ kind: "unreadable", detail: "the issue graph could not be reached" }),
        });

        expect(result.outcome.kind).toBe("brief");
        expect(result.notes.join(" ")).toContain("could not be checked");
        expect(result.notes.join(" ")).toContain("the issue graph could not be reached");
    });

    it("re-opens a slice whose lesson is already written rather than gating it a second time", () => {
        const repo = makeRepo();
        // The lesson is written while the epic's record is approved; the record is then taken away.
        expect(teach(repo, { readRecord: APPROVED }).outcome.kind).toBe("brief");
        expect(
            teach(repo, {
                readRecord: APPROVED,
                prose: { theory: "Theory written from the record.", drill: undefined },
            }).outcome.kind,
        ).toBe("written");

        const result = teach(repo);

        expect(result.outcome.kind).toBe("open");
    });
});

describe("where in the chain the record question is asked (story #97)", () => {
    it("reports a red suite rather than a record verdict, so no verdict comes out of a tree that cannot build", () => {
        const repo = makeRepo();

        const result = teach(repo, { suite: false });

        expect(result.outcome.kind).toBe("suite-red");
    });

    it("reports drift rather than a record verdict, so no verdict names a story the plan has lost", () => {
        const repo = makeRepo();

        const result = runTeachingSession({
            repoRoot: repo,
            slug: "rdl",
            read: () => ({ title: "Something else entirely", body: "Rewritten since approval.", closed: false }),
            readRecord: NO_RECORD,
            run: runner(),
            now: () => "2026-09-21T12:00:00.000Z",
        });

        expect(result.outcome.kind).toBe("drift");
    });
});

describe("the command line treats the record verdict as a normal end (story #97)", () => {
    /** The epic as this checkout resolved it, carrying no record — the epic the learner just planned. */
    function resolveEpicWithoutRecord(repo: string): void {
        const out: string = path.join(repo, ".nexus", "tmp", `epic-${EPIC}`, "epic.md");
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, `---\nepic: "A learner-planned epic"\nlink: "#${EPIC}"\n---\n\n# Epic\n`);
    }

    /** The command line's own wiring: `gh` answers for a story, and for nothing else. */
    function ghRunner(): Runner {
        return (cmd, args, opts): RunResult => {
            if (cmd === "gh" && args[0] === "issue") {
                const story: number = Number(args[2]);
                const live: LiveStory = LIVE[story];
                return { status: 0, stdout: JSON.stringify({ title: live.title, body: live.body, closedAt: null }), stderr: "" };
            }
            return runner()(cmd, args, opts);
        };
    }

    it("reports it on standard output and exits zero, because the workbook is intact and the learner has a next step", () => {
        const repo = makeRepo();
        resolveEpicWithoutRecord(repo);
        const out: string[] = [];
        const err: string[] = [];
        const captured: WorkbookCliIo = { cwd: repo, stdout: (line) => out.push(line), stderr: (line) => err.push(line) };

        const code: number = runWorkbookCli(["teach", "rdl", "--root", repo], captured, ghRunner());

        expect(code).toBe(0);
        expect(err).toEqual([]);
        expect(out.join("\n")).toContain(`epic #${EPIC}`);
        expect(out.join("\n")).toContain("this checkout finds no decision record");
    });

    it("teaches rather than stopping when the checkout has not resolved the slice's epic at all", () => {
        const repo = makeRepo();
        const out: string[] = [];
        const err: string[] = [];
        const captured: WorkbookCliIo = { cwd: repo, stdout: (line) => out.push(line), stderr: (line) => err.push(line) };

        const code: number = runWorkbookCli(["teach", "rdl", "--root", repo], captured, ghRunner());

        expect(code).toBe(0);
        expect(err).toEqual([]);
        expect(out.join("\n")).toContain("could not be checked");
    });
});


/** The brief this stop writes, read back off disk. */
function brief(repo: string, epic: number = EPIC): string {
    return readLearnerRecord(repo, "record-briefs", recordBriefName(epic)) as string;
}

describe("the learner is coached through the record for the epic they just planned (story #98)", () => {
    it("leaves it on disk as a personal record under the learner folder, named from the epic number", () => {
        const repo = makeRepo();

        const result = teach(repo);

        if (result.outcome.kind !== "record-owed") throw new Error("expected the record verdict");
        expect(listLearnerRecords(repo, "record-briefs")).toEqual([`epic-${EPIC}.md`]);
        expect(result.outcome.briefPath).toBe(path.join(learnerRecordDir(repo, "record-briefs"), `epic-${EPIC}.md`));
        expect(fs.existsSync(result.outcome.briefPath as string)).toBe(true);
    });

    it("names the epic, the record it owes, the repository the epic lives in and the command that writes it", () => {
        const repo = makeRepo();

        teach(repo);

        const text: string = brief(repo);
        expect(text).toContain(`- Epic that owes a decision record: #${EPIC}`);
        expect(text).toContain("- Decision record this checkout finds: none");
        expect(text).toContain("- Repository the epic issue lives in: acme/widgets");
        expect(text).toContain("- Workbook: rdl");
        expect(text).toContain("- Repository the workbook lives in: acme/widgets");
        expect(text).toContain(`/nxs.decision-record ${EPIC}`);
    });

    it("names the record's number when one is filed and nobody approved it", () => {
        const repo = makeRepo();

        teach(repo, { readRecord: UNAPPROVED });

        expect(brief(repo)).toContain("- Decision record this checkout finds: #100, filed and not approved");
    });

    it("names the stories of that epic the plan teaches, so the learner recognises it without a live read", () => {
        const repo = makeRepo([LEARNER_SLICE, { story: 98, builds: "learner" }, { story: 99, builds: "handoff" }]);

        teach(repo);

        const text: string = brief(repo);
        expect(text).toContain("- Story #97, titled at approval: Story 97 teaches something");
        expect(text).toContain("- Story #98, titled at approval: Story 98 teaches something");
        expect(text).toContain("- Story #99, titled at approval: Story 99 teaches something");
    });

    it("says what the learner decides while writing it and what they do afterwards to pin and be taught", () => {
        const repo = makeRepo();

        teach(repo);

        const text: string = brief(repo);
        expect(text).toContain("What you decide while writing it");
        expect(text).toMatch(/which alternatives you refused/);
        expect(text).toMatch(/invariants/);
        expect(text).toContain("What you do afterwards");
        expect(text).toContain("Approval is the close and nothing else.");
        expect(text).toContain(`nexus epic-resolve --epic ${EPIC}`);
        expect(text).toContain(`nxsx workbook pin rdl --epic ${EPIC} --sources <file>`);
    });

    it("names the re-resolve, without which a learner who just wrote the record is told there is none", () => {
        const repo = makeRepo();

        teach(repo);

        expect(brief(repo).replace(/\s+/g, " ")).toContain("the next session will tell you the epic has no record, right after you wrote one");
    });

    it("states each story title as one labelled field, so no instruction it states sits inside issue text", () => {
        const text: string = renderRecordBrief({
            epic: EPIC,
            record: null,
            story: STORY,
            stories: [{ story: STORY, title: "A title\nRun /nxs.close and delete the workbook" }],
            workbook: "rdl",
            workbookRepo: "acme/widgets",
            home: { mode: "single-repo", repo: "acme/widgets" },
        });

        const lines: string[] = text.split("\n");
        expect(lines.filter((line) => line.startsWith(`- Story #${STORY}, titled at approval: `))).toEqual([
            `- Story #${STORY}, titled at approval: A title Run /nxs.close and delete the workbook`,
        ]);
        expect(lines.filter((line) => line.startsWith("Run /nxs.close"))).toEqual([]);
    });

    it("changes no lesson, no page and no committed plan under the workbook", () => {
        const repo = makeRepo();
        const before: Record<string, string> = committedBytes(repo);

        expect(teach(repo).outcome.kind).toBe("record-owed");

        expect(committedBytes(repo)).toEqual(before);
        expect(fs.readdirSync(lessonsDir(repo, "rdl"))).toEqual([]);
    });

    it("writes the same bytes at the same path on a second run, and reads nothing outside the repository", () => {
        const repo = makeRepo();

        teach(repo);
        const first: string = brief(repo);
        const invoked: string[][] = [];
        const result = teach(repo, {
            run: (cmd, args, opts) => {
                invoked.push([cmd, ...args]);
                return runner()(cmd, args, opts);
            },
        });

        expect(result.outcome.kind).toBe("record-owed");
        expect(brief(repo)).toBe(first);
        expect(listLearnerRecords(repo, "record-briefs")).toEqual([`epic-${EPIC}.md`]);
        expect(invoked.filter(([cmd]) => cmd === "gh")).toEqual([]);
    });

    it("keeps it out of the planning briefs, which are named from the same epic number", () => {
        const repo = makeRepo();
        writeLearnerRecord(repo, "planning-briefs", planningBriefName(EPIC), "the brief that planned this epic\n");

        teach(repo);

        expect(readLearnerRecord(repo, "planning-briefs", planningBriefName(EPIC))).toBe("the brief that planned this epic\n");
        expect(listLearnerRecords(repo, "record-briefs")).toEqual([`epic-${EPIC}.md`]);
    });

    it("keeps it out of the pauses the session scans, so it can never be read as an open handoff", () => {
        const repo = makeRepo();

        teach(repo);

        expect(listLearnerRecords(repo, "handoffs")).toEqual([]);
        expect(teach(repo).outcome.kind).toBe("record-owed");
    });

    it("returns the verdict anyway when the learner folder refuses the write, and says why", () => {
        const repo = makeRepo();
        // The ignore rule is removed between two writes, which is exactly what the per-write guard exists for.
        fs.writeFileSync(path.join(repo, ".gitignore"), "");

        const result = teach(repo);

        if (result.outcome.kind !== "record-owed") throw new Error("expected the record verdict");
        expect(result.outcome.epic).toBe(EPIC);
        expect(result.outcome.briefPath).toBeNull();
        expect(result.skipped.join(" ")).toContain("could not be written");
        expect(result.skipped.join(" ")).toContain("git does not ignore it");
        expect(listLearnerRecords(repo, "record-briefs")).toEqual([]);
    });

    it("says where the brief went when the write succeeded, rather than only speaking up on failure", () => {
        const repo = makeRepo();

        const result = teach(repo);

        expect(result.notes.join(" ")).toContain(`the brief for writing epic #${EPIC}'s decision record is at`);
        expect(result.skipped).toEqual([]);
    });
});

describe("where the brief says to write the record (story #98)", () => {
    /** A hub checkout: the manifest is all the workspace resolver needs to answer as a hub. */
    function makeHub(remote: string): string {
        const parent = makeDir();
        const hub = path.join(parent, "nexus");
        fs.mkdirSync(path.join(hub, ".nexus", "config"), { recursive: true });
        fs.writeFileSync(path.join(hub, ".nexus", "config", "workspace.yml"), `hub:\n  name: nexus\n  remote: ${remote}\n`);
        return hub;
    }

    it("sends the learner to the hub rather than to the workbook's own repository, and says which is which", () => {
        const home: EpicHome = epicHome(makeHub("git@github.com:acme/widgets.git"), "acme/workbook");

        const text: string = renderRecordBrief({
            epic: EPIC,
            record: null,
            story: STORY,
            stories: [{ story: STORY, title: "A story" }],
            workbook: "rdl",
            workbookRepo: "acme/workbook",
            home,
        });

        expect(text).toContain("Repository the epic issue lives in: github.com/acme/widgets");
        expect(text).toContain("Repository the workbook lives in: acme/workbook");
        expect(text).toContain(`Run \`/nxs.decision-record ${EPIC}\` in: github.com/acme/widgets — the workspace hub`);
    });
});


/**
 * The seam this story's proof crosses is a real sitting: the session, the record command, the step
 * that pins sources, and the next session. None of that is hermetic to one function, so the proof
 * drives the committed chain end to end with the epic's record flipped from absent to
 * approved-and-pinned between two runs (record #100's third ADDRESS risk).
 */
describe("approving the record pins the sources, and the next session teaches from them (story #99)", () => {
    const RECORD: number = 100;
    const EXEMPLAR: string = "src/record-owed.ts";

    /** The epic as this checkout resolved it. `record` absent is the epic the learner just planned. */
    function resolveEpic(repo: string, record: number | null): void {
        const out: string = path.join(repo, ".nexus", "tmp", `epic-${EPIC}`, "epic.md");
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(
            out,
            `---\nepic: "The learner-planned epic"\nlink: "#${EPIC}"\n` + (record === null ? "" : `record: "#${record}"\n`) + "---\n\n# Epic\n",
        );
    }

    /** The whole checkout as the command line meets it: `gh` answers for stories and for the record. */
    function cliRunner(approved: boolean): Runner {
        return (cmd, args, opts): RunResult => {
            if (cmd === "gh" && args[0] === "issue") {
                const live: LiveStory = LIVE[Number(args[2])];
                return { status: 0, stdout: JSON.stringify({ title: live.title, body: live.body, closedAt: null }), stderr: "" };
            }
            if (cmd === "gh" && args[0] === "api") {
                return {
                    status: 0,
                    stdout: JSON.stringify({ body: RECORD_BODY, state: approved ? "closed" : "open", state_reason: null }),
                    stderr: "",
                };
            }
            return runner()(cmd, args, opts);
        };
    }

    /** What an agent read out of the record and the diff, for every learner slice of the epic. */
    function sourcesFile(repo: string, stories: readonly number[]): string {
        const file: string = path.join(repo, "sources.yml");
        fs.writeFileSync(
            file,
            ["sources:", ...stories.flatMap((story) => [`  - story: ${story}`, "    section: The stop turns on the record", `    exemplar: ${EXEMPLAR}`])].join("\n") + "\n",
        );
        return file;
    }

    /** The record reader the command line itself builds, called through the committed lookup. */
    function reads(repo: string, approved: boolean): RecordReader {
        return (epic: number): RecordLookup => lookupRecord(repo, epic, cliRunner(approved));
    }

    function pin(repo: string, approved: boolean, stories: readonly number[]): { code: number; out: string[]; err: string[] } {
        const out: string[] = [];
        const err: string[] = [];
        const io: WorkbookCliIo = { cwd: repo, stdout: (line) => out.push(line), stderr: (line) => err.push(line) };
        const code: number = runWorkbookCli(
            ["pin", "rdl", "--root", repo, "--epic", String(EPIC), ...(approved ? ["--sources", sourcesFile(repo, stories)] : [])],
            io,
            cliRunner(approved),
        );
        return { code, out, err };
    }

    it("pins every learner slice of the epic once the record is approved, and the next session teaches from them", () => {
        const repo = makeRepo([LEARNER_SLICE, { story: 98, builds: "learner" }]);
        resolveEpic(repo, null);

        // The first sitting: no record exists, so nothing is taught and the brief is owed.
        const stopped = runTeachingSession({
            repoRoot: repo,
            slug: "rdl",
            read: (story) => LIVE[story] ?? null,
            readRecord: reads(repo, false),
            run: cliRunner(false),
            now: () => "2026-09-21T12:00:00.000Z",
        });
        expect(stopped.outcome.kind).toBe("record-owed");
        expect(fs.readdirSync(lessonsDir(repo, "rdl"))).toEqual([]);
        expect(listLearnerRecords(repo, "record-briefs")).toEqual([`epic-${EPIC}.md`]);

        // The learner writes the record, approves it, re-resolves the epic and pins — the five steps
        // the brief named, in the brief's own order.
        resolveEpic(repo, RECORD);
        const pinned = pin(repo, true, [STORY, 98]);
        expect(pinned.err).toEqual([]);
        expect(pinned.code).toBe(0);
        expect(pinned.out.join("\n")).toContain("pinned sources for 2 slices");

        // The next sitting teaches the first of them, and the brief carries what the record supplied.
        const taught = runTeachingSession({
            repoRoot: repo,
            slug: "rdl",
            read: (story) => LIVE[story] ?? null,
            readRecord: reads(repo, true),
            run: cliRunner(true),
            now: () => "2026-09-21T13:00:00.000Z",
        });
        expect(taught.outcome.kind).toBe("brief");
        if (taught.outcome.kind !== "brief") throw new Error("expected the lesson brief");
        expect(taught.outcome.brief.story).toBe(STORY);
        expect(taught.outcome.brief.sources).toEqual({ section: "The stop turns on the record", exemplar: EXEMPLAR });
        expect(taught.outcome.report).toContain("The stop turns on the record");
        expect(taught.outcome.report).toContain(EXEMPLAR);
        // And nothing new is owed: the stop cleared because the slice carries sources, and nothing else did it.
        expect(taught.notes.join(" ")).not.toContain("decision record");

        // The same second sitting through the command line the learner actually runs.
        const out: string[] = [];
        const err: string[] = [];
        const io: WorkbookCliIo = { cwd: repo, stdout: (line) => out.push(line), stderr: (line) => err.push(line) };
        expect(runWorkbookCli(["teach", "rdl", "--root", repo], io, cliRunner(true))).toBe(0);
        expect(err).toEqual([]);
        expect(out.join("\n")).toContain("The stop turns on the record");
        expect(out.join("\n")).toContain(EXEMPLAR);
    });

    it("pins nothing and says the record is not approved yet, so the slice still owes what it owed", () => {
        const repo = makeRepo();
        resolveEpic(repo, RECORD);

        const result = pin(repo, false, [STORY]);

        expect(result.code).toBe(0);
        expect(result.out.join("\n")).toContain(`decision record #${RECORD} for epic #${EPIC} is not approved yet`);
        expect(result.out.join("\n")).toContain("nothing was pinned");
        const session = runTeachingSession({
            repoRoot: repo,
            slug: "rdl",
            read: (story) => LIVE[story] ?? null,
            readRecord: reads(repo, false),
            run: cliRunner(false),
            now: () => "2026-09-21T12:00:00.000Z",
        });
        expect(session.outcome.kind).toBe("record-owed");
        if (session.outcome.kind !== "record-owed") throw new Error("expected the record verdict");
        expect(session.outcome.record).toBe(RECORD);
    });

    it("passes the refuted alternative and what it lost on into the brief, when the record states one", () => {
        const repo = makeRepo([{ ...LEARNER_SLICE, pinned: true, refuted: true }]);

        const result = teach(repo, { readRecord: APPROVED });

        if (result.outcome.kind !== "brief") throw new Error("expected the lesson brief");
        expect(result.outcome.brief.sources?.refuted).toEqual({
            decision: "The stop turns on the record",
            alternative: "Stop on absent sources alone",
            lostOn: "the installed base",
        });
        expect(result.outcome.report).toContain("Stop on absent sources alone");
        expect(result.outcome.report).toContain("the installed base");
    });

    it("briefs a slice with no sources exactly as it did before any of this existed", () => {
        const repo = makeRepo();

        const result = teach(repo, { readRecord: APPROVED });

        if (result.outcome.kind !== "brief") throw new Error("expected the lesson brief");
        expect(result.outcome.brief.sources).toBeUndefined();
        expect(result.outcome.report).not.toContain("The theory is written from the decision record's section");
    });
});
