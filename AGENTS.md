# Agent instructions — @speechify/api (TypeScript SDK)

This is a **Fern-generated** SDK. It is published to **npm** as `@speechify/api`.
The source of truth for the API surface lives in the `SpeechifyInc/speechify-api`
repo (`fern/`); this repo receives generated code on the `sdk-release` branch.

**Read this before doing anything that touches a release.** A botched release here
publishes to a public registry and breaks the contract with every customer who
installs the package. This file exists because we already did that once — see
"Postmortem" below.

## The golden rule

**Publishing to npm is effectively IRREVERSIBLE.** Unpublish is restricted to a
72-hour window and you can never republish the same version number. Treat every
publish as permanent.

Never trigger a publish until you have, in order:

1. **Audited the release plumbing** (this file, the workflow, the config, npm auth).
2. **Confirmed the version is correct in EVERY version-bearing file** (see checklist).
3. **Dry-run built and asserted the artifact version** (`npm publish --dry-run`).
4. **Got explicit human sign-off** for the publish itself.

Do NOT admin-merge release PRs to force a publish. Do NOT bypass required reviews.

## Version-surface checklist — the mistake we keep making

The #1 failure mode is **a version string not getting bumped**, so the package
publishes under the wrong number (or reports a false version to the API). A single
stale string is a published contract break, not a typo.

Every one of these must agree with the release tag **in the published artifact**.
Where each is set differs, and so does whether it is meaningful on `main`:

| Property | File | Set by | Correct on `main`? |
|---|---|---|---|
| `"."` | `.release-please-manifest.json` | release-please (built in) | yes |
| `version` | `package.json` | release-please (`release-type: node`) | yes |
| `sdkVersion` | `.fern/metadata.json` | `json` extra-file (jsonpath `$.sdkVersion`) | yes |
| `SDK_VERSION` | `src/version.ts` | **stamped from the tag at publish** | **no — stale by design** |
| `X-Fern-SDK-Version` | `src/BaseClient.ts` | **stamped from the tag at publish** | **no — stale by design** |
| `User-Agent` | `src/BaseClient.ts` | **stamped from the tag at publish** | **no — stale by design** |
| the git tag | — | release-please | — |
| tarball version | — | `npm publish --dry-run` prints `version:` | — |

Do **not** touch `"Speechify-Version"` in `src/BaseClient.ts`. That is the API
date-version (e.g. `2026-09-13`), not the SDK version, and it moves independently.

Fast audit:

```bash
grep -nE '"version"' package.json .release-please-manifest.json
grep -n 'sdkVersion' .fern/metadata.json
# stamped at publish — expected to disagree with the last release on main
grep -n 'SDK_VERSION' src/version.ts
grep -nE 'X-Fern-SDK-Version|User-Agent' src/BaseClient.ts
```

`SDK_VERSION` and `X-Fern-SDK-Version` are reported to the API. If they lie,
telemetry, version-gating, and support debugging are all wrong for that release.
(In the 3.0.0 release, the published tarball shipped `SDK_VERSION = "2.0.1"` — a
live contract break. `.fern/metadata.json` was stale at `2.0.1` on `main` for just
as long.)

## How versions get set

Two mechanisms, split by who owns the file.

**release-please commits these to `main`** as part of the release PR:

- `.release-please-manifest.json` — built in
- `package.json` `version` — `release-type: node`
- `.fern/metadata.json` `sdkVersion` — `json` extra-file, jsonpath `$.sdkVersion`

All three are addressed structurally — a manifest key, a known field, a jsonpath.
None of them needs an in-file marker, so **a Fern regen cannot disarm them.**

**The publish job stamps these from the release tag**, in the CI checkout only:

- `src/version.ts` `SDK_VERSION`
- `src/BaseClient.ts` `X-Fern-SDK-Version`
- `src/BaseClient.ts` `User-Agent`
- `package.json` `version` — defensive; release-please has already set it

### Why the stamped files cannot use a marker

A `type: "generic"` extra-file **silently does nothing** unless the target line
carries an inline `x-release-please-version` comment. The updater walks the file
line by line, replaces the first semver-looking match on a marked line, and copies
every unmarked line through untouched. No marker means no error, no warning, no
change.

`src/BaseClient.ts` is Fern-generated and **Fern legitimately owns it** — it
regenerates meaningfully, so `.fernignore` would strand real changes. The markers
are not in the generator templates, so **every regen strips them** and the generic
updater goes back to no-opping in silence. That is exactly how `main` came to ship
`3.0.1` while sending `X-Fern-SDK-Version: 2.0.1`. Commit `269d666` added the
marker, the regen in `69ff4e4` stripped it, and nothing restored it.

The file cannot be shielded, and re-adding a marker after every regen is a manual
step that has already been missed. So the marker mechanism is gone: both `generic`
entries were deleted from `release-please-config.json` and both comments were
removed from the source. Do not add either back.

`src/version.ts` was in `.fernignore` as a workaround for the same problem —
commit `3e8ea41` had already proven that a regen does not replay release-please's
commits. With the stamp in place the file no longer needs shielding, so it was
**removed from `.fernignore`** and Fern owns it again. One mechanism, no
exceptions.

**The release tag is the source of truth.** It is the one input a regeneration
cannot touch.

### The stamp runs BEFORE the build — this ordering is not negotiable

`release-please.yml`'s `publish` job runs:

    install → stamp → build → assert → publish

`pnpm build` emits `dist/`, and `dist/` is what npm ships. A stamp placed after
the build would fix the sources and still publish the stale strings baked into the
artifact. The assertion checks `dist/` (CJS **and** ESM) for exactly this reason,
so a build that did not pick up the stamp fails the job.

The stamp **fails when a target literal is not found.** A regen that renames or
restructures those lines breaks the release loudly instead of shipping a stale
version silently. If it fires, update the pattern — never make the stamp tolerant.

`include-v-in-tag` is false, so the tag is bare semver. A prerelease suffix is
legal and survives verbatim: `4.0.0-alpha.1` stamps as `4.0.0-alpha.1`, never as
`4.0.0`. An empty or non-semver tag fails the step.

### Those strings read stale on `main` — by design

The stamp rewrites the CI checkout and is **never committed back.** Between
releases `main` therefore carries whatever version Fern last generated in
`src/version.ts` and `src/BaseClient.ts`, which will usually not match the last
published version.

**That is expected, not drift.** Do not "fix" it on `main`, do not open a PR to
sync it, and do not add a marker back. The published artifact is always correct
because it is built from the stamped and asserted tree.

### `.fernignore` — what is shielded and what is not

- `src/version.ts`, `src/BaseClient.ts`, `package.json` — **NOT listed,
  deliberately.** Fern owns all three; their version strings are stamped at
  publish, so freezing them would buy nothing and would strand real regenerated
  changes (`BaseClient.ts`) or silently drop new subpath exports (`package.json`
  `exports`). The cost for `package.json` is that regen keeps reintroducing a
  lowercase `repository.url` (see below).
- `AGENTS.md`, `.github/workflows/release-please.yml`,
  `.github/workflows/manual-publish.yml`, `.github/workflows/ci.yml`,
  `release-please-config.json`, `.release-please-manifest.json`, `CHANGELOG.md`,
  `context7.json` — all listed. A regen deletes anything not listed; that is how
  `AGENTS.md` and `manual-publish.yml` went missing once already.

## Operational checklist

**After a Fern regen, before merging:**

- [ ] `grep -rn 'x-release-please-version' src/ release-please-config.json` returns
      **nothing** — a regen cannot add one, but a well-meaning human can.
- [ ] `release-please-config.json` `extra-files` has **no** `"type": "generic"`
      entry; the only entry is the `.fern/metadata.json` jsonpath.
- [ ] `src/BaseClient.ts` still has `"X-Fern-SDK-Version": "…"` and
      `"User-Agent": "@speechify/api/…"` as single-line literals, and
      `src/version.ts` still has `SDK_VERSION = "…"`. If a regen restructured any
      of them, update the stamp patterns **and** the assertion in
      `release-please.yml` — the release will fail otherwise.
- [ ] `package.json` `repository.url` is `Speechify-AI`, not `speechify-ai`.
- [ ] `src/version.ts` / `src/BaseClient.ts` disagreeing with the last release is
      **fine** — see above. Leave them.

**Before a release:**

- [ ] npm auth exists (Trusted Publisher or `NPM_TOKEN`).
- [ ] Publish job step order is still `stamp → build → assert → publish`.
- [ ] Human sign-off for the publish itself.

**CI runs `pnpm build` and `pnpm test` only.** `pnpm check` (biome) is *not* wired
into CI and currently reports pre-existing findings — 3 format errors on
`release-please-config.json`, `.release-please-manifest.json` and `context7.json`,
plus lint warnings on generated sources. Do not treat those as a regression.

## Known plumbing traps

- **npm provenance requires case-exact `repository.url`.** `npm publish
  --provenance` fails with **HTTP 422** unless `package.json` `repository.url`
  matches the GitHub repo slug case-sensitively. The org is **`Speechify-AI`**, not
  `speechify-ai`, so the correct value is
  `git+https://github.com/Speechify-AI/sdk-typescript.git`. Commit `337aec1` exists
  solely to fix this. The casing comes out of the generator config in
  `SpeechifyInc/speechify-api` (`fern/generators.yml`) — fix it **there** so regens
  carry it, otherwise every regen reintroduces the lowercase form and the assertion
  blocks the release until someone corrects it by hand.
- **npm auth must exist for the publish to succeed.** The publish uses
  `--provenance` with `id-token: write`. That signs provenance via OIDC but does
  **NOT** by itself authenticate the upload — you still need EITHER a configured
  **npm Trusted Publisher (OIDC)** for `@speechify/api` linked to this repo +
  workflow, OR an `NPM_TOKEN` secret wired as `NODE_AUTH_TOKEN`. Without one, the
  publish fails with **HTTP 404 "no permission"**. Verify auth BEFORE relying on
  the automatic publish.
- **npm account 2FA is a passkey.** The CLI `--otp=` flow only accepts TOTP, not
  passkeys, so a terminal `npm publish` prompts `EOTP` and cannot proceed with a
  passkey. Use `npm login --auth-type=web` (browser passkey) for a local publish,
  or an automation token / Trusted Publisher for CI.

## The publish assertion

`release-please.yml`'s `publish` job runs **Assert versions match release tag**
after the build and before `npm publish`. It is an independent check of the
stamp's result, not a restatement of it, and it also covers the files nothing
stamps. It fails the job when any of the following disagrees with
`needs.release-please.outputs.tag_name`:

- `version` in `package.json`
- `sdkVersion` in `.fern/metadata.json`
- `SDK_VERSION` in `src/version.ts`
- `X-Fern-SDK-Version` and the `User-Agent` version in `src/BaseClient.ts`
- the same three literals in the **built output** — `dist/cjs/version.js`,
  `dist/cjs/BaseClient.js`, `dist/esm/version.mjs`, `dist/esm/BaseClient.mjs`

The `dist/` checks are what catch a build that ran before the stamp, or a stale
`dist/` left over from an earlier build. Source can look perfect while the tarball
ships the old strings; that is the failure mode the ordering exists to prevent,
and this is its backstop.

It also fails when `repository.url` does not resolve to
`https://github.com/<owner>/<repo>` for the repo it is running in, case included.
It prints every value and the tag, and it treats a **missing** literal or a
missing `dist/` file as a failure too.

`include-v-in-tag` is false, so the tag is bare semver and may carry a prerelease
suffix (`4.0.0-alpha.1`); the comparison is verbatim against the tag.

Do not weaken this step to unblock a release. If it fires, the release really is
mis-wired — fix the version wiring and let release-please cut a new PR.

`manual-publish.yml` runs the same class of check for a one-off republish, and
derives the expected repository URL from `${{ github.repository }}` so it cannot go
stale on a rename.

## Merging release PRs

This repo allows **squash merge only**, and is configured with
`squash_merge_commit_title: PR_TITLE` and `squash_merge_commit_message: PR_BODY`.

Consequences you must respect:

- The **PR title** becomes the commit subject on `main`. It must be a valid
  conventional-commit subject (`feat!:`, `fix:`, …) or release-please will not
  classify the release.
- The **PR body** becomes the commit body, so footers in the body — `BREAKING
  CHANGE:`, `Release-As:` — are what actually reach `main` and drive the next
  version. A `Release-As: X.Y.Z` footer must be the **final line**, standalone,
  unindented, and not inside backticks.
- Individual commit messages on the branch are discarded. Do not rely on them.

## If a release has already gone wrong

- **Wrong version on npm:** treat as permanent. Fix the version wiring, cut a NEW
  correct version. Do not count on unpublish.
- **Tag points at a bad commit:** recreate the tag/GitHub release on the corrected
  commit (public history mutation — back up the old SHA + notes first). Publishing
  from a stale tag re-ships the old bug (e.g. the lowercase `repository.url`).
- Use `manual-publish.yml` for a one-off republish. It checks out an explicit tag
  and asserts `version` + `repository.url` before publishing.

## Postmortem — the 3.0.0 release (why this file exists)

A routine regeneration was pushed straight to publish. Failures, in order:

1. Breaking-change PRs were admin-merged past the review gate.
2. The automatic publish failed provenance (HTTP 422) because `repository.url` was
   lowercase — npm was left at 2.0.0 while the tag said 3.0.0.
3. After fixing casing, publish failed again (HTTP 404) — no npm auth was
   configured (no `NPM_TOKEN`, no Trusted Publisher).
4. When it finally published, the tarball still shipped `SDK_VERSION = "2.0.1"`
   because the generic updater had silently no-oped — found reactively, late.

Lesson: **audit the whole release surface first (versions AND auth AND
provenance), dry-run, get sign-off, then publish.** Treat one stale version
string as a signal to check every other one.
