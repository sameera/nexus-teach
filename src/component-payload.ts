/**
 * The component payload: the authored component tree this package ships, and the primitives that
 * carry it into the distributable.
 *
 * The managed set is exactly the three component subtrees (`commands/`, `agents/`, `skills/`).
 * Everything else beside them is user-owned and never vendored, never deployed, never hashed.
 * `AUTHORED_ROOT_DIRNAME` is the one definition of where the authored tree lives: an ordinary
 * tracked directory, deliberately *not* one the harness loads, because authoring and loading are
 * separate and the account's install location is the only path by which components run.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

/** The managed component subtrees. */
export const COMPONENT_SUBTREES: string[] = ["commands", "agents", "skills"];

/** Directory name the payload travels under inside the release tree. */
export const COMPONENT_PAYLOAD_DIRNAME = "claude-components";

/** The repository-root directory holding the authored component tree. */
export const AUTHORED_ROOT_DIRNAME = "components";

/** The authored component tree of the checkout whose sources live under `srcDir`. */
export function authoredComponentRoot(srcDir: string): string {
    return path.resolve(srcDir, "..", AUTHORED_ROOT_DIRNAME);
}

/** The authored component tree of an arbitrary checkout — what a pointing install points at. */
export function checkoutComponentRoot(checkoutRoot: string): string {
    return path.join(checkoutRoot, AUTHORED_ROOT_DIRNAME);
}

function walkFiles(dir: string, base: string, out: string[]): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs: string = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(abs, base, out);
        } else {
            out.push(path.relative(base, abs).split(path.sep).join("/"));
        }
    }
}

/** Every managed component file under `componentDir`, as sorted posix-style relative paths. */
export function listComponentFiles(componentDir: string): string[] {
    const files: string[] = [];
    for (const subtree of COMPONENT_SUBTREES) {
        const root: string = path.join(componentDir, subtree);
        if (fs.existsSync(root) && fs.statSync(root).isDirectory()) {
            walkFiles(root, componentDir, files);
        }
    }
    return files.sort();
}

/**
 * sha256 of the managed set's canonical manifest: one `relpath\ncontent-sha256\n` record per file,
 * sorted by path. Any managed byte, added file or removed file changes the hash; files outside the
 * managed subtrees never do.
 */
export function hashComponentTree(componentDir: string): string {
    const manifest = createHash("sha256");
    for (const rel of listComponentFiles(componentDir)) {
        const content: Buffer = fs.readFileSync(path.join(componentDir, ...rel.split("/")));
        manifest.update(rel);
        manifest.update("\n");
        manifest.update(createHash("sha256").update(content).digest("hex"));
        manifest.update("\n");
    }
    return manifest.digest("hex");
}
