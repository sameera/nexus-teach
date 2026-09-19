/**
 * Types for the one rule that maps `@nexus/<library>/<module>` onto the sources the
 * `@sameeraperera/nexus` package publishes. The rule itself is plain JavaScript because three
 * toolchains read it and only one of them loads TypeScript.
 */

import type { Plugin } from "esbuild";

export declare function nexusLibraryRoot(fromDir: string): string;
export declare const NEXUS_SPECIFIER: RegExp;
export declare function resolveNexusSpecifier(specifier: string, fromDir: string): string | null;
export declare const NEXUS_LIBRARY_ALIAS: { find: RegExp; replacement: string };
export declare function nexusLibraryPlugin(fromDir: string): Plugin;
