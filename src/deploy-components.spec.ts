/**
 * The component mirror. These pin the semantics the shared component root depends on: the
 * destination is made to match the managed set, a second run converges, user-owned files are never
 * touched, and — the reason this package has a mirror of its own at all — Nexus's files and ours
 * coexist in one root with neither able to clear the other's.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_PAYLOAD, INSTALL_LEDGER_FILE, deployComponents, payloadDirectory, readInstallLedger } from "./deploy-components";

const TEACH = "@sameeraperera/nexus-teach";
const NEXUS = "@sameeraperera/nexus";

let tmpDirs: string[] = [];

function makeTmpDir(prefix: string): string {
    const dir: string = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
});

function makePayload(files: string[] = ["commands/nxsx.teach.md", "commands/nxsx.teach-plan.md", "skills/nxsx-workbook/SKILL.md"]): string {
    const dir: string = makeTmpDir("teach-payload-");
    for (const rel of files) {
        const abs: string = path.join(dir, ...rel.split("/"));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, `${rel} v1\n`);
    }
    return dir;
}

/** What Nexus's own install would have placed in the same root. */
function makeNexusPayload(): string {
    const dir: string = makeTmpDir("nexus-payload-");
    for (const rel of ["commands/nxs.epic.md", "agents/nxs-pm.md", "skills/nxs-setup/SKILL.md"]) {
        const abs: string = path.join(dir, ...rel.split("/"));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, `${rel} from nexus\n`);
    }
    return dir;
}

function snapshot(root: string): Record<string, string> {
    const out: Record<string, string> = {};
    const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const abs: string = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(abs);
            } else {
                out[path.relative(root, abs).split(path.sep).join("/")] = createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
            }
        }
    };
    if (fs.existsSync(root)) {
        walk(root);
    }
    return out;
}

describe("deployComponents", () => {
    it("places the whole managed set into an empty component root", () => {
        const root: string = makeTmpDir("teach-root-");

        const result = deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(result.written.sort()).toEqual(["commands/nxsx.teach-plan.md", "commands/nxsx.teach.md", "skills/nxsx-workbook/SKILL.md"]);
        expect(fs.readFileSync(path.join(root, "commands", "nxsx.teach.md"), "utf8")).toContain("v1");
    });

    it("overwrites a hand-edited component back to the payload's content", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });
        fs.writeFileSync(path.join(root, "commands", "nxsx.teach.md"), "edited by hand\n");

        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(fs.readFileSync(path.join(root, "commands", "nxsx.teach.md"), "utf8")).toContain("v1");
    });

    it("drops a component the payload no longer carries, and prunes the directory it emptied", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        const result = deployComponents(payloadDirectory(makePayload(["commands/nxsx.teach.md"])), root, { owner: TEACH });

        expect(result.removed).toEqual(["commands/nxsx.teach-plan.md", "skills/nxsx-workbook/SKILL.md"]);
        expect(fs.existsSync(path.join(root, "skills"))).toBe(false);
    });

    it("leaves a user's own files alone", () => {
        const root: string = makeTmpDir("teach-root-");
        fs.mkdirSync(path.join(root, "commands"), { recursive: true });
        fs.writeFileSync(path.join(root, "commands", "my-own.md"), "mine\n");
        fs.writeFileSync(path.join(root, "settings.local.json"), "{}\n");

        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });
        deployComponents(EMPTY_PAYLOAD, root, { owner: TEACH });

        expect(fs.readFileSync(path.join(root, "commands", "my-own.md"), "utf8")).toBe("mine\n");
        expect(fs.existsSync(path.join(root, "settings.local.json"))).toBe(true);
    });

    it("fails with a named error rather than emptying the root when the payload is missing", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(() => deployComponents(payloadDirectory(path.join(root, "no-such-payload")), root, { owner: TEACH })).toThrowError(/payload/i);
        expect(fs.existsSync(path.join(root, "commands", "nxsx.teach.md"))).toBe(true);
    });

    it("never follows a pointer standing where a managed subtree should be", () => {
        const root: string = makeTmpDir("teach-root-");
        const elsewhere: string = makeTmpDir("teach-elsewhere-");
        fs.writeFileSync(path.join(elsewhere, "nxsx.teach.md"), "not ours to delete\n");
        fs.symlinkSync(elsewhere, path.join(root, "agents"));

        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(fs.existsSync(path.join(elsewhere, "nxsx.teach.md"))).toBe(true);
    });
});

describe("sharing one component root with Nexus", () => {
    it("leaves Nexus's components in place when the teaching package installs", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makeNexusPayload()), root, { owner: NEXUS });

        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(fs.existsSync(path.join(root, "commands", "nxs.epic.md"))).toBe(true);
        expect(fs.existsSync(path.join(root, "skills", "nxs-setup", "SKILL.md"))).toBe(true);
    });

    it("leaves Nexus's components in place when the teaching package is uninstalled", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makeNexusPayload()), root, { owner: NEXUS });
        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        const result = deployComponents(EMPTY_PAYLOAD, root, { owner: TEACH });

        expect(result.removed).toEqual(["commands/nxsx.teach-plan.md", "commands/nxsx.teach.md", "skills/nxsx-workbook/SKILL.md"]);
        expect(fs.existsSync(path.join(root, "commands", "nxs.epic.md"))).toBe(true);
        expect(readInstallLedger(root)[NEXUS]).toEqual(["agents/nxs-pm.md", "commands/nxs.epic.md", "skills/nxs-setup/SKILL.md"]);
        expect(readInstallLedger(root)[TEACH]).toBeUndefined();
    });

    it("records what it placed under its own name, beside whatever else the root records", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makeNexusPayload()), root, { owner: NEXUS });

        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        const ledger = readInstallLedger(root);
        expect(Object.keys(ledger).sort()).toEqual([NEXUS, TEACH]);
        expect(ledger[TEACH]).toEqual(["commands/nxsx.teach-plan.md", "commands/nxsx.teach.md", "skills/nxsx-workbook/SKILL.md"]);
    });

    it("names a path both packages ship rather than resolving it silently", () => {
        const root: string = makeTmpDir("teach-root-");
        const shared: string = makeTmpDir("shared-payload-");
        fs.mkdirSync(path.join(shared, "commands"), { recursive: true });
        fs.writeFileSync(path.join(shared, "commands", "nxsx.teach.md"), "shipped by nexus too\n");
        deployComponents(payloadDirectory(shared), root, { owner: NEXUS });

        const result = deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(result.claimedByOthers).toEqual(["commands/nxsx.teach.md"]);
        expect(fs.readFileSync(path.join(root, "commands", "nxsx.teach.md"), "utf8")).toContain("v1");
    });

    it("never removes a path Nexus's record claims, even under our own prefix", () => {
        const root: string = makeTmpDir("teach-root-");
        const shared: string = makeTmpDir("shared-payload-");
        fs.mkdirSync(path.join(shared, "commands"), { recursive: true });
        fs.writeFileSync(path.join(shared, "commands", "nxsx.teach.md"), "shipped by nexus too\n");
        deployComponents(payloadDirectory(shared), root, { owner: NEXUS });

        const result = deployComponents(EMPTY_PAYLOAD, root, { owner: TEACH });

        expect(result.removed).toEqual([]);
        expect(fs.existsSync(path.join(root, "commands", "nxsx.teach.md"))).toBe(true);
    });

    it("adopts what it finds when the root has no record of us yet, and records it", () => {
        const root: string = makeTmpDir("teach-root-");
        fs.mkdirSync(path.join(root, "commands"), { recursive: true });
        fs.writeFileSync(path.join(root, "commands", "nxsx.retired.md"), "from an older release\n");
        expect(fs.existsSync(path.join(root, INSTALL_LEDGER_FILE))).toBe(false);

        const result = deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(result.removed).toEqual(["commands/nxsx.retired.md"]);
        expect(readInstallLedger(root)[TEACH]).toHaveLength(3);
    });

    it("converges: running both packages twice changes nothing", () => {
        const root: string = makeTmpDir("teach-root-");
        deployComponents(payloadDirectory(makeNexusPayload()), root, { owner: NEXUS });
        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });
        const first = snapshot(root);

        deployComponents(payloadDirectory(makeNexusPayload()), root, { owner: NEXUS });
        deployComponents(payloadDirectory(makePayload()), root, { owner: TEACH });

        expect(snapshot(root)).toEqual(first);
    });
});
