# FINPLE Step 114-2R Read-Only Repository-State Adapter Audit

Date: 2026-07-16
Issue: #263
Contract: `metrics-cutover-repository-state-adapter-v1-step114-2r`

## 1. Scope

Step 114-2R adds a pure, read-only collection boundary that converts a stable
local Git repository snapshot into the repository-state inputs required by the
merged Step 114-2Q execution-package preflight.

The adapter does not authorize or perform a cutover. It does not create target
files, update the selector, stage changes, commit, push, merge, deploy, call a
provider, or write to a database.

Fixed outputs remain false in every state:

- `fileWriteAuthorized=false`
- `commitAuthorized=false`
- `pushAuthorized=false`
- `mergeAuthorized=false`
- `deploymentAuthorized=false`
- `productionPublicationAuthorized=false`
- `appExportActivated=false`
- `pointerMutationExecuted=false`
- `rollbackExecuted=false`
- `loaderActivated=false`

## 2. Files

- `scripts/collect-metrics-cutover-repository-state.cjs`
- `scripts/lib/metrics-cutover-repository-state-adapter.cjs`
- `scripts/collect-metrics-cutover-repository-state.test.cjs`
- this audit document

No selector or CSV file is changed.

## 3. Read-only Git boundary

Git is invoked with an executable and argument array. Every invocation uses an
explicit working directory, `shell: false`, Buffer output, a 10-second timeout,
a 32 MiB maximum output size, and exit-code, signal, timeout, runtime-error,
and oversize checks. Returned issues are sanitized and never contain raw Git
stderr or worktree path names.

The exact command allowlist is:

```text
git rev-parse --show-toplevel
git rev-parse HEAD
git rev-parse HEAD^{tree}
git symbolic-ref --quiet --short HEAD
git status --porcelain=v1 -z --untracked-files=all
git ls-files -z
```

No command string, shell wrapper, PowerShell wrapper, or `cmd` wrapper is used.
The production adapter contains no Git mutation command.

## 4. One-attempt stability verification

The adapter performs one explicit start/end collection attempt and never
retries a concurrent change.

The start snapshot collects:

- Git top-level path
- repository HEAD
- HEAD tree
- named branch
- exact porcelain status bytes
- NUL-delimited tracked-path inventory
- exact selector bytes and SHA-256
- both target-path absence states

The end snapshot repeats the same critical observations. Ready requires exact
start/end equality for:

- Git root
- HEAD
- tree
- branch
- raw worktree status bytes
- tracked-path inventory hash
- selector bytes and canonical selector path
- each target absence state

Any concurrent mutation returns `blocked`.

## 5. Repository and branch boundary

The caller-supplied repository path must exist as a canonical directory and
must not be a symlink. `git rev-parse --show-toplevel` is canonicalized with
filesystem `realpath`, and its canonical value must equal the supplied root.
The adapter therefore cannot silently inspect another repository.

The selector and target parent paths must resolve inside that same canonical
root. Repository-relative paths reject absolute paths, traversal, backslashes,
CR/LF, and NUL.

The branch is collected with:

```text
git symbolic-ref --quiet --short HEAD
```

Detached HEAD, empty output, malformed branch syntax, or a branch change
during collection blocks. No feature branch name is hardcoded, so the adapter
can operate on a clean named review branch or `main`.

## 6. Worktree status

Ready requires exact empty output from:

```text
git status --porcelain=v1 -z --untracked-files=all
```

Staged, unstaged, untracked, renamed, conflicted, deleted, or added paths
therefore block. Invalid UTF-8, a missing terminal NUL for non-empty output,
unexpected empty records, and start/end status changes also block.

The public result contains only the safe entry count and clean/blocked state.
It does not expose raw status records or path names.

## 7. Tracked inventory

`git ls-files -z` is decoded as strict UTF-8 and parsed as NUL-delimited path
records. The adapter rejects:

- missing terminal NUL
- invalid UTF-8
- empty unexpected records
- duplicate paths
- absolute paths
- traversal
- backslashes
- CR/LF

The inventory must include the selector and all six trusted current pointer
components returned by `getMetricsCurrentPointerSnapshot()`.

The inventory digest is calculated by the merged Step 114-2Q
`hashMetricsTrackedPaths` export. The adapter does not introduce a competing
canonicalization algorithm. Reordered equivalent inventories produce the same
digest; any start/end inventory digest change blocks.

## 8. Selector verification

The exact selector path is:

```text
src/data/tickers/screenerCandidateOverlay.js
```

Both observations require a regular non-symlink file whose canonical path
stays inside the repository. The raw bytes are read without newline
normalization, hashed with SHA-256, and compared with
`getMetricsCurrentPointerSnapshot().selector.sha256`.

The first and second selector bytes and canonical paths must match. A missing
file, directory, symlink, path escape, hash mismatch, read failure, or
mid-collection replacement blocks.

## 9. Target-path absence checks

The CLI accepts exactly two target paths:

```text
--us-target <repository-relative CSV>
--kr-target <repository-relative CSV>
```

Both must be distinct repository-relative `.csv` paths under
`src/data/tickers/`. Each target parent is canonicalized and must remain inside
the repository.

Each target is checked before and after the other state reads. Ready requires
that each target:

- is absent from the trusted `git ls-files -z` inventory
- does not exist on disk
- is not an ignored existing file
- is not an untracked existing file
- is not a symlink
- is not a directory

The adapter never creates either target.

## 10. Step 114-2Q compatibility output

Only a `ready` result emits reusable Step 114-2Q inputs.

`repositoryPreimage` contains:

- merged Step 114-2Q repository-preimage contract version
- merged selector provenance commit SHA
- actual repository HEAD and tree SHAs
- exact selector path, bytes, and SHA-256
- sorted tracked paths and Step 114-2Q inventory hash
- `worktreeClean=true`
- actual named branch

`trustedOptions` binds the expected selector provenance, actual HEAD, actual
tree, tracked inventory digest, and actual named branch.

`executionPolicy` uses
`metrics-cutover-execution-policy-v1-step114-2q`, repeats those exact trusted
bindings, and preserves:

- `requireCleanWorktree=true`
- `requireCreateOnlyTargets=true`
- `requireExactTwoSelectorReplacements=true`
- `allowTargetDeletionOnRollback=false`

The compatibility test passes these three objects to the merged Step 114-2Q
preflight and verifies that its repository-state portion is accepted.

## 11. Blocked and idle suppression

For both `blocked` and `idle`, the adapter forces:

```text
repositoryPreimage={}
trustedOptions={}
executionPolicy={}
selectorContentBase64=""
trackedPaths=[]
```

No reusable Step 114-2Q repository input is exposed on failure. The result
does not contain target CSV bytes, approval receipts, keys, allowlists, ZIP
bytes, credentials, or secrets.

## 12. CLI behavior

Example:

```text
node scripts/collect-metrics-cutover-repository-state.cjs --repo . --us-target src/data/tickers/future_us.csv --kr-target src/data/tickers/future_kr.csv
```

The CLI prints exactly one sanitized JSON document to stdout and writes no
output file. Stderr is reserved for invocation or runtime diagnostics.

Exit codes:

- `0`: ready
- `1`: blocked validation result
- `2`: invocation or runtime error

## 13. Test evidence

Focused tests cover:

- stable isolated Git repository integration
- deterministic normalized output
- idle suppression and fixed false outputs
- exact no-shell Git argument arrays
- timeout, nonzero exit, signal/runtime sanitization, and oversized output
- invalid UTF-8, non-repository, root mismatch, root symlink, and path escape
- detached HEAD and changing or malformed branch
- changing HEAD and tree
- staged, unstaged, untracked, rename, conflict, and deletion states
- malformed and changing worktree status
- malformed, duplicate, traversal, reordered, and changing tracked inventory
- selector missing, symlink, directory, escape, hash mismatch, and replacement
- tracked, existing, ignored, untracked, symlink, directory, duplicate,
  malformed, escaping, and appearing targets
- Step 114-2Q repository-state compatibility
- blocked-output suppression
- CLI JSON/exit-code behavior
- production-source no-side-effect guard

## 14. Protected scope

Step 114-2R does not modify:

- `src/data/tickers/screenerCandidateOverlay.js`
- current or target overlay CSVs
- production loader or pointer selection
- scenario monthly returns or Step 4/5/6 calculation paths
- DB, auth, payment, subscription, MY PAGE, or public UI
- trading readiness, order authority, provider, KRX, KIS, or data.go.kr paths
- deployment workflows

No real candidate package, approval, key, receipt, ZIP, target data, secret,
or credential is committed.
