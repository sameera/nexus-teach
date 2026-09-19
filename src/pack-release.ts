/**
 * The release tree: the directory the published package's `files` allowlist points at, assembled
 * from the two parts that ship together — the bundled executable and the component payload.
 *
 * The parts are staged into one directory under the package root rather than published from where
 * they live in the checkout, because the package root is what the executable walks up to when it
 * resolves the single version declaration in `package.json`.
 *
 * Nothing is fetched at install time: the payload travels inside the package, so an adopter runs no
 * network step after installing and the executable and its payload cannot reach different versions.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { buildBundle } from "./build-bundle.js";
import { isDirectRun } from "./entry-point.js";
import { COMPONENT_PAYLOAD_DIRNAME, authoredComponentRoot, listComponentFiles } from "./component-payload.js";

/** The staged directory, relative to the package root. Named in the manifest's `files`. */
export const RELEASE_TREE_DIRNAME = "dist";

/** The one binary name the manifest declares. */
export const BIN_NAME = "nxsx";

/** The CLI entry point, relative to `src/`. */
export const ENTRY_POINT = "nxsx-cli.ts";

/** Stages every published part under `<repoRoot>/dist`, replacing whatever was there. */
export async function buildReleaseTree(repoRoot: string, outDir?: string): Promise<string[]> {
    const releaseDir: string = outDir ?? path.join(repoRoot, RELEASE_TREE_DIRNAME);
    fs.rmSync(releaseDir, { recursive: true, force: true });
    fs.mkdirSync(releaseDir, { recursive: true });

    const srcDir: string = path.join(repoRoot, "src");
    const { code } = await buildBundle(path.join(srcDir, ENTRY_POINT));
    const bundlePath: string = path.join(releaseDir, `${BIN_NAME}.mjs`);
    fs.writeFileSync(bundlePath, code);
    fs.chmodSync(bundlePath, 0o755);
    const written: string[] = [bundlePath];

    const componentRoot: string = authoredComponentRoot(srcDir);
    for (const rel of listComponentFiles(componentRoot)) {
        const dest: string = path.join(releaseDir, COMPONENT_PAYLOAD_DIRNAME, ...rel.split("/"));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(path.join(componentRoot, ...rel.split("/")), dest);
        written.push(dest);
    }
    return written;
}

async function main(): Promise<void> {
    const repoRoot: string = path.resolve(import.meta.dirname, "..");
    const written: string[] = await buildReleaseTree(repoRoot);
    console.log(`Release tree: ${written.length} files under ${path.join(repoRoot, RELEASE_TREE_DIRNAME)}`);
}

if (isDirectRun(import.meta.url, process.argv[1])) {
    main();
}
