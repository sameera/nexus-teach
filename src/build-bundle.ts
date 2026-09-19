/**
 * The esbuild bundling primitive: compiles the CLI entry point into a self-contained ESM bundle
 * targeting the repo's Node floor. Every non-builtin import is inlined, so the published executable
 * has no runtime dependency on anything — including the `@sameeraperera/nexus` package whose
 * published sources this build resolves `@nexus/...` specifiers against. Two installed packages
 * therefore cannot reach different versions of the same library at run time, because at run time
 * neither reaches a library at all.
 *
 * `absWorkingDir` is pinned to the entry's own directory so the output is byte-identical regardless
 * of the caller's cwd: esbuild's leading `// <entry-path>` banner is otherwise computed relative to
 * `process.cwd()`, which would make the fingerprint pin depend on where the build ran.
 */

import * as path from "node:path";
import * as esbuild from "esbuild";
import { nexusLibraryPlugin } from "./nexus-library-alias.mjs";

export interface BuiltBundle {
    code: string;
}

export async function buildBundle(entryAbsPath: string): Promise<BuiltBundle> {
    const result = await esbuild.build({
        entryPoints: [entryAbsPath],
        absWorkingDir: path.dirname(entryAbsPath),
        bundle: true,
        platform: "node",
        format: "esm",
        target: "node22",
        write: false,
        plugins: [nexusLibraryPlugin(path.dirname(entryAbsPath))],
        // The shebang makes the bundle directly executable, which is what a package manager relies
        // on when it links the declared binary onto the caller's path. It lives in the banner rather
        // than being prepended when the release tree is staged, so the bytes the fingerprint records
        // are the bytes that ship.
        //
        // Inlined CJS dependencies (the `yaml` package) require() Node builtins at module scope;
        // esbuild's ESM output has no `require`, so its shim throws on a plain-node run. Provide a
        // real require via createRequire — constant bytes, so the fingerprint stays deterministic.
        banner: {
            js: '#!/usr/bin/env node\nimport { createRequire as __teachCreateRequire } from "node:module"; const require = __teachCreateRequire(import.meta.url);',
        },
    });
    return { code: result.outputFiles[0].text };
}
