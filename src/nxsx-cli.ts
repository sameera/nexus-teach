/**
 * `nxsx` — the teaching stage's executable.
 *
 * Four verbs, and only one of them is the stage's own work. `workbook` is the surface both teaching
 * phases drive; `install`, `uninstall` and `version` exist because this package ships components
 * into the same account-level component root Nexus installs into, and a package that places files
 * there has to be able to take them back.
 *
 * Node builtins and this repository's own modules only: the release is one self-contained bundle,
 * so the program runs on a bare `node` with no install step of its own.
 *
 *   nxsx install [--payload <dir>] [--from-checkout <dir>]   place the components at the config dir
 *   nxsx uninstall                                           take back the ones this package placed
 *   nxsx version                                             the release, its payload and where it sits
 *   nxsx workbook <sub> ...                                  make, render, read and teach a workbook
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { isDirectRun } from "./entry-point.js";
import { WORKBOOK_SUBVERBS, runWorkbookCli, type WorkbookCliIo } from "./workbook-cli.js";
import {
    EMPTY_PAYLOAD,
    deployComponents,
    payloadDirectory,
    type DeployResult,
} from "./deploy-components.js";
import {
    describeInstallLocation,
    describeInstalledContent,
    ensureInstallLocation,
    inspectInstallLocation,
    resolveInstallLocation,
    type InstallLocationResult,
    type InstallLocationState,
} from "./install-location.js";
import { COMPONENT_PAYLOAD_DIRNAME, checkoutComponentRoot, hashComponentTree } from "./component-payload.js";
import { RELEASE_PACKAGE_NAME, releaseVersion } from "./release-identity.js";

export interface CliIo {
    cwd: string;
    stdout: (line: string) => void;
    stderr: (line: string) => void;
}

/** Every dispatch name this executable answers to, subverbs included. */
export const DISPATCH_NAMES: readonly string[] = [
    "install",
    "uninstall",
    "version",
    "workbook",
    ...WORKBOOK_SUBVERBS.map((sub) => `workbook ${sub}`),
];

export const USAGE: string = [
    "usage: nxsx <install|uninstall|version|workbook> [args]",
    "  install [--payload <dir>] [--from-checkout <dir>]",
    "      Place this package's components at the Claude configuration directory. With",
    "      --from-checkout, write pointers into that checkout's components/ instead of copies,",
    "      which is the maintainer's loop: an edit is live with no install step in between.",
    "  uninstall",
    "      Remove the components this package placed, and only those. Nexus's own components, and",
    "      anything else in the component root, are left exactly where they are.",
    "  version",
    "      Print { version, componentPayload, installLocation } as JSON.",
    "  workbook <subverb> ...",
    "      The workbook surface. Run `nxsx workbook` for its own usage.",
].join("\n");

/** Where the payload sits inside an installed release, beside this module's bundle. */
function defaultPayloadDir(): string {
    return path.join(import.meta.dirname, COMPONENT_PAYLOAD_DIRNAME);
}

interface TakenOption {
    present: boolean;
    value: string | undefined;
}

/** Take `--name <value>` out of `argv` in place, or report the argument error. */
function takeOption(argv: string[], name: string, io: CliIo): TakenOption | null {
    const index: number = argv.indexOf(name);
    if (index === -1) {
        return { present: false, value: undefined };
    }
    const value: string | undefined = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
        io.stderr(`${name} needs a value\n${USAGE}`);
        return null;
    }
    argv.splice(index, 2);
    return { present: true, value };
}

/**
 * A path this package just wrote that another installed package also claims. The mirror cannot
 * resolve it — both packages ship the file, and whichever installs last is what runs — so the
 * install says which paths are in that state rather than leaving the winner to be discovered.
 */
function collisionNoticeLines(claimed: string[]): string[] {
    if (claimed.length === 0) {
        return [];
    }
    return [
        `${claimed.length} of these file(s) are also shipped by another installed package, and this install overwrote them:`,
        ...claimed.map((rel) => `  ${rel}`),
        "Whichever package installs last is the body that runs. Reinstall the other package to put its own back.",
    ];
}

function runInstall(argv: string[], io: CliIo): number {
    const rest: string[] = [...argv];
    const payloadOpt = takeOption(rest, "--payload", io);
    if (payloadOpt === null) {
        return 2;
    }
    const checkoutOpt = takeOption(rest, "--from-checkout", io);
    if (checkoutOpt === null) {
        return 2;
    }
    if (rest.length > 0) {
        io.stderr(`unknown argument for install: ${rest[0]}\n${USAGE}`);
        return 2;
    }

    const location: InstallLocationResult = resolveInstallLocation();
    if (!location.ok) {
        io.stderr(location.message);
        return 1;
    }
    // The location is named before anything changes.
    io.stdout(describeInstallLocation(location));

    const pointing: boolean = checkoutOpt.present;
    let payloadDir: string;
    if (pointing) {
        const checkout: string = path.resolve(io.cwd, checkoutOpt.value as string);
        payloadDir = checkoutComponentRoot(checkout);
        io.stdout(`pointing at checkout: ${checkout}`);
    } else {
        payloadDir = payloadOpt.value ?? defaultPayloadDir();
    }

    let result: DeployResult;
    try {
        ensureInstallLocation(location.path);
        result = deployComponents(payloadDirectory(payloadDir), location.path, {
            mode: pointing ? "pointer" : "copy",
            owner: RELEASE_PACKAGE_NAME,
        });
    } catch (error) {
        io.stderr(error instanceof Error ? error.message : String(error));
        return 1;
    }
    io.stdout(
        `installed ${result.written.length} component ${pointing ? "pointer(s)" : "file(s)"} at ${location.path}` +
            (result.removed.length > 0 ? `; removed ${result.removed.length} stale component file(s)` : ""),
    );
    for (const line of collisionNoticeLines(result.claimedByOthers)) {
        io.stdout(line);
    }
    return 0;
}

function runUninstall(argv: string[], io: CliIo): number {
    if (argv.length > 0) {
        io.stderr(`unknown argument for uninstall: ${argv[0]}\n${USAGE}`);
        return 2;
    }

    const location: InstallLocationResult = resolveInstallLocation();
    if (!location.ok) {
        io.stderr(location.message);
        return 1;
    }
    io.stdout(describeInstallLocation(location));
    io.stdout(describeInstalledContent(inspectInstallLocation(location.path)));

    let result: DeployResult;
    try {
        result = deployComponents(EMPTY_PAYLOAD, location.path, { owner: RELEASE_PACKAGE_NAME });
    } catch (error) {
        io.stderr(error instanceof Error ? error.message : String(error));
        return 1;
    }
    io.stdout(`removed ${result.removed.length} component file(s) from ${location.path}`);
    io.stdout(
        "Run this before removing the package itself: this verb ships inside the package, and the " +
            "package manager has no record of a component set copied into the configuration directory, " +
            "so removing the package first leaves the components behind with nothing left to clear them.",
    );
    return 0;
}

function runVersion(argv: string[], io: CliIo): number {
    if (argv.length > 0) {
        io.stderr(`unknown argument for version: ${argv[0]}\n${USAGE}`);
        return 2;
    }
    const location: InstallLocationResult = resolveInstallLocation();
    const payloadDir: string = defaultPayloadDir();
    const state: InstallLocationState | null = location.ok ? inspectInstallLocation(location.path) : null;
    io.stdout(
        JSON.stringify(
            {
                version: releaseVersion(),
                componentPayload: fs.existsSync(payloadDir) ? hashComponentTree(payloadDir) : null,
                installLocation: location.ok
                    ? { path: location.path, source: location.source, content: state?.content ?? null, checkout: state?.checkout ?? null }
                    : { error: location.message },
            },
            null,
            2,
        ),
    );
    return 0;
}

export function runCli(argv: string[], io: CliIo): number {
    const [verb, ...rest] = argv;
    switch (verb) {
        case undefined:
        case "--help":
        case "-h":
        case "help":
            io.stdout(USAGE);
            return 0;
        case "install":
            return runInstall(rest, io);
        case "uninstall":
            return runUninstall(rest, io);
        case "version":
            return runVersion(rest, io);
        case "workbook":
            return runWorkbookCli(rest, io as WorkbookCliIo);
        default:
            io.stderr(`unknown verb: ${verb}\n${USAGE}`);
            return 2;
    }
}

function main(): void {
    const io: CliIo = {
        cwd: process.cwd(),
        stdout: (line: string) => process.stdout.write(`${line}\n`),
        stderr: (line: string) => process.stderr.write(`${line}\n`),
    };
    process.exitCode = runCli(process.argv.slice(2), io);
}

if (isDirectRun(import.meta.url, process.argv[1])) {
    main();
}
