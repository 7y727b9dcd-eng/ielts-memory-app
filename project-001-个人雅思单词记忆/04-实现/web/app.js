"use strict";

const STORAGE_KEY = "word-tuo-state-v5";
const LEGACY_STORAGE_KEYS = ["word-tuo-state-v4", "word-tuo-state-v3", "word-tuo-state-v2", "word-tuo-state-v1"];
const BACKUP_VERSION = 5;
const EXAM_INTERVAL_DAYS = 21;
const MAX_HISTORY = 800;
const LIBRARY_PAGE_SIZE = 40;
const LEXICON_API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const AUDIO_FALLBACK_BASE = "https://dict.youdao.com/dictvoice?type=2&audio=";
const CATALOGS = {
  ielts: "雅思词库",
  highschool: "高中人教版",
  all: "全部词库"
};
const HIGH_SCHOOL_CATALOG_URL = "./data/pep-highschool-2019.json";
const MEMORY_METHODS = [
  { id: "morphology", title: "词根词缀", short: "拆结构", evidence: "形态意识能把词义、拼写和发音连成更稳定的记忆。", builder: buildMorphologyContent },
  { id: "phonetic", title: "音标拆读", short: "听音拼写", evidence: "先读出单词并看到拼写，有助于把发音、字形和意义绑定。", builder: buildPhoneticContent },
  { id: "keyword", title: "关键词联想", short: "造画面", evidence: "关键词记忆法适合外语词汇的初次编码，尤其能提升即时回忆。", builder: buildKeywordImage },
  { id: "sentence", title: "句子联想", short: "放进句子", evidence: "把单词放到语境中，能记住词义边界和真实用法。", builder: buildSentenceAssociation },
  { id: "retrieval", title: "主动回忆", short: "先想后看", evidence: "提取练习会强化长期保持，比反复看更适合复习。", builder: buildRecallPrompt },
  { id: "family", title: "词族联结", short: "一串记", evidence: "同根词和派生词能帮助迁移到未见过的新词。", builder: buildFamilyContent },
  { id: "collocation", title: "搭配语境", short: "搭配输出", evidence: "搭配和典型场景能减少只会认不会用的问题。", builder: buildCollocationPrompt },
  { id: "reverse", title: "中英反向回忆", short: "中文到英文", evidence: "反向提取能训练输出，适合写作和口语。", builder: buildReverseRecall },
  { id: "dual", title: "双编码画面", short: "画面+文字", evidence: "文字和有意义的视觉表征结合，可以形成两条回忆线索。", builder: buildDualCoding },
  { id: "loci", title: "地点定位法", short: "放到熟悉地点", evidence: "把信息放入固定空间路径，有助于按线索回忆。", builder: buildMethodOfLoci },
  { id: "scene", title: "影视语境", short: "真实片段", evidence: "真实语境能补足语气、场景和使用限制。", builder: buildSceneContext }
];
const DEFAULT_MEMORY_METHOD_IDS = ["morphology", "phonetic", "keyword", "sentence", "retrieval", "family", "collocation", "reverse", "dual", "loci", "scene"];
const ONBOARDING_STEPS = [
  { title: "学习入口", tag: "HOME", body: "首页最醒目的“开始记忆单词”会按当前词库抽取今日新词；“只复习到期词”只处理遗忘曲线安排到今天的词。", actions: ["先选词库，再开始学习", "碎片时间优先点首页主按钮"] },
  { title: "三阶段学习", tag: "LEARN", body: "新词先看释义和例句，再主动回忆，最后进入影视语境或跳过。每次反馈都会更新下次复习日期。", actions: ["不认识：今天继续出现", "模糊：缩短间隔", "认识：延长间隔"] },
  { title: "记忆法设置", tag: "METHODS", body: "设置里可以开启或关闭每一种记忆法。学习页只显示你开启的方法，避免信息太多。", actions: ["建议保留主动回忆、词根词缀、句子联想", "抽象词可开启关键词联想和双编码画面"] },
  { title: "词库切换", tag: "LIBRARY", body: "词库页和设置页都可以切换雅思、高中人教版或全部词库。选择某个词库后，学习、复习、抽查互不干扰。", actions: ["备考雅思时选雅思词库", "补高中基础时选高中人教版"] },
  { title: "三周抽查", tag: "EXAM", body: "系统每 21 天保留一次抽查入口，混合释义选择、英文拼写和例句填空，满分 100 分。", actions: ["错词会回到复习队列", "可以只重测错词"] },
  { title: "发音和影视语境", tag: "AUDIO", body: "单词旁的“听”会优先使用网络发音，失败时回到系统朗读。影视语境只保存合法公开视频链接和时间段。", actions: ["朗读用于纠正重音", "影视片段用于记语气和场景"] },
  { title: "本地备份", tag: "DATA", body: "学习记录保存在当前设备浏览器或 App 内。换设备前先导出 JSON 备份，再在新设备恢复。", actions: ["定期导出备份", "重置数据前先确认已经备份"] }
];

const COMMON_ROOTS = {
  act: "做、行动", ag: "做、驱动", anim: "生命、精神", audi: "听", bio: "生命", cap: "抓住、拿", ceed: "走", cess: "走", ced: "走",
  chron: "时间", cid: "切、杀", claim: "喊叫", clud: "关闭", cogn: "知道", cred: "相信", cur: "跑", dict: "说", duc: "引导",
  fact: "做、制造", fer: "携带", fin: "结束、边界", form: "形状", gen: "产生", geo: "土地", graph: "写、画", ject: "投掷",
  jud: "判断", log: "说、学科", loc: "地点", luc: "光", man: "手", migr: "迁移", mit: "送出", mob: "移动", mot: "移动",
  nov: "新", path: "感受", ped: "脚", pel: "推动", phon: "声音", port: "携带", pos: "放置", press: "压", rupt: "破裂",
  scrib: "写", script: "写", sent: "感觉", sequ: "跟随", spect: "看", struct: "建造", tain: "握住", tele: "远", tend: "伸展",
  tract: "拉", ven: "来", vert: "转", vid: "看", vis: "看", viv: "生命", voc: "声音、叫"
};

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

const pageTitles = { home: "今天", learn: "学习", library: "词库", stats: "统计", settings: "设置" };
const rawState = loadRawState();
const state = normalizeState(rawState);
let activeView = "home";
let activeLearnMode = state.learningSession?.mode || "new";
let toastTimer;

const elementIds = [
  "pageTitle", "memorySummary", "newCount", "dueCount", "todayCount", "streakCount", "weakWordList",
  "examBanner", "examBannerTitle", "examBannerText", "examBannerButton", "learningPanel", "examPanel",
  "searchInput", "catalogSelect", "filterSelect", "libraryCounter", "loadMoreLibraryButton", "libraryList", "levelBars", "masteryRate", "historyList", "examHistoryList",
  "dailyNewGoalInput", "dailyGoalInput", "activeCatalogInput", "autoSpeakInput", "videoEnabledInput", "autoPlayClipsInput", "nextExamSetting",
  "memoryMethodSettings", "tutorialButton", "onboardingDialog", "onboardingContent", "onboardingProgress", "onboardingPrevButton", "onboardingNextButton", "onboardingSkipButton",
  "restoreFileInput", "wordDialog", "wordForm", "wordDialogTitle", "wordId", "wordText", "wordMeaning",
  "wordPhonetic", "wordCatalog", "wordAudioUrl", "wordTags", "wordExample", "mnemonicRoots", "mnemonicAssociation", "mnemonicFamily", "mnemonicSyllables",
  "importDialog", "importForm", "importText", "memoryDialog", "memoryWord", "memoryContent", "sceneDialog", "sceneWord", "sceneDescription", "sceneWordId",
  "sceneSavedClips", "sceneClipForm", "clipUrl", "clipStart", "clipEnd", "clipTitle", "clipCaption", "sceneResults", "toast"
];
const el = Object.fromEntries(elementIds.map((id) => [id, document.getElementById(id)]));
let libraryVisibleCount = LIBRARY_PAGE_SIZE;
let librarySignature = "";
const lexiconRequests = new Map();
let currentAudio = null;
let autoSpeakTimer = null;
let autoSpeakKey = "";
let speakRequestId = 0;
let onboardingIndex = 0;

bindEvents();
saveState();
syncLibraryCatalogWithActive();
renderActiveView();
ensureBundledCatalogs();
registerServiceWorker();
setTimeout(showOnboardingIfNeeded, 180);

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.querySelectorAll("[data-view-target]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewTarget)));
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
  document.querySelectorAll("[data-learn-mode]").forEach((button) => button.addEventListener("click", () => setLearnMode(button.dataset.learnMode)));
  document.getElementById("quickAddButton").addEventListener("click", () => openWordDialog());
  document.getElementById("startMemoryButton").addEventListener("click", startMemorySession);
  document.getElementById("startReviewButton").addEventListener("click", startReviewSession);
  document.getElementById("refreshNewWordsButton").addEventListener("click", refreshDailyNewWords);
  el.examBannerButton.addEventListener("click", () => { setLearnMode("exam"); switchView("learn"); });
  document.getElementById("importButton").addEventListener("click", () => el.importDialog.showModal());
  document.getElementById("sampleButton").addEventListener("click", () => importWordObjects(SAMPLE_WORDS));
  document.getElementById("importHighSchoolButton").addEventListener("click", () => importHighSchoolCatalog(true));
  document.getElementById("exportButton").addEventListener("click", exportBackup);
  document.getElementById("restoreButton").addEventListener("click", () => el.restoreFileInput.click());
  document.getElementById("resetButton").addEventListener("click", resetData);
  el.tutorialButton.addEventListener("click", () => openOnboarding(true));
  el.onboardingPrevButton.addEventListener("click", () => moveOnboarding(-1));
  el.onboardingNextButton.addEventListener("click", () => moveOnboarding(1));
  el.onboardingSkipButton.addEventListener("click", completeOnboarding);
  el.searchInput.addEventListener("input", resetLibraryWindow);
  el.catalogSelect.addEventListener("change", resetLibraryWindow);
  el.filterSelect.addEventListener("change", resetLibraryWindow);
  el.loadMoreLibraryButton.addEventListener("click", () => { libraryVisibleCount += LIBRARY_PAGE_SIZE; renderLibrary(); });
  el.wordForm.addEventListener("submit", saveWordForm);
  el.importForm.addEventListener("submit", importWords);
  el.sceneClipForm.addEventListener("submit", saveSceneClip);
  el.sceneDialog.addEventListener("close", () => { if (activeView === "learn") renderLearnArea(); });
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
    settings: { dailyNewGoal: 10, dailyGoal: 30, activeCatalog: "ielts", autoSpeak: true, videoEnabled: true, autoPlayClips: true, highSchoolCatalogImported: false, memoryMethods: DEFAULT_MEMORY_METHOD_IDS, onboardingSeen: false }
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
      activeCatalog: normalizeCatalog(input.settings?.activeCatalog || "ielts", true),
      autoSpeak: Boolean(input.settings?.autoSpeak ?? true),
      videoEnabled: Boolean(input.settings?.videoEnabled ?? true),
      autoPlayClips: Boolean(input.settings?.autoPlayClips ?? true),
      highSchoolCatalogImported: Boolean(input.settings?.highSchoolCatalogImported),
      memoryMethods: normalizeMemoryMethods(input.settings?.memoryMethods),
      onboardingSeen: Boolean(input.settings?.onboardingSeen)
    }
  };
  if (!output.words.length) output.words = fallback.words;
  return output;
}

function createWord(data) {
  return normalizeWord({
    id: makeId("word"), text: data.text, meaning: data.meaning, phonetic: data.phonetic || "",
    audioUrl: data.audioUrl || "", lexiconFetchedAt: data.lexiconFetchedAt || null,
    example: data.example || "", tags: data.tags || [catalogLabel(data.catalog || "ielts")], catalog: data.catalog || inferCatalog(data), catalogs: data.catalogs,
    mnemonics: normalizeMnemonics(data.mnemonics, data.text), status: data.status || "new",
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
  const normalized = {
    id: word.id || makeId("word"), text: repairWordText(String(word.text).trim()), meaning: String(word.meaning).trim(),
    phonetic: String(word.phonetic || "").trim(), example: String(word.example || "").trim(), tags: splitTags(word.tags || catalogLabel(inferCatalog(word))),
    audioUrl: safeAudioUrl(word.audioUrl), lexiconFetchedAt: word.lexiconFetchedAt || null,
    catalog: normalizeCatalog(word.catalog || inferCatalog(word)), catalogs: normalizeCatalogs(word.catalogs || [word.catalog || inferCatalog(word)]),
    mnemonics: normalizeMnemonics(word.mnemonics, word.text),
    status, repetitions, easeFactor: clamp(Number(word.easeFactor) || 2.5, 1.3, 3.0),
    intervalDays: Number.isFinite(storedInterval) ? Math.max(0, storedInterval) : legacyInterval(word.level), lapseCount: Math.max(0, Number(word.lapseCount) || 0),
    level: clamp(Number(word.level) || repetitions + 1, 1, 6), correct: Math.max(0, Number(word.correct) || 0), wrong: Math.max(0, Number(word.wrong) || 0),
    createdAt: word.createdAt || new Date().toISOString(), learnedAt: word.learnedAt || (word.lastReviewed ? word.lastReviewed : null),
    lastReviewed: word.lastReviewed || null, nextReview: word.nextReview || todayKey()
  };
  normalized.mnemonics = upgradeGeneratedMnemonics(normalized);
  return normalized;
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

function upgradeGeneratedMnemonics(word) {
  const memory = word.mnemonics || {};
  const roots = String(memory.roots || "");
  const association = String(memory.association || "");
  const shouldRefreshRoots = !roots || /未识别到可靠|自动拆解，建议核对词源/.test(roots);
  const shouldRefreshAssociation = !association || association.includes("发音、词形和中文释义组合成一个夸张画面");
  return {
    roots: shouldRefreshRoots ? analyzeWordParts(word.text) : roots,
    association: shouldRefreshAssociation ? buildAssociation(word) : association,
    family: memory.family && !memory.family.includes("继续收集") ? memory.family : buildWordFamily(word.text),
    syllables: memory.syllables || splitForSpelling(word.text)
  };
}

function buildAssociation(word) {
  const firstMeaning = String(word.meaning || "").split(/[；;，,。]/)[0] || "这个意思";
  return `看到 ${word.text} 时先读音，再联想到“${firstMeaning}”；复习时用自己的句子复述一次，避免只看中文。`;
}

function buildWordFamily(text) {
  const word = String(text || "").toLowerCase();
  const root = Object.keys(COMMON_ROOTS).sort((a,b) => b.length - a.length).find((part) => word.includes(part) && word.length > part.length + 2);
  if (root) return `同根联想：围绕 ${root}（${COMMON_ROOTS[root]}）收集派生词；复习时比较词性变化和含义变化。`;
  return `词族联想：记录 ${word} 的名词、动词、形容词或副词形式；没有派生词时用固定搭配来记。`;
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
  const root = Object.keys(COMMON_ROOTS).sort((a,b) => b.length - a.length).find((part) => word.includes(part) && word.length > part.length + 2);
  if (!prefix && !suffix && !root) return `词形观察：${word} 暂未匹配常见词根；可先按音节 ${splitForSpelling(word)} 记拼写，再结合例句记意义。`;
  const core = word.slice(prefix?.length || 0, suffix ? -suffix.length : undefined);
  const parts = [];
  if (prefix) parts.push(`${prefix}-（${prefixes[prefix]}）`);
  parts.push(root ? `${root}（${COMMON_ROOTS[root]}）` : (core || word));
  if (suffix) parts.push(`-${suffix}（${suffixes[suffix]}）`);
  return `${parts.join(" + ")}。记忆重点：${root ? `抓住 ${root}=${COMMON_ROOTS[root]} 这个核心意义` : "抓住中间词干"}，再用前后缀判断词性和方向。`;
}

function splitForSpelling(text) {
  const chunks = String(text || "").toLowerCase().match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy])|$)*/g);
  return chunks?.filter(Boolean).join(" · ") || String(text || "");
}

function meaningHead(word) {
  return String(word.meaning || "").split(/[；;，,。]/)[0]?.trim() || "核心释义";
}

function keywordCue(text) {
  const word = String(text || "").toLowerCase();
  const syllables = splitForSpelling(word).split(" · ").filter(Boolean);
  return syllables.slice(0, 2).join(" + ") || word.slice(0, Math.min(4, word.length));
}

function visualCue(meaning) {
  const text = String(meaning || "");
  if (/增加|大量|多|rise|increase/i.test(text)) return "向上增长的箭头";
  if (/减少|下降|少|decline/i.test(text)) return "向下收缩的箭头";
  if (/解释|理解|说明/.test(text)) return "两个人之间的一座桥";
  if (/可行|成功|有效/.test(text)) return "一条能走通的路";
  if (/恶化|坏|污染/.test(text)) return "颜色逐渐变深的空气";
  if (/连贯|条理/.test(text)) return "一条不断开的线";
  return `能代表“${text || "这个意思"}”的一个简单符号`;
}

function extractPhrase(example, word) {
  const text = String(example || "").trim();
  if (!text) return `${word} + 一个名词`;
  const parts = text.split(/\s+/);
  const index = parts.findIndex((part) => part.toLowerCase().replace(/[^a-z-]/g, "") === word);
  if (index < 0) return `${word} + 一个名词`;
  return parts.slice(Math.max(0, index - 2), Math.min(parts.length, index + 3)).join(" ");
}

function normalizeMemoryMethods(value) {
  const allowed = new Set(MEMORY_METHODS.map((method) => method.id));
  if (!Array.isArray(value)) return DEFAULT_MEMORY_METHOD_IDS;
  return uniqueStrings(value.filter((id) => allowed.has(id)));
}

function getEnabledMemoryMethods() {
  return new Set(normalizeMemoryMethods(state.settings.memoryMethods));
}

function normalizeRecord(record) {
  if (!record?.word) return null;
  return { id: record.id || makeId("record"), word: String(record.word), wordId: record.wordId || null, result: String(record.result || ""), type: record.type || "review", quality: Number.isFinite(Number(record.quality)) ? Number(record.quality) : null, reviewedAt: record.reviewedAt || new Date().toISOString() };
}

function normalizeSession(session) {
  if (!session || !["new", "review"].includes(session.mode) || !Array.isArray(session.wordIds)) return null;
  const stage = session.stage === "cloze" ? "scene" : session.stage;
  return { mode: session.mode, wordIds: session.wordIds.map(String), index: clamp(Number(session.index) || 0, 0, session.wordIds.length), stage: ["preview", "recall", "scene"].includes(stage) ? stage : (session.mode === "new" ? "preview" : "recall"), answerRevealed: Boolean(session.answerRevealed), pendingQuality: clamp(Number(session.pendingQuality) || 3, 1, 5), clozeChecked: Boolean(session.clozeChecked), clozeCorrect: Boolean(session.clozeCorrect) };
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
  renderActiveView();
}

function renderActiveView() {
  if (activeView === "home") return renderHome();
  if (activeView === "learn") return renderLearnArea();
  if (activeView === "library") return renderLibrary();
  if (activeView === "stats") return renderStats();
  if (activeView === "settings") return renderSettings();
}

function switchView(name) {
  stopSpeaking();
  activeView = name;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  el.pageTitle.textContent = pageTitles[name] || "单词TUO";
  renderActiveView();
  window.scrollTo(0, 0);
}

function setLearnMode(mode) {
  stopSpeaking();
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
  el.memorySummary.textContent = `${activeCatalogLabel()}：今日新词 ${newAvailable} 个，待复习 ${due} 个。`;
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
    showNoNewWordsGuidance(); return;
  }
  state.learningSession = { mode: "new", wordIds: words.map((word) => word.id), index: 0, stage: "preview", answerRevealed: false, pendingQuality: 3, clozeChecked: false, clozeCorrect: false };
  saveState(); setLearnMode("new"); switchView("learn");
}

function refreshDailyNewWords() {
  if (state.learningSession?.mode === "new") state.learningSession = null;
  const words = getTodayNewWords();
  saveState();
  renderAll();
  if (words.length) {
    showToast(`已刷新，今日新词 ${words.length} 个`);
    return;
  }
  showNoNewWordsGuidance();
}

function showNoNewWordsGuidance() {
  const activeNew = getUnlearnedWordsForActiveCatalog().length;
  if (activeNew) return showToast(`当前词库今日额度已用完，可在设置里调高“每日新词”`);
  const otherNew = state.words.filter((word) => word.status === "new" && !wordMatchesCatalog(word, state.settings.activeCatalog)).length;
  if (otherNew) return showToast("当前词库没有未学习单词，可切换到“全部词库”或其他词库");
  showToast("当前词库没有未学习单词，请先导入或添加新单词");
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
  renderSceneStage(word, session);
}

function sessionHeader(session, labels) {
  const activeIndex = Math.max(0, labels.indexOf(session.stage));
  return `<div class="exam-head"><p class="eyebrow">${session.mode === "new" ? "SYSTEM MEMORY" : "SPACED REVIEW"}</p><span class="exam-progress">${session.index + 1}/${session.wordIds.length}</span></div>${session.mode === "new" ? `<div class="stage-line">${labels.map((_, index) => `<span class="${index <= activeIndex ? "active" : ""}"></span>`).join("")}</div>` : ""}`;
}

function renderPreviewStage(word, session) {
  ensureWordLexicon(word, { rerender: false });
  el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","scene"])}<div class="learning-word"><div class="learning-word-main"><h2>${escapeHtml(word.text)}</h2><button class="inline-audio-button" id="wordSpeakButton" type="button" aria-label="朗读 ${escapeHtml(word.text)}" title="朗读">听</button></div><p class="phonetic">${escapeHtml(formatPhonetic(word))}</p><p class="audio-status">${word.audioUrl ? "已接入网络真人发音" : "朗读时会自动联网补充发音"}</p></div><div class="learning-answer"><p><strong>${escapeHtml(word.meaning)}</strong></p><blockquote>${escapeHtml(word.example || "暂无例句，可在词库中补充。")}</blockquote></div>${renderMemoryMethods(word)}<div class="session-tools"><button class="primary-button" id="toRecallButton">我看完了，开始回忆</button></div></article>`;
  document.getElementById("wordSpeakButton").addEventListener("click", () => speakWord(word));
  document.getElementById("toRecallButton").addEventListener("click", () => { stopSpeaking(); session.stage = "recall"; session.answerRevealed = false; saveState(); renderLearnArea(); });
  if (state.settings.autoSpeak) scheduleAutoSpeak(word, sessionSpeakKey(session, word));
}

function renderMemoryMethods(word) {
  const enabled = getEnabledMemoryMethods();
  const methods = MEMORY_METHODS.filter((method) => enabled.has(method.id));
  if (!methods.length) return `<section class="memory-methods"><div class="empty">已在设置中关闭全部记忆法。</div></section>`;
  return `<section class="memory-methods"><div class="method-heading"><p class="eyebrow">MEMORY TOOLS</p><strong>${methods.length} 种已开启</strong></div><div class="memory-method-grid">${methods.map((method, index) => renderMethodContent(method, word, index)).join("")}</div></section>`;
}

function renderMethodContent(method, word, index) {
  const content = method.builder(word);
  return `<details class="memory-method" ${index === 0 ? "open" : ""}><summary><span>${index + 1}</span><div><strong>${escapeHtml(method.title)}</strong><small>${escapeHtml(method.short)}</small></div></summary><div class="method-body"><p>${escapeHtml(content.summary)}</p><ul class="method-step-list">${content.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul><p class="method-evidence">${escapeHtml(content.evidence || method.evidence)}</p></div></details>`;
}

function buildMorphologyContent(word) {
  const roots = word.mnemonics?.roots || analyzeWordParts(word.text);
  const family = word.mnemonics?.family || buildWordFamily(word.text);
  return {
    summary: roots,
    steps: [
      `先圈出 ${word.text} 中最像词根、前缀或后缀的部分。`,
      `把结构翻译成一句中文：${roots.replace(/→/g, "所以")}`,
      `顺手连到词族：${family}`
    ],
    evidence: "适合长词和学术词；词根词缀能帮助你猜未见过的派生词。"
  };
}

function buildPhoneticContent(word) {
  const syllables = word.mnemonics?.syllables || splitForSpelling(word.text);
  return {
    summary: `${formatPhonetic(word)}；分段读作：${syllables}`,
    steps: [
      `点单词旁“听”，跟读 ${word.text} 两遍。`,
      `按 ${syllables} 分段拼写，重点检查重音附近的元音。`,
      `遮住英文，只看音标和中文，默写一遍 ${word.text}。`
    ],
    evidence: "适合拼写不稳的词；把声音、字母和意义同时绑定。"
  };
}

function buildSentenceAssociation(word) {
  const example = word.example || `I can use ${word.text} in a clear IELTS sentence.`;
  return {
    summary: `核心句：${example}`,
    steps: [
      `先读完整句，再只读含 ${word.text} 的短语。`,
      `把中文释义“${meaningHead(word)}”放回句子里，确认它在句中承担的意思。`,
      `自己改写一个句子：In my IELTS answer, ${word.text} can describe ${meaningHead(word)}.`
    ],
    evidence: "适合会认不会用的词；语境能限制词义，减少中文直译。"
  };
}

function buildRecallPrompt(word) {
  const hint = meaningHead(word);
  return {
    summary: `闭眼提取顺序：发音 -> 拼写 -> ${hint} -> 例句。`,
    steps: [
      `先不要看答案，听发音后说出 ${word.text} 的中文核心义。`,
      `在心里拼出 ${word.text}，再打开答案对照。`,
      `如果错了，点“不认识”；如果只想起一半，点“模糊”。`
    ],
    evidence: "主动回忆是复习核心；先提取再看答案，比反复看更能保持长期记忆。"
  };
}

function buildCollocationPrompt(word) {
  const text = String(word.text || "").toLowerCase();
  const head = meaningHead(word);
  return {
    summary: `常用搭配模板：${text} + noun / be ${text} in + 场景。`,
    steps: [
      `从例句中抽一个搭配：${extractPhrase(word.example, text)}`,
      `造一个雅思场景短语：${text} evidence / ${text} increase / ${text} solution。`,
      `复习时不要只说中文，要说出一个完整搭配来表达“${head}”。`
    ],
    evidence: "适合写作和口语；搭配比单个中文释义更接近真实输出。"
  };
}

function buildReverseRecall(word) {
  const firstMeaning = meaningHead(word);
  return {
    summary: `看到“${firstMeaning}”时，目标输出是 ${word.text}。`,
    steps: [
      `只看中文“${firstMeaning}”，先拼出英文。`,
      `再说一个短句：This word means ${firstMeaning}.`,
      `最后点“听”检查发音，确认重音和拼写没有分家。`
    ],
    evidence: "适合写作输出；从中文到英文的提取能减少“看得懂但写不出”。"
  };
}

function buildFamilyContent(word) {
  const family = word.mnemonics?.family || buildWordFamily(word.text);
  return {
    summary: family,
    steps: [
      `把 ${word.text} 放在词族中心，旁边写名词、动词、形容词或副词形式。`,
      `复习时说出至少一个同族词，并解释词性变化。`,
      `遇到同根新词时先猜大意，再查证。`
    ],
    evidence: "适合同根词多的学术词；词族能把单词从一个点变成一张网。"
  };
}

function buildKeywordImage(word) {
  const keyword = keywordCue(word.text);
  const head = meaningHead(word);
  return {
    summary: `关键词：${keyword}；画面：把“${keyword}”和“${head}”强行放进同一张夸张图片。`,
    steps: [
      `先读 ${word.text}，抓住声音最突出的部分：${keyword}。`,
      `想象一个画面：${keyword} 正在表现“${head}”。`,
      `回忆时先想画面，再从画面跳回 ${word.text}。`
    ],
    evidence: "适合抽象词初次记忆；画面越具体，回忆线索越清楚。"
  };
}

function buildDualCoding(word) {
  const head = meaningHead(word);
  return {
    summary: `文字线索：${word.text} = ${head}；视觉线索：画一个能代表“${head}”的小图标。`,
    steps: [
      `在脑中画一个简单图：${visualCue(head)}。`,
      `把 ${word.text} 写在图旁边，而不是单独背中文。`,
      `复习时先看图，再说英文和例句。`
    ],
    evidence: "双编码不是随便配图；图必须能解释词义，才不会增加负担。"
  };
}

function buildMethodOfLoci(word) {
  const head = meaningHead(word);
  return {
    summary: `地点：把 ${word.text} 放到你熟悉的“门口-书桌-床边”路线中。`,
    steps: [
      `选择固定地点：门口代表今天的新词第一组。`,
      `想象门口贴着 ${word.text}，旁边发生“${head}”的场景。`,
      `晚上复盘时沿路线走一遍，依次说出英文、中文和例句。`
    ],
    evidence: "适合一次学多个词；固定空间路径能给抽象信息增加回忆顺序。"
  };
}

function buildSceneContext(word) {
  const clips = state.clips[word.id] || [];
  return {
    summary: clips.length ? `已保存 ${clips.length} 个 5-20 秒片段，可用真实语气巩固。` : "尚未保存片段；可在影视语境里搜索并保存公开视频片段。",
    steps: clips.length ? [
      `播放第一个片段，听出 ${word.text} 出现的位置。`,
      "暂停后复述字幕，不看中文解释。",
      "把片段中的语气或场景写成一句自己的例句。"
    ] : [
      "点“影视语境”，打开搜索来源。",
      "保存公开视频链接和 5-20 秒时间段。",
      "下次学习时用片段做场景回忆。"
    ],
    evidence: "适合口语、听力和语感；真实场景能补充书面例句缺少的语气。"
  };
}

function renderRecallStage(word, session, isReview) {
  ensureWordLexicon(word, { rerender: false });
  el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","cloze"])}<div class="learning-word"><div class="learning-word-main"><h2>${escapeHtml(word.text)}</h2><button class="inline-audio-button" id="wordSpeakButton" type="button" aria-label="朗读 ${escapeHtml(word.text)}" title="朗读">听</button></div><p class="phonetic">${escapeHtml(formatPhonetic(word))}</p></div>${session.answerRevealed ? `<div class="learning-answer"><p><strong>${escapeHtml(word.meaning)}</strong></p><blockquote>${escapeHtml(word.example || "暂无例句")}</blockquote></div><div class="rating-actions"><button class="again-button" data-quality="1">不认识<small>重新学习</small></button><button class="hard-button" data-quality="3">模糊<small>缩短间隔</small></button><button class="good-button" data-quality="5">认识<small>增加间隔</small></button></div>` : `<div class="learning-answer"><p>先在心里说出中文释义，再显示答案。系统会按遗忘曲线安排下次复习。</p></div><div class="session-tools"><button class="primary-button" id="revealAnswerButton">显示答案</button></div>`}</article>`;
  document.getElementById("wordSpeakButton")?.addEventListener("click", () => speakWord(word));
  document.getElementById("revealAnswerButton")?.addEventListener("click", () => { stopSpeaking(); session.answerRevealed = true; saveState(); renderLearnArea(); });
  document.querySelectorAll("[data-quality]").forEach((button) => button.addEventListener("click", () => {
    const quality = Number(button.dataset.quality);
    if (isReview) { applyReview(word, quality, "review"); advanceSession(); }
    else { session.pendingQuality = quality; session.stage = "scene"; session.clozeChecked = false; session.clozeCorrect = false; saveState(); renderLearnArea(); }
  }));
  if (!session.answerRevealed && state.settings.autoSpeak) scheduleAutoSpeak(word, sessionSpeakKey(session, word));
}

function renderSceneStage(word, session) {
  stopSpeaking();
  const clips = state.clips[word.id] || [];
  if (!clips.length) {
    el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","scene"])}<div><p class="eyebrow">VIDEO CONTEXT</p><h2>用影视场景记住它</h2></div><div class="scene-learning-empty"><div class="scene-icon">▶</div><h3>还没有 ${escapeHtml(word.text)} 的影视片段</h3><p>先搜索并保存一个5–20秒公开视频片段。下次学习时会直接在这里播放，不再做普通例句填空。</p></div><div class="session-tools stacked-mobile"><button class="secondary-button" id="skipSceneButton">本词先跳过影视</button><button class="primary-button" id="findSceneButton">查找并添加片段</button></div></article>`;
    document.getElementById("findSceneButton").addEventListener("click", () => openSceneDialog(word));
    document.getElementById("skipSceneButton").addEventListener("click", () => { applyReview(word, session.pendingQuality, "new-complete"); advanceSession(); });
    return;
  }
  const clip = clips[Math.min(session.index, clips.length - 1)];
  const prompt = clip.caption ? makeCloze(clip.caption, word.text) : "观看片段并听辨目标单词，然后在下方输入。";
  el.learningPanel.innerHTML = `<article class="learning-card">${sessionHeader(session, ["preview","recall","scene"])}<div><p class="eyebrow">VIDEO CONTEXT</p><h2>影视语境记忆</h2></div><div class="learning-video" id="learningVideoHost"><button class="clip-play" id="playLearningClip" aria-label="播放影视片段">▶</button><span>${clip.end - clip.start}秒 · ${escapeHtml(clip.title)}</span></div><div class="cloze-sentence">${escapeHtml(prompt)}</div><form id="sceneRecallForm"><input class="answer-input" id="sceneRecallInput" autocomplete="off" autocapitalize="none" placeholder="输入片段中的目标单词" ${session.clozeChecked ? "disabled" : ""} /><div class="command-row">${session.clozeChecked ? `<div class="feedback ${session.clozeCorrect ? "correct" : "wrong"}">${session.clozeCorrect ? "场景回忆正确" : `正确答案：${escapeHtml(word.text)}`}</div><button class="primary-button" type="button" id="nextWordButton">下一个</button>` : `<button class="primary-button" type="submit">检查答案</button>`}</div></form></article>`;
  document.getElementById("playLearningClip").addEventListener("click", () => mountClipPlayer(document.getElementById("learningVideoHost"), clip, true));
  if (state.settings.autoPlayClips) mountClipPlayer(document.getElementById("learningVideoHost"), clip, true);
  document.getElementById("sceneRecallForm").addEventListener("submit", (event) => { event.preventDefault(); session.clozeCorrect = normalizeAnswer(document.getElementById("sceneRecallInput").value) === normalizeAnswer(word.text); session.clozeChecked = true; saveState(); renderLearnArea(); });
  document.getElementById("nextWordButton")?.addEventListener("click", () => { const quality = session.clozeCorrect ? session.pendingQuality : Math.min(2, session.pendingQuality); applyReview(word, quality, "new-complete"); advanceSession(); });
}

function advanceSession() {
  const session = state.learningSession;
  if (!session) return;
  stopSpeaking();
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
  const examWords = filterWordsByActiveCatalog(state.words);
  const weak = [...examWords].sort((a,b) => b.lapseCount - a.lapseCount || b.wrong - a.wrong);
  const recentCutoff = addDays(todayKey(), -21);
  const recent = examWords.filter((word) => (word.learnedAt || word.createdAt).slice(0,10) >= recentCutoff);
  const mastered = examWords.filter((word) => word.status === "mastered");
  add(weak.filter((word) => word.status !== "new"), 12); add(recent, 10); add(mastered, 8); add(examWords, 30 - picked.length);
  return picked.slice(0, 30);
}

function createExamQuestions(words) {
  const shuffled = shuffle([...words]);
  return shuffled.map((word, index) => {
    const type = index < Math.ceil(words.length / 3) ? "choice" : index < Math.ceil(words.length * 2 / 3) ? "spelling" : (word.example ? "cloze" : "spelling");
    if (type === "choice") {
      const distractors = shuffle(filterWordsByActiveCatalog(state.words).filter((item) => item.id !== word.id).map((item) => item.meaning).filter((value, i, all) => all.indexOf(value) === i)).slice(0, 3);
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

function resetLibraryWindow() {
  libraryVisibleCount = LIBRARY_PAGE_SIZE;
  librarySignature = "";
  renderLibrary();
}

function syncLibraryCatalogWithActive() {
  if (!el.catalogSelect) return;
  const activeCatalog = normalizeCatalog(state.settings.activeCatalog, true);
  el.catalogSelect.value = activeCatalog;
}

function renderLibrary() {
  const query = el.searchInput.value.trim().toLowerCase();
  const catalog = el.catalogSelect.value;
  const filter = el.filterSelect.value;
  const signature = `${query}|${catalog}|${filter}`;
  if (signature !== librarySignature) {
    librarySignature = signature;
    libraryVisibleCount = LIBRARY_PAGE_SIZE;
  }
  const words = state.words.filter((word) => {
    if (catalog !== "all" && !wordMatchesCatalog(word, catalog)) return false;
    const searchable = [word.text, word.meaning, word.example, catalogLabel(word.catalog), ...word.tags].join(" ").toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filter === "new") return word.status === "new";
    if (filter === "due") return word.status !== "new" && word.nextReview <= todayKey();
    if (filter === "weak") return word.lapseCount > 0 || word.status === "learning" || word.wrong > word.correct;
    if (filter === "mastered") return word.status === "mastered";
    return true;
  }).sort((a,b) => statusRank(a.status) - statusRank(b.status) || a.nextReview.localeCompare(b.nextReview) || a.text.localeCompare(b.text));
  const visibleWords = words.slice(0, libraryVisibleCount);
  el.libraryCounter.textContent = `${catalogLabel(catalog)} · 已加载 ${Math.min(visibleWords.length, words.length)} / ${words.length}`;
  el.loadMoreLibraryButton.disabled = visibleWords.length >= words.length;
  el.loadMoreLibraryButton.textContent = visibleWords.length >= words.length ? "已全部加载" : `加载更多 ${Math.min(LIBRARY_PAGE_SIZE, words.length - visibleWords.length)} 个`;
  renderWordList(el.libraryList, visibleWords, false);
  warmVisibleLexicon(visibleWords);
}

function renderWordList(container, words, compact) {
  container.innerHTML = "";
  if (!words.length) return container.append(emptyItem(compact ? "暂时没有薄弱词。" : "没有符合条件的单词。"));
  words.forEach((word) => {
    const item = document.createElement("li"); item.className = "word-item";
    const sceneButton = state.settings.videoEnabled ? `<button class="secondary-button" data-action="scene" data-id="${word.id}">影视语境</button>` : "";
    const catalogPills = normalizeCatalogs(word.catalogs || [word.catalog]).map((catalog) => `<span class="pill catalog-pill">${escapeHtml(catalogLabel(catalog))}</span>`).join("");
    item.innerHTML = `<div><div class="word-title-row"><h3>${escapeHtml(word.text)}</h3><button class="inline-audio-button small" data-action="speak" data-id="${word.id}" type="button" aria-label="朗读 ${escapeHtml(word.text)}" title="朗读">听</button></div><p>${escapeHtml(word.meaning)}</p><p class="phonetic">${escapeHtml(formatPhonetic(word))}</p><div class="word-meta">${catalogPills}<span class="pill">${word.audioUrl ? "真人发音" : "待补音频"}</span><span class="pill">${statusLabel(word.status)}</span><span class="pill">${word.status === "new" ? "未安排" : formatDue(word.nextReview)}</span>${word.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div></div>${compact ? "" : `<div class="item-actions"><button class="secondary-button" data-action="memory" data-id="${word.id}">记忆法</button>${sceneButton}<button class="secondary-button" data-action="edit" data-id="${word.id}">编辑</button><button class="danger-button" data-action="delete" data-id="${word.id}">删除</button></div>`}`;
    container.append(item);
  });
  container.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleWordAction(button.dataset.action, button.dataset.id)));
}

function handleWordAction(action, id) {
  const word = state.words.find((item) => item.id === id); if (!word) return;
  if (action === "speak") speakWord(word);
  if (action === "edit") openWordDialog(id);
  if (action === "memory") openMemoryDialog(word);
  if (action === "scene") openSceneDialog(word);
  if (action === "delete" && confirm(`删除 ${word.text}？`)) { state.words = state.words.filter((item) => item.id !== id); delete state.clips[id]; saveState(); renderAll(); showToast("单词已删除"); }
}

function openMemoryDialog(word) {
  el.memoryWord.textContent = `${word.text} · 八种记忆法`;
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
  mountClipPlayer(host, clip);
}

function mountClipPlayer(host, clip, autoplay = false) {
  if (!host || !clip) return;
  if (clip.type === "youtube") {
    host.innerHTML = `<iframe title="${escapeHtml(clip.title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(clip.videoId)}?start=${clip.start}&end=${clip.end}&playsinline=1&rel=0&autoplay=${autoplay ? 1 : 0}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    return;
  }
  host.innerHTML = `<video controls playsinline preload="metadata" ${autoplay ? "autoplay" : ""} src="${safeUrl(clip.url)}#t=${clip.start},${clip.end}"></video>`;
  const video = host.querySelector("video");
  video.addEventListener("loadedmetadata", () => { video.currentTime = clip.start; if (autoplay) video.play().catch(() => {}); });
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
  const catalog = normalizeCatalog(word?.catalog || state.settings.activeCatalog || "ielts");
  el.wordDialogTitle.textContent = word ? "编辑单词" : "添加单词"; el.wordId.value = word?.id || ""; el.wordText.value = word?.text || ""; el.wordMeaning.value = word?.meaning || ""; el.wordPhonetic.value = word?.phonetic || ""; el.wordCatalog.value = catalog; el.wordAudioUrl.value = word?.audioUrl || ""; el.wordTags.value = word?.tags.join(", ") || catalogLabel(catalog); el.wordExample.value = word?.example || ""; el.mnemonicRoots.value = memory.roots; el.mnemonicAssociation.value = memory.association; el.mnemonicFamily.value = memory.family; el.mnemonicSyllables.value = memory.syllables; el.wordDialog.showModal();
}

function saveWordForm(event) {
  event.preventDefault();
  const id = el.wordId.value;
  const mnemonics = { roots: el.mnemonicRoots.value, association: el.mnemonicAssociation.value, family: el.mnemonicFamily.value, syllables: el.mnemonicSyllables.value };
  const payload = createWord({ text: el.wordText.value, meaning: el.wordMeaning.value, phonetic: el.wordPhonetic.value, audioUrl: el.wordAudioUrl.value, example: el.wordExample.value, tags: splitTags(el.wordTags.value), catalog: el.wordCatalog.value, mnemonics });
  if (!payload) return;
  const index = state.words.findIndex((word) => word.id === id);
  if (index >= 0) state.words[index] = { ...state.words[index], text: payload.text, meaning: payload.meaning, phonetic: payload.phonetic, audioUrl: payload.audioUrl, example: payload.example, tags: payload.tags, catalog: payload.catalog, catalogs: payload.catalogs, mnemonics: payload.mnemonics }; else state.words.unshift(payload);
  saveState(); el.wordDialog.close(); el.wordForm.reset(); renderAll(); showToast("单词已保存");
}

function importWords(event) {
  event.preventDefault(); const raw = el.importText.value.trim(); if (!raw) return;
  let words;
  try { const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) throw new Error(); words = parsed; }
  catch { words = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [text, meaning, example = "", tags = catalogLabel(state.settings.activeCatalog)] = line.split("|").map((part) => part.trim()); return { text, meaning, example, tags: splitTags(tags), catalog: state.settings.activeCatalog }; }); }
  importWordObjects(words, { catalog: state.settings.activeCatalog === "all" ? "ielts" : state.settings.activeCatalog });
}

function importWordObjects(rawWords, options = {}) {
  const existing = new Map(state.words.map((word) => [word.text.toLowerCase(), word]));
  let imported = 0, updated = 0;
  rawWords.forEach((raw) => {
    const payload = { ...raw, catalog: options.catalog || raw.catalog || inferCatalog(raw) };
    const word = createWord(payload);
    if (!word) return;
    const found = existing.get(word.text.toLowerCase());
    if (found) {
      found.catalogs = normalizeCatalogs([...(found.catalogs || [found.catalog]), ...(word.catalogs || [word.catalog])]);
      found.catalog = normalizeCatalog(found.catalog || found.catalogs[0]);
      found.tags = uniqueStrings([...(found.tags || []), ...word.tags]);
      if (!found.meaning && word.meaning) found.meaning = word.meaning;
      if (!found.example && word.example) found.example = word.example;
      if (!found.phonetic && word.phonetic) found.phonetic = word.phonetic;
      if (!found.audioUrl && word.audioUrl) found.audioUrl = word.audioUrl;
      updated += 1;
      return;
    }
    state.words.unshift(word);
    existing.set(word.text.toLowerCase(), word);
    imported += 1;
  });
  if (!imported && !updated) return showToast("没有可导入的新单词");
  saveState(); if (el.importDialog.open) el.importDialog.close(); el.importForm.reset(); renderAll();
  showToast(`已新增 ${imported} 个，更新 ${updated} 个`);
}

async function ensureBundledCatalogs() {
  if (state.settings.highSchoolCatalogImported || state.words.some((word) => wordMatchesCatalog(word, "highschool"))) return;
  await importHighSchoolCatalog(false);
}

async function importHighSchoolCatalog(showResult = true) {
  try {
    let catalog = window.WORD_TUO_HIGH_SCHOOL_CATALOG;
    if (!catalog && typeof fetch === "function") {
      const response = await fetch(HIGH_SCHOOL_CATALOG_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error("catalog request failed");
      catalog = await response.json();
    }
    if (!catalog || !Array.isArray(catalog.words) || !catalog.words.length) throw new Error("catalog empty");
    importWordObjects(catalog.words, { catalog: "highschool" });
    state.settings.highSchoolCatalogImported = true;
    saveState(); renderAll();
    if (showResult) showToast(`高中词库已就绪：${catalog.words.length} 条`);
  } catch {
    if (showResult) showToast("高中词库导入失败，请稍后重试");
  }
}

function renderStats() {
  const visibleWords = filterWordsByActiveCatalog(state.words);
  const statuses = ["new", "learning", "review", "mastered"];
  const counts = statuses.map((status) => visibleWords.filter((word) => word.status === status).length); const max = Math.max(...counts, 1);
  el.masteryRate.textContent = `${Math.round(counts[3] / Math.max(visibleWords.length, 1) * 100)}%`;
  el.levelBars.innerHTML = counts.map((count, index) => `<div><div class="bar-label"><span>${statusLabel(statuses[index])}</span><strong>${count}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${count / max * 100}%"></div></div></div>`).join("");
  el.examHistoryList.innerHTML = "";
  if (!state.exams.length) el.examHistoryList.append(emptyItem("完成三周抽查后，这里会显示成绩。"));
  else state.exams.slice(0, 8).forEach((exam) => { const item = document.createElement("li"); item.textContent = `${formatDate(exam.completedAt)} · ${exam.practice ? "模拟" : "正式"} · ${exam.score}分 · ${exam.passed ? "通过" : "未通过"}`; el.examHistoryList.append(item); });
  el.historyList.innerHTML = "";
  if (!state.history.length) el.historyList.append(emptyItem("完成学习后，这里会显示记录。"));
  else state.history.slice(0, 20).forEach((record) => { const item = document.createElement("li"); item.textContent = `${formatTime(record.reviewedAt)} · ${record.word} · ${record.result}`; el.historyList.append(item); });
}

function renderSettings() {
  el.dailyNewGoalInput.value = state.settings.dailyNewGoal; el.dailyGoalInput.value = state.settings.dailyGoal; el.activeCatalogInput.value = state.settings.activeCatalog; el.autoSpeakInput.checked = state.settings.autoSpeak; el.videoEnabledInput.checked = state.settings.videoEnabled; el.autoPlayClipsInput.checked = state.settings.autoPlayClips; el.nextExamSetting.textContent = `当前学习：${activeCatalogLabel()}；下一场正式抽查：${formatDateKey(state.examSchedule.nextExamAt)}`;
  renderMemoryMethodSettings();
}

function saveSettings(event) {
  event.preventDefault(); const previousCatalog = state.settings.activeCatalog; state.settings.dailyNewGoal = clamp(Number(el.dailyNewGoalInput.value) || 10, 1, 50); state.settings.dailyGoal = clamp(Number(el.dailyGoalInput.value) || 30, 1, 300); state.settings.activeCatalog = normalizeCatalog(el.activeCatalogInput.value, true); if (previousCatalog !== state.settings.activeCatalog) { state.learningSession = null; syncLibraryCatalogWithActive(); resetLibraryWindow(); } state.settings.autoSpeak = el.autoSpeakInput.checked; state.settings.videoEnabled = el.videoEnabledInput.checked; state.settings.autoPlayClips = el.autoPlayClipsInput.checked; state.settings.memoryMethods = readEnabledMemoryMethods(); saveState(); renderActiveView(); showToast(`已保存，当前学习：${activeCatalogLabel()}`);
}

function renderMemoryMethodSettings() {
  const enabled = getEnabledMemoryMethods();
  el.memoryMethodSettings.innerHTML = MEMORY_METHODS.map((method) => `<label class="toggle-label memory-toggle"><input type="checkbox" name="memoryMethod" value="${escapeHtml(method.id)}" ${enabled.has(method.id) ? "checked" : ""} /><span><strong>${escapeHtml(method.title)}</strong><small>${escapeHtml(method.short)} · ${escapeHtml(method.evidence)}</small></span></label>`).join("");
}

function readEnabledMemoryMethods() {
  return [...el.memoryMethodSettings.querySelectorAll('input[name="memoryMethod"]:checked')].map((input) => input.value);
}

function showOnboardingIfNeeded() {
  if (!state.settings.onboardingSeen) openOnboarding(false);
}

function openOnboarding(fromSettings = false) {
  onboardingIndex = 0;
  renderOnboarding();
  el.onboardingSkipButton.textContent = fromSettings ? "关闭" : "先跳过";
  el.onboardingDialog.showModal();
}

function renderOnboarding() {
  const step = ONBOARDING_STEPS[onboardingIndex];
  el.onboardingProgress.textContent = `${onboardingIndex + 1}/${ONBOARDING_STEPS.length}`;
  el.onboardingPrevButton.disabled = onboardingIndex === 0;
  el.onboardingNextButton.textContent = onboardingIndex === ONBOARDING_STEPS.length - 1 ? "开始使用" : "下一步";
  el.onboardingContent.innerHTML = `<article class="tutorial-card"><p class="eyebrow">${escapeHtml(step.tag)}</p><h2>${escapeHtml(step.title)}</h2><p>${escapeHtml(step.body)}</p><ul class="tutorial-steps">${step.actions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
}

function moveOnboarding(delta) {
  if (onboardingIndex === ONBOARDING_STEPS.length - 1 && delta > 0) return completeOnboarding();
  onboardingIndex = clamp(onboardingIndex + delta, 0, ONBOARDING_STEPS.length - 1);
  renderOnboarding();
}

function completeOnboarding() {
  state.settings.onboardingSeen = true;
  saveState();
  el.onboardingDialog.close();
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
  const remaining = Math.max(0, state.settings.dailyNewGoal - countTodayNewCompletedForActiveCatalog());
  return getUnlearnedWordsForActiveCatalog().slice(0, remaining);
}
function countTodayNewCompletedForActiveCatalog() {
  const learned = new Set();
  state.history.forEach((record) => {
    if (record.type !== "new-complete" || record.reviewedAt.slice(0,10) !== todayKey()) return;
    const word = findWord(record.wordId);
    if (word && wordMatchesCatalog(word, state.settings.activeCatalog)) learned.add(word.id);
  });
  return learned.size;
}
function getUnlearnedWordsForActiveCatalog() { return filterWordsByActiveCatalog(state.words).filter((word) => word.status === "new"); }
function getDueWords() { return filterWordsByActiveCatalog(state.words).filter((word) => word.status !== "new" && word.nextReview <= todayKey()).sort((a,b) => statusRank(a.status) - statusRank(b.status) || b.lapseCount - a.lapseCount || a.text.localeCompare(b.text)); }
function weakWords() { return filterWordsByActiveCatalog(state.words).filter((word) => word.status === "learning" || word.lapseCount > 0 || word.wrong > word.correct).sort((a,b) => b.lapseCount - a.lapseCount || b.wrong - a.wrong); }
function todayRecords() { return state.history.filter((record) => record.reviewedAt.slice(0,10) === todayKey()); }
function learningStreak() { const days = new Set(state.history.map((record) => record.reviewedAt.slice(0,10))); let cursor = new Date(); if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1); let count = 0; while (days.has(dateKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); } return count; }
function isExamDue() { return todayKey() >= state.examSchedule.nextExamAt; }

async function speakWord(word) {
  const requestId = ++speakRequestId;
  const enriched = await ensureWordLexicon(word);
  if (requestId !== speakRequestId) return;
  if (enriched?.audioUrl) return playWordAudio(enriched.audioUrl, enriched.text);
  speak(word.text);
}
function playWordAudio(url, fallbackText) {
  stopSpeaking();
  try {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.preload = "auto";
    audio.addEventListener("ended", () => { if (currentAudio === audio) currentAudio = null; }, { once: true });
    audio.play().catch(() => speak(fallbackText));
  } catch {
    speak(fallbackText);
  }
}
function speak(text) {
  stopSpeaking();
  if (!("speechSynthesis" in window)) return showToast("当前环境不支持朗读");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = .86;
  speechSynthesis.speak(utterance);
}
function stopSpeaking() {
  speakRequestId += 1;
  if (autoSpeakTimer) {
    clearTimeout(autoSpeakTimer);
    autoSpeakTimer = null;
  }
  autoSpeakKey = "";
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.removeAttribute("src");
      currentAudio.load();
    } catch { /* ignore audio cleanup failures */ }
    currentAudio = null;
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}
function scheduleAutoSpeak(word, key) {
  if (autoSpeakTimer) clearTimeout(autoSpeakTimer);
  autoSpeakKey = key;
  autoSpeakTimer = setTimeout(() => {
    autoSpeakTimer = null;
    if (activeView === "learn" && autoSpeakKey === key) speakWord(word);
  }, 180);
}
function sessionSpeakKey(session, word) {
  return `${session.mode}:${session.index}:${session.stage}:${word.id}:${session.answerRevealed ? "shown" : "hidden"}`;
}
async function ensureWordLexicon(word, { rerender = false } = {}) {
  if (!word || word.audioUrl && word.phonetic) return word;
  const key = word.text.toLowerCase();
  if (lexiconRequests.has(key)) return lexiconRequests.get(key);
  const request = lookupDictionaryLexicon(word.text).then((lexicon) => {
    const target = state.words.find((item) => item.id === word.id) || word;
    let changed = false;
    if (lexicon.phonetic && !target.phonetic) { target.phonetic = lexicon.phonetic; changed = true; }
    if (lexicon.audioUrl && !target.audioUrl) { target.audioUrl = lexicon.audioUrl; changed = true; }
    target.lexiconFetchedAt = new Date().toISOString();
    if (changed) saveState();
    if (changed && rerender && (activeView === "learn" || activeView === "library")) renderActiveView();
    return target;
  }).catch(() => {
    word.lexiconFetchedAt = new Date().toISOString();
    saveState();
    return word;
  }).finally(() => lexiconRequests.delete(key));
  lexiconRequests.set(key, request);
  return request;
}
async function lookupDictionaryLexicon(text) {
  if (typeof fetch !== "function") return {};
  const cleaned = String(text || "").trim().toLowerCase().replace(/[^a-z -]/g, "");
  if (!cleaned || cleaned.length > 48) return {};
  const response = await fetch(`${LEXICON_API_BASE}${encodeURIComponent(cleaned)}`);
  if (!response.ok) return {};
  const entries = await response.json();
  const phonetics = Array.isArray(entries) ? entries.flatMap((entry) => entry.phonetics || []) : [];
  const audioUrl = safeAudioUrl(phonetics.find((item) => safeAudioUrl(item.audio))?.audio) || buildFallbackAudioUrl(cleaned);
  const phonetic = phonetics.find((item) => item.text)?.text || entries.find?.((entry) => entry.phonetic)?.phonetic || "";
  return { phonetic: String(phonetic || "").trim(), audioUrl };
}
function buildFallbackAudioUrl(text) {
  const cleaned = String(text || "").trim().toLowerCase();
  if (!/^[a-z][a-z -]{1,47}$/.test(cleaned)) return "";
  return `${AUDIO_FALLBACK_BASE}${encodeURIComponent(cleaned)}`;
}
function formatPhonetic(word) { return word.phonetic || "音标待补充"; }
function warmVisibleLexicon(words) {
  if (activeView !== "library") return;
  const targets = words.filter((word) => !word.phonetic || !word.audioUrl).slice(0, 6);
  setTimeout(() => targets.forEach((word) => ensureWordLexicon(word, { rerender: false })), 120);
}
function makeCloze(sentence, word) { const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); const replaced = sentence.replace(new RegExp(`\\b${escaped}\\b`, "i"), "____"); return replaced === sentence ? `${sentence}  [${word}]` : replaced; }
function normalizeAnswer(value) { return String(value || "").trim().toLowerCase().replace(/[.!?,;:'"\s]+/g, " ").trim(); }
function shuffle(items) { for (let i = items.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items; }
function statusRank(status) { return { learning: 0, new: 1, review: 2, mastered: 3 }[status] ?? 4; }
function statusLabel(status) { return { new: "未学习", learning: "学习中", review: "复习中", mastered: "已掌握" }[status] || status; }
function legacyInterval(level) { return Number(level) <= 1 ? 0 : Number(level) === 2 ? 1 : Number(level) === 3 ? 3 : Number(level) === 4 ? 7 : Number(level) === 5 ? 15 : 30; }
function normalizeCatalog(value, allowAll = false) {
  const catalog = String(value || "").toLowerCase();
  if (allowAll && catalog === "all") return "all";
  return catalog === "highschool" ? "highschool" : "ielts";
}
function normalizeCatalogs(values) {
  const list = (Array.isArray(values) ? values : [values]).map((value) => normalizeCatalog(value)).filter(Boolean);
  return uniqueStrings(list.length ? list : ["ielts"]);
}
function catalogLabel(catalog) { return CATALOGS[normalizeCatalog(catalog, true)] || CATALOGS.ielts; }
function activeCatalogLabel() { return catalogLabel(state.settings.activeCatalog); }
function inferCatalog(word) {
  const tags = splitTags(word?.tags || "");
  return tags.some((tag) => /高中|人教|必修/.test(tag)) ? "highschool" : "ielts";
}
function repairWordText(text) {
  const fixes = { deion: "description", "teenager (13": "teenager", "ache /": "headache", "paraphrase / （": "paraphrase" };
  let value = fixes[text] || text;
  value = value.replace(/\s*\/.*$/, "").trim();
  value = value.replace(/(?:adj|adv|vt|vi|prep|pron|conj|num)$/i, "").trim();
  if (/nn$/i.test(value) || (/[a-z]n$/i.test(value) && !/(tion|sion|ion|ain|een|oon|ern|orn|own|ian|man|men|in|on)$/i.test(value))) value = value.slice(0, -1);
  return value.replace(/\s+/g, " ").trim();
}
function wordMatchesCatalog(word, catalog) {
  const wanted = normalizeCatalog(catalog, true);
  if (wanted === "all") return true;
  return normalizeCatalogs(word.catalogs || [word.catalog || inferCatalog(word)]).includes(wanted);
}
function filterWordsByActiveCatalog(words) {
  const catalog = normalizeCatalog(state.settings.activeCatalog, true);
  return catalog === "all" ? words : words.filter((word) => wordMatchesCatalog(word, catalog));
}
function findWord(id) { return state.words.find((word) => word.id === id); }
function uniqueStrings(values) { return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]; }
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
function safeAudioUrl(value) { try { const url = new URL(String(value || "")); return url.protocol === "https:" ? url.href : ""; } catch { return ""; } }
function registerServiceWorker() { if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {})); }
