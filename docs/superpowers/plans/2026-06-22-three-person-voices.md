# Three-Person Voices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three misleading voice-type choices with three named Azure speakers, record the actual audio source, and complete the missing voice-related v1.2 acceptance work without breaking offline training.

**Architecture:** A shared `data/voices.json` catalog is consumed by both the browser and Cloudflare Worker. Pure migration and comparison rules live in `voice-core.js`; `app.js` owns health checks, UI state and playback. The Worker remains a scenario-ID whitelist and generates SSML only from server-owned speaker configuration.

**Tech Stack:** Vanilla JavaScript, IndexedDB, Cache Storage, Service Worker, Cloudflare Workers, Azure Speech SSML, Node.js built-in test runner, SwiftUI/WKWebView resource bundle.

## Global Constraints

- Speakers are exactly `lin_xiao`, `chen_yu`, and `su_ning`; the composition is two women and one man.
- UI labels use 林晓、陈屿、苏宁 as primary identities, not speaking-style categories.
- TTS API version is `2`; version 1 audio must not be reused.
- With no healthy proxy, named cloud speakers are disabled and only one `system` device voice is offered.
- No Azure key may appear in browser, PWA, IPA, exported data, or repository files.
- Progress conclusions require the same `speakerId`, `audioProvider`, and `voiceVersion` as baseline.
- Old attempts remain readable and exportable.
- Preserve unrelated dirty workspace files and stage only files listed by each task.

---

### Task 1: Shared speaker catalog and pure voice data rules

**Files:**
- Create: `data/voices.json`
- Create: `voice-core.js`
- Create: `tests/voice-core.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: legacy `voiceProfile` and `audioSource` fields.
- Produces: `VoiceCore.migrateVoiceRecord(record)`, `VoiceCore.isVoiceComparable(baseline, attempt)`, and shared speaker records with `id`, `name`, `genderLabel`, `azureVoice`, `style`, and `styleDegree`.

- [ ] **Step 1: Write failing tests for migration and comparison**

```js
test("migrates old profiles and normalizes actual providers", () => {
  assert.deepEqual(core.migrateVoiceRecord({ voiceProfile: "briefing", audioSource: "cache" }), {
    voiceProfile: "briefing", audioSource: "cache", speakerId: "chen_yu",
    audioProvider: "azure", audioDelivery: "cache", voiceVersion: 1,
  });
});

test("compares only identical speaker provider and version", () => {
  const baseline = { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 };
  assert.equal(core.isVoiceComparable(baseline, { ...baseline }), true);
  assert.equal(core.isVoiceComparable(baseline, { ...baseline, audioProvider: "system" }), false);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/voice-core.test.js`

Expected: FAIL because `voice-core.js` does not exist.

- [ ] **Step 3: Add version 2 speaker catalog**

```json
{
  "version": 2,
  "speakers": [
    { "id": "lin_xiao", "name": "林晓", "genderLabel": "女声", "azureVoice": "zh-CN-XiaoxiaoNeural", "style": "chat", "styleDegree": 0.55 },
    { "id": "chen_yu", "name": "陈屿", "genderLabel": "男声", "azureVoice": "zh-CN-YunxiNeural", "style": "chat", "styleDegree": 0.45 },
    { "id": "su_ning", "name": "苏宁", "genderLabel": "女声", "azureVoice": "zh-CN-XiaoyiNeural", "style": null, "styleDegree": null }
  ]
}
```

- [ ] **Step 4: Implement pure normalization rules**

```js
const LEGACY_SPEAKERS = { natural: "lin_xiao", briefing: "chen_yu", calm: "su_ning", system: "system" };

function migrateVoiceRecord(record) {
  const speakerId = record.speakerId || LEGACY_SPEAKERS[record.voiceProfile] || "system";
  const audioDelivery = record.audioDelivery || (record.audioSource === "cache" ? "cache" : record.audioSource === "azure" ? "network" : "system");
  const audioProvider = record.audioProvider || (audioDelivery === "system" ? "system" : "azure");
  return { ...record, speakerId, audioProvider, audioDelivery, voiceVersion: Number(record.voiceVersion) || 1 };
}

function isVoiceComparable(baseline, attempt) {
  return Boolean(baseline && attempt && baseline.speakerId === attempt.speakerId && baseline.audioProvider === attempt.audioProvider && Number(baseline.voiceVersion) === Number(attempt.voiceVersion));
}
```

- [ ] **Step 5: Load `voice-core.js` before `app.js` in `index.html` and run GREEN tests**

Run: `node --test tests/voice-core.test.js`

Expected: all voice-core tests PASS.

- [ ] **Step 6: Commit only Task 1 files**

```powershell
git add -- data/voices.json voice-core.js tests/voice-core.test.js index.html
git commit -m "feat: add named speaker data model"
```

### Task 2: Worker v2 speakers, optional SSML style, and truthful health

**Files:**
- Modify: `worker/src/index.js`
- Modify: `worker/test/worker.test.mjs`
- Modify: `worker/README.md`

**Interfaces:**
- Consumes: `data/voices.json` and `data/scenarios.json`.
- Produces: `GET /v1/health` with Azure readiness and `GET /v1/tts/{scenarioId}?profile={speakerId}&v=2`.

- [ ] **Step 1: Replace Worker tests with v2 expectations**

```js
test("health is unavailable when Azure secrets are absent", async () => {
  const response = await handler(new Request("https://voice.example/v1/health"), {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, service: "listening-training-tts", version: 2, azureConfigured: false });
});

test("Su Ning omits express-as while Lin Xiao uses chat", async () => {
  await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=su_ning&v=2"), env);
  assert.doesNotMatch(lastBody, /mstts:express-as/);
  await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=lin_xiao&v=2"), env);
  assert.match(lastBody, /style="chat"/);
});
```

- [ ] **Step 2: Run Worker tests and verify RED**

Run: `node --test worker/test/worker.test.mjs`

Expected: FAIL because Worker still accepts version 1 and type-based profiles.

- [ ] **Step 3: Import shared voices and generate optional-style SSML**

```js
import voices from "../../data/voices.json" with { type: "json" };
const SPEAKERS = new Map(voices.speakers.map((speaker) => [speaker.id, speaker]));

function buildSsml(text, speaker) {
  const content = speaker.style
    ? `<mstts:express-as style="${speaker.style}" styledegree="${speaker.styleDegree}">${escapeXml(text)}</mstts:express-as>`
    : escapeXml(text);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN"><voice name="${speaker.azureVoice}"><prosody rate="0%">${content}</prosody></voice></speak>`;
}
```

- [ ] **Step 4: Make health reflect Secret readiness and normalize v2 cache keys**

Cache key format: `/v1/tts/{scenarioId}?profile={speakerId}&v=2`. Unknown profile, unknown scenario, arbitrary text and versions other than 2 return 400/404 before Azure is called.

- [ ] **Step 5: Run Worker tests and verify GREEN**

Run: `node --test worker/test/worker.test.mjs`

Expected: all Worker tests PASS, including one mocked cache-hit test with one Azure call across two requests.

- [ ] **Step 6: Update deployment instructions and commit Task 2**

```powershell
git add -- worker/src/index.js worker/test/worker.test.mjs worker/README.md
git commit -m "feat: serve three named Azure speakers"
```

### Task 3: Speaker UI, health state, and honest device fallback

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Create: `tests/speaker-ui-contract.test.js`

**Interfaces:**
- Consumes: `data/voices.json`, `VoiceCore`, Worker health and TTS v2.
- Produces: `loadSpeakerCatalog()`, `checkVoiceService()`, `renderSpeakerChoices()`, session `speakerId`, `audioProvider`, and `audioDelivery`.

- [ ] **Step 1: Add failing UI contract tests**

The test reads `index.html` and `app.js` and asserts that the old labels are absent, the speaker container exists, `TTS_VERSION` is `"2"`, health is checked, and the system fallback is a single option.

Run: `node --test tests/speaker-ui-contract.test.js`

Expected: FAIL while old type labels and v1 code remain.

- [ ] **Step 2: Replace hard-coded voice cards with generated speaker cards**

```html
<div class="setup-grid voice-choice-grid" id="speakerChoiceGrid"></div>
<p class="setup-status" id="voiceSetupStatus" aria-live="polite"></p>
```

Each cloud card contains a stable initials avatar, name, gender label, availability badge and one preview button. When health is unavailable, render one checked `system` card and disabled cloud cards.

- [ ] **Step 3: Load speaker data and check proxy health with timeout**

```js
async function checkVoiceService() {
  if (!settings.ttsEndpoint) return { available: false, reason: "not_configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${settings.ttsEndpoint.replace(/\/$/, "")}/v1/health`, { signal: controller.signal });
    const body = await response.json();
    return { available: response.ok && body.ok && body.azureConfigured, reason: response.ok ? null : "unavailable" };
  } catch {
    return { available: false, reason: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 4: Record actual source during playback**

Cloud network and cache playback both set `audioProvider="azure"`; only `audioDelivery` differs. Device fallback sets `speakerId="system"`, `audioProvider="system"`, `audioDelivery="system"`, and displays “本题使用设备语音”.

- [ ] **Step 5: Use the same preview scenario for all three speakers and run UI tests**

Run: `node --test tests/speaker-ui-contract.test.js tests/voice-core.test.js`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```powershell
git add -- app.js index.html styles.css tests/speaker-ui-contract.test.js
git commit -m "feat: present three people instead of voice types"
```

### Task 4: Baseline migration and accurate progress filtering

**Files:**
- Modify: `training-core.js`
- Modify: `app.js`
- Modify: `tests/training-core.test.js`
- Modify: `tests/voice-core.test.js`

**Interfaces:**
- Consumes: normalized attempts from `VoiceCore.migrateVoiceRecord`.
- Produces: baseline summaries with `speakerId`, `audioProvider`, `voiceVersion` and report cards that expose excluded-count information.

- [ ] **Step 1: Add failing baseline and filter tests**

```js
test("baseline stores actual speaker provider and version", () => {
  const summary = core.summarizeBaseline([{ detailScore: 1, intentScore: 1, replayCount: 0, duration: 20, speakerId: "system", audioProvider: "system", voiceVersion: 2 }]);
  assert.equal(summary.speakerId, "system");
  assert.equal(summary.audioProvider, "system");
  assert.equal(summary.voiceVersion, 2);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/training-core.test.js tests/voice-core.test.js`

Expected: FAIL because baseline still stores only `voiceProfile`.

- [ ] **Step 3: Extend baseline summary and migrate IndexedDB attempts**

Call `VoiceCore.migrateVoiceRecord` for every loaded attempt. Preserve legacy fields for export compatibility but use normalized fields for all new calculations.

- [ ] **Step 4: Filter report data with `isVoiceComparable`**

```js
const all = attempts.filter((item) => item.methodId === methodId && item.sessionComplete !== false);
const comparable = all.filter((item) => VoiceCore.isVoiceComparable(baseline, item));
const excludedCount = all.length - comparable.length;
```

Display baseline identity and “另有 N 题因人物或实际音源不同未纳入结论”.

- [ ] **Step 5: Run core tests and verify GREEN**

Run: `node --test tests/training-core.test.js tests/voice-core.test.js`

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```powershell
git add -- training-core.js app.js tests/training-core.test.js tests/voice-core.test.js
git commit -m "fix: compare progress using actual audio source"
```

### Task 5: Cache, PWA, iOS packaging, and full verification

**Files:**
- Modify: `sw.js`
- Modify: `manifest.webmanifest`
- Modify: `index.html`
- Modify: `.github/workflows/build-altstore-ipa.yml`
- Modify: `AltStore-App/project.yml`
- Modify: `tests/offline-assets.test.js`

**Interfaces:**
- Consumes: `voice-core.js`, `data/voices.json`, app and Worker v2 resources.
- Produces: PWA cache v15, audio cache v2, iOS build 15 resources, and a reproducible verification report.

- [ ] **Step 1: Update failing offline asset assertions to v15/v2**

Assert `voice-core.js?v=15`, `data/voices.json`, `listening-training-audio-v2`, and that the iOS workflow copies `voice-core.js` and the entire `data` directory.

- [ ] **Step 2: Run offline tests and verify RED**

Run: `node --test tests/offline-assets.test.js`

Expected: FAIL because current caches are PWA v14 and audio v1.

- [ ] **Step 3: Bump browser and iOS resources**

Use query/cache version 15, `MARKETING_VERSION: 1.2.1`, and `CURRENT_PROJECT_VERSION: 15`. Preserve the new audio v2 cache during service-worker activation.

- [ ] **Step 4: Run complete automated verification**

Run:

```powershell
node --test tests/*.test.js worker/test/*.test.mjs
node --check app.js
node --check voice-core.js
node --check training-core.js
node --check sw.js
git diff --check
```

Expected: zero failed tests, zero syntax errors, zero diff errors.

- [ ] **Step 5: Browser acceptance on `http://127.0.0.1:4180/index.html?v=15#home`**

Verify with the in-app browser: no console errors; unconfigured proxy shows only device voice; configured mocked health enables 林晓、陈屿、苏宁; method selection, intent check, answer and three scores still complete; report shows actual-source filtering.

- [ ] **Step 6: Run secret and UTF-8 scans**

```powershell
rg -n "�|鈥|鍩虹嚎|璁粌" app.js index.html styles.css data worker voice-core.js training-core.js
rg -n "sk-[A-Za-z0-9]{20,}|[A-Za-z0-9+/]{40,}={0,2}" app.js index.html data worker voice-core.js
```

Expected: no encoding damage and no embedded credential value.

- [ ] **Step 7: Commit Task 5 without unrelated workspace files**

```powershell
git add -- sw.js manifest.webmanifest index.html .github/workflows/build-altstore-ipa.yml AltStore-App/project.yml tests/offline-assets.test.js
git commit -m "build: package three-person voice release"
```

### Task 6: External activation and device acceptance checkpoint

**Files:**
- Modify after evidence exists: `worker/README.md`
- Create after evidence exists: `docs/superpowers/verification/2026-06-22-three-person-voices.md`

**Interfaces:**
- Consumes: user-owned Azure Speech and Cloudflare accounts, deployed Worker URL, iPhone and AltStore.
- Produces: deployment URL entered in app settings and device acceptance evidence; secrets remain only in Worker Secret storage.

- [ ] **Step 1: Deploy without exposing secrets**

User enters Azure values directly into `wrangler secret put AZURE_SPEECH_KEY` and `wrangler secret put AZURE_SPEECH_REGION`; Codex must not request the values in chat or store them in files.

- [ ] **Step 2: Verify health and all three MP3 endpoints**

Expected: health 200 with `azureConfigured=true`; all three profiles return `audio/mpeg`; unknown profile returns 400; unknown scenario returns 404.

- [ ] **Step 3: Verify Wi-Fi and cellular connectivity**

If `workers.dev` is unreachable on both networks, deploy the same contract to Azure Functions East Asia before proceeding.

- [ ] **Step 4: Trigger the iOS workflow and install build 15 through AltStore**

Verify microphone denial fallback, three previews, cached replay, forced offline device fallback, background return and local data recovery.

- [ ] **Step 5: Record truthful acceptance status**

The verification document must distinguish PASS, FAIL and BLOCKED. The four-week outcome remains BLOCKED until enough dated training data exists.
