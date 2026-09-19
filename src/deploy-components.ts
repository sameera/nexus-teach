/**
 * The component mirror: the sole component installer for this package. Installing at the account's
 * configuration directory and emptying it are two callers of this one function; nothing else writes
 * components.
 *
 * Semantics: a file-tree MIRROR over the explicit managed set, not a blind directory copy and not a
 * merge. Every payload file is written into the component root (created or overwritten in place),
 * and any file the sweep owns that the payload no longer carries is removed — so a second run with
 * no upstream change converges to an identical component set. User-owned files are never touched.
 * Idempotency comes from "make the destination match the managed set", never from timestamps or
 * diffs. An empty payload is a DECLARED mode, never an empty directory: the throw on a missing
 * payload is the only thing standing between "the install could not find what it ships" and "delete
 * every component this account has", and a mirror of an empty directory cannot tell those apart.
 *
 * **The sweep, and why it has two halves.** This package shares a component root with Nexus, and
 * neither may clear the other's files. What a package removes is what its own entry in the shared
 * install record claims — never what carries a prefix, and never what another package's entry
 * claims. The prefix still contributes candidates, for the one case the record cannot answer: a
 * component root written before this package had a record there. Nexus's mirror holds the same two
 * halves against the same record file; the two implementations are separate because the packages
 * are, and the record format is the contract between them.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { isTeachingNamespacedPath } from "./teaching-namespace.js";
import { COMPONENT_SUBTREES, listComponentFiles } from "./component-payload.js";

/**
 * Where a component root records which package placed which file — the contract this package shares
 * with Nexus, which reads and writes the same file under its own key. A dotfile at the root's top
 * level, which the sweep never looks at: the top level holds the harness's own account state and is
 * out of bounds.
 */
export const INSTALL_LEDGER_FILE = ".nexus-install.json";

/** Component-root-relative paths, by the name of the package that placed them. */
export type InstallLedger = Record<string, string[]>;

/** The record a component root holds, or an empty one when it holds none or holds nonsense. */
export function readInstallLedger(componentRoot: string): InstallLedger {
    const file: string = path.join(componentRoot, INSTALL_LEDGER_FILE);
    if (!fs.existsSync(file)) {
        return {};
    }
    try {
        const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }
        const ledger: InstallLedger = {};
        for (const [owner, paths] of Object.entries(parsed as Record<string, unknown>)) {
            if (Array.isArray(paths) && paths.every((p) => typeof p === "string")) {
                ledger[owner] = paths as string[];
            }
        }
        return ledger;
    } catch {
        // An unreadable record reads as no record. Falling back to the prefix sweep is the
        // behaviour of a root that predates the record, and it cannot touch another package's
        // differently-prefixed files.
        return {};
    }
}

function writeInstallLedger(componentRoot: string, ledger: InstallLedger): void {
    const file: string = path.join(componentRoot, INSTALL_LEDGER_FILE);
    if (Object.keys(ledger).length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    const ordered: InstallLedger = {};
    for (const owner of Object.keys(ledger).sort()) {
        ordered[owner] = [...ledger[owner]].sort();
    }
    fs.mkdirSync(componentRoot, { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(ordered, null, 4)}\n`);
}

/** What to mirror: a payload directory, or emptiness said out loud. */
export type ComponentPayload = { kind: "directory"; dir: string } | { kind: "empty" };

/** Removal semantics — the only way to ask this primitive to end with nothing installed. */
export const EMPTY_PAYLOAD: ComponentPayload = { kind: "empty" };

/** The ordinary payload: the managed set under `dir`. */
export function payloadDirectory(dir: string): ComponentPayload {
    return { kind: "directory", dir };
}

/** How a payload file is placed: as its bytes, or as a pointer at the file the payload holds. */
export type WriteMode = "copy" | "pointer";

export interface MirrorOptions {
    /** Default `copy`. `pointer` writes one pointer per payload file (the maintainer's mode). */
    mode?: WriteMode;
    /** The package this install speaks for. Scopes the sweep, and is the key it records under. */
    owner: string;
}

export interface DeployResult {
    /** Component-root-relative paths written (created or overwritten). */
    written: string[];
    /** Component-root-relative paths removed from the target. */
    removed: string[];
    /**
     * Paths this payload wrote that another installed package's record also claims — a collision
     * the caller has to hear about rather than one the mirror can resolve. The other package's
     * files this run merely left alone are not a collision: that is the ordinary state of a
     * shared root.
     */
    claimedByOthers: string[];
}

/** True only for a directory the path itself names — never for a pointer at one. */
function isRealDirectory(candidate: string): boolean {
    try {
        return fs.lstatSync(candidate).isDirectory();
    } catch {
        return false;
    }
}

/** True for a path that really is there — a pointer counts as itself, never as what it names. */
function pathExists(candidate: string): boolean {
    try {
        fs.lstatSync(candidate);
        return true;
    } catch {
        return false;
    }
}

/** True for a component-root-relative path sitting inside one of the three managed subtrees. */
function isUnderManagedSubtree(rel: string): boolean {
    const segments: string[] = rel.split("/");
    return segments.length > 1 && COMPONENT_SUBTREES.includes(segments[0]);
}

function walkFiles(dir: string, base: string, out: string[]): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs: string = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(abs, base, out);
        } else {
            // A pointer is an entry, never a door: `isDirectory()` is false for a link to a
            // directory, so no traversal ever leaves the location we were given.
            out.push(path.relative(base, abs).split(path.sep).join("/"));
        }
    }
}

/** Remove now-empty directories left behind under `root` after stale-file removal. */
function pruneEmptyDirs(root: string): void {
    if (!isRealDirectory(root)) {
        return;
    }
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            pruneEmptyDirs(path.join(root, entry.name));
        }
    }
    if (fs.readdirSync(root).length === 0) {
        fs.rmdirSync(root);
    }
}

/**
 * Mirror `payload` into `componentRoot`. Read-only toward everything outside the managed set, and
 * toward the component root's own top level, which holds the harness's account state.
 */
export function deployComponents(payload: ComponentPayload, componentRoot: string, options: MirrorOptions): DeployResult {
    let payloadFiles: string[] = [];
    if (payload.kind === "directory") {
        if (!fs.existsSync(payload.dir) || !fs.statSync(payload.dir).isDirectory()) {
            throw new Error(`component payload not found at ${payload.dir}`);
        }
        payloadFiles = listComponentFiles(payload.dir);
    }
    const payloadSet = new Set<string>(payloadFiles);

    const ledger: InstallLedger = readInstallLedger(componentRoot);
    const foreign = new Set<string>();
    for (const [owner, paths] of Object.entries(ledger)) {
        if (owner !== options.owner) {
            for (const rel of paths) {
                foreign.add(rel);
            }
        }
    }
    const mine: Set<string> | null = ledger[options.owner] === undefined ? null : new Set(ledger[options.owner]);

    const claimedByOthers: string[] = [];
    const written: string[] = [];
    for (const rel of payloadFiles) {
        const segments: string[] = rel.split("/");
        const dest: string = path.join(componentRoot, ...segments);
        const src: string = path.join((payload as { dir: string }).dir, ...segments);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        // Unlink first: overwriting in place would write THROUGH a pointer left by an earlier
        // pointing install, straight into the maintainer's checkout.
        fs.rmSync(dest, { force: true });
        if ((options.mode ?? "copy") === "pointer") {
            fs.symlinkSync(src, dest);
        } else {
            fs.copyFileSync(src, dest);
        }
        written.push(rel);
        if (foreign.has(rel)) {
            claimedByOthers.push(rel);
        }
    }

    const candidateSet = new Set<string>();
    for (const subtree of COMPONENT_SUBTREES) {
        const subtreeRoot: string = path.join(componentRoot, subtree);
        if (!isRealDirectory(subtreeRoot)) {
            continue;
        }
        const existing: string[] = [];
        walkFiles(subtreeRoot, componentRoot, existing);
        for (const rel of existing) {
            if (isTeachingNamespacedPath(rel)) {
                candidateSet.add(rel);
            }
        }
    }
    if (mine !== null) {
        for (const rel of mine) {
            // The record is a claim about what was placed, not a licence to delete an arbitrary
            // path: still only the managed subtrees, and still only a file that is really there.
            if (isUnderManagedSubtree(rel) && pathExists(path.join(componentRoot, ...rel.split("/")))) {
                candidateSet.add(rel);
            }
        }
    }

    const removed: string[] = [];
    for (const rel of [...candidateSet].sort()) {
        if (payloadSet.has(rel) || foreign.has(rel)) {
            continue;
        }
        if (mine !== null && !mine.has(rel)) {
            continue;
        }
        fs.rmSync(path.join(componentRoot, ...rel.split("/")));
        removed.push(rel);
    }
    for (const subtree of COMPONENT_SUBTREES) {
        pruneEmptyDirs(path.join(componentRoot, subtree));
    }

    const next: InstallLedger = { ...ledger };
    if (payloadFiles.length === 0) {
        delete next[options.owner];
    } else {
        next[options.owner] = payloadFiles;
    }
    writeInstallLedger(componentRoot, next);

    return { written, removed, claimedByOthers: Array.from(new Set(claimedByOthers)).sort() };
}
