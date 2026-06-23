# Task 2 Report: Worker v2 speakers, shared catalog proxy

## Status

Completed.

## Commit

- `4e706238d03d1d0051fbbd10a29321a4b00f3766` — `feat: serve three named Azure speakers`

## Changed files

- `worker/src/index.js`
- `worker/test/worker.test.mjs`
- `worker/README.md`

## What changed

- Worker now imports `data/voices.json` and `data/scenarios.json`.
- `/v1/health` now truthfully reflects Azure Secret readiness and returns version `2`.
- `/v1/tts/{scenarioId}` now only accepts `profile=lin_xiao|chen_yu|su_ning` with `v=2`.
- SSML now uses shared speaker config:
  - `lin_xiao` → Xiaoxiao + `chat` + `0.55`
  - `chen_yu` → Yunxi + `chat` + `0.45`
  - `su_ning` → Xiaoyi with no `mstts:express-as`
- Cache normalization now ignores extra query params and keys only by scenario, speaker, and version 2.
- README now documents the v2 health and TTS contract.

## Exact test output

### `node --test worker/test/worker.test.mjs`

```text
✔ worker imports the shared speaker catalog instead of hard-coding Azure voices (2.1296ms)
✔ health is unavailable when either Azure secret is absent (26.7769ms)
✔ health is ready only when both Azure secrets exist (0.5966ms)
✔ wildcard CORS preflight is preserved (0.4585ms)
✔ unknown scenario, profile, and version are rejected before Azure is called (1.011ms)
✔ lin xiao and chen yu use the shared v2 Azure speaker settings (1.3247ms)
✔ su ning omits express-as while still returning mp3 (0.4835ms)
✔ equivalent v2 requests share the same cache key and call Azure once (0.7026ms)
✔ Azure upstream failures become 502 responses (0.6449ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 166.2771
```

### `node --test tests/*.test.js worker/test/*.test.mjs`

```text
✔ service worker keeps generated speech cache during upgrades (1.2486ms)
✔ offline shell includes shared catalog and scoring core (0.2355ms)
✔ slot method uses F1 across unique information types (1.0833ms)
✔ delayed response combines intent and constraint accuracy (0.2319ms)
✔ metacognitive method rewards relevant prediction and calibrated confidence (0.2381ms)
✔ baseline summary stores the selected voice and stable duration (9.8841ms)
✔ progress needs five comparable questions and detects improvement (0.573ms)
✔ method trend compares first five with latest five after ten questions (0.2873ms)
✔ voice catalog contains the exact three named speakers (2.1493ms)
✔ legacy briefing cache records migrate to the named speaker model (0.2777ms)
✔ voice comparison requires exact speaker provider and version matches (0.2847ms)
✔ worker imports the shared speaker catalog instead of hard-coding Azure voices (1.7133ms)
✔ health is unavailable when either Azure secret is absent (30.7391ms)
✔ health is ready only when both Azure secrets exist (0.837ms)
✔ wildcard CORS preflight is preserved (0.5576ms)
✔ unknown scenario, profile, and version are rejected before Azure is called (1.0528ms)
✔ lin xiao and chen yu use the shared v2 Azure speaker settings (1.7161ms)
✔ su ning omits express-as while still returning mp3 (0.6519ms)
✔ equivalent v2 requests share the same cache key and call Azure once (0.917ms)
✔ Azure upstream failures become 502 responses (0.7742ms)
ℹ tests 20
ℹ suites 0
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 185.661
```

## Self-review

- Confirmed red-green TDD flow: rewrote Worker tests first, observed 7 expected failures, then implemented until green.
- Confirmed Worker no longer hard-codes Azure voice names and instead imports the shared speaker catalog.
- Confirmed invalid profile/version/scenario paths return `400/404` before Azure is called.
- Confirmed cache equivalence test proves extra query parameters are ignored.
- Confirmed CORS GET/OPTIONS behavior, MP3 output, scenario whitelist, and `502` upstream failure mapping remain intact.
- Confirmed only the three allowed Task 2 files were committed.

## Concerns

- No functional blockers.
- Git emitted LF→CRLF normalization warnings for the three edited Worker files; this did not affect tests or the commit.
- The workspace still contains unrelated untracked files from concurrent work; they were intentionally left untouched and not included in the commit.

## Fix section: review findings follow-up

### Fixed finding 1: Azure SSML nesting

- Styled speakers now render as `voice > mstts:express-as > prosody`.
- Unstyled speaker now renders as `voice > prosody`.
- Added regression assertions that check tag order and closing order strongly enough to catch the old invalid nesting.

### Fixed finding 2: frozen public Worker allow-list

- Worker still imports the shared voice catalog, but public acceptance is now frozen to exactly:
  - `lin_xiao`
  - `chen_yu`
  - `su_ning`
- Added regression coverage for an injected speaker catalog containing an extra speaker. The Worker accepts injected data for allowed IDs but still rejects the extra ID with `400`, proving catalog growth does not silently expand the public API.

### Exact verification output after review fixes

#### `node --test worker/test/worker.test.mjs`

```text
✔ worker imports the shared speaker catalog instead of hard-coding Azure voices (1.5998ms)
✔ worker freezes the public speaker allow-list to the three named IDs (0.5436ms)
✔ health is unavailable when either Azure secret is absent (29.832ms)
✔ health is ready only when both Azure secrets exist (0.7279ms)
✔ wildcard CORS preflight is preserved (0.4792ms)
✔ unknown scenario, profile, and version are rejected before Azure is called (1.3858ms)
✔ lin xiao and chen yu use the shared v2 Azure speaker settings (1.3914ms)
✔ su ning omits express-as while still returning mp3 (0.4815ms)
✔ injected speaker catalogs still expose only the frozen public allow-list (0.5794ms)
✔ equivalent v2 requests share the same cache key and call Azure once (1.5773ms)
✔ Azure upstream failures become 502 responses (0.5954ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 171.2804
```

#### `node --test tests/*.test.js worker/test/*.test.mjs`

```text
✔ service worker keeps generated speech cache during upgrades (1.2054ms)
✔ offline shell includes shared catalog and scoring core (0.243ms)
✔ slot method uses F1 across unique information types (1.6888ms)
✔ delayed response combines intent and constraint accuracy (0.3058ms)
✔ metacognitive method rewards relevant prediction and calibrated confidence (0.3256ms)
✔ baseline summary stores the selected voice and stable duration (3.3005ms)
✔ progress needs five comparable questions and detects improvement (1.1718ms)
✔ method trend compares first five with latest five after ten questions (0.4412ms)
✔ voice catalog contains the exact three named speakers (2.3623ms)
✔ legacy briefing cache records migrate to the named speaker model (0.3529ms)
✔ voice comparison requires exact speaker provider and version matches (0.4177ms)
✔ worker imports the shared speaker catalog instead of hard-coding Azure voices (1.7855ms)
✔ worker freezes the public speaker allow-list to the three named IDs (0.4683ms)
✔ health is unavailable when either Azure secret is absent (30.3229ms)
✔ health is ready only when both Azure secrets exist (0.8322ms)
✔ wildcard CORS preflight is preserved (0.5513ms)
✔ unknown scenario, profile, and version are rejected before Azure is called (1.028ms)
✔ lin xiao and chen yu use the shared v2 Azure speaker settings (1.2712ms)
✔ su ning omits express-as while still returning mp3 (0.4761ms)
✔ injected speaker catalogs still expose only the frozen public allow-list (0.8929ms)
✔ equivalent v2 requests share the same cache key and call Azure once (2.2261ms)
✔ Azure upstream failures become 502 responses (0.8221ms)
ℹ tests 22
ℹ suites 0
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 199.5795
```
