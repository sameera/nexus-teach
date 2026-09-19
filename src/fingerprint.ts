/**
 * The fingerprint pin: a committed record of what the release's two parts hash to, so a
 * distributable whose payload lags the authored tree fails the suite instead of shipping stale
 * components.
 *
 * It is one file with two entries — the executable bundle and the component payload — because those
 * are the two things that can independently go stale, and a single combined hash could not say
 * which one did.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { buildBundle } from "./build-bundle.js";
import { BIN_NAME, ENTRY_POINT } from "./pack-release.js";
import { authoredComponentRoot, hashComponentTree } from "./component-payload.js";

/** The committed pin, at the repository root. */
export const FINGERPRINT_FILE = "fingerprint.json";

export type Fingerprint = Record<string, string>;

/** Key of the payload entry in the pin. */
export const PAYLOAD_KEY = "claude-components";

/** Hash the two parts as they stand in `repoRoot` right now. */
export async function currentFingerprint(repoRoot: string): Promise<Fingerprint> {
    const srcDir: string = path.join(repoRoot, "src");
    const { code } = await buildBundle(path.join(srcDir, ENTRY_POINT));
    return {
        [`${BIN_NAME}.mjs`]: createHash("sha256").update(code).digest("hex"),
        [PAYLOAD_KEY]: hashComponentTree(authoredComponentRoot(srcDir)),
    };
}

/** The pin as committed, or an empty record when there is none yet. */
export function readFingerprint(repoRoot: string): Fingerprint {
    const file: string = path.join(repoRoot, FINGERPRINT_FILE);
    if (!fs.existsSync(file)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(file, "utf8")) as Fingerprint;
}

export function writeFingerprint(repoRoot: string, fingerprint: Fingerprint): void {
    const ordered: Fingerprint = {};
    for (const key of Object.keys(fingerprint).sort()) {
        ordered[key] = fingerprint[key];
    }
    fs.writeFileSync(path.join(repoRoot, FINGERPRINT_FILE), `${JSON.stringify(ordered, null, 4)}\n`);
}

/**
 * What differs between the pin and the parts on disk, as one line per entry, or null when they
 * agree. The message names which part is stale, because "re-pin" is the remedy for one of them and
 * "you changed a component" is the explanation for the other.
 */
export function fingerprintMismatch(pinned: Fingerprint, current: Fingerprint): string | null {
    const lines: string[] = [];
    for (const key of Object.keys(current).sort()) {
        if (pinned[key] === undefined) {
            lines.push(`  - ${key}: MISSING from the pin`);
        } else if (pinned[key] !== current[key]) {
            lines.push(`  - ${key}: STALE — the pin records ${pinned[key].slice(0, 12)}… but the source hashes ${current[key].slice(0, 12)}…`);
        }
    }
    for (const key of Object.keys(pinned).sort()) {
        if (current[key] === undefined) {
            lines.push(`  - ${key}: pinned but no longer produced`);
        }
    }
    if (lines.length === 0) {
        return null;
    }
    return ["Release fingerprint mismatch — the pin is stale relative to the in-repo source:", ...lines, "Re-pin with `pnpm pin`."].join("\n");
}
