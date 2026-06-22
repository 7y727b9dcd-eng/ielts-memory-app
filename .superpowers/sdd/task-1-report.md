# Task 1 Report

Status: DONE

Commit: `b52d7abc28308eb3b409dbc399aa9500bae7ce1e`

## What changed

- Added `data/voices.json` with the exact version 2 three-speaker catalog.
- Added `voice-core.js` as a UMD module exporting:
  - `LEGACY_SPEAKERS`
  - `migrateVoiceRecord(record)`
  - `isVoiceComparable(baseline, attempt)`
- Added `tests/voice-core.test.js` to lock in:
  - the exact catalog contents
  - legacy `briefing + cache` migration
  - exact speaker/provider/version comparison
- Updated `index.html` to load `voice-core.js` before `app.js`.

## Verification

Pre-implementation red check:

- `node --test tests/voice-core.test.js`
- Result: failed with `Cannot find module '../voice-core.js'`

Final green checks:

- `node --test tests/offline-assets.test.js tests/training-core.test.js tests/voice-core.test.js worker/test/worker.test.mjs`
- Result: 14 tests passed, 0 failed

## Self-review

- Confirmed the catalog entries match the brief exactly, including IDs, names, Azure voice names, style values, and `null` fields.
- Confirmed `migrateVoiceRecord` preserves legacy fields and produces `speakerId`, `audioProvider`, `audioDelivery`, and `voiceVersion` exactly as required.
- Confirmed `isVoiceComparable` only accepts exact speaker/provider/version matches.
- Confirmed the new script is loaded before `app.js` in `index.html`.

## Concerns

- The worktree already had unrelated untracked files; I left them untouched.
- I did not change the service worker shell or cache list in Task 1, since the brief only required the shared catalog, pure voice rules, tests, and script load order.

## Fix review findings

Commit: `b47bd2d82fcbb4354a6f4060bc793c91ea748294`

### Changes made

- Ensured `index.html` loads `voice-core.js?v=14` so the new shared module follows the same cache-busting pattern as the other bundled scripts.
- Added explicit negative coverage for voice comparison:
  - provider mismatch returns `false`
  - version mismatch returns `false`
- Updated the offline shell test to require `voice-core.js?v=14` in the service worker cache list.
- Updated `sw.js` to cache `./voice-core.js?v=14` alongside the rest of the shell.
- Confirmed `data/voices.json` and `tests/voice-core.test.js` contain the literal UTF-8 speaker names and gender labels required by the review:
  - 林晓 / 陈屿 / 苏宁
  - 女声 / 男声 / 女声

### Verification

- `node --test tests/voice-core.test.js`
- Result: 3 tests passed, 0 failed

- `node --test tests/offline-assets.test.js tests/training-core.test.js tests/voice-core.test.js worker/test/worker.test.mjs`
- Result: 14 tests passed, 0 failed

### Notes

- The unrelated dirty files in the workspace were preserved.
- The report update itself is appended in the working tree as requested.

## Encoding retry

This pass corrected the source encoding issue by storing the speaker names and gender labels as JSON Unicode escapes and matching them with the same escape style in the test expectations.

Commit: `b52d7abc28308eb3b409dbc399aa9500bae7ce1e`

### Changes made

- Updated `data/voices.json` to store:
  - `\u6797\u6653` / `\u9648\u5c7f` / `\u82cf\u5b81`
  - `\u5973\u58f0` / `\u7537\u58f0` / `\u5973\u58f0`
- Updated `tests/voice-core.test.js` to:
  - assert the raw JSON contains the Unicode escape sequences
  - assert the parsed catalog values equal the expected escaped strings
  - verify the parsed runtime values resolve to 林晓 / 陈屿 / 苏宁 and 女声 / 男声 / 女声

### Verification

- `node --test tests/voice-core.test.js`
- Result: 3 tests passed, 0 failed

- `node -e "const fs=require('node:fs'); const catalog=JSON.parse(fs.readFileSync('data/voices.json','utf8')); const expected=['\\u6797\\u6653','\\u9648\\u5c7f','\\u82cf\\u5b81']; const labels=['\\u5973\\u58f0','\\u7537\\u58f0','\\u5973\\u58f0']; console.log(JSON.stringify({names:catalog.speakers.map(s=>s.name), labels:catalog.speakers.map(s=>s.genderLabel), namesMatch:catalog.speakers.every((s,i)=>s.name===expected[i]), labelsMatch:catalog.speakers.every((s,i)=>s.genderLabel===labels[i])}));"`
- Result: `{"names":["林晓","陈屿","苏宁"],"labels":["女声","男声","女声"],"namesMatch":true,"labelsMatch":true}`

- `node --test tests/offline-assets.test.js tests/training-core.test.js tests/voice-core.test.js worker/test/worker.test.mjs`
- Result: 14 tests passed, 0 failed

### Current report correction

- The earlier `5 passed` count came from a combined check that included `tests/offline-assets.test.js` plus `tests/voice-core.test.js`.
- The standalone `tests/voice-core.test.js` run is 3 tests, and that is the count now recorded in the report for the focused check.
