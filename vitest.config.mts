import * as path from "node:path";
import { defineConfig } from "vitest/config";
import { NEXUS_LIBRARY_ALIAS } from "./src/nexus-library-alias.mjs";

export default defineConfig({
    root: import.meta.dirname,
    resolve: {
        // The Nexus pipeline libraries this stage reads roadmaps and config through are published
        // as source by the `@sameeraperera/nexus` package (epic #677, goal #690). One rule maps
        // every `@nexus/<library>/<module>` specifier onto that published tree, so no import in the
        // moved code had to change and nothing here keeps a table of subpaths.
        //
        // A `link:` override puts those sources outside this repo, where their bare `yaml` import
        // cannot reach this repo's install; pin it here.
        alias: [NEXUS_LIBRARY_ALIAS, { find: /^yaml$/, replacement: path.join(import.meta.dirname, "node_modules", "yaml") }],
    },
    test: {
        name: "nexus-teach",
        watch: false,
        globals: true,
        environment: "node",
        // These specs parse real HTML through jsdom and spawn real subprocesses.
        testTimeout: 20000,
        include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
        reporters: ["default"],
        coverage: {
            reportsDirectory: "./test-output/vitest/coverage",
            provider: "v8" as const,
        },
    },
});
