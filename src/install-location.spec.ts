/**
 * The install location. The thing worth pinning is the refusal: a configuration directory that was
 * named but cannot be used is an error, never a silent fall back to the default — installing
 * components somewhere the harness is not reading looks exactly like success.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
    CONFIG_DIR_VAR,
    describeInstallLocation,
    describeInstalledContent,
    inspectInstallLocation,
    resolveInstallLocation,
} from "./install-location";

let tmpDirs: string[] = [];
function makeTmpDir(): string {
    const dir: string = fs.mkdtempSync(path.join(os.tmpdir(), "teach-location-"));
    tmpDirs.push(dir);
    return dir;
}
afterEach(() => {
    for (const dir of tmpDirs) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
});

describe("resolveInstallLocation", () => {
    it("uses the configuration directory the environment names", () => {
        const result = resolveInstallLocation({ env: { [CONFIG_DIR_VAR]: "/opt/claude" } });

        expect(result).toEqual({ ok: true, path: "/opt/claude", source: "environment" });
    });

    it("falls back to the home-directory default only when nothing was named", () => {
        const result = resolveInstallLocation({ env: {}, homedir: () => "/home/someone" });

        expect(result).toEqual({ ok: true, path: path.join("/home/someone", ".claude"), source: "home-default" });
    });

    it("refuses a relative value rather than resolving it against whatever cwd happens to be", () => {
        const result = resolveInstallLocation({ env: { [CONFIG_DIR_VAR]: "relative/dir" } });

        expect(result.ok).toBe(false);
        expect(result.ok === false && result.message).toContain(CONFIG_DIR_VAR);
    });

    it("refuses an empty value rather than treating it as unset", () => {
        const result = resolveInstallLocation({ env: { [CONFIG_DIR_VAR]: "   " } });

        expect(result.ok).toBe(false);
    });

    it("refuses when no home directory resolves and nothing was named", () => {
        const result = resolveInstallLocation({ env: {}, homedir: () => "" });

        expect(result.ok).toBe(false);
    });
});

describe("inspectInstallLocation", () => {
    it("reports only this package's components, never the ones Nexus placed", () => {
        const root: string = makeTmpDir();
        fs.mkdirSync(path.join(root, "commands"), { recursive: true });
        fs.writeFileSync(path.join(root, "commands", "nxsx.teach.md"), "ours\n");
        fs.writeFileSync(path.join(root, "commands", "nxs.epic.md"), "nexus\n");
        fs.writeFileSync(path.join(root, "commands", "someone-elses.md"), "theirs\n");

        const state = inspectInstallLocation(root);

        expect(state.files).toEqual(["commands/nxsx.teach.md"]);
        expect(state.populated).toBe(true);
        expect(state.content).toBe("copy");
    });

    it("identifies a pointing install by the link itself and names the checkout", () => {
        const root: string = makeTmpDir();
        const checkout: string = makeTmpDir();
        fs.mkdirSync(path.join(checkout, "commands"), { recursive: true });
        fs.writeFileSync(path.join(checkout, "commands", "nxsx.teach.md"), "ours\n");
        fs.mkdirSync(path.join(root, "commands"), { recursive: true });
        fs.symlinkSync(path.join(checkout, "commands", "nxsx.teach.md"), path.join(root, "commands", "nxsx.teach.md"));

        const state = inspectInstallLocation(root);

        expect(state.content).toBe("checkout-pointer");
        expect(state.checkout).toBe(checkout);
        expect(describeInstalledContent(state)).toContain(checkout);
    });

    it("says so plainly when the root holds none of ours", () => {
        const root: string = makeTmpDir();

        expect(describeInstalledContent(inspectInstallLocation(root))).toBe("install location holds: no teaching component set");
    });
});

describe("describeInstallLocation", () => {
    it("names where the answer came from, so a surprising path can be traced to its rule", () => {
        expect(describeInstallLocation({ path: "/opt/claude", source: "environment" })).toContain(`$${CONFIG_DIR_VAR}`);
        expect(describeInstallLocation({ path: "/home/a/.claude", source: "home-default" })).toContain("home-directory default");
    });
});
