/** `pnpm pin` — rebuild the two parts and rewrite the committed fingerprint. */

import * as path from "node:path";
import { isDirectRun } from "./entry-point.js";
import { currentFingerprint, writeFingerprint, type Fingerprint } from "./fingerprint.js";

async function main(): Promise<void> {
    const repoRoot: string = path.resolve(import.meta.dirname, "..");
    const fingerprint: Fingerprint = await currentFingerprint(repoRoot);
    writeFingerprint(repoRoot, fingerprint);
    for (const [key, value] of Object.entries(fingerprint)) {
        console.log(`  ${key}  ${value.slice(0, 16)}…`);
    }
}

if (isDirectRun(import.meta.url, process.argv[1])) {
    main();
}
