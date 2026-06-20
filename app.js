"use strict";

document.documentElement.dataset.scriptLoaded = "true";

const DB_NAME = "listen-respond-training";
const DB_VERSION = 1;
const PROFILE_KEY = "training-profile-v1";
const SETTINGS_KEY = "training-settings-v1";

const INFO_LABELS = {
  person: "人物",
  action: "任务",
  condition: "条件",
  time: "时间",
  reason: "原因",
  result: "结果",
};

const SCENARIOS = [
  {
    id: "baseline-brief-1", baseline: true, level: 1, category: "任务交代", stage: "边听边压缩", duration: 10, units: 4, rate: 0.88, responseType: "choice",
    text: "小周，麻烦你把上午讨论的三个修改点整理一下，今天下午四点前发到项目群里，大家下班前需要确认。",
    info: [
      { type: "person", text: "小周" }, { type: "action", text: "整理上午讨论的三个修改点" }, { type: "time", text: "下午四点前" }, { type: "reason", text: "让大家下班前确认" },
    ],
    question: "这段话最核心的任务是什么？",
    options: ["整理三个修改点并发到项目群", "重新组织一次项目会议", "请大家提交下周计划", "检查所有人的下班时间"], correct: 0,
  },
  {
    id: "baseline-progress-2", baseline: true, level: 1, category: "进度同步", stage: "保留顺序", duration: 15, units: 5, rate: 0.92, responseType: "order",
    text: "客户已经确认了首页方案，设计部明天会补齐移动端页面，等他们交付以后，开发先做登录和首页，数据报表放到下周处理。",
    info: [
      { type: "result", text: "客户确认首页方案" }, { type: "time", text: "设计部明天补齐移动端" }, { type: "condition", text: "设计交付以后" }, { type: "action", text: "开发先做登录和首页" }, { type: "time", text: "数据报表下周处理" },
    ],
    orderItems: ["客户确认首页方案", "设计补齐移动端", "开发做登录和首页", "处理数据报表"], orderAnswer: [0, 1, 2, 3],
    question: "按对话中的先后安排还原工作顺序",
  },
  {
    id: "baseline-problem-3", baseline: true, level: 2, category: "问题解释", stage: "结构化复述", duration: 22, units: 6, rate: 0.95, responseType: "voice",
    text: "昨天导出的销售数字少了一部分，不是原始数据丢失，而是报表筛选条件沿用了五月份。你先把日期改成六月一号到今天，再重新导出一份，旧文件先不要发给区域负责人。",
    info: [
      { type: "result", text: "销售数字少了一部分" }, { type: "reason", text: "沿用了五月筛选条件" }, { type: "condition", text: "原始数据没有丢失" }, { type: "action", text: "日期改为六月一号到今天" }, { type: "action", text: "重新导出" }, { type: "condition", text: "旧文件不要发送" },
    ],
    question: "用自己的话复述：出了什么问题、为什么、下一步怎么做？",
    responseTemplate: "问题是……，原因是……，接下来我会……。",
  },
  {
    id: "baseline-meeting-4", baseline: true, level: 3, category: "会议讨论", stage: "长段理解", duration: 34, units: 7, rate: 1, responseType: "choice",
    text: "关于下周的产品演示，我们原来计划周二上午进行，但销售团队周二要去拜访客户，所以先调整到周三下午两点。演示内容仍然由林悦负责，技术问题让陈工现场回答。请在周一中午前完成演示稿，周二我们内部走一遍流程，如果发现数据有变化，只更新图表，不要临时增加新功能。",
    info: [
      { type: "time", text: "改到周三下午两点" }, { type: "reason", text: "销售周二拜访客户" }, { type: "person", text: "林悦负责演示" }, { type: "person", text: "陈工回答技术问题" }, { type: "time", text: "周一中午前完成演示稿" }, { type: "time", text: "周二内部演练" }, { type: "condition", text: "只更新图表，不增加新功能" },
    ],
    question: "哪项安排同时符合时间和变更限制？",
    options: ["周三下午演示，数据变化时只更新图表", "周二上午演示，并增加客户要求的新功能", "周三上午演示，技术问题由林悦回答", "周一完成演示后不再进行内部演练"], correct: 0,
  },
  {
    id: "task-handoff-1", level: 1, category: "任务交代", stage: "边听边压缩", duration: 12, units: 4, rate: 0.9, responseType: "choice",
    text: "请把供应商的新报价和上个月的版本做个对比，重点标出涨价超过百分之五的项目，明天上午十点前发给我。",
    info: [{ type: "action", text: "对比新旧报价" }, { type: "condition", text: "标出涨价超过 5% 的项目" }, { type: "time", text: "明天上午十点前" }, { type: "person", text: "发给任务交代人" }],
    question: "需要重点标出什么？", options: ["所有价格变化", "涨价超过 5% 的项目", "上月新增项目", "供应商联系方式"], correct: 1,
  },
  {
    id: "feedback-1", level: 1, category: "意见反馈", stage: "理解与应答", duration: 14, units: 4, rate: 0.94, responseType: "voice",
    text: "这份总结的数据很完整，不过结论部分有点长。你保留前三条主要发现，每条控制在两句话以内，具体计算过程放到附件里就可以。",
    info: [{ type: "result", text: "数据完整" }, { type: "result", text: "结论过长" }, { type: "condition", text: "只保留前三条发现，每条两句话内" }, { type: "action", text: "计算过程移到附件" }],
    question: "先确认你理解的修改要求，再说明你会怎么处理。", responseTemplate: "我理解需要……，我会先……，然后……。",
  },
  {
    id: "progress-1", level: 2, category: "进度同步", stage: "保留顺序", duration: 20, units: 5, rate: 0.96, responseType: "order",
    text: "调研问卷今天已经关闭，运营下午会清理无效回答。明天上午数据组开始分析，周五给出第一版结论，确认方向以后再请设计做汇报页面。",
    info: [{ type: "result", text: "问卷已关闭" }, { type: "action", text: "运营清理无效回答" }, { type: "time", text: "明早开始分析" }, { type: "time", text: "周五给第一版结论" }, { type: "condition", text: "确认方向后再做汇报页面" }],
    question: "还原这项工作的推进顺序", orderItems: ["关闭问卷", "清理无效回答", "分析数据", "给出第一版结论", "制作汇报页面"], orderAnswer: [0,1,2,3,4],
  },
  {
    id: "meeting-1", level: 2, category: "会议讨论", stage: "长段理解", duration: 24, units: 6, rate: 0.98, responseType: "choice",
    text: "这次活动预算先维持八万元不变。场地报价比预期高，所以把礼品数量从三百份降到两百份，但不要降低餐饮标准。市场部今天确认场地，行政周四前锁定餐饮，剩余预算留给现场物料。",
    info: [{ type: "condition", text: "总预算八万元不变" }, { type: "reason", text: "场地报价偏高" }, { type: "action", text: "礼品降到两百份" }, { type: "condition", text: "餐饮标准不降低" }, { type: "time", text: "今天确认场地，周四锁定餐饮" }, { type: "result", text: "余款用于现场物料" }],
    question: "预算调整的原则是什么？", options: ["增加预算保证礼品数量", "减少礼品但保持餐饮标准", "降低餐饮标准保留三百份礼品", "取消现场物料以支付场地"], correct: 1,
  },
  {
    id: "problem-2", level: 2, category: "问题解释", stage: "结构化复述", duration: 26, units: 6, rate: 1, responseType: "voice",
    text: "客服这两天收到的重复投诉突然变多，初步看不是产品故障，而是帮助中心的旧链接仍然排在搜索结果前面。内容团队今晚会更新跳转，客服暂时统一回复新链接，明天下午再看投诉量有没有下降。",
    info: [{ type: "result", text: "重复投诉变多" }, { type: "condition", text: "不是产品故障" }, { type: "reason", text: "旧链接搜索排名靠前" }, { type: "action", text: "今晚更新跳转" }, { type: "action", text: "客服统一回复新链接" }, { type: "time", text: "明天下午观察投诉量" }],
    question: "向同事复述问题判断、临时措施和检查时间。", responseTemplate: "目前判断……，今晚先……，明天下午再……。",
  },
  {
    id: "task-handoff-3", level: 3, category: "任务交代", stage: "长段理解", duration: 32, units: 7, rate: 1.02, responseType: "order",
    text: "月底复盘会之前要准备三份材料。你先向财务确认实际支出，拿到数字后更新项目成本表；同时请运营补充活动转化数据。两边资料齐了以后再写复盘结论，结论不要超过一页。成本表周三完成，完整材料周四下班前发给参会人。",
    info: [{ type: "action", text: "向财务确认支出" }, { type: "action", text: "更新成本表" }, { type: "action", text: "请运营补充转化数据" }, { type: "condition", text: "资料齐后写结论" }, { type: "condition", text: "结论不超过一页" }, { type: "time", text: "成本表周三完成" }, { type: "time", text: "周四下班前发完整材料" }],
    question: "按依赖关系还原主要步骤", orderItems: ["确认支出并收集转化数据", "更新项目成本表", "资料齐后写结论", "周四发送完整材料"], orderAnswer: [0,1,2,3],
  },
  {
    id: "meeting-3", level: 3, category: "会议讨论", stage: "理解与应答", duration: 38, units: 8, rate: 1.04, responseType: "voice",
    text: "新员工培训原定线上完成，但上次反馈说互动不足，所以第一天改为线下，后两天仍然线上。人力负责场地和课程通知，业务部门各派一位同事参加第一天下午的答疑。课程资料要在培训前三天上传，讲师如果修改案例，必须在当天中午前告诉人力。由于会议室只能坐四十人，超过的人安排到下个月，不临时更换更大的场地。",
    info: [{ type: "condition", text: "第一天线下，后两天线上" }, { type: "reason", text: "上次反馈互动不足" }, { type: "person", text: "人力负责场地和通知" }, { type: "person", text: "业务部门派人答疑" }, { type: "time", text: "资料提前三天上传" }, { type: "time", text: "案例修改当天中午前通知" }, { type: "condition", text: "会议室上限四十人" }, { type: "result", text: "超员安排到下个月" }],
    question: "作为执行人，确认形式、分工、截止时间和人数限制。", responseTemplate: "我确认培训形式是……，分工是……，需要在……前完成，人数方面……。",
  },
  {
    id: "feedback-3", level: 3, category: "意见反馈", stage: "长段理解", duration: 40, units: 8, rate: 1.05, responseType: "choice",
    text: "方案整体方向可以继续，但目前的用户数据只覆盖老客户，不能直接支持新市场判断。先保留现有结论作为参考，再从最近三个月的新注册用户里抽取两百人补做访谈。研究团队周五给出访谈提纲，下周二开始联系用户。因为发布时间不变，产品原型可以同步推进，不过最终文案要等新访谈结果出来以后再定。",
    info: [{ type: "result", text: "方案方向可继续" }, { type: "condition", text: "现有数据只覆盖老客户" }, { type: "condition", text: "旧结论仅作参考" }, { type: "action", text: "访谈两百名新注册用户" }, { type: "time", text: "周五出提纲" }, { type: "time", text: "下周二联系用户" }, { type: "action", text: "原型同步推进" }, { type: "condition", text: "最终文案等待访谈结果" }],
    question: "哪些工作可以立即继续，哪些必须等待？", options: ["原型可推进，最终文案等待新访谈", "所有工作都等访谈结束后开始", "最终文案先定，原型等待新数据", "取消新访谈，直接使用老客户结论"], correct: 0,
  },
];

const defaultProfile = {
  baselineComplete: false,
  stableDuration: null,
  difficulty: { level: 1, rate: 0.92, infoUnits: 4, adaptationStep: 0 },
  createdAt: new Date().toISOString(),
};

const defaultSettings = { weeklyGoal: 3, baseRate: 0.92, reminders: false };

let db;
let profile = { ...defaultProfile, difficulty: { ...defaultProfile.difficulty } };
let settings = { ...defaultSettings };
let attempts = [];
let session = null;
let currentRecording = null;
let recordingStream = null;
let recordingUrl = null;
let toastTimer = null;

const $ = (id) => document.getElementById(id);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initialize().catch(reportFatalError), { once: true });
} else {
  initialize().catch(reportFatalError);
}

function reportFatalError(error) {
  console.error("Application initialization failed", error);
  document.documentElement.dataset.appReady = "error";
  const toast = document.getElementById("toast");
  if (toast) {
    toast.textContent = "应用初始化失败，请刷新页面后重试";
    toast.classList.add("show");
  }
}

async function initialize() {
  validateScenarioCatalog();
  bindNavigation();
  bindActions();
  try {
    db = await openDatabase();
    profile = mergeProfile((await getMeta(PROFILE_KEY)) || defaultProfile);
    settings = { ...defaultSettings, ...((await getMeta(SETTINGS_KEY)) || {}) };
    attempts = await getAllAttempts();
  } catch (error) {
    console.warn("IndexedDB unavailable; current session will remain usable.", error);
    showToast("本地数据库暂不可用，本次记录可能无法保存");
  }
  syncSettingsForm();
  renderDashboard();
  registerServiceWorker();
  document.documentElement.dataset.appReady = "true";
  const params = new URLSearchParams(location.search);
  const requestedMode = params.get("mode");
  const requestedView = params.get("view");
  if (["baseline", "quick", "system"].includes(requestedMode)) {
    startSession(profile.baselineComplete ? requestedMode : "baseline");
  } else if (["home", "report", "settings"].includes(requestedView)) {
    switchView(requestedView);
  }
}

function validateScenarioCatalog() {
  const ids = new Set();
  SCENARIOS.forEach((scenario) => {
    if (!scenario.id || ids.has(scenario.id)) throw new Error(`Invalid or duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);
    if (!scenario.text || !Array.isArray(scenario.info) || scenario.info.length !== scenario.units) throw new Error(`Invalid information units: ${scenario.id}`);
    if (!['choice', 'order', 'voice'].includes(scenario.responseType)) throw new Error(`Invalid response type: ${scenario.id}`);
    if (scenario.responseType === 'choice' && (!Array.isArray(scenario.options) || !scenario.options[scenario.correct])) throw new Error(`Invalid choice answer: ${scenario.id}`);
    if (scenario.responseType === 'order' && (!Array.isArray(scenario.orderItems) || scenario.orderItems.length !== scenario.orderAnswer.length)) throw new Error(`Invalid order answer: ${scenario.id}`);
  });
}

function bindNavigation() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewTarget));
  });
}

function bindActions() {
  $("primaryStartButton").dataset.bound = "true";
  $("primaryStartButton").addEventListener("click", () => {
    $("primaryStartButton").dataset.clicked = "true";
    startSession(profile.baselineComplete ? "system" : "baseline");
  });
  $("quickStartButton").addEventListener("click", () => startSession(profile.baselineComplete ? "quick" : "baseline"));
  $("systemStartButton").addEventListener("click", () => startSession(profile.baselineComplete ? "system" : "baseline"));
  $("exitTrainingButton").addEventListener("click", exitTraining);
  $("playButton").addEventListener("click", playCurrentScenario);
  $("skipAudioButton").addEventListener("click", finishAudio);
  $("replayButton").addEventListener("click", replayCurrentScenario);
  $("submitAnswerButton").addEventListener("click", submitCurrentAnswer);
  $("nextExerciseButton").addEventListener("click", advanceSession);
  $("helpButton").addEventListener("click", () => $("helpDialog").showModal());
  $("closeHelpButton").addEventListener("click", () => $("helpDialog").close());
  $("helpStartButton").addEventListener("click", () => { $("helpDialog").close(); startSession(profile.baselineComplete ? "quick" : "baseline"); });
  $("weeklyGoalInput").addEventListener("change", saveSettings);
  $("baseRateInput").addEventListener("change", saveSettings);
  $("reminderInput").addEventListener("change", saveSettings);
  $("exportButton").addEventListener("click", exportData);
  $("resetButton").addEventListener("click", resetNewData);
}

function mergeProfile(value) {
  return { ...defaultProfile, ...value, difficulty: { ...defaultProfile.difficulty, ...(value?.difficulty || {}) } };
}

function switchView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.viewTarget === name));
  document.querySelector(".bottom-nav").classList.toggle("hidden", name === "training");
  if (name === "report") renderReport();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startSession(mode) {
  stopSpeech();
  cleanupRecording();
  const queue = mode === "baseline" ? SCENARIOS.filter((item) => item.baseline) : selectTrainingScenarios(mode === "quick" ? 3 : 7);
  session = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, mode, queue, index: 0, results: [], replayCount: 0, audioFinishedAt: null, firstActionAt: null, selected: null, order: [], checkedUnits: [], voiceSelfChecking: false };
  switchView("training");
  renderExercise();
}

function selectTrainingScenarios(count) {
  const target = profile.difficulty.level;
  const recentIds = attempts.slice(-5).map((item) => item.scenarioId);
  let pool = SCENARIOS.filter((item) => !item.baseline && Math.abs(item.level - target) <= 1 && !recentIds.includes(item.id));
  if (pool.length < count) pool = SCENARIOS.filter((item) => !item.baseline);
  return shuffle(pool).slice(0, count);
}

function renderExercise() {
  const scenario = currentScenario();
  if (!scenario) return completeSession();
  session.replayCount = 0;
  session.audioFinishedAt = null;
  session.firstActionAt = null;
  session.selected = null;
  session.order = [];
  session.checkedUnits = [];
  session.voiceSelfChecking = false;
  setStage("exerciseReady");
  $("sessionLabel").textContent = session.mode === "baseline" ? "基线测试" : session.mode === "quick" ? "碎片训练" : "系统训练";
  $("sessionCount").textContent = `${session.index + 1} / ${session.queue.length}`;
  $("sessionProgress").style.width = `${((session.index + 1) / session.queue.length) * 100}%`;
  $("scenarioCategory").textContent = scenario.category;
  $("scenarioStats").textContent = `约 ${scenario.duration} 秒 · ${scenario.units} 个信息点`;
  $("exerciseStageLabel").textContent = scenario.stage;
  $("exercisePrompt").textContent = session.mode === "baseline" ? "完整听一遍，再回答" : stagePrompt(scenario.stage);
  const rate = effectiveRate(scenario);
  $("playRateLabel").textContent = `当前语速 ${rate.toFixed(2).replace(/0$/, "")}×`;
  $("audioStatus").textContent = "";
  $("skipAudioButton").classList.add("hidden");
  $("playButton").disabled = false;
}

function stagePrompt(stage) {
  if (stage === "保留顺序") return "听清每一步之间的关系";
  if (stage === "理解与应答") return "先确认理解，再组织回应";
  if (stage === "长段理解") return "持续更新要点，不逐字背诵";
  if (stage === "结构化复述") return "抓住问题、原因和下一步";
  return "准备好后，完整听一遍";
}

function currentScenario() { return session?.queue[session.index]; }

function effectiveRate(scenario) {
  const adaptiveOffset = profile.baselineComplete ? profile.difficulty.rate - 0.92 : 0;
  const preferenceOffset = settings.baseRate - 0.92;
  return Math.max(0.8, Math.min(1.25, (scenario.rate || 0.92) + preferenceOffset + adaptiveOffset));
}

function playCurrentScenario() {
  if (!session || !currentScenario()) return;
  session.replayCount += 1;
  speakScenario(currentScenario(), false);
}

function replayCurrentScenario() {
  session.replayCount += 1;
  speakScenario(currentScenario(), true);
}

function speakScenario(scenario, keepAnswerVisible) {
  stopSpeech();
  markFirstAction();
  $("playButton").disabled = true;
  $("skipAudioButton").classList.remove("hidden");
  $("audioStatus").textContent = "正在播放，请持续更新脑中的信息结构……";
  if (!keepAnswerVisible) setStage("exerciseReady");

  if (!("speechSynthesis" in window)) {
    $("audioStatus").textContent = "当前浏览器无法朗读，请更换 Safari 或 Chrome。";
    $("playButton").disabled = false;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(scenario.text);
  utterance.lang = "zh-CN";
  utterance.rate = effectiveRate(scenario);
  utterance.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const chineseVoice = voices.find((voice) => /^zh[-_]/i.test(voice.lang));
  if (chineseVoice) utterance.voice = chineseVoice;
  utterance.onend = () => {
    $("playButton").disabled = false;
    if (keepAnswerVisible) {
      $("audioStatus").textContent = "重听完成";
      session.audioFinishedAt = performance.now();
    } else finishAudio();
  };
  utterance.onerror = () => {
    $("audioStatus").textContent = "朗读未完成，可重新播放或直接开始作答。";
    $("playButton").disabled = false;
  };
  speechSynthesis.speak(utterance);
}

function finishAudio() {
  stopSpeech();
  session.audioFinishedAt = performance.now();
  session.firstActionAt = null;
  renderAnswerStage();
}

function renderAnswerStage() {
  const scenario = currentScenario();
  setStage("exerciseAnswer");
  $("questionPrompt").textContent = scenario.question;
  $("submitAnswerButton").disabled = true;
  $("submitAnswerButton").textContent = "提交答案";
  const area = $("answerArea");
  area.innerHTML = "";
  if (scenario.responseType === "choice") renderChoice(area, scenario);
  if (scenario.responseType === "order") renderOrder(area, scenario);
  if (scenario.responseType === "voice") renderVoice(area, scenario);
}

function renderChoice(area, scenario) {
  const grid = document.createElement("div");
  grid.className = "option-grid";
  scenario.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => {
      markFirstAction();
      session.selected = index;
      grid.querySelectorAll("button").forEach((item, itemIndex) => item.classList.toggle("selected", itemIndex === index));
      $("submitAnswerButton").disabled = false;
    });
    grid.appendChild(button);
  });
  area.appendChild(grid);
}

function renderOrder(area, scenario) {
  const result = document.createElement("div");
  result.className = "order-result";
  result.innerHTML = "<small>依次点击下方步骤</small>";
  const bank = document.createElement("div");
  bank.className = "order-bank";
  scenario.orderItems.forEach((text, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "order-chip";
    button.textContent = text;
    button.addEventListener("click", () => {
      markFirstAction();
      const existing = session.order.indexOf(index);
      if (existing >= 0) session.order.splice(existing, 1); else session.order.push(index);
      button.classList.toggle("selected", session.order.includes(index));
      result.innerHTML = session.order.length ? session.order.map((item, position) => `<span>${position + 1}. ${escapeHtml(scenario.orderItems[item])}</span>`).join("") : "<small>依次点击下方步骤</small>";
      $("submitAnswerButton").disabled = session.order.length !== scenario.orderAnswer.length;
    });
    bank.appendChild(button);
  });
  area.append(result, bank);
}

function renderVoice(area, scenario) {
  const panel = document.createElement("div");
  panel.className = "voice-panel";
  panel.innerHTML = `<p class="voice-hint">建议结构：${escapeHtml(scenario.responseTemplate)}</p><button class="record-button" id="recordButton" type="button">开始录音</button><p class="status-line" id="recordStatus">也可以不录音，直接口头回答后自评</p><div id="recordPlayback"></div><button class="text-button" id="skipRecordButton" type="button">我已口头回答，进入自评</button>`;
  area.appendChild(panel);
  $("recordButton").addEventListener("click", toggleRecording);
  $("skipRecordButton").addEventListener("click", () => {
    markFirstAction();
    $("submitAnswerButton").disabled = false;
    $("recordStatus").textContent = "回答完成，提交后逐项核对信息点";
  });
}

async function toggleRecording() {
  markFirstAction();
  if (currentRecording?.state === "recording") {
    currentRecording.stop();
    $("recordButton").classList.remove("recording");
    $("recordButton").textContent = "重新录音";
    $("submitAnswerButton").disabled = false;
    return;
  }
  cleanupRecording();
  if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
    $("recordStatus").textContent = "当前浏览器不能录音，请直接口头回答后提交。";
    $("submitAnswerButton").disabled = false;
    return;
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    currentRecording = new MediaRecorder(recordingStream);
    currentRecording.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    currentRecording.addEventListener("stop", () => {
      const blob = new Blob(chunks, { type: currentRecording.mimeType || "audio/webm" });
      recordingUrl = URL.createObjectURL(blob);
      $("recordPlayback").innerHTML = "";
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = recordingUrl;
      $("recordPlayback").appendChild(audio);
      recordingStream?.getTracks().forEach((track) => track.stop());
    });
    currentRecording.start();
    $("recordButton").classList.add("recording");
    $("recordButton").textContent = "停止录音";
    $("recordStatus").textContent = "正在本地录音……";
  } catch (error) {
    $("recordStatus").textContent = "未获得麦克风权限。你仍可直接口头回答并完成自评。";
    $("submitAnswerButton").disabled = false;
  }
}

function submitCurrentAnswer() {
  const scenario = currentScenario();
  markFirstAction();
  if (currentRecording?.state === "recording") currentRecording.stop();
  if (scenario.responseType === "voice" && !session.voiceSelfChecking) return renderSelfCheck(scenario);
  if (scenario.responseType === "voice") {
    return finalizeAttempt({ detailScore: session.checkedUnits.length / scenario.info.length, intentScore: session.checkedUnits.length >= Math.ceil(scenario.info.length / 2) ? 1 : 0, captured: session.checkedUnits });
  }
  finalizeAttempt(scoreObjective(scenario));
}

function renderSelfCheck(scenario) {
  session.voiceSelfChecking = true;
  const area = $("answerArea");
  area.innerHTML = `<div class="option-grid"><p class="voice-hint">回想刚才的回答，勾选你明确说出的信息。请按实际情况选择。</p></div>`;
  const grid = area.querySelector(".option-grid");
  scenario.info.forEach((unit, index) => {
    const label = document.createElement("label");
    label.className = "option-button";
    label.innerHTML = `<input type="checkbox" value="${index}" /> <b>${INFO_LABELS[unit.type]}</b> · ${escapeHtml(unit.text)}`;
    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      if (input.checked) session.checkedUnits.push(index); else session.checkedUnits = session.checkedUnits.filter((item) => item !== index);
      label.classList.toggle("selected", input.checked);
    });
    grid.appendChild(label);
  });
  $("submitAnswerButton").textContent = "完成自评";
  $("submitAnswerButton").disabled = false;
}

function scoreObjective(scenario) {
  if (scenario.responseType === "choice") {
    const correct = session.selected === scenario.correct;
    return { detailScore: correct ? 1 : 0, intentScore: correct ? 1 : 0, captured: correct ? scenario.info.map((_, index) => index) : [] };
  }
  let correctPositions = 0;
  scenario.orderAnswer.forEach((value, index) => { if (session.order[index] === value) correctPositions += 1; });
  const score = correctPositions / scenario.orderAnswer.length;
  return { detailScore: score, intentScore: score >= 0.5 ? 1 : 0, captured: scenario.info.map((_, index) => index).slice(0, Math.round(scenario.info.length * score)) };
}

async function finalizeAttempt(scores) {
  const scenario = currentScenario();
  const attempt = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    scenarioId: scenario.id,
    sessionId: session.id,
    category: scenario.category,
    mode: session.mode,
    completedAt: new Date().toISOString(),
    duration: scenario.duration,
    units: scenario.units,
    rate: effectiveRate(scenario),
    detailScore: clampScore(scores.detailScore),
    intentScore: clampScore(scores.intentScore),
    replayCount: Math.max(0, session.replayCount - 1),
    responseLatency: session.firstActionAt && session.audioFinishedAt ? Math.max(0, Math.round(session.firstActionAt - session.audioFinishedAt)) : null,
    capturedTypes: scores.captured.map((index) => scenario.info[index]?.type).filter(Boolean),
    missedTypes: scenario.info.filter((_, index) => !scores.captured.includes(index)).map((unit) => unit.type),
    recordingUsed: Boolean(recordingUrl),
  };
  session.results.push(attempt);
  attempts.push(attempt);
  if (db) await putAttempt(attempt);
  renderFeedback(attempt, scores.captured);
}

function renderFeedback(attempt, captured) {
  const scenario = currentScenario();
  setStage("exerciseFeedback");
  const percent = Math.round(attempt.detailScore * 100);
  $("resultScore").textContent = `${percent}%`;
  $("resultRing").style.setProperty("--score", `${percent}%`);
  $("feedbackTitle").textContent = percent >= 80 ? "信息结构保持得很完整" : percent >= 60 ? "核心框架已经形成" : "这次信息还堆在一起";
  $("feedbackMessage").textContent = percent >= 80 ? "继续保持边听边更新，不需要刻意追求更快。" : percent >= 60 ? "下一次重点挂住条件和时间，不要逐字回放。" : "下一题先只抓人物、任务和截止时间，减少脑中的原句负担。";
  $("feedbackTranscript").textContent = scenario.text;
  $("infoReview").innerHTML = scenario.info.map((unit, index) => `<div class="info-item ${captured.includes(index) ? "" : "missed"}"><b>${INFO_LABELS[unit.type]}</b>${escapeHtml(unit.text)}</div>`).join("");
  $("nextExerciseButton").textContent = session.index === session.queue.length - 1 ? "查看本次结果" : "下一题";
}

function advanceSession() {
  cleanupRecording();
  session.index += 1;
  if (session.index >= session.queue.length) completeSession(); else renderExercise();
}

async function completeSession() {
  const results = session.results;
  const average = results.length ? results.reduce((sum, item) => sum + item.detailScore, 0) / results.length : 0;
  if (session.mode === "baseline") {
    const passed = results.filter((item) => item.detailScore >= 0.7);
    profile.baselineComplete = true;
    profile.stableDuration = passed.length ? Math.max(...passed.map((item) => item.duration)) : 10;
    profile.difficulty.level = profile.stableDuration >= 30 ? 3 : profile.stableDuration >= 18 ? 2 : 1;
    profile.difficulty.infoUnits = profile.difficulty.level + 3;
    showToast(`基线完成：当前稳定语段约 ${profile.stableDuration} 秒`);
  } else {
    adaptDifficulty();
    showToast(`训练完成：本次细节召回 ${Math.round(average * 100)}%`);
  }
  if (db) await setMeta(PROFILE_KEY, profile);
  session = null;
  renderDashboard();
  renderReport();
  switchView("report");
}

function adaptDifficulty() {
  const recent = attempts.slice(-5);
  if (recent.length < 5) return;
  const average = recent.reduce((sum, item) => sum + item.detailScore, 0) / recent.length;
  const noReplay = recent.every((item) => item.replayCount === 0);
  const difficulty = profile.difficulty;
  if (average >= 0.8 && noReplay) {
    const dimension = difficulty.adaptationStep % 3;
    if (dimension === 0) difficulty.infoUnits = Math.min(8, difficulty.infoUnits + 1);
    if (dimension === 1) difficulty.level = Math.min(3, difficulty.level + 1);
    if (dimension === 2) difficulty.rate = Math.min(1.15, +(difficulty.rate + 0.04).toFixed(2));
    difficulty.adaptationStep += 1;
  } else if (average < 0.6) {
    const dimension = Math.max(0, (difficulty.adaptationStep - 1) % 3);
    if (dimension === 2) difficulty.rate = Math.max(0.85, +(difficulty.rate - 0.04).toFixed(2));
    if (dimension === 1) difficulty.level = Math.max(1, difficulty.level - 1);
    if (dimension === 0) difficulty.infoUnits = Math.max(4, difficulty.infoUnits - 1);
    difficulty.adaptationStep = Math.max(0, difficulty.adaptationStep - 1);
  }
  const stable = recent.filter((item) => item.detailScore >= 0.8 && item.intentScore === 1);
  if (stable.length) profile.stableDuration = Math.max(profile.stableDuration || 0, ...stable.map((item) => item.duration));
}

function renderDashboard() {
  const week = attemptsThisWeek();
  const recall = week.length ? week.reduce((sum, item) => sum + item.detailScore, 0) / week.length : null;
  $("stableDuration").textContent = profile.stableDuration ? `${profile.stableDuration} 秒` : "待测";
  $("detailRecall").textContent = recall === null ? "—" : `${Math.round(recall * 100)}%`;
  const sessions = uniqueSessionsThisWeek();
  $("weeklySessions").textContent = `${sessions} / ${settings.weeklyGoal}`;
  $("primaryStartButton").textContent = profile.baselineComplete ? "开始系统训练" : "开始基线测试";
}

function renderReport() {
  const week = attemptsThisWeek();
  const recall = week.length ? week.reduce((sum, item) => sum + item.detailScore, 0) / week.length : null;
  $("reportDuration").textContent = profile.stableDuration ? `${profile.stableDuration} 秒` : "待完成基线";
  $("reportDifficulty").textContent = profile.baselineComplete ? `难度 ${profile.difficulty.level} · ${profile.difficulty.infoUnits} 个信息点 · ${profile.difficulty.rate.toFixed(2)}×` : "起始难度尚未确定";
  $("reportRecall").textContent = recall === null ? "—" : `${Math.round(recall * 100)}%`;
  $("reportRing").style.setProperty("--score", `${recall === null ? 0 : recall * 100}%`);
  renderWeakTypes(week);
  renderHistory();
  renderRecommendation(week, recall);
}

function renderWeakTypes(items) {
  const list = $("weakTypeList");
  if (!items.length) { list.innerHTML = '<p class="empty-state">完成训练后，会按人物、任务、条件、时间、原因显示遗漏情况。</p>'; return; }
  const missed = {};
  items.flatMap((item) => item.missedTypes || []).forEach((type) => { missed[type] = (missed[type] || 0) + 1; });
  const rows = Object.entries(INFO_LABELS).map(([type, label]) => ({ label, count: missed[type] || 0 })).sort((a,b) => b.count - a.count).slice(0,4);
  const max = Math.max(1, ...rows.map((row) => row.count));
  list.innerHTML = rows.map((row) => `<div class="weak-row"><span>${row.label}</span><div class="weak-bar"><i style="width:${row.count / max * 100}%"></i></div><b>${row.count} 次</b></div>`).join("");
}

function renderHistory() {
  const recent = [...attempts].reverse().slice(0,5);
  $("recentHistory").innerHTML = recent.length ? recent.map((item) => `<div class="history-row"><div><b>${escapeHtml(item.category)}</b><small>${formatDate(item.completedAt)} · ${item.duration} 秒</small></div><strong>${Math.round(item.detailScore * 100)}%</strong></div>`).join("") : '<p class="empty-state">还没有训练记录。</p>';
}

function renderRecommendation(week, recall) {
  let text = "完成基线测试后，这里会给出针对性训练建议。";
  if (profile.baselineComplete && !week.length) text = `本周先完成一次 20 分钟系统训练，从约 ${profile.stableDuration} 秒的材料开始。`;
  if (week.length && recall < 0.6) text = "本周先保持当前语速，优先抓人物、任务和时间；不要增加长度。";
  if (week.length && recall >= 0.6 && recall < 0.8) text = "继续当前难度，复述时明确说出条件与原因，减少无结构的原句回放。";
  if (week.length && recall >= 0.8) text = "理解准确率已经稳定。下一阶段只增加一个维度，避免长度、信息量和语速同时上升。";
  $("recommendation").querySelector("p").textContent = text;
}

function attemptsThisWeek() {
  const start = startOfWeek(new Date());
  return attempts.filter((item) => new Date(item.completedAt) >= start);
}

function uniqueSessionsThisWeek() {
  const ids = new Set(attemptsThisWeek().filter((item) => item.mode === "system").map((item) => item.sessionId || item.completedAt.slice(0,10)));
  return ids.size;
}

function syncSettingsForm() {
  $("weeklyGoalInput").value = String(settings.weeklyGoal);
  $("baseRateInput").value = String(settings.baseRate);
  $("reminderInput").checked = Boolean(settings.reminders);
}

async function saveSettings() {
  settings.weeklyGoal = Number($("weeklyGoalInput").value);
  settings.baseRate = Number($("baseRateInput").value);
  settings.reminders = $("reminderInput").checked;
  if (db) await setMeta(SETTINGS_KEY, settings);
  renderDashboard();
  showToast("设置已保存在本机");
}

function exportData() {
  const payload = { app: "聆听训练", version: 1, exportedAt: new Date().toISOString(), profile, settings, attempts };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `聆听训练-训练记录-${new Date().toISOString().slice(0,10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function resetNewData() {
  if (!confirm("只重置“聆听训练”的训练记录和基线结果。旧雅思数据不会被删除。确定继续吗？")) return;
  if (db) {
    await transactionPromise("attempts", "readwrite", (store) => store.clear());
    await setMeta(PROFILE_KEY, defaultProfile);
  }
  attempts = [];
  profile = mergeProfile(defaultProfile);
  renderDashboard();
  renderReport();
  showToast("新版训练数据已重置");
}

function exitTraining() {
  if (session?.results.length && !confirm("本次未完成的训练不会计为一次系统训练。确定退出吗？")) return;
  stopSpeech();
  cleanupRecording();
  session = null;
  switchView("home");
}

function setStage(id) {
  document.querySelectorAll(".exercise-stage").forEach((stage) => stage.classList.toggle("active", stage.id === id));
}

function markFirstAction() {
  if (session && !session.firstActionAt && session.audioFinishedAt) session.firstActionAt = performance.now();
}

function stopSpeech() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

function cleanupRecording() {
  if (currentRecording?.state === "recording") currentRecording.stop();
  recordingStream?.getTracks().forEach((track) => track.stop());
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  currentRecording = null;
  recordingStream = null;
  recordingUrl = null;
}

function showToast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").classList.add("show");
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function clampScore(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function startOfWeek(date) { const result = new Date(date); const day = (result.getDay() + 6) % 7; result.setHours(0,0,0,0); result.setDate(result.getDate() - day); return result; }
function formatDate(value) { return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("attempts")) {
        const store = database.createObjectStore("attempts", { keyPath: "id" });
        store.createIndex("completedAt", "completedAt");
      }
      if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionPromise(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

function getMeta(key) {
  return new Promise((resolve, reject) => {
    const request = db.transaction("meta").objectStore("meta").get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

function setMeta(key, value) { return transactionPromise("meta", "readwrite", (store) => store.put({ key, value })); }
function putAttempt(attempt) { return transactionPromise("attempts", "readwrite", (store) => store.put(attempt)); }
function getAllAttempts() {
  return new Promise((resolve, reject) => {
    const request = db.transaction("attempts").objectStore("attempts").getAll();
    request.onsuccess = () => resolve((request.result || []).sort((a,b) => a.completedAt.localeCompare(b.completedAt)));
    request.onerror = () => reject(request.error);
  });
}

// Cloud features intentionally remain disabled. A future authenticated backend can implement these contracts.
window.ListenRespondAI = Object.freeze({
  enabled: false,
  async generateSession(profileInput, scenarioType) {
    void profileInput; void scenarioType;
    throw new Error("AI session generation is not configured.");
  },
  async analyzeResponse(transcript, expectedUnits) {
    void transcript; void expectedUnits;
    throw new Error("AI response analysis is not configured.");
  },
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker registration failed", error));
  }
}
