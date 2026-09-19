import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PLAN_FILENAME } from "./workbook-plan";
import { WORKBOOK_STORE_PATH } from "./workbook-location";
import { createWorkbook, lessonsDir, readLessons, readWorkbookPlan, workbookRoot, writtenLessonFiles } from "./workbook-store";

let tmpDirs: string[] = [];
function makeDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workbook-store-"));
    tmpDirs.push(dir);
    return dir;
}
afterEach(() => {
    for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
    tmpDirs = [];
});

function repoWithWorkbook(): string {
    const dir = makeDir();
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    fs.writeFileSync(path.join(dir, ".gitignore"), "");
    createWorkbook(dir, "rdl");
    return dir;
}

function authorLesson(repo: string, file: string, title: string): void {
    fs.writeFileSync(path.join(lessonsDir(repo, "rdl"), file), `---\ntitle: ${title}\n---\n\nProse.\n`);
}

function slice(story: number, lesson: string): string {
    return [
        `  - story: ${story}`,
        `    lesson: ${lesson}`,
        "    builds: learner",
        "    branch: feat/x",
        "    concepts: [c]",
        "    pinning_test:",
        "      file: x.spec.ts",
        "      text: |",
        "        it('x', () => {});",
        "    pinned:",
        `      title: Story ${story}`,
        "      body: A story body.",
    ].join("\n");
}

function writePlan(repo: string, stories: readonly [number, string][]): void {
    const text: string = [
        "repo: nexus",
        "epic: 407",
        "suite: [npx, nx, test, lib]",
        "grading: [npx, nx, test, lib]",
        "slices:",
        ...stories.map(([story, lesson]) => slice(story, lesson)),
        "",
    ].join("\n");
    fs.writeFileSync(path.join(workbookRoot(repo, "rdl"), PLAN_FILENAME), text);
}

describe("a slice with no lesson yet is a stub the workbook skips", () => {
    it("reads only the lessons that have been written, in plan order", () => {
        const repo = repoWithWorkbook();
        writePlan(repo, [[460, "01-drift.md"], [464, "02-handoff.md"], [465, "03-fence.md"]]);
        authorLesson(repo, "02-handoff.md", "Handoff");
        authorLesson(repo, "01-drift.md", "Drift");

        expect(readLessons(repo, "rdl").map((l) => l.file)).toEqual(["01-drift.md", "02-handoff.md"]);
    });

    it("still refuses a lesson the plan does not name, which has no place in the workbook", () => {
        const repo = repoWithWorkbook();
        writePlan(repo, [[460, "01-drift.md"]]);
        authorLesson(repo, "01-drift.md", "Drift");
        authorLesson(repo, "stray.md", "Stray");

        expect(() => readLessons(repo, "rdl")).toThrow(/stray\.md/);
    });

    it("names the lesson files that have been written, so the stubs can be told apart", () => {
        const repo = repoWithWorkbook();
        writePlan(repo, [[460, "01-drift.md"], [464, "02-handoff.md"]]);
        authorLesson(repo, "01-drift.md", "Drift");

        expect(writtenLessonFiles(repo, "rdl")).toEqual(["01-drift.md"]);
    });

    it("reads the plan back, and says there is none when the workbook declares no slices", () => {
        const repo = repoWithWorkbook();
        expect(readWorkbookPlan(repo, "rdl")).toBeNull();

        writePlan(repo, [[460, "01-drift.md"]]);
        expect(readWorkbookPlan(repo, "rdl")?.slices[0].story).toBe(460);
    });

    it("keeps ordering by a plain lessons list, which a workbook with no slices still uses", () => {
        const repo = repoWithWorkbook();
        authorLesson(repo, "a.md", "A");
        authorLesson(repo, "b.md", "B");
        fs.writeFileSync(path.join(workbookRoot(repo, "rdl"), PLAN_FILENAME), "lessons:\n  - b.md\n  - a.md\n");

        expect(readLessons(repo, "rdl").map((l) => l.file)).toEqual(["b.md", "a.md"]);
    });
});

/**
 * Where a workbook sits, relative to the other stores under the Nexus root.
 *
 * These moved here from the Nexus pipeline's own store-exclusion specs when the teaching stage left
 * that repository (Nexus epic #677, goal #692). The exclusion itself is still checked there — a
 * derived diff must withhold whatever a repository has put in the workbook directory — but the
 * placement is this library's behaviour, and it is checked where the code that decides it lives.
 */
describe("a workbook is created as a committed folder outside the queue", () => {
    function initRepo(): string {
        const dir = makeDir();
        execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
        execFileSync("git", ["config", "user.email", "spec@example.com"], { cwd: dir });
        execFileSync("git", ["config", "user.name", "spec"], { cwd: dir });
        return dir;
    }

    it("puts the workbook in the store beside the queue, not inside it", () => {
        const repo = initRepo();

        const workbook = createWorkbook(repo, "roadmap-driven-learning");

        expect(fs.existsSync(workbook.root)).toBe(true);
        expect(workbook.relativePath).toBe(`${WORKBOOK_STORE_PATH}/roadmap-driven-learning`);
        expect(workbook.relativePath.startsWith(".nexus/queue")).toBe(false);
    });

    it("leaves the workbook committable — git does not ignore it", () => {
        const repo = initRepo();
        const workbook = createWorkbook(repo, "roadmap-driven-learning");
        const page = path.join(workbook.root, "lesson.html");
        fs.mkdirSync(path.dirname(page), { recursive: true });
        fs.writeFileSync(page, "<p>lesson</p>\n");

        execFileSync("git", ["add", "-A"], { cwd: repo });
        execFileSync("git", ["commit", "-q", "-m", "add workbook"], { cwd: repo });

        const tracked = execFileSync("git", ["ls-files"], { cwd: repo, encoding: "utf8" }).split("\n");
        expect(tracked).toContain(`${workbook.relativePath}/lesson.html`);
    });

    it("holds more than one workbook, because a repository may teach more than one roadmap", () => {
        const repo = initRepo();

        const first = createWorkbook(repo, "one");
        const second = createWorkbook(repo, "two");
        const again = createWorkbook(repo, "one");

        expect(first.created).toBe(true);
        expect(second.created).toBe(true);
        expect(again.created).toBe(false);
        expect(fs.readdirSync(path.join(repo, WORKBOOK_STORE_PATH)).sort()).toEqual(["one", "two"]);
    });
});
