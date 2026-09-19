/**
 * The committed fingerprint is the only thing that can say a release's payload has fallen behind
 * the authored tree. A pin that is allowed to go stale says nothing, so the suite checks it.
 */

import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { currentFingerprint, fingerprintMismatch, readFingerprint } from "./fingerprint";

const REPO_ROOT: string = path.resolve(import.meta.dirname, "..");

describe("the fingerprint pin", () => {
    it("matches the executable and the component payload as they stand in the checkout", async () => {
        const mismatch: string | null = fingerprintMismatch(readFingerprint(REPO_ROOT), await currentFingerprint(REPO_ROOT));

        expect(mismatch, mismatch ?? undefined).toBeNull();
    }, 60000);

    it("names which part went stale rather than only reporting two unequal digests", () => {
        const message: string | null = fingerprintMismatch({ "nxsx.mjs": "a".repeat(64), "claude-components": "b".repeat(64) }, { "nxsx.mjs": "c".repeat(64), "claude-components": "b".repeat(64) });

        expect(message).toContain("nxsx.mjs: STALE");
        expect(message).not.toContain("claude-components: STALE");
    });

    it("reports a part the pin has never seen, so a new one cannot ship unpinned", () => {
        expect(fingerprintMismatch({}, { "nxsx.mjs": "a".repeat(64) })).toContain("MISSING from the pin");
    });
});
