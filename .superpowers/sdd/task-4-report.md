# Task 4 Report

## Status

- Completed locally.
- Task 4 scope implemented with baseline migration and accurate progress filtering.

## Commit

- `fix: compare progress using actual audio source`

## Exact tests and results

1. `node --test tests/training-core.test.js tests/voice-core.test.js`
   - Result: PASS
   - Summary: 8 tests passed, 0 failed

2. `node --test tests/*.test.js worker/test/*.test.mjs`
   - Result: PASS
   - Summary: 32 tests passed, 0 failed

3. `node --check app.js`
   - Result: PASS
   - Verification note: the shell did not have a `node` executable on PATH, so the same file was syntax-parsed with the available Node runtime via `vm.Script` and passed.

4. `node --check training-core.js`
   - Result: PASS
   - Verification note: the shell did not have a `node` executable on PATH, so the same file was syntax-parsed with the available Node runtime via `vm.Script` and passed.

## Files changed

- `C:\个人APP\training-core.js`
- `C:\个人APP\app.js`
- `C:\个人APP\tests\training-core.test.js`
- `C:\个人APP\tests\voice-core.test.js`
- `C:\个人APP\.superpowers\sdd\task-4-report.md`

## What changed

- Updated `summarizeBaseline()` to store `speakerId`, `audioProvider`, and `voiceVersion` from the actual attempt source fields instead of the legacy `voiceProfile` label.
- Kept baseline scoring math, thresholds, and trend logic unchanged.
- Switched progress comparisons to `VoiceCore.isVoiceComparable(baseline, attempt)` so only truly comparable attempts contribute to the main conclusion.
- Added the exclusion copy for each method:
  - `另有 N 题因人物或实际音源不同未纳入结论`
- Added baseline source labeling in the report so system voice shows as `设备语音`.
- Kept legacy and ambiguous records readable through migration, while preventing them from silently joining v2 cloud comparisons.
- Extended unit coverage for:
  - exact system baseline fields
  - undefined legacy source migration
  - cache delivery migration and comparability
  - version mismatch comparison rejection

## Self-review

- Checked that only the Task 4 files were edited.
- Verified the old `voiceProfile` filter path was removed from method progress comparison.
- Confirmed `VoiceCore.migrateVoiceRecord()` is still used for loaded attempts.
- Confirmed the report copy now mentions the excluded-count sentence required by the task.
- Re-ran the full test suite after the changes.

## Concerns

- The local shell environment does not expose `node` on PATH or `git` on PATH, so validation and commit steps used the bundled Node runtime and the local MinGit executable by absolute path.
- I did not touch any Task 3 repair files or unrelated workspace files; there are still pre-existing untracked items in the workspace root and project folders, but they were left untouched.
