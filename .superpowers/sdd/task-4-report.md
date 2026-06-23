# Task 4 Report

## Status

- Completed locally.
- Task 4 scope implemented with baseline migration, actual-source progress filtering, and a direct UI regression test for excluded-count rendering.

## Commits

- `6a23654 fix: compare progress using actual audio source`
- Follow-up commit: `test: cover actual-source progress exclusions`

## Exact tests and results

1. `node --test tests/speaker-ui-contract.test.js tests/training-core.test.js tests/voice-core.test.js`
   - Result: PASS
   - Summary: 20 tests passed, 0 failed

2. `node --test tests/*.test.js worker/test/*.test.mjs`
   - Result: PASS
   - Summary: 33 tests passed, 0 failed

3. `node --check app.js`
   - Result: PASS

4. `node --check training-core.js`
   - Result: PASS

## Files changed

- `C:\个人APP\training-core.js`
- `C:\个人APP\app.js`
- `C:\个人APP\tests\training-core.test.js`
- `C:\个人APP\tests\voice-core.test.js`
- `C:\个人APP\tests\speaker-ui-contract.test.js`
- `C:\个人APP\.superpowers\sdd\task-4-report.md`
- `C:\个人APP\.superpowers\sdd\progress.md`

## What changed

- `summarizeBaseline()` now stores `speakerId`, `audioProvider`, and `voiceVersion` from actual attempt source fields.
- Loaded attempts continue to pass through `VoiceCore.migrateVoiceRecord()` while preserving legacy fields for history/export.
- Main method progress uses `VoiceCore.isVoiceComparable(baseline, attempt)` before calculating the conclusion.
- Azure cache and network attempts remain comparable because both use `audioProvider="azure"` when speaker and version match.
- Each method card reports excluded attempts with: `另有 N 题因人物或实际音源不同未纳入结论`.
- Baseline source labeling displays `system` as `设备语音`.
- Old ambiguous records remain readable but do not silently enter v2 cloud comparisons.
- Existing progress thresholds and method-trend calculations were preserved.

## Test coverage added

- Exact baseline fields for `{ speakerId: "system", audioProvider: "system", voiceVersion: 2 }`.
- Legacy undefined-source migration remains readable but ambiguous.
- Cache delivery on a v2 Azure record remains comparable by provider.
- Version mismatch is rejected by `isVoiceComparable()`.
- Runtime `renderMethodProgress()` test verifies comparable counts, excluded counts, and `设备语音` baseline labeling.

## Self-review

- Verified Task 4 code paths against the plan acceptance points.
- Added a direct UI regression test for the review gap.
- Re-ran targeted and full automated tests after the follow-up change.
- Left unrelated untracked workspace files untouched.

## Concerns

- None for Task 4 after the follow-up test/report fix.
