"use strict";

const STORAGE_KEY = "word-tuo-state-v1";

const SAMPLE_WORDS = [
  { text: "substantial", meaning: "大量的；实质性的；重要的", phonetic: "/səbˈstænʃl/", example: "The report shows a substantial increase in international applications.", tags: ["雅思", "阅读", "高频"] },
  { text: "coherent", meaning: "连贯的；条理清楚的", phonetic: "/koʊˈhɪrənt/", example: "A coherent essay presents ideas in a logical order.", tags: ["雅思", "写作"] },
  { text: "interpret", meaning: "解释；理解；口译", phonetic: "/ɪnˈtɜːrprət/", example: "Candidates need to interpret data from charts accurately.", tags: ["雅思", "阅读", "图表"] },
  { text: "approximately", meaning: "大约；近似地", phonetic: "/əˈprɑːksɪmətli/", example: "The number of visitors rose to approximately two million.", tags: ["雅思", "写作", "数据"] },
  { text: "inevitable", meaning: "不可避免的；必然发生的", phonetic: "/ɪnˈevɪtəbl/", example: "Some argue that urban expansion is inevitable.", tags: ["雅思", "写作", "观点"] },
  { text: "allocate", meaning: "分配；拨出", phonetic: "/ˈæləkeɪt/", example: "Governments should allocate more funding to public transport.", tags: ["雅思", "写作", "社会"] },
  { text: "deteriorate", meaning: "恶化；变坏", phonetic: "/dɪˈtɪriəreɪt/", example: "Air quality may deteriorate as traffic volume increases.", tags: ["雅思", "环境"] },
  { text: "viable", meaning: "可行的；能成功的", phonetic: "/ˈvaɪəbl/", example: "Solar power is becoming a viable alternative to fossil fuels.", tags: ["雅思", "科技"] }
];

const pageTitles = { home: "今天", review: "复习", library: "雅思词库", stats: "统计", settings: "设置" };
const state = normalizeState(loadState());
let activeView = "home";
let reviewQueue = [];
let toastTimer;

const el = Object.fromEntries([
  "pageTitle", "dailySummary", "dueCount", "todayCount", "totalCount", "streakCount", "weakWordList",
  "reviewProgress", "reviewWord", "reviewPhonetic", "reviewAnswer", "reviewMeaning", "reviewExample", "reviewActions",
  "searchInput", "filterSelect", "libraryList", "levelBars", "historyList", "dailyGoalInput", "autoSpeakInput",
  "restoreFileInput", "wordDialog", "wordForm", "wordDialogTitle", "wordId", "wordText", "wordMeaning", "wordPhonetic",
  "wordTags", "wordExample", "importDialog", "importForm", "importText", "toast"
].map((id) => [id, document.getElementById(id)]));

bindEvents();
saveState();
renderAll();
registerServiceWorker();

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.querySelectorAll("[data-view-target]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewTarget)));
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
  document.getElementById("quickAddButton").addEventListener("click", () => openWordDialog());
  document.getElementById("startReviewButton").addEventListener("click", startReviewSession);
  document.getElementById("speakButton").addEventListener("click", () => reviewQueue[0] && speak(reviewQueue[0].text));
  document.getElementById("showAnswerButton").addEventListener("click", () => el.reviewAnswer.classList.remove("hidden"));
  document.querySelectorAll("[data-result]").forEach((button) => button.addEventListener("click", () => submitReview(button.dataset.result)));
  document.getElementById("importButton").addEventListener("click", () => el.importDialog.showModal());
  document.getElementById("sampleButton").addEventListener("click", () => importWordObjects(SAMPLE_WORDS));
  document.getElementById("exportButton").addEventListener("click", exportBackup);
  document.getElementById("restoreButton").addEventListener("click", () => el.restoreFileInput.click());
  document.getElementById("resetButton").addEventListener("click", resetData);
  el.searchInput.addEventListener("input", renderLibrary);
  el.filterSelect.addEventListener("change", renderLibrary);
  el.wordForm.addEventListener("submit", saveWordForm);
  el.importForm.addEventListener("submit", importWords);
  document.getElementById("settingsForm").addEventListener("submit", saveSettings);
  el.restoreFileInput.addEventListener("change", restoreBackup);
}

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createDefaultState(); }
  catch { return createDefaultState(); }
}

function createDefaultState() {
  return {
    words: SAMPLE_WORDS.map((word, index) => createWord({ ...word, level: index < 3 ? 1 : 2 })),
    history: [],
    settings: { dailyGoal: 30, autoSpeak: true }
  };
}

function normalizeState(input) {
  const fallback = createDefaultState();
  const output = {
    words: Array.isArray(input?.words) ? input.words.map(normalizeWord).filter(Boolean) : fallback.words,
    history: Array.isArray(input?.history) ? input.history.map(normalizeRecord).filter(Boolean) : [],
    settings: {
      dailyGoal: clamp(Number(input?.settings?.dailyGoal) || 30, 1, 300),
      autoSpeak: Boolean(input?.settings?.autoSpeak ?? true)
    }
  };
  if (!output.words.length) output.words = fallback.words;
  return output;
}

function createWord(data) {
  return normalizeWord({
    id: crypto.randomUUID?.() || `word-${Date.now()}-${Math.random()}`,
    text: data.text,
    meaning: data.meaning,
    phonetic: data.phonetic || "",
    example: data.example || "",
    tags: data.tags || ["雅思"],
    level: data.level || 1,
    correct: 0,
    wrong: 0,
    createdAt: new Date().toISOString(),
    lastReviewed: null,
    nextReview: todayKey()
  });
}

function normalizeWord(word) {
  if (!word?.text || !word?.meaning) return null;
  return {
    id: word.id || `word-${Date.now()}-${Math.random()}`,
    text: String(word.text).trim(),
    meaning: String(word.meaning).trim(),
    phonetic: String(word.phonetic || "").trim(),
    example: String(word.example || "").trim(),
    tags: splitTags(word.tags || "雅思"),
    level: clamp(Number(word.level) || 1, 1, 6),
    correct: Math.max(0, Number(word.correct) || 0),
    wrong: Math.max(0, Number(word.wrong) || 0),
    createdAt: word.createdAt || new Date().toISOString(),
    lastReviewed: word.lastReviewed || null,
    nextReview: word.nextReview || todayKey()
  };
}

function normalizeRecord(record) {
  if (!record?.word) return null;
  return { id: record.id || `record-${Date.now()}-${Math.random()}`, word: String(record.word), result: String(record.result || ""), reviewedAt: record.reviewedAt || new Date().toISOString() };
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function renderAll() {
  renderHome();
  renderLibrary();
  renderStats();
  el.dailyGoalInput.value = state.settings.dailyGoal;
  el.autoSpeakInput.checked = state.settings.autoSpeak;
}

function switchView(name) {
  activeView = name;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  el.pageTitle.textContent = pageTitles[name];
  if (name === "review") {
    if (!reviewQueue.length) reviewQueue = getDueWords();
    renderReview();
  } else renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
  const due = getDueWords().length;
  const done = todayRecords().length;
  el.dueCount.textContent = due;
  el.todayCount.textContent = done;
  el.totalCount.textContent = state.words.length;
  el.streakCount.textContent = `${learningStreak()}天`;
  el.dailySummary.textContent = `已完成 ${done}/${state.settings.dailyGoal} 个，待复习 ${due} 个。`;
  renderWordList(el.weakWordList, weakWords().slice(0, 4), true);
}

function startReviewSession() {
  reviewQueue = getDueWords();
  switchView("review");
}

function renderReview() {
  const word = reviewQueue[0];
  el.reviewAnswer.classList.add("hidden");
  if (!word) {
    el.reviewProgress.textContent = "COMPLETE";
    el.reviewWord.textContent = "今日已完成";
    el.reviewPhonetic.textContent = "";
    el.reviewMeaning.textContent = "没有到期单词。";
    el.reviewExample.textContent = "可以在词库中添加新词。";
    el.reviewAnswer.classList.remove("hidden");
    el.reviewActions.classList.add("hidden");
    renderAll();
    return;
  }
  el.reviewActions.classList.remove("hidden");
  el.reviewProgress.textContent = `待复习 ${reviewQueue.length} 个`;
  el.reviewWord.textContent = word.text;
  el.reviewPhonetic.textContent = word.phonetic;
  el.reviewMeaning.textContent = word.meaning;
  el.reviewExample.textContent = word.example || "暂无例句，可在词库中补充。";
  if (state.settings.autoSpeak) setTimeout(() => speak(word.text), 140);
}

function submitReview(result) {
  const word = reviewQueue.shift();
  if (!word) return;
  const schedule = {
    again: { delta: -1, days: 0, correct: 0, wrong: 1, label: "不认识" },
    hard: { delta: 0, days: 1, correct: 0, wrong: 1, label: "模糊" },
    good: { delta: 1, days: intervalFor(word.level), correct: 1, wrong: 0, label: "认识" }
  }[result];
  word.level = clamp(word.level + schedule.delta, 1, 6);
  word.correct += schedule.correct;
  word.wrong += schedule.wrong;
  word.lastReviewed = new Date().toISOString();
  word.nextReview = addDays(todayKey(), schedule.days);
  if (result === "again") reviewQueue.push(word);
  state.history.unshift({ id: `record-${Date.now()}-${Math.random()}`, word: word.text, result: schedule.label, reviewedAt: new Date().toISOString() });
  state.history = state.history.slice(0, 500);
  saveState();
  renderReview();
}

function renderLibrary() {
  const query = el.searchInput.value.trim().toLowerCase();
  const filter = el.filterSelect.value;
  const words = state.words.filter((word) => {
    const searchable = [word.text, word.meaning, word.example, ...word.tags].join(" ").toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filter === "due") return word.nextReview <= todayKey();
    if (filter === "weak") return word.wrong > 0 || word.level <= 2;
    if (filter === "mastered") return word.level >= 5;
    return true;
  }).sort((a, b) => a.nextReview.localeCompare(b.nextReview) || a.text.localeCompare(b.text));
  renderWordList(el.libraryList, words, false);
}

function renderWordList(container, words, compact) {
  container.innerHTML = "";
  if (!words.length) return container.append(emptyItem(compact ? "暂时没有薄弱词。" : "没有符合条件的单词。"));
  words.forEach((word) => {
    const item = document.createElement("li");
    item.className = "word-item";
    item.innerHTML = `<div><h3>${escapeHtml(word.text)}</h3><p>${escapeHtml(word.meaning)}</p><div class="word-meta"><span class="pill">Lv.${word.level}</span><span class="pill">${formatDue(word.nextReview)}</span>${word.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div></div>${compact ? "" : `<div class="item-actions"><button class="secondary-button" data-action="speak" data-id="${word.id}">朗读</button><button class="secondary-button" data-action="edit" data-id="${word.id}">编辑</button><button class="danger-button" data-action="delete" data-id="${word.id}">删除</button></div>`}`;
    container.append(item);
  });
  container.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleWordAction(button.dataset.action, button.dataset.id)));
}

function handleWordAction(action, id) {
  const word = state.words.find((item) => item.id === id);
  if (!word) return;
  if (action === "speak") speak(word.text);
  if (action === "edit") openWordDialog(id);
  if (action === "delete" && confirm(`删除 ${word.text}？`)) {
    state.words = state.words.filter((item) => item.id !== id);
    saveState(); renderAll(); showToast("单词已删除");
  }
}

function openWordDialog(id = "") {
  const word = state.words.find((item) => item.id === id);
  el.wordDialogTitle.textContent = word ? "编辑单词" : "添加单词";
  el.wordId.value = word?.id || "";
  el.wordText.value = word?.text || "";
  el.wordMeaning.value = word?.meaning || "";
  el.wordPhonetic.value = word?.phonetic || "";
  el.wordTags.value = word?.tags.join(", ") || "雅思";
  el.wordExample.value = word?.example || "";
  el.wordDialog.showModal();
}

function saveWordForm(event) {
  event.preventDefault();
  const id = el.wordId.value;
  const payload = createWord({ text: el.wordText.value, meaning: el.wordMeaning.value, phonetic: el.wordPhonetic.value, example: el.wordExample.value, tags: splitTags(el.wordTags.value) });
  if (!payload) return;
  const index = state.words.findIndex((word) => word.id === id);
  if (index >= 0) state.words[index] = { ...state.words[index], text: payload.text, meaning: payload.meaning, phonetic: payload.phonetic, example: payload.example, tags: payload.tags };
  else state.words.unshift(payload);
  saveState(); el.wordDialog.close(); el.wordForm.reset(); renderAll(); showToast("单词已保存");
}

function importWords(event) {
  event.preventDefault();
  const raw = el.importText.value.trim();
  if (!raw) return;
  let words;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    words = parsed;
  } catch {
    words = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const [text, meaning, example = "", tags = "雅思"] = line.split("|").map((part) => part.trim());
      return { text, meaning, example, tags: splitTags(tags) };
    });
  }
  importWordObjects(words);
}

function importWordObjects(rawWords) {
  const existing = new Set(state.words.map((word) => word.text.toLowerCase()));
  const imported = [];
  rawWords.forEach((raw) => {
    const word = createWord(raw);
    if (word && !existing.has(word.text.toLowerCase())) { imported.push(word); existing.add(word.text.toLowerCase()); }
  });
  if (!imported.length) return showToast("没有可导入的新单词");
  state.words.unshift(...imported);
  saveState();
  if (el.importDialog.open) el.importDialog.close();
  el.importForm.reset(); renderAll(); showToast(`已导入 ${imported.length} 个单词`);
}

function renderStats() {
  const counts = [1,2,3,4,5,6].map((level) => state.words.filter((word) => word.level === level).length);
  const max = Math.max(...counts, 1);
  el.levelBars.innerHTML = counts.map((count, index) => `<div><div class="bar-label"><span>等级 ${index + 1}</span><strong>${count}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${count / max * 100}%"></div></div></div>`).join("");
  el.historyList.innerHTML = "";
  if (!state.history.length) return el.historyList.append(emptyItem("完成复习后，这里会显示记录。"));
  state.history.slice(0, 20).forEach((record) => {
    const item = document.createElement("li");
    item.textContent = `${formatTime(record.reviewedAt)} · ${record.word} · ${record.result}`;
    el.historyList.append(item);
  });
}

function saveSettings(event) {
  event.preventDefault();
  state.settings.dailyGoal = clamp(Number(el.dailyGoalInput.value) || 30, 1, 300);
  state.settings.autoSpeak = el.autoSpeakInput.checked;
  saveState(); renderAll(); showToast("设置已保存");
}

function exportBackup() {
  const json = JSON.stringify({ app: "单词TUO", version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
  if (window.webkit?.messageHandlers?.shareBackup) {
    window.webkit.messageHandlers.shareBackup.postMessage(json);
    return showToast("备份已准备");
  }
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `单词TUO-备份-${todayKey()}.json`; anchor.click(); URL.revokeObjectURL(url);
}

function restoreBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const restored = normalizeState(JSON.parse(String(reader.result || "{}")));
      state.words = restored.words; state.history = restored.history; state.settings = restored.settings;
      saveState(); renderAll(); showToast("备份已恢复");
    } catch { showToast("备份文件格式不正确"); }
    el.restoreFileInput.value = "";
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm("清空单词TUO的全部学习数据？")) return;
  const fresh = createDefaultState();
  state.words = fresh.words; state.history = []; state.settings = fresh.settings;
  saveState(); renderAll(); showToast("数据已重置");
}

function speak(text) {
  if (!("speechSynthesis" in window)) return showToast("当前环境不支持朗读");
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US"; utterance.rate = 0.86;
  speechSynthesis.speak(utterance);
}

function getDueWords() { return state.words.filter((word) => word.nextReview <= todayKey()).sort((a,b) => a.level - b.level || b.wrong - a.wrong || a.text.localeCompare(b.text)); }
function weakWords() { return state.words.filter((word) => word.wrong > 0 || word.level <= 2).sort((a,b) => b.wrong - a.wrong || a.level - b.level); }
function todayRecords() { return state.history.filter((record) => dateKey(new Date(record.reviewedAt)) === todayKey()); }
function learningStreak() {
  const days = new Set(state.history.map((record) => dateKey(new Date(record.reviewedAt))));
  let cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dateKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); }
  return count;
}
function intervalFor(level) { return level <= 1 ? 1 : level === 2 ? 3 : level === 3 ? 7 : level === 4 ? 15 : 30; }
function splitTags(value) { return (Array.isArray(value) ? value : String(value).split(/[,，]/)).map((tag) => String(tag).trim()).filter(Boolean); }
function todayKey() { return dateKey(new Date()); }
function dateKey(date) { const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,"0"); const d = String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
function addDays(key, days) { const date = new Date(`${key}T00:00:00`); date.setDate(date.getDate()+days); return dateKey(date); }
function formatDue(key) { return key <= todayKey() ? "今天" : `下次 ${Number(key.slice(5,7))}/${Number(key.slice(8,10))}`; }
function formatTime(value) { const date = new Date(value); return `${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`; }
function clamp(value,min,max) { return Math.min(Math.max(value,min),max); }
function emptyItem(text) { const item = document.createElement("li"); item.className = "empty"; item.textContent = text; return item; }
function showToast(text) { el.toast.textContent = text; el.toast.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 2200); }
function escapeHtml(value) { return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function registerServiceWorker() { if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {})); }
