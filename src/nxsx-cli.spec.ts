/**
 * The executable's own verbs, driven the way a user drives them.
 *
 * The case worth having is the whole point of the package being separate: Nexus and the teaching
 * stage install into one component root, and installing or removing either must leave the other's
 * components exactly where they are.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DISPATCH_NAMES, runCli, type CliIo } from "./nxsx-cli";
import { deployComponents, payloadDirectory, readInstallLedger } from "./deploy-components";
import { CONFIG_DIR_VAR } from "./install-location";

const NEXUS = "@sameeraperera/nexus";
const TEACH = "@sameeraperera/nexus-teach";

let tmpDirs: string[] = [];
let savedConfigDir: string | undefined;

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
    if (savedConfigDir === undefined) {
        delete process.env[CONFIG_DIR_VAR];
    } else {
        process.env[CONFIG_DIR_VAR] = savedConfigDir;
    }
    savedConfigDir = undefined;
});

function useConfigDir(dir: string): void {
    savedConfigDir = process.env[CONFIG_DIR_VAR];
    process.env[CONFIG_DIR_VAR] = dir;
}

interface Captured extends CliIo {
    out: string[];
    err: string[];
}

function io(cwd: string): Captured {
    const out: string[] = [];
    const err: string[] = [];
    return { cwd, out, err, stdout: (line) => out.push(line), stderr: (line) => err.push(line) };
}

/** A checkout-shaped payload: `<dir>/components/...`, which `--from-checkout` points at. */
function makeCheckout(): string {
    const dir: string = makeTmpDir("teach-checkout-");
    for (const rel of ["commands/nxsx.teach.md", "commands/nxsx.teach-plan.md", "agents/nxsx-concept-extractor.md", "skills/nxsx-workbook/SKILL.md"]) {
        const abs: string = path.join(dir, "components", ...rel.split("/"));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, `${rel}\n`);
    }
    return dir;
}

function installNexusInto(root: string): void {
    const payload: string = makeTmpDir("nexus-payload-");
    for (const rel of ["commands/nxs.epic.md", "skills/nxs-setup/SKILL.md"]) {
        const abs: string = path.join(payload, ...rel.split("/"));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, `${rel} from nexus\n`);
    }
    deployComponents(payloadDirectory(payload), root, { owner: NEXUS });
}

describe("nxsx", () => {
    it("prints its usage when run with no verb, and names every verb it answers to", () => {
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli([], captured)).toBe(0);
        expect(captured.out.join("\n")).toContain("nxsx <install|uninstall|version|workbook>");
        expect(DISPATCH_NAMES).toContain("install");
        expect(DISPATCH_NAMES).toContain("workbook render");
    });

    it("refuses an unknown verb with a non-zero status rather than doing nothing quietly", () => {
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["teach-me"], captured)).toBe(2);
        expect(captured.err.join("\n")).toContain("unknown verb");
    });
});

describe("nxsx install", () => {
    it("places the components and says where, before anything else it prints", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        const checkout: string = makeCheckout();
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["install", "--payload", path.join(checkout, "components")], captured)).toBe(0);
        expect(captured.out[0]).toContain(`install location: ${root}`);
        expect(fs.existsSync(path.join(root, "commands", "nxsx.teach.md"))).toBe(true);
        expect(readInstallLedger(root)[TEACH]).toHaveLength(4);
    });

    it("writes pointers at a checkout when asked, so an edit is live with no install step", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        const checkout: string = makeCheckout();
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["install", "--from-checkout", checkout], captured)).toBe(0);
        const placed: string = path.join(root, "commands", "nxsx.teach.md");
        expect(fs.lstatSync(placed).isSymbolicLink()).toBe(true);
        fs.writeFileSync(path.join(checkout, "components", "commands", "nxsx.teach.md"), "edited live\n");
        expect(fs.readFileSync(placed, "utf8")).toBe("edited live\n");
    });

    it("leaves Nexus's components exactly where they are", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        installNexusInto(root);
        const checkout: string = makeCheckout();

        expect(runCli(["install", "--payload", path.join(checkout, "components")], io(makeTmpDir("cwd-")))).toBe(0);

        expect(fs.existsSync(path.join(root, "commands", "nxs.epic.md"))).toBe(true);
        expect(fs.existsSync(path.join(root, "skills", "nxs-setup", "SKILL.md"))).toBe(true);
        expect(Object.keys(readInstallLedger(root)).sort()).toEqual([NEXUS, TEACH]);
    });

    it("reports the payload it could not find rather than emptying the component root", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        const checkout: string = makeCheckout();
        runCli(["install", "--payload", path.join(checkout, "components")], io(makeTmpDir("cwd-")));
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["install", "--payload", path.join(checkout, "gone")], captured)).toBe(1);
        expect(captured.err.join("\n")).toContain("payload not found");
        expect(fs.existsSync(path.join(root, "commands", "nxsx.teach.md"))).toBe(true);
    });

    it("refuses a configuration directory it cannot use instead of choosing another one", () => {
        useConfigDir("relative/dir");
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["install"], captured)).toBe(1);
        expect(captured.err.join("\n")).toContain(CONFIG_DIR_VAR);
    });
});

describe("nxsx uninstall", () => {
    it("removes what this package placed, and only that", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        installNexusInto(root);
        const checkout: string = makeCheckout();
        runCli(["install", "--payload", path.join(checkout, "components")], io(makeTmpDir("cwd-")));
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["uninstall"], captured)).toBe(0);

        expect(captured.out.join("\n")).toContain("removed 4 component file(s)");
        expect(fs.existsSync(path.join(root, "commands", "nxsx.teach.md"))).toBe(false);
        expect(fs.existsSync(path.join(root, "commands", "nxs.epic.md"))).toBe(true);
        expect(readInstallLedger(root)[TEACH]).toBeUndefined();
        expect(readInstallLedger(root)[NEXUS]).toHaveLength(2);
    });

    it("says what the location holds before it removes anything", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        const checkout: string = makeCheckout();
        runCli(["install", "--from-checkout", checkout], io(makeTmpDir("cwd-")));
        const captured = io(makeTmpDir("cwd-"));

        runCli(["uninstall"], captured);

        expect(captured.out[1]).toContain("pointers at the checkout");
    });
});

describe("nxsx version", () => {
    it("reports the release, the payload fingerprint and where the components are installed", () => {
        const root: string = makeTmpDir("config-");
        useConfigDir(root);
        const captured = io(makeTmpDir("cwd-"));

        expect(runCli(["version"], captured)).toBe(0);

        const readOut = JSON.parse(captured.out.join("\n")) as { version: string | null; installLocation: { path: string } };
        expect(readOut.version).toMatch(/^\d+\.\d+\.\d+/);
        expect(readOut.installLocation.path).toBe(root);
    });
});
