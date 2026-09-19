/**
 * One rule maps every `@nexus/<library>/<module>` specifier onto the source the
 * `@sameeraperera/nexus` package publishes (epic #677, goal #690).
 *
 * This stage reads roadmaps out of Nexus epic issues, resolves the delivery config, verifies
 * decision-record digests and resolves a multi-repo workspace. Those are Nexus's capabilities, and
 * the alternative to reaching them was a copy of 2,860 lines of workspace and epic resolution
 * living here and drifting out of step with the repository that keeps changing them.
 *
 * It is a rule rather than a table because the published layout drops the `src/` segment, which
 * makes a library's declared subpath its staged filename: nothing has to be enumerated, and a new
 * subpath needs no edit here. Nexus's own suite pins that property, so a release that broke it
 * would fail there rather than here.
 *
 * Plain JavaScript because three toolchains have to read it — the bundler, the test runner and the
 * type checker's sibling `paths` block — and only one of them can load TypeScript.
 */

import { createRequire } from "node:module";
import * as path from "node:path";

const NEXUS_PACKAGE = "@sameeraperera/nexus";

/** Where the published library sources sit inside the installed Nexus package. */
export function nexusLibraryRoot(fromDir) {
    const require = createRequire(path.join(fromDir, "noop.js"));
    return path.join(path.dirname(require.resolve(`${NEXUS_PACKAGE}/package.json`)), "dist", "lib");
}

/** The matcher every toolchain uses: `@nexus/<library>/<module>` and nothing else. */
export const NEXUS_SPECIFIER = /^@nexus\/([^/]+)\/(.+)$/;

/** Resolve one specifier to an absolute file, or null when it is not one of ours. */
export function resolveNexusSpecifier(specifier, fromDir) {
    const match = NEXUS_SPECIFIER.exec(specifier);
    if (match === null) {
        return null;
    }
    return path.join(nexusLibraryRoot(fromDir), match[1], `${match[2]}.ts`);
}

/** The Vite/Vitest form of the same rule. */
export const NEXUS_LIBRARY_ALIAS = {
    find: NEXUS_SPECIFIER,
    replacement: `${nexusLibraryRoot(import.meta.dirname)}/$1/$2.ts`,
};

/** The esbuild form of the same rule. */
export function nexusLibraryPlugin(fromDir) {
    return {
        name: "nexus-published-libraries",
        setup(build) {
            build.onResolve({ filter: NEXUS_SPECIFIER }, (args) => ({
                path: resolveNexusSpecifier(args.path, fromDir),
            }));
        },
    };
}
