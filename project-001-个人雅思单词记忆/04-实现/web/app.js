"use strict";

const STORAGE_KEY = "word-tuo-state-v3";
const LEGACY_STORAGE_KEYS = ["word-tuo-state-v2", "word-tuo-state-v1"];
const BACKUP_VERSION = 3;
const EXAM_INTERVAL_DAYS = 21;
const MAX_HISTORY = 800;

const SAMPLE_WORDS = [
  { text: "substantial", meaning: "大量的；实质性的；重要的", phonetic: "/səbˈstænʃl/", example: "The report shows a substantial increase in international applications.", tags: ["雅思", "阅读", "高频"] },
  { text: "coherent", meaning: "连贯的；条理清楚的", phonetic: "/koʊˈhɪrənt/", example: "A coherent essay presents ideas in a logical order.", tags: ["雅思", "写作"] },
  { text: "interpret", meaning: "解释；理解；口译", phonetic: "/ɪnˈtɜːrprət/", example: "Candidates need to interpret data from charts accurately.", tags: ["雅思", "阅读"] },
  { text: "approximately", meaning: "大约；近似地", phonetic: "/əˈprɑːksɪmətli/", example: "The number of visitors rose to approximately two million.", tags: ["雅思", "写作"] },
  { text: "inevitable", meaning: "不可避免的；必然发生的", phonetic: "/ɪnˈevɪtəbl/", example: "Some argue that urban expansion is inevitable.", tags: ["雅思", "观点"] },
  { text: "allocate", meaning: "分配；拨出", phonetic: "/ˈæləkeɪt/", example: "Governments should allocate more funding to public transport.", tags: ["雅思", "社会"] },
  { text: "deteriorate", meaning: "恶化；变坏", phonetic: "/dɪˈtɪriəreɪt/", example: "Air quality may deteriorate as traffic volume increases.", tags: ["雅思", "环境"] },
  { text: "viable", meaning: "可行的；能成功的", phonetic: "/ˈvaɪəbl/", example: "Solar power is becoming a viable alternative to fossil fuels.", tags: ["雅思", "科技"] },
  { text: "conventional", meaning: "传统的；常规的", phonetic: "/kənˈvenʃənl/", example: "Conventional farming can place pressure on natural resources.", tags: ["雅思", "阅读"] },
  { text: "facilitate", meaning: "促进；使便利", phonetic: "/fəˈsɪlɪteɪt/", example: "Digital tools facilitate communication across long distances.", tags: ["雅思", "写作"] },
  { text: "prevalent", meaning: "普遍的；盛行的", phonetic: "/ˈprevələnt/", example: "Remote work has become increasingly prevalent in many industries.", tags: ["雅思", "高频"] },
  { text: "compelling", meaning: "令人信服的；引人入胜的", phonetic: "/kəmˈpelɪŋ/", example: "The researcher presented compelling evidence for the policy change.", tags: ["雅思", "写作"] }
];

const SAMPLE_MNEMONICS = {
  substantial: { roots: "sub-（在下）+ stance（站立、实体）+ -ial（形容词）→ 有实体分量的", association: "有 substance（实质）的内容，分量就很 substantial。", family: "substance 实质；substantially 大幅地；substantiate 证实", syllables: "sub · stan · tial" },
  coherent: { roots: "co-（共同）+ her/haer（黏着）+ -ent（形容词）→ 各部分黏在一起", association: "观点像胶水一样黏合，文章就连贯。", family: "cohere 连贯；coherence 连贯性；incoherent 不连贯的", syllables: "co · her · ent" },
  interpret: { roots: "inter-（在……之间）+ pret（解释、说明）→ 在信息之间作解释", association: "在数据和读者之间搭桥，就是 interpret。", family: "interpretation 解释；interpreter 口译员；misinterpret 误解", syllables: "in · ter · pret" },
  approximately: { roots: "ap-/ad-（趋向）+ proxim（接近）+ -ly（副词）→ 接近地", association: "proximity 是接近，approximately 就是大约接近。", family: "approximate 大约的；approximation 近似值；proximity 接近", syllables: "ap · prox · i · mate · ly" },
  inevitable: { roots: "in-（不）+ evit（避免）+ -able（能够）→ 不能避免的", association: "in + evitable：无法逃避，所以不可避免。", family: "inevitably 不可避免地；evitable 可避免的", syllables: "in · ev · it · a · ble" },
  allocate: { roots: "al-/ad-（到）+ loc（地点）+ -ate（动词）→ 把资源放到指定位置", association: "location 是位置，把钱放到某个位置就是 allocate。", family: "allocation 分配；locate 定位；location 位置", syllables: "al · lo · cate" },
  deteriorate: { roots: "deterior（更坏）+ -ate（变成）→ 变得更坏", association: "情况一路变得 worse，就是 deteriorate。", family: "deterioration 恶化；deteriorated 已恶化的", syllables: "de · te · ri · o · rate" },
  viable: { roots: "vi/viv（生命）+ -able（能够）→ 能存活、能实行的", association: "能活下来的方案，才是 viable solution。", family: "viability 可行性；vital 有生命力的；survive 生存", syllables: "vi · a · ble" },
  conventional: { roots: "con-（共同）+ ven（来）+ -tion + -al → 大家共同形成的惯例", association: "大家都按 convention 做，就是传统常规的。", family: "convention 惯例；conventionality 传统性；unconventional 非传统的", syllables: "con · ven · tion · al" },
  facilitate: { roots: "facil（容易）+ -itate（使成为）→ 使事情更容易", association: "facility 带来便利，facilitate 就是促进、便利化。", family: "facility 设施；facilitation 促进；facilitator 促进者", syllables: "fa · cil · i · tate" },
  prevalent: { roots: "pre-（在前）+ val（强、有效）+ -ent → 占优势而广泛存在", association: "到处都能看到、占主流，就是 prevalent。", family: "prevail 盛行；prevalence 流行程度；prevailing 盛行的", syllables: "prev · a · lent" },
  compelling: { roots: "com-（共同、加强）+ pel（驱动）+ -ing → 强力推动注意力", association: "像一股力量把你推向结论，所以令人信服。", family: "compel 迫使；compulsion 强迫；compellingly 有说服力地", syllables: "com · pel · ling" }
};

const pageTitles = { home: "今天", learn: "学习", library: "雅思词库", stats: "统计", settings: "设置" };
const rawState = loadRawState();
const state = normalizeState(rawState);
let activeView = "home";
let activeLearnMode = state.learningSession?.mode || "new";
let toastTimer;

const elementIds = [
  "pageTitle", "memorySummary", "newCount", "dueCount", "todayCount", "streakCount", "weakWordList",
  "examBanner", "examBannerTitle", "examBannerText", "examBannerButton", "learningPanel", "examPanel",
  "searchInput", "filterSelect", "libraryList", "levelBars", "masteryRate", "historyList", "examHistoryList",
  "dailyNewGoalInput", "dailyGoalInput", "autoSpeakInput", "videoEnabledInput", "nextExamSetting",
  "restoreFileInput", "wordDialog", "wordForm", "wordDialogTitle", "wordId", "wordText", "wordMeaning",
  "wordPhonetic", "wordTags", "wordExample", "mnemonicRoots", "mnemonicAssociation", "mnemonicFamily", "mnemonicSyllables",
  "importDialog", "importForm", "importText", "memoryDialog", "memoryWord", "memoryContent", "sceneDialog", "sceneWord", "sceneDescription", "sceneWordId",
  "sceneSavedClips", "sceneClipForm", "clipUrl", "clipStart", "clipEnd", "clipTitle", "clipCaption", "sceneResults", "toast"
];
const el = Object.fromEntries(elementIds.map((id) => [id, document.getElementById(id)]));

bindEvents();
saveState();
renderAll();
registerServiceWorker();

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.querySelectorAll("[data-view-target]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewTarget)));
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
  document.querySelectorAll("[data-learn-mode]").forEach((button) => button.addEventListener("click", () => setLearnMode(button.dataset.learnMode)));
  document.getElementById("quickAddButton").addEventListener("click", () => openWordDialog());
  document.getElementById("startMemoryButton").addEventListener("click", startMemorySession);
  document.getElementById("startReviewButton").addEventListener("click", startReviewSession);
  el.examBannerButton.addEventListener("click", () => { setLearnMode("exam"); switchView("learn"); });
  document.getElementById("importButton").addEventListener("click", () => el.importDialog.showModal());
  document.getElementById("sampleButton").addEventListener("click", () => importWordObjects(SAMPLE_WORDS));
  document.getElementById("exportButton").addEventListener("click", exportBackup);
  document.getElementById("restoreButton").addEventListener("click", () => el.restoreFileInput.click());
  document.getElementById("resetButton").addEventListener("click", resetData);
  el.searchInput.addEventListener("input", renderLibrary);
  el.filterSelect.addEventListener("change", renderLibrary);
  el.wordForm.addEventListener("submit", saveWordForm);
  el.importForm.addEventListener("submit", importWords);
  el.sceneClipForm.addEventListener("submit", saveSceneClip);
  document.getElementById("settingsForm").addEventListener("submit", saveSettings);
  el.restoreFileInput.addEventListener("change", restoreBackup);
}

function loadRawState() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return JSON.parse(current);
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) return { ...JSON.parse(legacy), migratedFrom: key.endsWith("v2") ? 2 : 1 };
    }
  } catch { /* use defaults */ }
  return null;
}

function createDefaultState() {
  const started = todayKey();
  return {
    version: BACKUP_VERSION,
    words: SAMPLE_WORDS.map((word) => createWord({ ...word, mnemonics: SAMPLE_MNEMONICS[word.text] })),
    clips: {}, history: [], exams: [], currentExam: null, lastExamResult: null, learningSession: null,
    examSchedule: { cycleStartedAt: started, nextExamAt: addDays(started, EXAM_INTERVAL_DAYS) },
    settings: { dailyNewGoal: 10, dailyGoal: 30, autoSpeak: true, videoEnabled: true }
  };
}

function normalizeState(input) {
  const fallback = createDefaultState();
  if (!input) return fallback;
  const started = input.examSchedule?.cycleStartedAt || input.createdAt?.slice?.(0, 10) || todayKey();
  const output = {
    version: BACKUP_VERSION,
    words: Array.isArray(input.words) ? input.words.map(normalizeWord).filter(Boolean) : fallback.words,
    clips: normalizeClips(input.clips),
    history: Array.isArray(input.history) ? input.history.map(normalizeRecord).filter(Boolean) : [],
    exams: Array.isArray(input.exams) ? input.exams.map(normalizeExamRecord).filter(Boolean) : [],
    currentExam: normalizeCurrentExam(input.currentExam),
    lastExamResult: normalizeExamRecord(input.lastExamResult),
    learningSession: normalizeSession(input.learningSession),
    examSchedule: {
      cycleStartedAt: started,
      nextExamAt: input.examSchedule?.nextExamAt || addDays(started, EXAM_INTERVAL_DAYS)
    },
    settings: {
      dailyNewGoal: clamp(Number(input.settings?.dailyNewGoal) || 10, 1, 50),
      dailyGoal: clamp(Number(input.settings?.dailyGoal) || 30, 1, 300),
      autoSpeak: Boolean(input.settings?.autoSpeak ?? true),
      videoEnabled: Boolean(input.settings?.videoEnabled ?? true)
    }
  };
  if (!output.words.length) output.words = fallback.words;
  return output;
}

function createWord(data) {
  return normalizeWord({
    id: makeId("word"), text: data.text, meaning: data.meaning, phonetic: data.phonetic || "",
    example: data.example || "", tags: data.tags || ["雅思"], mnemonics: normalizeMnemonics(data.mnemonics, data.text), status: data.status || "new",
    repetitions: 0, easeFactor: 2.5, intervalDays: 0, lapseCount: 0, correct: 0, wrong: 0,
    createdAt: new Date().toISOString(), learnedAt: null, lastReviewed: null, nextReview: todayKey()
  });
}

function normalizeWord(word) {
  if (!word?.text || !word?.meaning) return null;
  const repetitions = Math.max(0, Number(word.repetitions ?? Math.max(0, (Number(word.level) || 1) - 1)) || 0);
  const storedInterval = Number(word.intervalDays);
  const status = ["new", "learning", "review", "mastered"].includes(word.status)
    ? word.status : (word.lastReviewed ? (Number(word.level) >= 5 ? "mastered" : "review") : "new");
  return {
    id: word.id || makeId("word"), text: String(word.text).trim(), meaning: String(word.meaning).trim(),
    phonetic: String(word.phonetic || "").trim(), example: String(word.example || "").trim(), tags: splitTags(word.tags || "雅思"), mnemonics: normalizeMnemonics(word.mnemonics, word.text),
    status, repetitions, easeFactor: clamp(Number(word.easeFactor) || 2.5, 1.3, 3.0),
    intervalDays: Number.isFinite(storedInterval) ? Math.max(0, storedInterval) : legacyInterval(word.level), lapseCount: Math.max(0, Number(word.lapseCount) || 0),
    level: clamp(Number(word.level) || repetitions + 1, 1, 6), correct: Math.max(0, Number(word.correct) || 0), wrong: Math.max(0, Number(word.wrong) || 0),
    createdAt: word.createdAt || new Date().toISOString(), learnedAt: word.learnedAt || (word.lastReviewed ? word.lastReviewed : null),
    lastReviewed: word.lastReviewed || null, nextReview: word.nextReview || todayKey()
  };
}

function normalizeMnemonics(input, text) {
  const curated = SAMPLE_MNEMONICS[String(text || "").toLowerCase()];
  const source = input || curated || {};
  return {
    roots: String(source.roots || analyzeWordParts(text)).trim(),
    association: String(source.association || `把 ${text || "这个单词"} 的发音、词形和中文释义组合成一个夸张画面。`).trim(),
    family: String(source.family || "阅读时继续收集同词根、同前后缀的词，形成词族。" ).trim(),
    syllables: String(source.syllables || splitForSpelling(text)).trim()
  };
}

function normalizeClips(input) {
  if (!input || typeof input !== "object") return {};
  return Object.fromEntries(Object.entries(input).map(([wordId, clips]) => [wordId, Array.isArray(clips) ? clips.map(normalizeClip).filter(Boolean).slice(0, 3) : []]));
}

function normalizeClip(clip) {
  if (!clip?.url) return null;
  const start = Math.max(0, Number(clip.start) || 0);
  const end = Math.max(start + 5, Number(clip.end) || start + 10);
  return { id: clip.id || makeId("clip"), url: String(clip.url), type: clip.type || detectClipType(clip.url), videoId: clip.videoId || extractYouTubeId(clip.url), start, end: Math.min(end, start + 20), title: String(clip.title || "影视语境片段"), caption: String(clip.caption || ""), createdAt: clip.createdAt || new Date().toISOString() };
}

function analyzeWordParts(text) {
  const word = String(text || "").toLowerCase();
  const prefixes = { anti: "反对", inter: "在……之间", trans: "跨越", under: "在下、低于", over: "过度、在上", pre: "在前", sub: "在下", con: "共同", com: "共同、加强", re: "再次", dis: "否定、分离", de: "向下、去除", un: "不", in: "不、向内", im: "不、向内" };
  const suffixes = { ation: "名词后缀", tion: "名词后缀", sion: "名词后缀", ment: "名词后缀", ness: "性质、状态", able: "能够", ible: "能够", ous: "形容词后缀", ive: "具有……性质", al: "形容词后缀", ent: "形容词/名词后缀", ant: "形容词/名词后缀", ate: "动词后缀", ity: "性质、状态", ly: "副词后缀" };
  const prefix = Object.keys(prefixes).sort((a,b) => b.length - a.length).find((part) => word.startsWith(part) && word.length > part.length + 3);
  const suffix = Object.keys(suffixes).sort((a,b) => b.length - a.length).find((part) => word.endsWith(part) && word.length > part.length + 3);
  if (!prefix && !suffix) return "未识别到可靠的常见词缀；建议结合词源词典后在词库中补充。";
  const core = word.slice(prefix?.length || 0, suffix ? -suffix.length : undefined);
  return `${prefix ? `${prefix}-（${prefixes[prefix]}）+ ` : ""}${core || word}${suffix ? ` + -${suffix}（${suffixes[suffix]}）` : ""}（自动拆解，建议核对词源）`;
}

function splitForSpelling(text) {
  const chunks = String(text || "").toLowerCase().match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy])|$)*/g);
  return chunks?.filter(Boolean).join(" · ") || String(text || "");
}

function normalizeRecord(record) {
  if (!record?.word) return null;
  return { id: record.id || makeId("record"), word: String(record.word), wordId: record.wordId || null, result: String(record.result || ""), type: record.type || "review", quality: Number.isFinite(Number(record.quality)) ? Number(record.quality) : null, reviewedAt: record.reviewedAt || new Date().toISOString() };
}

function normalizeSession(session) {
  if (!session || !["new", "review"].includes(session.mode) || !Array.isArray(session.wordIds)) return null;
  return { mode: session.mode, wordIds: session.wordIds.map(String), index: clamp(Number(session.index) || 0, 0, session.wordIds.length), stage: ["preview", "recall", "cloze"].includes(session.stage) ? session.stage : (session.mode === "new" ? "preview" : "recall"), answerRevealed: Boolean(session.answerRevealed), pendingQuality: clamp(Number(session.pendingQuality) || 3, 1, 5), clozeChecked: Boolean(session.clozeChecked), clozeCorrect: Boolean(session.clozeCorrect) };
}

function normalizeCurrentExam(exam) {
  if (!exam || !Array.isArray(exam.questions)) return null;
  return { id: exam.id || makeId("exam"), createdAt: exam.createdAt || new Date().toISOString(), index: clamp(Number(exam.index) || 0, 0, exam.questions.length), practice: Boolean(exam.practice), retest: Boolean(exam.retest), questions: exam.questions.map(normalizeQuestion).filter(Boolean) };
}

function normalizeQuestion(question) {
  if (!question?.answer || !question?.wordId) return null;
  return { id: question.id || makeId("question"), wordId: question.wordId, type: question.type || "spelling", prompt: String(question.prompt || ""), answer: String(question.answer), options: Array.isArray(question.options) ? question.options.map(String) : [], response: String(question.response || ""), correct: typeof question.correct === "boolean" ? question.correct : null };
}

function normalizeExamRecord(exam) {
  if (!exam?.completedAt || !Array.isArray(exam.questions)) return null;
  return { id: exam.id || makeId("exam-record"), completedAt: exam.completedAt, score: clamp(Number(exam.score) || 0, 0, 100), passed: Boolean(exam.passed), practice: Boolean(exam.practice), retest: Boolean(exam.retest), questions: exam.questions.map(normalizeQuestion).filter(Boolean), wrongWordIds: Array.isArray(exam.wrongWordIds) ? exam.wrongWordIds.map(String) : [], breakdown: exam.breakdown || {} };
}

function saveState() { state.version = BACKUP_VERSION; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function replaceState(next) {
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, next);
}

function renderAll() {
  renderHome(); renderLibrary(); renderStats(); renderSettings();
  if (activeView === "learn") renderLearnArea();
}

function switchView(name) {
  activeView = name;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  el.pageTitle.textContent = pageTitles[name] || "单词TUO";
  if (name === "learn") renderLearnArea(); else renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setLearnMode(mode) {
  activeLearnMode = mode;
  document.querySelectorAll("[data-learn-mode]").forEach((button) => button.classList.toggle("active", button.dataset.learnMode === mode));
  renderLearnArea();
}

function renderHome() {
  const newAvailable = getTodayNewWords().length;
  const due = getDueWords().length;
  const done = todayRecords().length;
  el.newCount.textContent = newAvailable;
  el.dueCount.textContent = due;
  el.todayCount.textContent = done;
  el.streakCount.textContent = `${learningStreak()}天`;
  el.memorySummary.textContent = `今日新词 ${newAvailable} 个，待复习 ${due} 个。`;
  renderExamBanner();
  renderWordList(el.weakWordList, weakWords().slice(0, 4), true);
}

function renderExamBanner() {
  const due = isExamDue();
  const days = daysBetween(todayKey(), state.examSchedule.nextExamAt);
  el.examBannerTitle.textContent = due ? "本期抽查已到期" : "三周抽查";
  el.examBannerText.textContent = due ? "30词混合卷已准备，可中途退出后继续。" : `${days} 天后进行下一场正式抽查。`;
  el.examBannerButton.textContent = state.currentExam ? "继续抽查" : (due ? "开始抽查" : "模拟抽查");
}

function startMemorySession() {
  if (state.learningSession?.mode === "new" && state.learningSession.index < state.learningSession.wordIds.length) {
    setLearnMode("new"); switchView("learn"); return;
  }
  const words = getTodayNewWords();
  if (!words.length) {
    if (getDueWords().length) return startReviewSession();
    showToast("今天没有新的学习任务"); return;
  }
  state.learningSession = { mode: "new", wordIds: words.map((word) => word.id), index: 0, stage: "preview", answerRevealed: false, pendingQuality: 3, clozeChecked: false, clozeCorrect: false };
  saveState(); setLearnMode("new"); switchView("learn");
}

function startReviewSession() {
  if (state.learningSession?.mode === "review" && state.learningSession.index < state.learningSession.wordIds.length) {
    setLearnMode("review"); switchView("learn"); return;
  }
  const words = getDueWords();
  state.learningSession = words.length ? { mode: "review", wordIds: words.map((word) => word.id), index: 0, stage: "recall", answerRevealed: false, pendingQuality: 3, clozeChecked: false, clozeCorrect: false } : null;
  saveState(); setLearnMode("review"); switchView("learn");
}

function renderLearnArea() {
  document.querySelectorAll("[data-learn-mode]").forEach((button) => button.classList.toggle("active", button.dataset.learnMode === activeLearnMode));
  const examMode = activeLearnMode === "exam";
  el.learningPanel.classList.toggle("hidden", examMode);
  el.examPanel.classList.toggle("hidden", !examMode);
  if (examMode) return renderExamPanel();
  renderLearningPanel(activeLearnMode);
}

function renderLearningPanel(mode) {
  const session = state.learningSession;
  if (!session || session.mode !== mode || session.index >= session.wordIds.length) {
    const count = mode === "new" ? getTodayNewWords().length : getDueWords().length;
    el.learningPanel.innerHTML = `<div class="learning-card empty-session"><div><p class="eyebrow">${mode === "new" ? "NEW WORDS" : "REVIEW"}</p><h2>${count ? `有 ${count} 个任务等待完成` : (mode === "new" ? "今日新词已完成" : "到期复习已完成")}</h2><p>${mode === "new" ? "三阶段学习会把新词送入 SM-2 复习队列。" : "下一批单词会按记忆表现自动出现。"}</p>${count ? `<button class="primary-button" id="beginSessionButton">${mode === "new" ? "开始三阶段记忆" : "开始到期复习"}</button>` : ""}</div></div>`;
    document.getElementById("beginSessionButton")?.addEventListener("click", mode === "new" ? startMemorySession : startReviewSession);
    return;
  }
  const word = state.words.find((item) => item.id === session.wordIds[session.index]);
  if (!word) { session.index += 1; saveState(); return renderLearningPanel(mode); }
  if (mode === "review") return renderRecallStage(word, session, true);
  if (session.stage === "preview") return renderPreviewStage(word, session);
  if (session.stage === "recall") return renderRecallStage(word, session, false);
  renderClozeStage(word, session);
}

function sessionHeader(session, labels) {
  const activeIndex = Math.max(0, labels.indexOf(session.stage));
  return `<div class="exam-head"><p class="eyebrow">${session.mode === "new" ? "SYSTEM MEMORY" : "SPACED REVIEW"}</p><span class="exam-progress">${session.index + 1}/${session.wordIds.length}</span></div>${session.mode === "new" ? `<div class="stage-line">${labels.map((_, index) => `<span class="${index <= activeIndex ? "active" : ""}"></span>`).join("")}</div>` : ""}`;
}

function renderPreviewStage(word, session) {
  el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","cloze"])}<div class="learning-word"><h2>${escapeHtml(word.text)}</h2><p class="phonetic">${escapeHtml(word.phonetic)}</p></div><div class="learning-answer"><p><strong>${escapeHtml(word.meaning)}</strong></p><blockquote>${escapeHtml(word.example || "暂无例句，可在词库中补充。")}</blockquote></div>${renderMemoryMethods(word)}<div class="session-tools"><button class="secondary-button" id="sessionSpeakButton">朗读</button><button class="primary-button" id="toRecallButton">我看完了，开始回忆</button></div></article>`;
  document.getElementById("sessionSpeakButton").addEventListener("click", () => speak(word.text));
  document.getElementById("toRecallButton").addEventListener("click", () => { session.stage = "recall"; session.answerRevealed = false; saveState(); renderLearnArea(); });
  if (state.settings.autoSpeak) setTimeout(() => speak(word.text), 120);
}

function renderMemoryMethods(word) {
  const memory = word.mnemonics;
  const methods = [
    ["词根词缀", memory.roots],
    ["联想钩子", memory.association],
    ["词族联结", memory.family],
    ["音节拼写", memory.syllables],
    ["语境记忆", word.example || `用 ${word.text} 造一个和自己有关的句子。`]
  ];
  return `<section class="memory-methods"><div class="method-heading"><p class="eyebrow">MEMORY TOOLS</p><strong>五种记忆法</strong></div><div class="memory-method-grid">${methods.map(([title, content], index) => `<details class="memory-method" ${index === 0 ? "open" : ""}><summary><span>${index + 1}</span>${escapeHtml(title)}</summary><p>${escapeHtml(content)}</p></details>`).join("")}</div></section>`;
}

function renderRecallStage(word, session, isReview) {
  el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","cloze"])}<div class="learning-word"><h2>${escapeHtml(word.text)}</h2><p class="phonetic">${escapeHtml(word.phonetic)}</p></div>${session.answerRevealed ? `<div class="learning-answer"><p><strong>${escapeHtml(word.meaning)}</strong></p><blockquote>${escapeHtml(word.example || "暂无例句")}</blockquote></div><div class="rating-actions"><button class="again-button" data-quality="1">不认识<small>重新学习</small></button><button class="hard-button" data-quality="3">模糊<small>缩短间隔</small></button><button class="good-button" data-quality="5">认识<small>增加间隔</small></button></div>` : `<div class="learning-answer"><p>先在心里说出中文释义，再显示答案。</p></div><div class="session-tools"><button class="secondary-button" id="sessionSpeakButton">朗读</button><button class="primary-button" id="revealAnswerButton">显示答案</button></div>`}</article>`;
  document.getElementById("sessionSpeakButton")?.addEventListener("click", () => speak(word.text));
  document.getElementById("revealAnswerButton")?.addEventListener("click", () => { session.answerRevealed = true; saveState(); renderLearnArea(); });
  document.querySelectorAll("[data-quality]").forEach((button) => button.addEventListener("click", () => {
    const quality = Number(button.dataset.quality);
    if (isReview) { applyReview(word, quality, "review"); advanceSession(); }
    else { session.pendingQuality = quality; session.stage = "cloze"; session.clozeChecked = false; session.clozeCorrect = false; saveState(); renderLearnArea(); }
  }));
  if (!session.answerRevealed && state.settings.autoSpeak) setTimeout(() => speak(word.text), 120);
}

function renderClozeStage(word, session) {
  const sentence = word.example ? makeCloze(word.example, word.text) : `根据释义拼写英文：${word.meaning}`;
  el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","cloze"])}<div><p class="eyebrow">EXAMPLE CLOZE</p><h2>完成例句</h2></div><div class="cloze-sentence">${escapeHtml(sentence)}</div><form id="clozeForm"><input class="answer-input" id="clozeInput" autocomplete="off" autocapitalize="none" placeholder="输入英文单词" ${session.clozeChecked ? "disabled" : ""} /><div class="command-row">${session.clozeChecked ? `<div class="feedback ${session.clozeCorrect ? "correct" : "wrong"}">${session.clozeCorrect ? "回答正确" : `正确答案：${escapeHtml(word.text)}`}</div><button class="primary-button" type="button" id="nextWordButton">下一个</button>` : `<button class="primary-button" type="submit">检查答案</button>`}</div></form></article>`;
  document.getElementById("clozeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const response = document.getElementById("clozeInput").value;
    session.clozeCorrect = normalizeAnswer(response) === normalizeAnswer(word.text);
    session.clozeChecked = true; saveState(); renderLearnArea();
  });
  document.getElementById("nextWordButton")?.addEventListener("click", () => {
    const quality = session.clozeCorrect ? session.pendingQuality : Math.min(2, session.pendingQuality);
    applyReview(word, quality, "new-complete"); advanceSession();
  });
}

function advanceSession() {
  const session = state.learningSession;
  if (!session) return;
  session.index += 1; session.stage = session.mode === "new" ? "preview" : "recall"; session.answerRevealed = false; session.pendingQuality = 3; session.clozeChecked = false; session.clozeCorrect = false;
  if (session.index >= session.wordIds.length) state.learningSession = null;
  saveState(); renderAll(); renderLearnArea();
}

function applyReview(word, quality, type) {
  const previousEase = word.easeFactor;
  word.easeFactor = clamp(previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)), 1.3, 3.0);
  if (quality <= 2) {
    word.repetitions = 0; word.intervalDays = 0; word.nextReview = todayKey(); word.status = "learning"; word.lapseCount += 1; word.wrong += 1;
  } else if (quality === 3) {
    word.repetitions = Math.max(1, word.repetitions); word.intervalDays = word.intervalDays ? Math.max(1, Math.round(word.intervalDays * 1.2)) : 1; word.nextReview = addDays(todayKey(), word.intervalDays); word.status = "review"; word.wrong += 1;
  } else {
    word.repetitions += 1;
    word.intervalDays = word.repetitions === 1 ? 1 : word.repetitions === 2 ? 3 : Math.max(4, Math.round(Math.max(1, word.intervalDays) * word.easeFactor));
    word.nextReview = addDays(todayKey(), word.intervalDays); word.status = word.intervalDays >= 30 || word.repetitions >= 5 ? "mastered" : "review"; word.correct += 1;
  }
  word.level = clamp(word.repetitions + 1, 1, 6); word.lastReviewed = new Date().toISOString();
  if (!word.learnedAt) word.learnedAt = word.lastReviewed;
  state.history.unshift({ id: makeId("record"), word: word.text, wordId: word.id, result: quality <= 2 ? "不认识" : quality === 3 ? "模糊" : "认识", type, quality, reviewedAt: word.lastReviewed });
  state.history = state.history.slice(0, MAX_HISTORY);
  saveState();
}

function renderExamPanel() {
  if (state.currentExam) return renderExamQuestion();
  const last = state.lastExamResult || state.exams[0];
  const due = isExamDue();
  el.examPanel.innerHTML = `<article class="exam-card">${last ? `<div class="score-ring">${last.score}</div><div style="text-align:center"><h2>${last.passed ? "抽查通过" : "继续巩固"}</h2><p class="muted">${formatDate(last.completedAt)} · ${last.questions.length} 词</p></div>${renderScoreDetails(last)}` : `<div class="empty-session"><div><p class="eyebrow">21-DAY CHECK</p><h2>三周抽查</h2><p>选择、拼写和例句填空混合计分，80分及格。</p></div></div>`}<div class="command-row stacked-mobile">${last?.wrongWordIds?.length ? `<button class="secondary-button" id="retestWrongButton">只重测错词</button>` : ""}<button class="primary-button" id="startExamButton">${due ? "开始本期抽查" : "开始模拟抽查"}</button></div><p class="setting-note">下一场正式抽查：${formatDateKey(state.examSchedule.nextExamAt)}</p></article>`;
  document.getElementById("startExamButton").addEventListener("click", () => startExam({ practice: !due }));
  document.getElementById("retestWrongButton")?.addEventListener("click", () => startExam({ practice: true, retest: true, wordIds: last.wrongWordIds }));
}

function startExam({ practice = false, retest = false, wordIds = null } = {}) {
  const words = wordIds ? wordIds.map((id) => state.words.find((word) => word.id === id)).filter(Boolean) : selectExamWords();
  if (!words.length) return showToast("词库中还没有可抽查的单词");
  state.currentExam = { id: makeId("exam"), createdAt: new Date().toISOString(), index: 0, practice, retest, questions: createExamQuestions(words) };
  saveState(); renderExamPanel();
}

function selectExamWords() {
  const picked = [];
  const add = (items, limit) => items.forEach((word) => { if (picked.length < 30 && limit > 0 && !picked.includes(word)) { picked.push(word); limit -= 1; } });
  const weak = [...state.words].sort((a,b) => b.lapseCount - a.lapseCount || b.wrong - a.wrong);
  const recentCutoff = addDays(todayKey(), -21);
  const recent = state.words.filter((word) => (word.learnedAt || word.createdAt).slice(0,10) >= recentCutoff);
  const mastered = state.words.filter((word) => word.status === "mastered");
  add(weak.filter((word) => word.status !== "new"), 12); add(recent, 10); add(mastered, 8); add(state.words, 30 - picked.length);
  return picked.slice(0, 30);
}

function createExamQuestions(words) {
  const shuffled = shuffle([...words]);
  return shuffled.map((word, index) => {
    const type = index < Math.ceil(words.length / 3) ? "choice" : index < Math.ceil(words.length * 2 / 3) ? "spelling" : (word.example ? "cloze" : "spelling");
    if (type === "choice") {
      const distractors = shuffle(state.words.filter((item) => item.id !== word.id).map((item) => item.meaning).filter((value, i, all) => all.indexOf(value) === i)).slice(0, 3);
      return { id: makeId("question"), wordId: word.id, type, prompt: `选择 “${word.text}” 的中文释义`, answer: word.meaning, options: shuffle([word.meaning, ...distractors]), response: "", correct: null };
    }
    if (type === "cloze") return { id: makeId("question"), wordId: word.id, type, prompt: makeCloze(word.example, word.text), answer: word.text, options: [], response: "", correct: null };
    return { id: makeId("question"), wordId: word.id, type: "spelling", prompt: `根据释义拼写英文：${word.meaning}`, answer: word.text, options: [], response: "", correct: null };
  });
}

function renderExamQuestion() {
  const exam = state.currentExam;
  if (!exam || exam.index >= exam.questions.length) return completeExam();
  const question = exam.questions[exam.index];
  const typeName = { choice: "释义选择", spelling: "拼写", cloze: "例句填空" }[question.type];
  el.examPanel.innerHTML = `<article class="exam-card"><div class="exam-head"><div><p class="eyebrow">${typeName}</p><h2>三周抽查</h2></div><span class="exam-progress">${exam.index + 1}/${exam.questions.length}</span></div><div class="bar-track"><div class="bar-fill" style="width:${exam.index / exam.questions.length * 100}%"></div></div><div class="exam-question"><h2>${escapeHtml(question.prompt)}</h2></div>${question.type === "choice" ? `<div class="option-list">${question.options.map((option) => `<button class="option-button ${question.response === option ? "selected" : ""}" data-exam-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div>` : `<input class="answer-input" id="examAnswerInput" autocomplete="off" autocapitalize="none" value="${escapeHtml(question.response)}" placeholder="输入答案" />`}<div class="session-tools"><button class="secondary-button" id="exitExamButton">稍后继续</button><button class="primary-button" id="nextExamQuestionButton" ${question.response ? "" : "disabled"}>${exam.index + 1 === exam.questions.length ? "提交试卷" : "下一题"}</button></div></article>`;
  document.querySelectorAll("[data-exam-option]").forEach((button) => button.addEventListener("click", () => { question.response = button.dataset.examOption; saveState(); renderExamQuestion(); }));
  document.getElementById("examAnswerInput")?.addEventListener("input", (event) => { question.response = event.target.value; document.getElementById("nextExamQuestionButton").disabled = !question.response.trim(); saveState(); });
  document.getElementById("nextExamQuestionButton").addEventListener("click", () => { question.correct = normalizeAnswer(question.response) === normalizeAnswer(question.answer); exam.index += 1; saveState(); renderExamPanel(); });
  document.getElementById("exitExamButton").addEventListener("click", () => { switchView("home"); showToast("抽查进度已保存"); });
}

function completeExam() {
  const exam = state.currentExam;
  if (!exam) return;
  const total = exam.questions.length;
  const correct = exam.questions.filter((question) => question.correct).length;
  const score = Math.round(correct / Math.max(total, 1) * 100);
  const breakdown = {};
  ["choice", "spelling", "cloze"].forEach((type) => { const rows = exam.questions.filter((question) => question.type === type); breakdown[type] = { correct: rows.filter((question) => question.correct).length, total: rows.length }; });
  const record = { id: exam.id, completedAt: new Date().toISOString(), score, passed: score >= 80, practice: exam.practice, retest: exam.retest, questions: exam.questions, wrongWordIds: [...new Set(exam.questions.filter((question) => !question.correct).map((question) => question.wordId))], breakdown };
  record.wrongWordIds.forEach((id) => { const word = state.words.find((item) => item.id === id); if (word) { word.status = "learning"; word.nextReview = todayKey(); word.lapseCount += 1; word.wrong += 1; } });
  state.exams.unshift(record); state.exams = state.exams.slice(0, 24); state.lastExamResult = record; state.currentExam = null;
  if (!record.practice && !record.retest) state.examSchedule.nextExamAt = addDays(todayKey(), EXAM_INTERVAL_DAYS);
  saveState(); renderAll(); renderExamPanel();
}

function renderScoreDetails(record) {
  const labels = { choice: "选择", spelling: "拼写", cloze: "填空" };
  return `<div class="score-details">${Object.entries(labels).map(([type,label]) => `<div><span>${label}</span><strong>${record.breakdown?.[type]?.correct || 0}/${record.breakdown?.[type]?.total || 0}</strong></div>`).join("")}</div>`;
}

function renderLibrary() {
  const query = el.searchInput.value.trim().toLowerCase();
  const filter = el.filterSelect.value;
  const words = state.words.filter((word) => {
    const searchable = [word.text, word.meaning, word.example, ...word.tags].join(" ").toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filter === "new") return word.status === "new";
    if (filter === "due") return word.status !== "new" && word.nextReview <= todayKey();
    if (filter === "weak") return word.lapseCount > 0 || word.status === "learning" || word.wrong > word.correct;
    if (filter === "mastered") return word.status === "mastered";
    return true;
  }).sort((a,b) => statusRank(a.status) - statusRank(b.status) || a.nextReview.localeCompare(b.nextReview) || a.text.localeCompare(b.text));
  renderWordList(el.libraryList, words, false);
}

function renderWordList(container, words, compact) {
  container.innerHTML = "";
  if (!words.length) return container.append(emptyItem(compact ? "暂时没有薄弱词。" : "没有符合条件的单词。"));
  words.forEach((word) => {
    const item = document.createElement("li"); item.className = "word-item";
    const sceneButton = state.settings.videoEnabled ? `<button class="secondary-button" data-action="scene" data-id="${word.id}">影视语境</button>` : "";
    item.innerHTML = `<div><h3>${escapeHtml(word.text)}</h3><p>${escapeHtml(word.meaning)}</p><div class="word-meta"><span class="pill">${statusLabel(word.status)}</span><span class="pill">${word.status === "new" ? "未安排" : formatDue(word.nextReview)}</span>${word.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div></div>${compact ? "" : `<div class="item-actions"><button class="secondary-button" data-action="speak" data-id="${word.id}">朗读</button><button class="secondary-button" data-action="memory" data-id="${word.id}">记忆法</button>${sceneButton}<button class="secondary-button" data-action="edit" data-id="${word.id}">编辑</button><button class="danger-button" data-action="delete" data-id="${word.id}">删除</button></div>`}`;
    container.append(item);
  });
  container.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleWordAction(button.dataset.action, button.dataset.id)));
}

function handleWordAction(action, id) {
  const word = state.words.find((item) => item.id === id); if (!word) return;
  if (action === "speak") speak(word.text);
  if (action === "edit") openWordDialog(id);
  if (action === "memory") openMemoryDialog(word);
  if (action === "scene") openSceneDialog(word);
  if (action === "delete" && confirm(`删除 ${word.text}？`)) { state.words = state.words.filter((item) => item.id !== id); delete state.clips[id]; saveState(); renderAll(); showToast("单词已删除"); }
}

function openMemoryDialog(word) {
  el.memoryWord.textContent = `${word.text} · 五种记忆法`;
  el.memoryContent.innerHTML = renderMemoryMethods(word);
  el.memoryDialog.showModal();
}

async function openSceneDialog(word) {
  el.sceneWord.textContent = `${word.text} · 影视语境`;
  el.sceneWordId.value = word.id;
  el.sceneDescription.textContent = "搜索后可保存最多3个公开视频链接；播放器只在点击时加载，片段严格限制为5–20秒。";
  el.sceneResults.innerHTML = `<div class="empty">正在准备语境来源…</div>`;
  renderSavedClips(word);
  el.sceneDialog.showModal();
  const results = await clipProvider.search(word.text, 3);
  if (!el.sceneDialog.open) return;
  el.sceneResults.innerHTML = `<div class="scene-notice">先在以下合法来源搜索，再把 YouTube 或公开 MP4/WebM 链接保存到上方。PlayPhrase.me 没有确认免费公开接口，因此不会自动抓取。</div>${results.map((result) => `<article class="scene-card"><div><p class="eyebrow">${escapeHtml(result.source)}</p><h3>${escapeHtml(result.title)}</h3></div><p>${escapeHtml(result.caption)}</p><a href="${safeUrl(result.url)}" target="_blank" rel="noopener noreferrer">打开搜索</a></article>`).join("")}`;
}

function saveSceneClip(event) {
  event.preventDefault();
  const word = state.words.find((item) => item.id === el.sceneWordId.value);
  if (!word) return showToast("没有找到对应单词");
  const url = el.clipUrl.value.trim();
  const start = Math.max(0, Number(el.clipStart.value) || 0);
  const end = Number(el.clipEnd.value);
  const duration = end - start;
  const type = detectClipType(url);
  if (!type) return showToast("仅支持 YouTube 或 HTTPS 的 MP4/WebM 链接");
  if (duration < 5 || duration > 20) return showToast("片段长度必须是5–20秒");
  const clips = state.clips[word.id] || [];
  if (clips.length >= 3) return showToast("每个单词最多保存3个片段");
  clips.push(normalizeClip({ url, type, videoId: extractYouTubeId(url), start, end, title: el.clipTitle.value.trim(), caption: el.clipCaption.value.trim() }));
  state.clips[word.id] = clips;
  saveState(); el.sceneClipForm.reset(); el.clipStart.value = 0; el.clipEnd.value = 10; renderSavedClips(word); showToast("片段已保存，点击即可播放");
}

function renderSavedClips(word) {
  const clips = state.clips[word.id] || [];
  if (!clips.length) {
    el.sceneSavedClips.innerHTML = `<div class="empty"><strong>还没有保存片段</strong><p>打开下方搜索，将公开视频链接和5–20秒时间段保存到这里。</p></div>`;
    return;
  }
  preconnectClipHosts(clips);
  el.sceneSavedClips.innerHTML = clips.map((clip, index) => `<article class="saved-clip"><div class="clip-screen" id="clipScreen-${escapeHtml(clip.id)}"><button class="clip-play" data-play-clip="${escapeHtml(clip.id)}" aria-label="播放片段">▶</button><span>${clip.end - clip.start}秒片段</span></div><div class="clip-copy"><p class="eyebrow">CLIP ${index + 1}</p><h3>${escapeHtml(clip.title)}</h3><p>${escapeHtml(clip.caption || `${clip.start}s–${clip.end}s`)}</p><button class="text-button" data-delete-clip="${escapeHtml(clip.id)}">删除片段</button></div></article>`).join("");
  el.sceneSavedClips.querySelectorAll("[data-play-clip]").forEach((button) => button.addEventListener("click", () => playSavedClip(word.id, button.dataset.playClip)));
  el.sceneSavedClips.querySelectorAll("[data-delete-clip]").forEach((button) => button.addEventListener("click", () => deleteSavedClip(word.id, button.dataset.deleteClip)));
}

function playSavedClip(wordId, clipId) {
  const clip = (state.clips[wordId] || []).find((item) => item.id === clipId);
  if (!clip) return;
  const host = document.getElementById(`clipScreen-${clip.id}`);
  if (clip.type === "youtube") {
    host.innerHTML = `<iframe title="${escapeHtml(clip.title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(clip.videoId)}?start=${clip.start}&end=${clip.end}&playsinline=1&rel=0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    return;
  }
  host.innerHTML = `<video controls playsinline preload="metadata" src="${safeUrl(clip.url)}#t=${clip.start},${clip.end}"></video>`;
  const video = host.querySelector("video");
  video.addEventListener("loadedmetadata", () => { video.currentTime = clip.start; });
  video.addEventListener("timeupdate", () => { if (video.currentTime >= clip.end) video.pause(); });
}

function deleteSavedClip(wordId, clipId) {
  state.clips[wordId] = (state.clips[wordId] || []).filter((clip) => clip.id !== clipId);
  saveState();
  const word = state.words.find((item) => item.id === wordId);
  if (word) renderSavedClips(word);
}

function detectClipType(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (extractYouTubeId(value)) return "youtube";
    if (/\.(mp4|webm)(?:$|\?)/i.test(url.pathname + url.search)) return "video";
  } catch { return null; }
  return null;
}

function extractYouTubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return /^[\w-]{11}$/.test(url.pathname.slice(1)) ? url.pathname.slice(1) : null;
    if (url.hostname.endsWith("youtube.com")) {
      const candidate = url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : url.searchParams.get("v");
      return /^[\w-]{11}$/.test(candidate || "") ? candidate : null;
    }
  } catch { return null; }
  return null;
}

function preconnectClipHosts(clips) {
  if (!clips.some((clip) => clip.type === "youtube") || document.querySelector('link[data-video-preconnect]')) return;
  ["https://www.youtube-nocookie.com", "https://i.ytimg.com"].forEach((href) => { const link = document.createElement("link"); link.rel = "preconnect"; link.href = href; link.dataset.videoPreconnect = "true"; document.head.append(link); });
}

class ClipProvider {
  async search(word, limit = 3) { throw new Error(`ClipProvider.search not implemented: ${word}/${limit}`); }
}

class FreeContextProvider extends ClipProvider {
  async search(word, limit = 3) {
    const cached = await clipCache.get(word);
    if (cached) return cached.slice(0, limit);
    const query = encodeURIComponent(`${word} movie scene English subtitles`);
    const encodedWord = encodeURIComponent(word);
    const results = [
      { id: `playphrase-${word}`, source: "PLAYPHRASE", title: `搜索 ${word} 的影视台词`, caption: "优先来源；当前仅打开搜索页，不抓取或预载受保护片段。", url: `https://www.playphrase.me/#/search?q=${encodedWord}`, precise: false },
      { id: `youtube-${word}`, source: "PUBLIC VIDEO", title: `查找 ${word} 的公开视频语境`, caption: "公开视频搜索结果；是否为影视片段及具体时间点由来源页面决定。", url: `https://www.youtube.com/results?search_query=${query}`, precise: false },
      { id: `youglish-${word}`, source: "YOUGLISH", title: `听 ${word} 的真实语境`, caption: "从公开视频中查找真实发音语境，可能不是影视作品。", url: `https://youglish.com/pronounce/${encodedWord}/english`, precise: false }
    ].slice(0, limit);
    await clipCache.set(word, results); return results;
  }
}

const clipCache = {
  dbPromise: null,
  open() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve) => {
      const request = indexedDB.open("word-tuo-clips", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("searches", { keyPath: "word" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
    return this.dbPromise;
  },
  async get(word) {
    const db = await this.open(); if (!db) return null;
    return new Promise((resolve) => { const request = db.transaction("searches", "readonly").objectStore("searches").get(word.toLowerCase()); request.onsuccess = () => { const row = request.result; resolve(row && Date.now() - row.savedAt < 7 * 86400000 ? row.results : null); }; request.onerror = () => resolve(null); });
  },
  async set(word, results) {
    const db = await this.open(); if (!db) return;
    return new Promise((resolve) => { const request = db.transaction("searches", "readwrite").objectStore("searches").put({ word: word.toLowerCase(), savedAt: Date.now(), results }); request.onsuccess = request.onerror = () => resolve(); });
  }
};
const clipProvider = new FreeContextProvider();

function openWordDialog(id = "") {
  const word = state.words.find((item) => item.id === id);
  const memory = word?.mnemonics || normalizeMnemonics(null, word?.text || "");
  el.wordDialogTitle.textContent = word ? "编辑单词" : "添加单词"; el.wordId.value = word?.id || ""; el.wordText.value = word?.text || ""; el.wordMeaning.value = word?.meaning || ""; el.wordPhonetic.value = word?.phonetic || ""; el.wordTags.value = word?.tags.join(", ") || "雅思"; el.wordExample.value = word?.example || ""; el.mnemonicRoots.value = memory.roots; el.mnemonicAssociation.value = memory.association; el.mnemonicFamily.value = memory.family; el.mnemonicSyllables.value = memory.syllables; el.wordDialog.showModal();
}

function saveWordForm(event) {
  event.preventDefault();
  const id = el.wordId.value;
  const mnemonics = { roots: el.mnemonicRoots.value, association: el.mnemonicAssociation.value, family: el.mnemonicFamily.value, syllables: el.mnemonicSyllables.value };
  const payload = createWord({ text: el.wordText.value, meaning: el.wordMeaning.value, phonetic: el.wordPhonetic.value, example: el.wordExample.value, tags: splitTags(el.wordTags.value), mnemonics });
  if (!payload) return;
  const index = state.words.findIndex((word) => word.id === id);
  if (index >= 0) state.words[index] = { ...state.words[index], text: payload.text, meaning: payload.meaning, phonetic: payload.phonetic, example: payload.example, tags: payload.tags, mnemonics: payload.mnemonics }; else state.words.unshift(payload);
  saveState(); el.wordDialog.close(); el.wordForm.reset(); renderAll(); showToast("单词已保存");
}

function importWords(event) {
  event.preventDefault(); const raw = el.importText.value.trim(); if (!raw) return;
  let words;
  try { const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) throw new Error(); words = parsed; }
  catch { words = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [text, meaning, example = "", tags = "雅思"] = line.split("|").map((part) => part.trim()); return { text, meaning, example, tags: splitTags(tags) }; }); }
  importWordObjects(words);
}

function importWordObjects(rawWords) {
  const existing = new Set(state.words.map((word) => word.text.toLowerCase())); const imported = [];
  rawWords.forEach((raw) => { const word = createWord(raw); if (word && !existing.has(word.text.toLowerCase())) { imported.push(word); existing.add(word.text.toLowerCase()); } });
  if (!imported.length) return showToast("没有可导入的新单词");
  state.words.unshift(...imported); saveState(); if (el.importDialog.open) el.importDialog.close(); el.importForm.reset(); renderAll(); showToast(`已导入 ${imported.length} 个单词`);
}

function renderStats() {
  const statuses = ["new", "learning", "review", "mastered"];
  const counts = statuses.map((status) => state.words.filter((word) => word.status === status).length); const max = Math.max(...counts, 1);
  el.masteryRate.textContent = `${Math.round(counts[3] / Math.max(state.words.length, 1) * 100)}%`;
  el.levelBars.innerHTML = counts.map((count, index) => `<div><div class="bar-label"><span>${statusLabel(statuses[index])}</span><strong>${count}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${count / max * 100}%"></div></div></div>`).join("");
  el.examHistoryList.innerHTML = "";
  if (!state.exams.length) el.examHistoryList.append(emptyItem("完成三周抽查后，这里会显示成绩。"));
  else state.exams.slice(0, 8).forEach((exam) => { const item = document.createElement("li"); item.textContent = `${formatDate(exam.completedAt)} · ${exam.practice ? "模拟" : "正式"} · ${exam.score}分 · ${exam.passed ? "通过" : "未通过"}`; el.examHistoryList.append(item); });
  el.historyList.innerHTML = "";
  if (!state.history.length) el.historyList.append(emptyItem("完成学习后，这里会显示记录。"));
  else state.history.slice(0, 20).forEach((record) => { const item = document.createElement("li"); item.textContent = `${formatTime(record.reviewedAt)} · ${record.word} · ${record.result}`; el.historyList.append(item); });
}

function renderSettings() {
  el.dailyNewGoalInput.value = state.settings.dailyNewGoal; el.dailyGoalInput.value = state.settings.dailyGoal; el.autoSpeakInput.checked = state.settings.autoSpeak; el.videoEnabledInput.checked = state.settings.videoEnabled; el.nextExamSetting.textContent = `下一场正式抽查：${formatDateKey(state.examSchedule.nextExamAt)}`;
}

function saveSettings(event) {
  event.preventDefault(); state.settings.dailyNewGoal = clamp(Number(el.dailyNewGoalInput.value) || 10, 1, 50); state.settings.dailyGoal = clamp(Number(el.dailyGoalInput.value) || 30, 1, 300); state.settings.autoSpeak = el.autoSpeakInput.checked; state.settings.videoEnabled = el.videoEnabledInput.checked; saveState(); renderAll(); showToast("设置已保存");
}

function exportBackup() {
  const json = JSON.stringify({ app: "单词TUO", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), ...state }, null, 2);
  if (window.webkit?.messageHandlers?.shareBackup) { window.webkit.messageHandlers.shareBackup.postMessage(json); return showToast("备份已准备"); }
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `单词TUO-备份-${todayKey()}.json`; anchor.click(); URL.revokeObjectURL(url);
}

function restoreBackup(event) {
  const file = event.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { replaceState(normalizeState(JSON.parse(String(reader.result || "{}")))); saveState(); renderAll(); showToast("备份已恢复"); } catch { showToast("备份文件格式不正确"); } el.restoreFileInput.value = ""; };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm("清空单词TUO的全部学习数据？")) return;
  replaceState(createDefaultState()); saveState(); renderAll(); showToast("数据已重置");
}

function getTodayNewWords() {
  const learned = new Set(state.history.filter((record) => record.type === "new-complete" && record.reviewedAt.slice(0,10) === todayKey()).map((record) => record.wordId));
  const remaining = Math.max(0, state.settings.dailyNewGoal - learned.size);
  return state.words.filter((word) => word.status === "new").slice(0, remaining);
}
function getDueWords() { return state.words.filter((word) => word.status !== "new" && word.nextReview <= todayKey()).sort((a,b) => statusRank(a.status) - statusRank(b.status) || b.lapseCount - a.lapseCount || a.text.localeCompare(b.text)); }
function weakWords() { return state.words.filter((word) => word.status === "learning" || word.lapseCount > 0 || word.wrong > word.correct).sort((a,b) => b.lapseCount - a.lapseCount || b.wrong - a.wrong); }
function todayRecords() { return state.history.filter((record) => record.reviewedAt.slice(0,10) === todayKey()); }
function learningStreak() { const days = new Set(state.history.map((record) => record.reviewedAt.slice(0,10))); let cursor = new Date(); if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1); let count = 0; while (days.has(dateKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); } return count; }
function isExamDue() { return todayKey() >= state.examSchedule.nextExamAt; }

function speak(text) { if (!("speechSynthesis" in window)) return showToast("当前环境不支持朗读"); speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "en-US"; utterance.rate = .86; speechSynthesis.speak(utterance); }
function makeCloze(sentence, word) { const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); const replaced = sentence.replace(new RegExp(`\\b${escaped}\\b`, "i"), "____"); return replaced === sentence ? `${sentence}  [${word}]` : replaced; }
function normalizeAnswer(value) { return String(value || "").trim().toLowerCase().replace(/[.!?,;:'"\s]+/g, " ").trim(); }
function shuffle(items) { for (let i = items.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items; }
function statusRank(status) { return { learning: 0, new: 1, review: 2, mastered: 3 }[status] ?? 4; }
function statusLabel(status) { return { new: "未学习", learning: "学习中", review: "复习中", mastered: "已掌握" }[status] || status; }
function legacyInterval(level) { return Number(level) <= 1 ? 0 : Number(level) === 2 ? 1 : Number(level) === 3 ? 3 : Number(level) === 4 ? 7 : Number(level) === 5 ? 15 : 30; }
function splitTags(value) { return (Array.isArray(value) ? value : String(value).split(/[,，]/)).map((tag) => String(tag).trim()).filter(Boolean); }
function todayKey() { return dateKey(new Date()); }
function dateKey(date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; }
function addDays(key, days) { const date = new Date(`${key}T00:00:00`); date.setDate(date.getDate() + days); return dateKey(date); }
function daysBetween(from, to) { return Math.max(0, Math.ceil((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000)); }
function formatDue(key) { return key <= todayKey() ? "今天" : `下次 ${Number(key.slice(5,7))}/${Number(key.slice(8,10))}`; }
function formatDateKey(key) { return `${Number(key.slice(5,7))}月${Number(key.slice(8,10))}日`; }
function formatDate(value) { const date = new Date(value); return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`; }
function formatTime(value) { const date = new Date(value); return `${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`; }
function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function makeId(prefix) { return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function emptyItem(text) { const item = document.createElement("li"); item.className = "empty"; item.textContent = text; return item; }
function showToast(text) { el.toast.textContent = text; el.toast.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 2200); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function safeUrl(value) { try { const url = new URL(value); return url.protocol === "https:" ? url.href : "#"; } catch { return "#"; } }
function registerServiceWorker() { if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {})); }
