/**
 * The release identity. One semantic version covers the executable and the component payload
 * together, because they ship as one artifact and cannot be at different versions.
 *
 * That version is declared exactly once, as the `version` of this package's own manifest, and every
 * reader reaches it the same way: walk up from the reader's own file position until a manifest
 * naming this package appears. The walk is what makes the one declaration serve both layouts with
 * no build step — in a source checkout it lands on the repository root, and in a distributable it
 * lands on the package root. An unresolved declaration is reported as `null`, never as a guessed
 * version.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** The name that identifies this package's own manifest among the manifests the walk passes. */
export const RELEASE_PACKAGE_NAME = "@sameeraperera/nexus-teach";

/** The `version` of the manifest at `dir` when it names this release, else null. */
function declaredAt(dir: string): string | null {
    const candidate: string = path.join(dir, "package.json");
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
        return null;
    }
    let manifest: { name?: unknown; version?: unknown };
    try {
        manifest = JSON.parse(fs.readFileSync(candidate, "utf8"));
    } catch {
        return null;
    }
    if (manifest.name !== RELEASE_PACKAGE_NAME || typeof manifest.version !== "string") {
        return null;
    }
    const declared: string = manifest.version.trim();
    return declared === "" ? null : declared;
}

/** The nearest declaration at or above `startDir`, or null when there is none. */
export function resolveReleaseVersion(startDir: string): string | null {
    let dir: string = path.resolve(startDir);
    for (;;) {
        const declared: string | null = declaredAt(dir);
        if (declared !== null) {
            return declared;
        }
        const parent: string = path.dirname(dir);
        if (parent === dir) {
            return null;
        }
        dir = parent;
    }
}

/** The release this executable is part of, resolved from where this module itself sits. */
export function releaseVersion(): string | null {
    return resolveReleaseVersion(import.meta.dirname);
}
