# Task 3 Report

## Status

- Completed locally.
- Scope implemented: front-end speaker UI, v2 voice-service health state, honest device fallback, v2 audio metadata recording, and Task 3 contract coverage.

## Commits

- Local commit message prepared: `feat: present three people instead of voice types`

## Exact tests and results

1. `node --check app.js`
   - Result: PASS

2. `node --test tests/speaker-ui-contract.test.js`
   - Result: PASS
   - Assertions covered:
     - old voice-type labels absent from interactive speaker UI
     - `speakerChoiceGrid` exists
     - `AUDIO_CACHE_NAME` is `listening-training-audio-v2`
     - `TTS_VERSION` is `"2"`
     - `loadSpeakerCatalog()`, `renderSpeakerChoices()`, `checkVoiceService()` exist
     - `/v1/health`, `AbortController`, `4000`, version/azure health checks exist
     - one explicit `SYSTEM_SPEAKER` fallback path exists

3. `node --test tests/*.test.js worker/test/*.test.mjs`
   - Result: PASS
   - Summary: 25 tests passed, 0 failed

## Files changed

- `C:\个人APP\index.html`
- `C:\个人APP\styles.css`
- `C:\个人APP\app.js`
- `C:\个人APP\tests\speaker-ui-contract.test.js`
- `C:\个人APP\.superpowers\sdd\task-3-report.md`

## What changed

- Replaced hard-coded voice-type cards with generated speaker cards in `speakerChoiceGrid`.
- Added speaker catalog loading from `data/voices.json`.
- Added v2 cloud voice health check against `/v1/health` with a 4-second abort timeout.
- Switched browser constants to `TTS_VERSION="2"` and `listening-training-audio-v2`.
- Rendered one honest system fallback card when cloud voice is missing/unhealthy; disabled cloud speaker cards in that state.
- Preserved remembered named speaker only for healthy cloud-voice situations.
- Recorded actual playback metadata on attempts:
  - cloud: `audioProvider="azure"` and `audioDelivery="network" | "cache"`
  - device fallback: `speakerId="system"`, provider/delivery `system`, `voiceVersion=2`
- Added clear per-question device fallback messaging in playback state.

## Self-review

- Checked diff scope to keep edits inside Task 3 files only.
- Confirmed unrelated untracked workspace files were not staged.
- Re-ran the full automated test set after cleanup changes.
- Rechecked for accidental duplicate fallback paths and stale voice-type UI contract.

## Concerns

- No live browser/device smoke run was performed in this turn, so the rendered card layout and real playback UX were validated by code and automated file-contract tests, not by an interactive manual pass.
- Preview flow still relies on browser `speechSynthesis` for device fallback behavior; this is consistent with existing behavior but not manually re-verified on a real device here.

## Follow-up fix after task review

- Removed the duplicated in-browser cloud speaker catalog so `data/voices.json` remains the only cloud speaker source of truth.
- Upgraded PWA shell assets to `v15` and kept generated audio in `listening-training-audio-v2`.
- Updated `sw.js` to preserve the v2 audio cache and cache `data/voices.json`.
- Tightened the unavailable-cloud behavior: the visible selector uses only `SYSTEM_SPEAKER`; generated cards show named speakers as disabled, not as fake device voices.
- Added a `speechSynthesis` capability guard for preview fallback.

## Follow-up verification

1. `node --test tests/speaker-ui-contract.test.js tests/offline-assets.test.js`
   - Result: PASS
   - Summary: 8 tests passed, 0 failed

2. `node --check app.js`
   - Result: PASS

3. `node --test tests/*.test.js worker/test/*.test.mjs`
   - Result: PASS
   - Summary: 28 tests passed, 0 failed
