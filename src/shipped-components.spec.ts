/**
 * The shipped component bodies, checked against the executable that actually ships.
 *
 * Two things can go wrong silently once the teaching stage has an executable of its own. A body can
 * keep addressing `nexus workbook`, which resolves to the *other* package and will stop existing
 * when Nexus drops the verb. And a body can name a subverb this executable does not declare, which
 * fails only when a learner reaches that step of a sitting. Both are readable from the bodies, so
 * both are checked here rather than discovered in a session.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { DISPATCH_NAMES } from "./nxsx-cli";
import { COMPONENT_SUBTREES, authoredComponentRoot, listComponentFiles } from "./component-payload";
import { isTeachingNamespacedPath } from "./teaching-namespace";

const ROOT: string = authoredComponentRoot(import.meta.dirname);
const BODIES: { rel: string; text: string }[] = listComponentFiles(ROOT).map((rel) => ({
    rel,
    text: fs.readFileSync(path.join(ROOT, ...rel.split("/")), "utf8"),
}));

describe("the components this package ships", () => {
    it("are all under this package's namespace, so a Nexus sweep can never own one", () => {
        expect(BODIES.length).toBeGreaterThan(0);
        expect(BODIES.map((b) => b.rel).filter((rel) => !isTeachingNamespacedPath(rel))).toEqual([]);
    });

    it("sit only in the three managed subtrees", () => {
        expect(BODIES.map((b) => b.rel.split("/")[0]).filter((top) => !COMPONENT_SUBTREES.includes(top))).toEqual([]);
    });

    it("address this package's executable, never the one the verb used to live in", () => {
        const stale: string[] = BODIES.filter((b) => /`[^`]*\bnexus workbook\b/.test(b.text)).map((b) => b.rel);

        expect(stale).toEqual([]);
    });

    it("name only subverbs the executable declares", () => {
        const undeclared: string[] = [];
        for (const { rel, text } of BODIES) {
            for (const match of text.matchAll(/\bnxsx ([a-z][a-z-]*)(?: ([a-z][a-z-]*))?/g)) {
                const one: string = match[1];
                const two: string | undefined = match[2];
                if (DISPATCH_NAMES.includes(`${one} ${two ?? ""}`.trim()) || DISPATCH_NAMES.includes(one)) {
                    continue;
                }
                undeclared.push(`${rel}: nxsx ${one}${two === undefined ? "" : ` ${two}`}`);
            }
        }

        expect([...new Set(undeclared)]).toEqual([]);
    });

    it("declares a frontmatter name matching the file it ships as", () => {
        const mismatched: string[] = [];
        for (const { rel, text } of BODIES) {
            const declared = /^---\n(?:.*\n)*?name:\s*(\S+)\s*\n/.exec(text);
            if (declared === null) {
                continue;
            }
            const segments: string[] = rel.split("/");
            const expected: string = segments[0] === "skills" ? segments[1] : segments[segments.length - 1].replace(/\.md$/, "");
            if (declared[1] !== expected) {
                mismatched.push(`${rel}: declares ${declared[1]}`);
            }
        }

        expect(mismatched).toEqual([]);
    });
});
