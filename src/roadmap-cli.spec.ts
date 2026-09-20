import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type RunResult, type Runner } from "@nexus/workspace/run";
import { runWorkbookCli, type WorkbookCliIo } from "./workbook-cli.js";
import { ROADMAP_EPIC_CAP, epicsFromQuery, readRoadmap, type Roadmap } from "./roadmap.js";
import { workbookRoot } from "./workbook-store.js";

let tmpDirs: string[] = [];
function initRepo(): string {
    const dir: string = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-cli-"));
    tmpDirs.push(dir);
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    fs.writeFileSync(path.join(dir, ".gitignore"), ".nexus/tmp/\n");
    return dir;
}
afterEach(() => {
    for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
    tmpDirs = [];
});

interface Captured extends WorkbookCliIo {
    out: string[];
    err: string[];
}
function makeIo(cwd: string): Captured {
    const out: string[] = [];
    const err: string[] = [];
    return { cwd, out, err, stdout: (l) => out.push(l), stderr: (l) => err.push(l) };
}

interface FakeStory {
    number: number;
    title: string;
    body: string;
    blockedBy?: number[];
}

/** The epic the fake issue graph is built around. Labels and a body are only set by the stub cases. */
interface FakeEpic {
    number: number;
    title: string;
    body?: string;
    labels?: string[];
}

/**
 * One issue on the fake graph, carrying whatever of it the resolver and the expansion step read.
 *
 * `labels` is what both the issue view and the classification query report, so a fake epic carries
 * its epic marker here and a fake story carries its story one — the same marker the real graph
 * would carry, rather than one synthesised per call site.
 */
interface FakeIssue {
    number: number;
    title: string;
    body?: string;
    labels?: string[];
    /** The sub-issue numbers GitHub returns for it, in its own order rather than a sorted one. */
    children?: number[];
    /** The issue this one is a sub-issue of — what a `not-an-epic` refusal names it beneath. */
    parent?: number;
    blockedBy?: number[];
}

/** Answers every `gh` call the shared resolver and the expansion step make, over one fake graph. */
function graphRunner(issues: FakeIssue[], calls: string[][] = []): Runner {
    const byNumber = new Map(issues.map((i) => [i.number, i]));
    return (cmd: string, args: string[]): RunResult => {
        calls.push([cmd, ...args]);
        const ok = (stdout: string): RunResult => ({ status: 0, stdout, stderr: "" });
        const fail = (stderr: string): RunResult => ({ status: 1, stdout: "", stderr });
        if (cmd === "git") return ok("");
        if (cmd !== "gh") return fail(`unexpected command ${cmd}`);
        if (args[0] === "repo" && args[1] === "view") return ok("acme/app\n");
        if (args[0] === "issue" && args[1] === "view") {
            const issue: FakeIssue | undefined = byNumber.get(Number(args[2]));
            if (issue === undefined) return fail(`not found: #${args[2]}`);
            return ok(
                JSON.stringify({
                    number: issue.number,
                    title: issue.title,
                    body: issue.body ?? "",
                    state: "OPEN",
                    stateReason: "",
                    labels: (issue.labels ?? []).map((name) => ({ name })),
                }),
            );
        }
        if (args[0] === "api" && args[1] === "graphql") {
            const query: string = args.find((a) => a.startsWith("query=")) ?? "";
            const n: number = Number((args.find((a) => a.startsWith("num=")) ?? "num=0").slice(4));
            const issue: FakeIssue | undefined = byNumber.get(n);
            // The combined facts query — matched before the bare parent query it contains.
            if (query.includes("parent{number} issueType{name}")) {
                if (issue === undefined) return ok(JSON.stringify({ data: { repository: { issue: null } } }));
                return ok(
                    JSON.stringify({
                        data: {
                            repository: {
                                issue: {
                                    parent: issue.parent === undefined ? null : { number: issue.parent },
                                    issueType: null,
                                    state: "OPEN",
                                    stateReason: null,
                                    labels: { nodes: (issue.labels ?? []).map((name) => ({ name })) },
                                },
                            },
                        },
                    }),
                );
            }
            if (query.includes("parent{number}")) return ok("");
            if (query.includes("issueType{name}")) return ok("");
            // What is left is the sub-issue list, already `--jq`'d down to one number per line.
            if (issue === undefined) return fail(`Could not resolve to an Issue with the number ${n}.`);
            const children: number[] = issue.children ?? [];
            return ok(children.length === 0 ? "" : children.join("\n") + "\n");
        }
        if (args[0] === "api" && String(args[1]).includes("dependencies/blocked_by")) {
            const match: RegExpExecArray | null = /issues\/(\d+)\/dependencies/.exec(String(args[1]));
            const n: number = match === null ? 0 : Number(match[1]);
            const edges: number[] = byNumber.get(n)?.blockedBy ?? [];
            return ok(edges.length === 0 ? "" : edges.join("\n") + "\n");
        }
        return fail(`unexpected gh call: ${args.join(" ")}`);
    };
}

/** The same graph for the single-epic cases: one epic, its stories, and nothing above it. */
function ghRunner(epic: FakeEpic, stories: FakeStory[], calls: string[][] = []): Runner {
    return graphRunner(
        [
            {
                number: epic.number,
                title: epic.title,
                body: epic.body,
                labels: ["epic", ...(epic.labels ?? [])],
                children: stories.map((s) => s.number),
            },
            ...stories.map((s) => ({
                number: s.number,
                title: s.title,
                body: s.body,
                labels: ["story"],
                parent: epic.number,
                blockedBy: s.blockedBy,
            })),
        ],
        calls,
    );
}

const STORIES: FakeStory[] = [
    { number: 11, title: "First", body: "Do the first thing." },
    { number: 12, title: "Second", body: "Do the second thing.", blockedBy: [11] },
];

describe("a learner resolves a roadmap from an epic issue", () => {
    it("writes a roadmap holding the epic's stories in a dependency-respecting order", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        const code: number = runWorkbookCli(["roadmap", "--epic", "100"], io, ghRunner({ number: 100, title: "Alpha" }, STORIES));
        expect(code).toBe(0);
        const roadmap: Roadmap | null = readRoadmap(repo, "alpha");
        expect(roadmap?.stories.map((s) => s.number)).toEqual([11, 12]);
        expect(roadmap?.stories[1].body).toContain("Do the second thing.");
    });

    it("creates the workbook the interview will be keyed on before anything is asked", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        runWorkbookCli(["roadmap", "--epic", "100"], io, ghRunner({ number: 100, title: "Alpha" }, STORIES));
        expect(fs.existsSync(workbookRoot(repo, "alpha"))).toBe(true);
    });

    it("leaves the roadmap out of the committed tree", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        runWorkbookCli(["roadmap", "--epic", "100"], io, ghRunner({ number: 100, title: "Alpha" }, STORIES));
        const tracked: string = execFileSync("git", ["status", "--porcelain", "--", ".nexus/tmp"], { cwd: repo, encoding: "utf8" });
        expect(tracked.trim()).toBe("");
    });

    it("carries a story's whole body, sub-headings and all, so no later phase re-reads the issue", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        const whole: string = [
            "- **story_type:** system",
            "- **size:** M",
            "",
            "**As a** learner, **I want** the roadmap to hold what the story says.",
            "",
            "## Acceptance Criteria",
            "",
            "- [ ] **Given** a resolved roadmap, **when** a later phase reads it, **then** it finds the criteria there.",
            "",
            "## Notes",
            "",
            "A real story body carries H2 sub-headings under its H3 heading.",
        ].join("\n");
        runWorkbookCli(
            ["roadmap", "--epic", "100"],
            io,
            ghRunner({ number: 100, title: "Alpha" }, [{ number: 11, title: "First", body: whole }]),
        );
        expect(readRoadmap(repo, "alpha")?.stories[0].body).toBe(whole);
    });

    it("takes the name the learner gave it when they gave one", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        runWorkbookCli(["roadmap", "my-roadmap", "--epic", "100"], io, ghRunner({ number: 100, title: "Alpha" }, STORIES));
        expect(readRoadmap(repo, "my-roadmap")).not.toBeNull();
    });
});

describe("a learner resolves a roadmap from an epic nobody has planned yet", () => {
    // `needs-refinement` is what the shared publishing resolver falls back to for the unplanned
    // label, and this spec drives the *installed* resolver rather than a substitute — so a Nexus
    // release that renamed or restructured the refusal this relaxation keys on fails here, loudly,
    // instead of turning every roadmap holding an unplanned member back into a hard failure.
    const STUB: FakeEpic = { number: 500, title: "Epsilon", body: "What nobody has planned yet.", labels: ["needs-refinement"] };

    it("resolves it as a member instead of refusing the whole roadmap", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        const code: number = runWorkbookCli(["roadmap", "--epic", "500"], io, ghRunner(STUB, []));
        expect(code).toBe(0);
        expect(readRoadmap(repo, "epsilon")?.members.map((m) => m.number)).toEqual([500]);
    });

    it("carries the title and body off the issue, and gives it no stories", () => {
        const repo: string = initRepo();
        runWorkbookCli(["roadmap", "--epic", "500"], makeIo(repo), ghRunner(STUB, []));
        const roadmap: Roadmap | null = readRoadmap(repo, "epsilon");
        expect(roadmap?.members[0].title).toBe("Epsilon");
        expect(roadmap?.members[0].body).toBe("What nobody has planned yet.");
        expect(roadmap?.stories).toEqual([]);
    });

    it("writes the member's kind down, so a later phase reads it off the file", () => {
        const repo: string = initRepo();
        runWorkbookCli(["roadmap", "--epic", "500"], makeIo(repo), ghRunner(STUB, []));
        expect(readRoadmap(repo, "epsilon")?.members[0].kind).toBe("unplanned");
    });
});

describe("a learner resolves a roadmap from an initiative", () => {
    /**
     * An initiative above a planned epic and an epic nobody has planned yet.
     *
     * The initiative carries no marker of its own, because nothing in this repository classifies an
     * issue as one (record #82, invariant 3), and its children come back in GitHub's order rather
     * than a sorted one, so the order a roadmap holds them in is resolution's and not the graph's.
     */
    const INITIATIVE: FakeIssue[] = [
        { number: 900, title: "Ship the thing", children: [500, 100] },
        { number: 100, title: "Alpha", labels: ["epic"], parent: 900, children: [11, 12] },
        { number: 11, title: "First", body: "Do the first thing.", labels: ["story"], parent: 100 },
        { number: 12, title: "Second", body: "Do the second thing.", labels: ["story"], parent: 100, blockedBy: [11] },
        {
            number: 500,
            title: "Epsilon",
            body: "What nobody has planned yet.",
            labels: ["epic", "needs-refinement"],
            parent: 900,
        },
    ];

    it("holds one member for each child, planned and unplanned alike", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        const code: number = runWorkbookCli(["roadmap", "--initiative", "900"], io, graphRunner(INITIATIVE));
        expect(code).toBe(0);
        const roadmap: Roadmap | null = readRoadmap(repo, "ship-the-thing");
        expect(roadmap?.members.map((m) => m.number)).toEqual([100, 500]);
        expect(roadmap?.stories.map((s) => s.number)).toEqual([11, 12]);
    });

    it("states each member's kind, and carries an unplanned one's body", () => {
        const repo: string = initRepo();
        runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(repo), graphRunner(INITIATIVE));
        const members = readRoadmap(repo, "ship-the-thing")?.members ?? [];
        expect(members.map((m) => m.kind)).toEqual(["planned", "unplanned"]);
        expect(members[1].body).toBe("What nobody has planned yet.");
    });

    it("holds the same members, of the same kinds, as naming those children directly", () => {
        const initiativeRepo: string = initRepo();
        runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(initiativeRepo), graphRunner(INITIATIVE));

        const directRepo: string = initRepo();
        const graph: Runner = graphRunner(INITIATIVE);
        const named: Runner = (cmd, args, opts) => {
            if (args[0] === "search") {
                const rows = [100, 500].map((number) => ({ number, repository: { nameWithOwner: "acme/app" } }));
                return { status: 0, stdout: JSON.stringify(rows), stderr: "" };
            }
            return graph(cmd, args, opts);
        };
        expect(runWorkbookCli(["roadmap", "direct", "--query", "label:teaching"], makeIo(directRepo), named)).toBe(0);

        const fromInitiative = readRoadmap(initiativeRepo, "ship-the-thing")?.members;
        const fromChildren = readRoadmap(directRepo, "direct")?.members;
        expect(fromInitiative).toEqual(fromChildren);
    });

    it("holds the same members in the same order when the graph has not changed", () => {
        const first: string = initRepo();
        const again: string = initRepo();
        runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(first), graphRunner(INITIATIVE));
        runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(again), graphRunner(INITIATIVE));
        expect(readRoadmap(first, "ship-the-thing")).toEqual(readRoadmap(again, "ship-the-thing"));
    });

    it("names the roadmap from the initiative's own title, not from its lowest-numbered child", () => {
        const repo: string = initRepo();
        runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(repo), graphRunner(INITIATIVE));
        expect(readRoadmap(repo, "ship-the-thing")).not.toBeNull();
        expect(readRoadmap(repo, "alpha")).toBeNull();
    });

    it("takes the name the learner gave it when they gave one, and never reads the initiative's title", () => {
        const repo: string = initRepo();
        const calls: string[][] = [];
        expect(runWorkbookCli(["roadmap", "my-roadmap", "--initiative", "900"], makeIo(repo), graphRunner(INITIATIVE, calls))).toBe(0);
        expect(readRoadmap(repo, "my-roadmap")).not.toBeNull();
        expect(calls.some((c) => c[1] === "issue" && c[2] === "view" && c[3] === "900")).toBe(false);
    });

    it("reads the initiative's children as sub-issues, in one call, before any child is read", () => {
        const repo: string = initRepo();
        const calls: string[][] = [];
        runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(repo), graphRunner(INITIATIVE, calls));
        const children: number = calls.filter((c) => c.includes("num=900") && c.some((t) => t.startsWith("query=") && t.includes("subIssues"))).length;
        expect(children).toBe(1);
        const readChildren: number = calls.findIndex((c) => c.includes("num=900") && c.some((t) => t.startsWith("query=") && t.includes("subIssues")));
        const readAChild: number = calls.findIndex((c) => c.some((t) => t === "num=100" || t === "num=500"));
        expect(readChildren).toBeGreaterThanOrEqual(0);
        expect(readChildren).toBeLessThan(readAChild);
    });

    it("leaves an epic issue number resolving exactly as it does today", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        expect(runWorkbookCli(["roadmap", "--epic", "100"], io, graphRunner(INITIATIVE))).toBe(0);
        const roadmap: Roadmap | null = readRoadmap(repo, "alpha");
        expect(roadmap?.members.map((m) => m.number)).toEqual([100]);
        expect(roadmap?.stories.map((s) => s.number)).toEqual([11, 12]);
    });

    it("needs exactly one of an epic, an initiative and a query", () => {
        const repo: string = initRepo();
        const graph: Runner = graphRunner(INITIATIVE);
        expect(runWorkbookCli(["roadmap", "--epic", "100", "--initiative", "900"], makeIo(repo), graph)).toBe(2);
        expect(runWorkbookCli(["roadmap", "x", "--initiative", "900", "--query", "label:t"], makeIo(repo), graph)).toBe(2);
    });

    it("takes an issue number and nothing else", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        expect(runWorkbookCli(["roadmap", "--initiative", "not-a-number"], io, graphRunner(INITIATIVE))).toBe(2);
        expect(io.err.join("\n")).toContain("issue number");
    });
});

describe("an initiative with nothing beneath it", () => {
    const BARE: FakeIssue[] = [{ number: 900, title: "Ship the thing" }];

    it("is refused, and no roadmap is written", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        expect(runWorkbookCli(["roadmap", "--initiative", "900"], io, graphRunner(BARE))).toBe(1);
        expect(readRoadmap(repo, "ship-the-thing")).toBeNull();
        expect(fs.existsSync(path.join(repo, ".nexus", "workbook"))).toBe(false);
    });

    it("names the initiative and says it has nothing beneath it", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        runWorkbookCli(["roadmap", "--initiative", "900"], io, graphRunner(BARE));
        const said: string = io.err.join("\n");
        expect(said).toContain("roadmap-initiative-empty");
        expect(said).toContain("#900");
        expect(said).toContain("nothing beneath it");
    });

    it("refuses under its own name, not the one a roadmap already uses for an empty set", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        runWorkbookCli(["roadmap", "--initiative", "900"], io, graphRunner(BARE));
        // `roadmap-empty` is worded for a lead who named nothing at all, which is the wrong
        // problem to describe to one who named an issue that simply has no children.
        expect(io.err.join("\n")).not.toContain("roadmap-empty:");
    });

    it("resolves an initiative whose children are every one of them unplanned", () => {
        const repo: string = initRepo();
        const stubs: FakeIssue[] = [
            { number: 900, title: "Ship the thing", children: [500, 501] },
            { number: 500, title: "Epsilon", body: "Later.", labels: ["epic", "needs-refinement"], parent: 900 },
            { number: 501, title: "Zeta", body: "Later still.", labels: ["epic", "needs-refinement"], parent: 900 },
        ];
        expect(runWorkbookCli(["roadmap", "--initiative", "900"], makeIo(repo), graphRunner(stubs))).toBe(0);
        const roadmap: Roadmap | null = readRoadmap(repo, "ship-the-thing");
        expect(roadmap?.members.map((m) => m.number)).toEqual([500, 501]);
        expect(roadmap?.members.map((m) => m.kind)).toEqual(["unplanned", "unplanned"]);
    });
});

describe("a number that names something other than an epic", () => {
    it("stops, says why that number cannot be a roadmap, and makes no workbook", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        const run: Runner = (cmd, args) => {
            if (cmd === "gh" && args[0] === "repo") return { status: 0, stdout: "acme/app\n", stderr: "" };
            if (cmd === "gh" && args[0] === "issue") {
                return { status: 0, stdout: JSON.stringify({ number: 12, title: "A story", body: "", state: "OPEN", stateReason: "", labels: [] }), stderr: "" };
            }
            if (cmd === "gh" && args[0] === "api") {
                // #12 is a story: filed as one, and a sub-issue of epic #100.
                const query: string = args.find((a) => a.startsWith("query=")) ?? "";
                if (query.includes("parent{number} issueType{name}")) {
                    const issue = {
                        parent: { number: 100 },
                        issueType: null,
                        state: "OPEN",
                        stateReason: null,
                        labels: { nodes: [{ name: "story" }] },
                    };
                    return { status: 0, stdout: JSON.stringify({ data: { repository: { issue } } }), stderr: "" };
                }
                return { status: 0, stdout: "100\n", stderr: "" };
            }
            return { status: 0, stdout: "", stderr: "" };
        };
        const code: number = runWorkbookCli(["roadmap", "--epic", "12"], io, run);
        expect(code).toBe(1);
        expect(io.err.join("\n")).toContain("not-an-epic");
        expect(fs.existsSync(path.join(repo, ".nexus", "workbook"))).toBe(false);
    });

    it("needs exactly one of an epic and a query", () => {
        const repo: string = initRepo();
        expect(runWorkbookCli(["roadmap"], makeIo(repo), ghRunner({ number: 100, title: "Alpha" }, STORIES))).toBe(2);
        expect(runWorkbookCli(["roadmap", "--epic", "100", "--query", "label:x"], makeIo(repo), ghRunner({ number: 100, title: "Alpha" }, STORIES))).toBe(2);
    });
});

describe("a backlog query naming several epics", () => {
    function searchRunner(rows: { number: number; repo: string }[], calls: string[][]): Runner {
        return (cmd: string, args: string[]): RunResult => {
            calls.push([cmd, ...args]);
            const payload = rows.map((r) => ({ number: r.number, repository: { nameWithOwner: r.repo } }));
            return { status: 0, stdout: JSON.stringify(payload), stderr: "" };
        };
    }

    it("composes the learner's expression with the configured exclusion, as an argument vector", () => {
        const repo: string = initRepo();
        const calls: string[][] = [];
        const result = epicsFromQuery(searchRunner([{ number: 100, repo: "acme/app" }], calls), repo, "label:teaching");
        expect(result.ok).toBe(true);
        const vector: string[] = calls[0];
        expect(vector).toContain("label:teaching");
        expect(vector.some((token) => token.startsWith("-label:"))).toBe(true);
        expect(vector.every((token) => !token.includes(" -label:"))).toBe(true);
    });

    it("returns every epic the query found", () => {
        const repo: string = initRepo();
        const result = epicsFromQuery(searchRunner([{ number: 200, repo: "acme/app" }, { number: 100, repo: "acme/app" }], []), repo, "label:teaching");
        expect(result.ok && result.epics).toEqual([100, 200]);
    });

    it("refuses a query returning more epics than the cap, by name", () => {
        const repo: string = initRepo();
        const rows = Array.from({ length: ROADMAP_EPIC_CAP + 1 }, (_, i) => ({ number: 100 + i, repo: "acme/app" }));
        const result = epicsFromQuery(searchRunner(rows, []), repo, "label:teaching");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.problem).toBe("roadmap-too-many-epics");
    });

    it("says the query returned more than the cap, never a count the fetch limit invented", () => {
        const repo: string = initRepo();
        const calls: string[][] = [];
        const rows = Array.from({ length: ROADMAP_EPIC_CAP + 1 }, (_, i) => ({ number: 100 + i, repo: "acme/app" }));
        const result = epicsFromQuery(searchRunner(rows, calls), repo, "label:teaching");
        // The search is asked for one row past the cap, so the row count is a floor, not a total —
        // a query matching fifty epics comes back the same length as one matching eleven.
        const limit: string = calls[0][calls[0].indexOf("--limit") + 1];
        expect(Number(limit)).toBe(ROADMAP_EPIC_CAP + 1);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.message).toContain(`more than ${ROADMAP_EPIC_CAP}`);
            expect(result.error.message).not.toContain(String(ROADMAP_EPIC_CAP + 1));
        }
    });

    it("drops the exclusion when the caller asks for unplanned epics, without inverting the query", () => {
        const repo: string = initRepo();
        const calls: string[][] = [];
        const result = epicsFromQuery(searchRunner([{ number: 100, repo: "acme/app" }], calls), repo, "label:teaching", {
            excludeUnplanned: false,
        });
        expect(result.ok).toBe(true);
        const vector: string[] = calls[0];
        expect(vector).toContain("label:teaching");
        // Not composed, and not replaced by its positive: a query matching only unplanned epics
        // would silently drop the planned half of a roadmap named by one search.
        expect(vector.some((token) => token.startsWith("-label:"))).toBe(false);
        expect(vector.filter((token) => token.startsWith("label:"))).toEqual(["label:teaching"]);
    });

    it("refuses a query whose epics span more than one repository, by name", () => {
        const repo: string = initRepo();
        const result = epicsFromQuery(searchRunner([{ number: 100, repo: "acme/app" }, { number: 200, repo: "acme/other" }], []), repo, "label:teaching");
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.problem).toBe("roadmap-multi-repo");
            expect(result.error.message).toContain("acme/other");
        }
    });

    it("asks the teach-from query for unplanned epics too, so a growing roadmap needs no list of issues", () => {
        const repo: string = initRepo();
        const calls: string[][] = [];
        const graph: Runner = ghRunner({ number: 100, title: "Alpha" }, STORIES);
        const search: Runner = (cmd, args, opts) => {
            calls.push([cmd, ...args]);
            if (args[0] === "search") {
                return { status: 0, stdout: JSON.stringify([{ number: 100, repository: { nameWithOwner: "acme/app" } }]), stderr: "" };
            }
            return graph(cmd, args, opts);
        };
        expect(runWorkbookCli(["roadmap", "alpha", "--query", "label:teaching"], makeIo(repo), search)).toBe(0);
        const vector: string[] = calls[0];
        expect(vector).toContain("label:teaching");
        expect(vector.some((token) => token.startsWith("-label:"))).toBe(false);
    });

    it("makes the learner name a query-resolved roadmap", () => {
        const repo: string = initRepo();
        const io: Captured = makeIo(repo);
        const code: number = runWorkbookCli(["roadmap", "--query", "label:teaching"], io, ghRunner({ number: 100, title: "Alpha" }, STORIES));
        expect(code).toBe(2);
        expect(io.err.join("\n")).toContain("name");
    });
});
