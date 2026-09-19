# Contributing to Nexus Teach

This guide is for people working **on** the teaching stage. To *use* it, read `README.md`.

## Layout

```
components/        the authored components — commands/, agents/, skills/
src/               the library and the `nxsx` executable
fingerprint.json   what the release's two parts hash to
```

`components/` is deliberately **not** a directory the harness loads. Authoring and loading are
separate: the account's install location is the only path by which a component runs, so there is
exactly one copy that can run and no ambiguity about which one it is.

## From a fresh clone

```bash
git clone https://github.com/sameera/nexus-teach.git
cd nexus-teach
pnpm install
```

`pnpm install` needs `@sameeraperera/nexus` at a version that publishes its library sources
(**0.61.0 or later**). Until that release is on the registry, build it from a Nexus checkout and
install the tarball:

```bash
cd ../nexus && pnpm nexus:build-release && npm pack
cd ../nexus-teach && pnpm add -D ../nexus/sameeraperera-nexus-*.tgz
```

## The maintainer's loop

Point your install location at this checkout, so an edit under `components/` is live with no install
step in between:

```bash
npx tsx src/nxsx-cli.ts install --from-checkout .
npx tsx src/nxsx-cli.ts version
```

The read-out names the install location, says whether it holds a copy or pointers, and — in the
pointing mode — names the checkout the pointers resolve into.

Re-run the install verb only when you **add or remove** a component file; editing an existing one
needs nothing.

Then put the executable on your PATH, because every component body addresses `nxsx` by bare name and
a check in the suite enforces that:

```bash
pnpm build
npm link
nxsx version
```

`npm link`, not `pnpm link --global`: the link has to land in the bin directory your `PATH` already
carries for node, which is npm's global prefix.

**Re-run `pnpm build` when you change anything under `src/`.** The two halves refresh on different
triggers, and the mismatch bites in one direction: components are live from the checkout, so a body
may name a subverb the linked build does not carry yet.

## The checks

```bash
pnpm test        # vitest
pnpm typecheck   # tsc -b, library and specs
pnpm lint        # eslint
pnpm build       # the staged release tree under dist/
pnpm pin         # rewrite fingerprint.json after changing a component or the executable
```

Two worth knowing about before they fail on you:

- **The fingerprint pin.** `fingerprint.json` records what the bundle and the component payload hash
  to. Change either and the suite fails until you `pnpm pin`. It is the only thing that can say a
  release's payload has fallen behind the authored tree.
- **The shipped-component checks.** Every component must sit under this package's namespace, address
  `nxsx` rather than `nexus`, and name only subverbs the executable declares. All three are readable
  from the bodies, so all three are checked rather than discovered in a session.

## How the Nexus libraries resolve

`src/nexus-library-alias.mjs` holds one rule that maps `@nexus/<library>/<module>` onto the sources
the `@sameeraperera/nexus` package publishes. Three toolchains read it — esbuild through a plugin,
vitest through a resolve alias, and `tsc` through the sibling `paths` block in `tsconfig.base.json`.
Keep them in step; a mapping that works for two of the three fails in the third at the worst moment.

## Test-first

Write the failing test that pins the intended behaviour before the code that satisfies it. Test
user-visible behaviour, not implementation. For a rendered page, the character grid a learner sees
*is* the user-visible behaviour — assert it as they perceive it, not through DOM structure.
