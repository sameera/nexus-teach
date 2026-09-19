/**
 * The one definition of "this package's component".
 *
 * The teaching stage ships beside Nexus, into the same component root, and neither package may
 * sweep the other's files. Nexus owns the `nxs.`/`nxs-` prefixes and matches on them; this package
 * owns `nxsx.`/`nxsx-`, which fails both of those tests — that is the whole reason the names were
 * changed before the split (Nexus epic #677, goal #688).
 *
 * The rule is about a PATH SEGMENT, not a file name: a file is ours when the first segment beneath
 * a managed subtree carries the prefix, so a whole `skills/nxsx-workbook/` directory is owned by its
 * directory name and an adopter's own file sitting beside it is not.
 */

/** The namespace prefixes this package owns. */
const NAMESPACE_PREFIXES: readonly string[] = ["nxsx.", "nxsx-"];

/** True for a single path segment this package owns. */
export function isTeachingNamespaced(segment: string): boolean {
    return NAMESPACE_PREFIXES.some((prefix) => segment.startsWith(prefix));
}

/** True when a component-root-relative path names a file this package owns under a subtree. */
export function isTeachingNamespacedPath(rel: string): boolean {
    const segments: string[] = rel.split("/");
    return segments.length > 1 && isTeachingNamespaced(segments[1]);
}
