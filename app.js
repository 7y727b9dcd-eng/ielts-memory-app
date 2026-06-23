"use strict";

document.documentElement.dataset.scriptLoaded = "true";

const DB_NAME = "listen-respond-training";
const DB_VERSION = 2;
const PROFILE_KEY = "training-profile-v1";
const SETTINGS_KEY = "training-settings-v1";
const FALLBACK_KEY = "listening-training-fallback-v1";
const SCENARIO_CATALOG_URL = "./data/scenarios.json";
const VOICE_CATALOG_URL = "./data/voices.json";
const AUDIO_CACHE_NAME = "listening-training-audio-v2";
const TTS_VERSION = "2";
const PREVIEW_SCENARIO_ID = "task-handoff-1";
const SLOT_TYPES = ["person", "action", "condition", "time", "reason"];

const SYSTEM_SPEAKER = Object.freeze({
  id: "system",
  name: "设备语音",
  genderLabel: "普通话",
  description: "当前设备可直接播放的普通话语音",
});
const LEGACY_VOICE_PROFILE_BY_SPEAKER = Object.freeze({
  lin_xiao: "natural",
  chen_yu: "briefing",
  su_ning: "calm",
  system: "system",
});

const TRAINING_METHODS = Object.freeze({
  free: { label: "自由训练", short: "按原方式完成训练" },
  slot: { label: "信息槽位压缩", short: "挂住人物、任务、条件、时间和原因" },
  meta: { label: "预测—监控—复盘", short: "先预测重点，再校准理解信心" },
  delayed: { label: "先理解后应答", short: "先确认意图和约束，再组织回答" },
});

const INFO_LABELS = {
  person: "人物",
  action: "任务",
  condition: "条件",
  time: "时间",
  reason: "原因",
  result: "结果",
};

let SCENARIOS = [
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
    id: "task-handoff-1", focus: "chunk", level: 1, category: "任务交代", stage: "边听边压缩", duration: 12, units: 4, rate: 0.9, responseType: "choice",
    text: "请把供应商的新报价和上个月的版本做个对比，重点标出涨价超过百分之五的项目，明天上午十点前发给我。",
    info: [{ type: "action", text: "对比新旧报价" }, { type: "condition", text: "标出涨价超过 5% 的项目" }, { type: "time", text: "明天上午十点前" }, { type: "person", text: "发给任务交代人" }],
    question: "需要重点标出什么？", options: ["所有价格变化", "涨价超过 5% 的项目", "上月新增项目", "供应商联系方式"], correct: 1,
  },
  {
    id: "feedback-1", focus: "response", level: 1, category: "意见反馈", stage: "理解与应答", duration: 14, units: 4, rate: 0.94, responseType: "voice",
    text: "这份总结的数据很完整，不过结论部分有点长。你保留前三条主要发现，每条控制在两句话以内，具体计算过程放到附件里就可以。",
    info: [{ type: "result", text: "数据完整" }, { type: "result", text: "结论过长" }, { type: "condition", text: "只保留前三条发现，每条两句话内" }, { type: "action", text: "计算过程移到附件" }],
    question: "先确认你理解的修改要求，再说明你会怎么处理。", responseTemplate: "我理解需要……，我会先……，然后……。",
  },
  {
    id: "progress-1", focus: "chunk", level: 2, category: "进度同步", stage: "保留顺序", duration: 20, units: 5, rate: 0.96, responseType: "order",
    text: "调研问卷今天已经关闭，运营下午会清理无效回答。明天上午数据组开始分析，周五给出第一版结论，确认方向以后再请设计做汇报页面。",
    info: [{ type: "result", text: "问卷已关闭" }, { type: "action", text: "运营清理无效回答" }, { type: "time", text: "明早开始分析" }, { type: "time", text: "周五给第一版结论" }, { type: "condition", text: "确认方向后再做汇报页面" }],
    question: "还原这项工作的推进顺序", orderItems: ["关闭问卷", "清理无效回答", "分析数据", "给出第一版结论", "制作汇报页面"], orderAnswer: [0,1,2,3,4],
  },
  {
    id: "meeting-1", focus: "speed", level: 2, category: "会议讨论", stage: "长段理解", duration: 24, units: 6, rate: 0.98, responseType: "choice",
    text: "这次活动预算先维持八万元不变。场地报价比预期高，所以把礼品数量从三百份降到两百份，但不要降低餐饮标准。市场部今天确认场地，行政周四前锁定餐饮，剩余预算留给现场物料。",
    info: [{ type: "condition", text: "总预算八万元不变" }, { type: "reason", text: "场地报价偏高" }, { type: "action", text: "礼品降到两百份" }, { type: "condition", text: "餐饮标准不降低" }, { type: "time", text: "今天确认场地，周四锁定餐饮" }, { type: "result", text: "余款用于现场物料" }],
    question: "预算调整的原则是什么？", options: ["增加预算保证礼品数量", "减少礼品但保持餐饮标准", "降低餐饮标准保留三百份礼品", "取消现场物料以支付场地"], correct: 1,
  },
  {
    id: "problem-2", focus: "chunk", level: 2, category: "问题解释", stage: "结构化复述", duration: 26, units: 6, rate: 1, responseType: "voice",
    text: "客服这两天收到的重复投诉突然变多，初步看不是产品故障，而是帮助中心的旧链接仍然排在搜索结果前面。内容团队今晚会更新跳转，客服暂时统一回复新链接，明天下午再看投诉量有没有下降。",
    info: [{ type: "result", text: "重复投诉变多" }, { type: "condition", text: "不是产品故障" }, { type: "reason", text: "旧链接搜索排名靠前" }, { type: "action", text: "今晚更新跳转" }, { type: "action", text: "客服统一回复新链接" }, { type: "time", text: "明天下午观察投诉量" }],
    question: "向同事复述问题判断、临时措施和检查时间。", responseTemplate: "目前判断……，今晚先……，明天下午再……。",
  },
  {
    id: "task-handoff-3", focus: "speed", level: 3, category: "任务交代", stage: "长段理解", duration: 32, units: 7, rate: 1.02, responseType: "order",
    text: "月底复盘会之前要准备三份材料。你先向财务确认实际支出，拿到数字后更新项目成本表；同时请运营补充活动转化数据。两边资料齐了以后再写复盘结论，结论不要超过一页。成本表周三完成，完整材料周四下班前发给参会人。",
    info: [{ type: "action", text: "向财务确认支出" }, { type: "action", text: "更新成本表" }, { type: "action", text: "请运营补充转化数据" }, { type: "condition", text: "资料齐后写结论" }, { type: "condition", text: "结论不超过一页" }, { type: "time", text: "成本表周三完成" }, { type: "time", text: "周四下班前发完整材料" }],
    question: "按依赖关系还原主要步骤", orderItems: ["确认支出并收集转化数据", "更新项目成本表", "资料齐后写结论", "周四发送完整材料"], orderAnswer: [0,1,2,3],
  },
  {
    id: "meeting-3", focus: "response", level: 3, category: "会议讨论", stage: "理解与应答", duration: 38, units: 8, rate: 1.04, responseType: "voice",
    text: "新员工培训原定线上完成，但上次反馈说互动不足，所以第一天改为线下，后两天仍然线上。人力负责场地和课程通知，业务部门各派一位同事参加第一天下午的答疑。课程资料要在培训前三天上传，讲师如果修改案例，必须在当天中午前告诉人力。由于会议室只能坐四十人，超过的人安排到下个月，不临时更换更大的场地。",
    info: [{ type: "condition", text: "第一天线下，后两天线上" }, { type: "reason", text: "上次反馈互动不足" }, { type: "person", text: "人力负责场地和通知" }, { type: "person", text: "业务部门派人答疑" }, { type: "time", text: "资料提前三天上传" }, { type: "time", text: "案例修改当天中午前通知" }, { type: "condition", text: "会议室上限四十人" }, { type: "result", text: "超员安排到下个月" }],
    question: "作为执行人，确认形式、分工、截止时间和人数限制。", responseTemplate: "我确认培训形式是……，分工是……，需要在……前完成，人数方面……。",
  },
  {
    id: "feedback-3", focus: "speed", level: 3, category: "意见反馈", stage: "长段理解", duration: 40, units: 8, rate: 1.05, responseType: "choice",
    text: "方案整体方向可以继续，但目前的用户数据只覆盖老客户，不能直接支持新市场判断。先保留现有结论作为参考，再从最近三个月的新注册用户里抽取两百人补做访谈。研究团队周五给出访谈提纲，下周二开始联系用户。因为发布时间不变，产品原型可以同步推进，不过最终文案要等新访谈结果出来以后再定。",
    info: [{ type: "result", text: "方案方向可继续" }, { type: "condition", text: "现有数据只覆盖老客户" }, { type: "condition", text: "旧结论仅作参考" }, { type: "action", text: "访谈两百名新注册用户" }, { type: "time", text: "周五出提纲" }, { type: "time", text: "下周二联系用户" }, { type: "action", text: "原型同步推进" }, { type: "condition", text: "最终文案等待访谈结果" }],
    question: "哪些工作可以立即继续，哪些必须等待？", options: ["原型可推进，最终文案等待新访谈", "所有工作都等访谈结束后开始", "最终文案先定，原型等待新数据", "取消新访谈，直接使用老客户结论"], correct: 0,
  },
  {
    id: "chunk-brief-2", focus: "chunk", level: 1, category: "任务交代", stage: "边听边压缩", duration: 18, units: 5, rate: 0.92, responseType: "order",
    text: "王然先把合同里的交付日期改到八月十五日，再请法务确认违约条款。法务回复以后，把最终版本发给供应商，今天不要先发旧文件。",
    info: [{ type: "person", text: "王然负责修改" }, { type: "action", text: "交付日期改到八月十五日" }, { type: "action", text: "请法务确认违约条款" }, { type: "condition", text: "法务回复后再发供应商" }, { type: "condition", text: "不发送旧文件" }],
    question: "按依赖关系排列处理步骤", orderItems: ["修改交付日期", "请法务确认条款", "等待法务回复", "发送最终版本"], orderAnswer: [0,1,2,3],
  },
  {
    id: "speed-update-2", focus: "speed", level: 2, category: "进度同步", stage: "渐进式提速", duration: 28, units: 6, rate: 1.08, responseType: "choice",
    text: "新版帮助文档已经完成中文校对，英文版还差支付部分。翻译团队明天中午补齐，产品经理下午统一检查链接。如果没有严重错误，周四先发布网页版，应用内入口等下周版本更新时再开放。",
    info: [{ type: "result", text: "中文校对完成" }, { type: "result", text: "英文支付部分未完成" }, { type: "time", text: "明天中午补齐翻译" }, { type: "action", text: "产品经理检查链接" }, { type: "time", text: "周四先发布网页版" }, { type: "condition", text: "应用内入口下周再开放" }],
    question: "哪项发布安排正确？", options: ["周四先发布网页版，应用内入口下周开放", "所有版本都推迟到下周", "明天中午直接开放应用内入口", "只发布英文版并取消中文校对"], correct: 0,
  },
  {
    id: "response-risk-2", focus: "response", level: 2, category: "问题解释", stage: "理解与应答", duration: 25, units: 6, rate: 0.98, responseType: "voice",
    text: "测试环境的短信验证码今天偶尔延迟，不影响正式用户。技术团队已经联系服务商，预计下午五点前恢复。你先暂停内部批量测试，但单个账号可以继续；如果五点后仍未恢复，再通知项目负责人调整明天的验收时间。",
    info: [{ type: "result", text: "测试短信偶尔延迟" }, { type: "condition", text: "不影响正式用户" }, { type: "time", text: "预计下午五点前恢复" }, { type: "action", text: "暂停内部批量测试" }, { type: "condition", text: "单个账号可以继续" }, { type: "condition", text: "五点后未恢复再调整验收" }],
    question: "向负责人确认影响范围、当前措施和升级条件。", responseTemplate: "目前影响……，我会先……；如果……，再……。",
  },
  {
    id: "response-change-3", focus: "response", level: 3, category: "会议讨论", stage: "理解与应答", duration: 35, units: 7, rate: 1.02, responseType: "voice",
    text: "客户希望把培训从两小时缩短到九十分钟，但要求保留现场练习。我们不删练习，把开场介绍压缩十分钟，产品演示减少二十分钟，问答环节维持半小时。课程负责人今天修改流程，讲师明早确认；如果客户再增加内容，只能替换现有案例，不能延长结束时间。",
    info: [{ type: "result", text: "培训缩短到九十分钟" }, { type: "condition", text: "保留现场练习" }, { type: "action", text: "开场压缩十分钟" }, { type: "action", text: "演示减少二十分钟" }, { type: "condition", text: "问答保持半小时" }, { type: "time", text: "今天改流程，明早确认" }, { type: "condition", text: "新增内容只能替换案例" }],
    question: "向客户复述新的时长分配和后续变更边界。", responseTemplate: "新的总时长是……，我们保留……，通过……压缩；后续新增内容只能……。",
  },
];

const defaultProfile = {
  baselineComplete: false,
  baselineSummary: null,
  stableDuration: null,
  methodTrends: {},
  difficulty: { level: 1, rate: 0.92, infoUnits: 4, adaptationStep: 0 },
  createdAt: new Date().toISOString(),
};

const defaultSettings = {
  weeklyGoal: 3,
  baseRate: 0.92,
  reminders: false,
  reminderTime: "20:00",
  speakerId: "system",
  voiceProfile: "system",
  lastMethodId: "slot",
  ttsEndpoint: "",
};

let db;
let profile = { ...defaultProfile, difficulty: { ...defaultProfile.difficulty } };
let settings = { ...defaultSettings };
let attempts = [];
let storageMode = "indexeddb";
let session = null;
let pendingSession = null;
let speakerCatalog = [];
let speakerCatalogMap = new Map();
let voiceServiceState = { available: false, reason: "not_configured", endpoint: "", version: 2 };
let currentAudio = null;
let currentAudioUrl = null;
let currentRecording = null;
let recordingStream = null;
let recordingUrl = null;
let toastTimer = null;
const { summarizeBaseline, scoreSlotMethod, scoreMetaMethod, scoreDelayedMethod, evaluateProgress, evaluateMethodTrend } = window.TrainingCore;
const VoiceCoreApi = window.VoiceCore || {};
const migrateVoiceRecord = typeof VoiceCoreApi.migrateVoiceRecord === "function" ? VoiceCoreApi.migrateVoiceRecord : (value) => value;
const LEGACY_SPEAKERS = VoiceCoreApi.LEGACY_SPEAKERS || { natural: "lin_xiao", briefing: "chen_yu", calm: "su_ning", system: "system" };

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
  SCENARIOS = await loadScenarioCatalog();
  speakerCatalog = await loadSpeakerCatalog();
  speakerCatalogMap = new Map(speakerCatalog.map((speaker) => [speaker.id, speaker]));
  validateScenarioCatalog();
  bindNavigation();
  bindActions();
  try {
    db = await openDatabase();
    profile = mergeProfile((await getMeta(PROFILE_KEY)) || defaultProfile);
    settings = normalizeSpeakerSettings({ ...defaultSettings, ...((await getMeta(SETTINGS_KEY)) || {}) });
    attempts = (await getAllAttempts()).map(migrateAttempt);
  } catch (error) {
    console.warn("IndexedDB unavailable; using localStorage fallback.", error);
    storageMode = "localstorage";
    const fallback = loadFallbackState();
    profile = mergeProfile(fallback.profile || defaultProfile);
    settings = normalizeSpeakerSettings({ ...defaultSettings, ...(fallback.settings || {}) });
    attempts = Array.isArray(fallback.attempts) ? fallback.attempts.map(migrateAttempt) : [];
    showToast("已启用兼容存储，训练记录仍会保存在本机");
  }
  profile = restoreBaselineSummary(profile, attempts);
  await refreshSpeakerPreferences();
  syncSettingsForm();
  updateStorageStatus();
  renderDashboard();
  registerServiceWorker();
  document.documentElement.dataset.appReady = "true";
  const params = new URLSearchParams(location.search);
  const requestedMode = params.get("mode");
  const requestedFocus = params.get("focus");
  const requestedView = params.get("view") || location.hash.replace(/^#/, "");
  if (["chunk", "speed", "response"].includes(requestedFocus)) {
    requestSession("focus", requestedFocus);
  } else if (["baseline", "quick", "system"].includes(requestedMode)) {
    requestSession(requestedMode);
  } else if (["home", "report", "settings"].includes(requestedView)) {
    switchView(requestedView);
  }
}

async function loadScenarioCatalog() {
  const response = await fetch(SCENARIO_CATALOG_URL, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Scenario catalog unavailable: ${response.status}`);
  const catalog = await response.json();
  if (catalog.version !== 2 || !Array.isArray(catalog.scenarios)) throw new Error("Invalid scenario catalog version");
  return catalog.scenarios;
}

async function loadSpeakerCatalog() {
  try {
    const response = await fetch(VOICE_CATALOG_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Speaker catalog unavailable: ${response.status}`);
    const catalog = await response.json();
    if (catalog.version !== 2 || !Array.isArray(catalog.speakers) || !catalog.speakers.length) throw new Error("Invalid speaker catalog version");
    return catalog.speakers;
  } catch (error) {
    console.warn("Speaker catalog unavailable; cloud speakers hidden.", error);
    return [];
  }
}

function migrateAttempt(value) {
  return migrateVoiceRecord({
    methodId: "free",
    methodScore: null,
    voiceProfile: "system",
    audioSource: "system",
    intentSelection: null,
    methodEvidence: null,
    ...value,
  });
}

function normalizeSpeakerSettings(value) {
  const speakerId = value?.speakerId || LEGACY_SPEAKERS[value?.voiceProfile] || defaultSettings.speakerId;
  const fallbackSpeakerId = speakerCatalog[0]?.id || SYSTEM_SPEAKER.id;
  return {
    ...defaultSettings,
    ...value,
    speakerId: speakerCatalogMap.has(speakerId) ? speakerId : fallbackSpeakerId,
  };
}

function legacyVoiceProfileFromSpeakerId(speakerId) {
  return LEGACY_VOICE_PROFILE_BY_SPEAKER[speakerId] || "system";
}

function voiceSetupMessage(state = voiceServiceState) {
  if (state.available && speakerCatalog.length) return "\u4e91\u8bed\u97f3\u53ef\u7528\uff0c\u53ef\u9009\u62e9\u4e09\u4f4d\u8bf4\u8bdd\u4eba\u5e76\u8bb0\u4f4f\u504f\u597d\u3002";
  if (state.available) return "\u4e91\u8bed\u97f3\u670d\u52a1\u5df2\u8fde\u901a\uff0c\u4f46\u8bf4\u8bdd\u4eba\u76ee\u5f55\u4e0d\u53ef\u7528\uff0c\u672c\u6b21\u5c06\u4f7f\u7528\u8bbe\u5907\u8bed\u97f3\u3002";
  if (state.reason === "not_configured") return "\u5c1a\u672a\u914d\u7f6e\u4e91\u8bed\u97f3\u4ee3\u7406\uff0c\u672c\u6b21\u5c06\u4f7f\u7528\u8bbe\u5907\u8bed\u97f3\u3002";
  return "\u4e91\u8bed\u97f3\u5f53\u524d\u4e0d\u53ef\u7528\uff0c\u672c\u6b21\u5c06\u4f7f\u7528\u8bbe\u5907\u8bed\u97f3\uff0c\u4e0d\u4f1a\u628a\u4e00\u6761\u8bbe\u5907\u8bed\u97f3\u4f2a\u88c5\u6210\u4e09\u4e2a\u4eba\u3002";
}

function resolvePreferredSpeakerId() {
  return speakerCatalogMap.has(settings.speakerId) ? settings.speakerId : (speakerCatalog[0]?.id || SYSTEM_SPEAKER.id);
}

function restoreBaselineSummary(value, items) {
  if (value.baselineSummary || !value.baselineComplete) return value;
  const baseline = items.filter((item) => item.mode === "baseline" && item.sessionComplete !== false);
  if (!baseline.length) return { ...value, baselineComplete: false };
  return {
    ...value,
    baselineSummary: summarizeBaseline(baseline),
  };
}

function validateScenarioCatalog() {
  const ids = new Set();
  SCENARIOS.forEach((scenario) => {
    if (!scenario.id || ids.has(scenario.id)) throw new Error(`Invalid or duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);
    if (!scenario.text || !Array.isArray(scenario.info) || scenario.info.length !== scenario.units) throw new Error(`Invalid information units: ${scenario.id}`);
    if (!scenario.intentCheck || !Array.isArray(scenario.intentCheck.options) || !scenario.intentCheck.options[scenario.intentCheck.correct]) throw new Error(`Invalid intent check: ${scenario.id}`);
    if (!scenario.constraintCheck || !Array.isArray(scenario.constraintCheck.options) || !Array.isArray(scenario.constraintCheck.correct)) throw new Error(`Invalid constraint check: ${scenario.id}`);
    if (!['choice', 'order', 'voice'].includes(scenario.responseType)) throw new Error(`Invalid response type: ${scenario.id}`);
    if (scenario.responseType === 'choice' && (!Array.isArray(scenario.options) || !scenario.options[scenario.correct])) throw new Error(`Invalid choice answer: ${scenario.id}`);
    if (scenario.responseType === 'order' && (!Array.isArray(scenario.orderItems) || scenario.orderItems.length !== scenario.orderAnswer.length)) throw new Error(`Invalid order answer: ${scenario.id}`);
  });
  ["chunk", "speed", "response"].forEach((focus) => {
    if (SCENARIOS.filter((scenario) => scenario.focus === focus).length < 4) throw new Error(`Insufficient focus scenarios: ${focus}`);
  });
}

async function refreshSpeakerPreferences(selectedSpeakerId = resolvePreferredSpeakerId()) {
  voiceServiceState = await checkVoiceService();
  updateSpeakerSelectOptions();
  renderSpeakerChoices(selectedSpeakerId);
}

function updateSpeakerSelectOptions() {
  const select = $("speakerIdInput");
  if (!select) return;
  const cloudSpeakersReady = voiceServiceState.available && speakerCatalog.length > 0;
  const options = cloudSpeakersReady ? speakerCatalog : [SYSTEM_SPEAKER];
  const value = cloudSpeakersReady ? resolvePreferredSpeakerId() : SYSTEM_SPEAKER.id;
  select.innerHTML = options.map((speaker) => `<option value="${speaker.id}">${escapeHtml(speaker.name)} - ${escapeHtml(speaker.genderLabel)}</option>`).join("");
  select.value = value;
  select.disabled = !cloudSpeakersReady;
}

function renderSpeakerChoices(selectedSpeakerId = resolvePreferredSpeakerId()) {
  const container = $("speakerChoiceGrid");
  const status = $("voiceSetupStatus");
  if (!container || !status) return;
  const cloudSpeakersReady = voiceServiceState.available && speakerCatalog.length > 0;
  const choices = cloudSpeakersReady
    ? speakerCatalog.map((speaker) => ({ ...speaker, available: true, disabled: false }))
    : [
        { ...SYSTEM_SPEAKER, available: true, disabled: false, checked: true },
        ...speakerCatalog.map((speaker) => ({ ...speaker, available: false, disabled: true })),
      ];
  const checkedSpeakerId = cloudSpeakersReady ? selectedSpeakerId : SYSTEM_SPEAKER.id;
  container.innerHTML = choices.map((speaker) => {
    const isSystem = speaker.id === SYSTEM_SPEAKER.id;
    const checked = checkedSpeakerId === speaker.id;
    const badge = speaker.available ? (isSystem ? "\u8bbe\u5907\u8bed\u97f3" : "\u4e91\u53ef\u7528") : "\u4e91\u4e0d\u53ef\u7528";
    const description = isSystem
      ? SYSTEM_SPEAKER.description
      : `${speaker.name}\u4f7f\u7528\u540c\u4e00\u9898\u8bd5\u542c\uff0c\u4fdd\u6301\u5bf9\u6bd4\u516c\u5e73\u3002`;
    return `<div class="speaker-choice${speaker.disabled ? " speaker-choice--disabled" : ""}${isSystem ? " speaker-choice--system" : ""}">
      <label>
        <input type="radio" name="speakerId" value="${speaker.id}" ${checked ? "checked" : ""} ${speaker.disabled ? "disabled" : ""} />
        <span class="speaker-avatar" aria-hidden="true">${escapeHtml(speaker.name.slice(0, 1))}</span>
        <span class="speaker-choice__name"><b>${escapeHtml(speaker.name)}</b><span class="speaker-badge">${badge}</span></span>
        <span class="speaker-choice__meta">${escapeHtml(speaker.genderLabel)}</span>
        <span class="speaker-choice__description">${escapeHtml(description)}</span>
      </label>
      <button type="button" data-speaker-preview="${speaker.id}" ${speaker.disabled ? "disabled" : ""}>\u8bd5\u542c\u540c\u4e00\u9898</button>
    </div>`;
  }).join("");
  status.textContent = voiceSetupMessage();
}

async function checkVoiceService() {
  const endpoint = settings.ttsEndpoint?.trim().replace(/\/$/, "");
  if (!endpoint) return { available: false, reason: "not_configured", endpoint: "", version: 2 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${endpoint}/v1/health`, { signal: controller.signal, cache: "no-cache" });
    const body = await response.json();
    const available = Boolean(response.ok && body?.ok === true && body?.azureConfigured === true && Number(body?.version) === 2);
    return { available, reason: available ? null : "unhealthy", endpoint, version: Number(body?.version) || null };
  } catch (error) {
    return { available: false, reason: error?.name === "AbortError" ? "timeout" : "unreachable", endpoint, version: null };
  } finally {
    clearTimeout(timer);
  }
}

function bindNavigation() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-view-target]");
    if (!trigger) return;
    event.preventDefault();
    switchView(trigger.dataset.viewTarget, true);
  });
  window.addEventListener("hashchange", () => {
    const view = location.hash.replace(/^#/, "");
    if (["home", "report", "settings"].includes(view)) switchView(view);
  });
}

function bindActions() {
  $("primaryStartButton").addEventListener("click", () => {
    requestSession(profile.baselineComplete ? "system" : "baseline");
  });
  $("quickStartButton").addEventListener("click", () => requestSession("quick"));
  $("systemStartButton").addEventListener("click", () => requestSession("system"));
  document.querySelectorAll("[data-focus]").forEach((button) => {
    button.addEventListener("click", () => requestSession("focus", button.dataset.focus));
  });
  $("cancelSetupButton").addEventListener("click", () => { pendingSession = null; switchView("home"); });
  $("confirmSetupButton").addEventListener("click", confirmSessionSetup);
  $("speakerChoiceGrid").addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-speaker-preview]");
    if (!button) return;
    previewSpeaker(button.dataset.speakerPreview);
  });
  $("exitTrainingButton").addEventListener("click", exitTraining);
  $("playButton").addEventListener("click", playCurrentScenario);
  $("skipAudioButton").addEventListener("click", finishAudio);
  $("replayButton").addEventListener("click", replayCurrentScenario);
  $("submitIntentButton").addEventListener("click", submitIntentCheck);
  $("submitAnswerButton").addEventListener("click", submitCurrentAnswer);
  $("nextExerciseButton").addEventListener("click", advanceSession);
  $("helpButton").addEventListener("click", () => $("helpDialog").showModal());
  $("closeHelpButton").addEventListener("click", () => $("helpDialog").close());
  $("helpStartButton").addEventListener("click", () => { $("helpDialog").close(); requestSession("quick"); });
  $("weeklyGoalInput").addEventListener("change", saveSettings);
  $("baseRateInput").addEventListener("change", saveSettings);
  $("reminderInput").addEventListener("change", saveSettings);
  $("reminderTimeInput").addEventListener("change", saveSettings);
  $("speakerIdInput").addEventListener("change", saveSettings);
  $("ttsEndpointInput").addEventListener("change", saveSettings);
  $("redoBaselineButton").addEventListener("click", () => requestSession("baseline"));
  $("exportButton").addEventListener("click", exportData);
  $("resetButton").addEventListener("click", resetNewData);
}

function mergeProfile(value) {
  return { ...defaultProfile, ...value, difficulty: { ...defaultProfile.difficulty, ...(value?.difficulty || {}) } };
}

function switchView(name, updateHash = false) {
  if (!["home", "setup", "training", "report", "settings"].includes(name)) return;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".bottom-nav [data-view-target]").forEach((item) => item.classList.toggle("active", item.dataset.viewTarget === name));
  document.querySelector(".bottom-nav").classList.toggle("hidden", name === "training" || name === "setup");
  if (name === "report") renderReport();
  if (name === "settings") updateStorageStatus();
  if (updateHash && name !== "training" && location.hash !== `#${name}`) updateViewAddress(name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function requestSession(mode, focus = null) {
  pendingSession = { mode, focus };
  const baseline = mode === "baseline";
  $("methodSetupSection").classList.toggle("hidden", baseline);
  $("setupEyebrow").textContent = baseline ? "约 8 分钟" : mode === "quick" ? "约 5 分钟" : mode === "system" ? "约 20 分钟" : "专项训练";
  $("setupTitle").textContent = baseline ? "开始首次能力基线" : "选择本次聆听方法";
  $("setupDescription").textContent = baseline ? "基线不使用训练提示，以便后续成绩有一致的比较起点。" : "训练中会按所选方法给出简短步骤，并单独计算方法执行分。";
  const recommendation = focus === "response" ? "delayed" : focus === "speed" ? "meta" : focus === "chunk" ? "slot" : settings.lastMethodId;
  const method = baseline ? "free" : (TRAINING_METHODS[recommendation] ? recommendation : "slot");
  const methodInput = document.querySelector(`input[name="trainingMethod"][value="${method}"]`);
  if (methodInput) methodInput.checked = true;
  $("methodRecommendation").textContent = `推荐：${TRAINING_METHODS[method].label}`;
  await refreshSpeakerPreferences(resolvePreferredSpeakerId());
  switchView("setup");
}

async function confirmSessionSetup() {
  if (!pendingSession) return;
  const methodId = pendingSession.mode === "baseline" ? "free" : document.querySelector('input[name="trainingMethod"]:checked')?.value;
  const speakerId = document.querySelector('input[name="speakerId"]:checked')?.value;
  if (!methodId || !speakerId) return showToast("请先选择训练方法和说话人");
  if (voiceServiceState.available && speakerCatalogMap.has(speakerId)) {
    settings.speakerId = speakerId;
    settings.voiceProfile = legacyVoiceProfileFromSpeakerId(speakerId);
  }
  if (pendingSession.mode !== "baseline") settings.lastMethodId = methodId;
  await persistSettings();
  syncSettingsForm();
  const next = pendingSession;
  pendingSession = null;
  startSession(next.mode, next.focus, methodId, speakerId);
}

function startSession(mode, focus = null, methodId = "free", speakerId = resolvePreferredSpeakerId()) {
  stopSpeech();
  cleanupRecording();
  let queue;
  if (mode === "baseline") queue = SCENARIOS.filter((item) => item.baseline);
  else if (mode === "focus") queue = selectFocusedScenarios(focus);
  else if (mode === "quick") queue = selectTrainingScenarios(3);
  else queue = selectSystemScenarios();
  if (!queue.length) {
    showToast("当前训练暂时没有可用题目");
    return;
  }
  const actualSpeakerId = speakerId === SYSTEM_SPEAKER.id ? SYSTEM_SPEAKER.id : speakerId;
  session = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    mode,
    focus,
    methodId,
    selectedSpeakerId: speakerId,
    speakerId: actualSpeakerId,
    voiceProfile: legacyVoiceProfileFromSpeakerId(actualSpeakerId),
    audioSource: actualSpeakerId === SYSTEM_SPEAKER.id ? "system" : "azure",
    audioProvider: actualSpeakerId === SYSTEM_SPEAKER.id ? "system" : "azure",
    audioDelivery: actualSpeakerId === SYSTEM_SPEAKER.id ? "system" : "network",
    voiceVersion: 2,
    queue,
    index: 0,
    results: [],
    replayCount: 0,
    audioFinishedAt: null,
    firstActionAt: null,
    selected: null,
    order: [],
    checkedUnits: [],
    voiceSelfChecking: false,
    intentSelection: null,
    methodEvidence: {},
  };
  switchView("training");
  renderExercise();
}

function selectFocusedScenarios(focus) {
  const pool = SCENARIOS.filter((item) => !item.baseline && item.focus === focus);
  return shuffle(pool).slice(0, 4);
}

function selectTrainingScenarios(count) {
  const recentIds = attempts.slice(-5).map((item) => item.scenarioId);
  let pool = SCENARIOS.filter((item) => !item.baseline && Math.abs(item.level - profile.difficulty.level) <= 1 && !recentIds.includes(item.id));
  if (pool.length < count) pool = SCENARIOS.filter((item) => !item.baseline);
  return rankScenarios(pool).slice(0, count);
}

function selectSystemScenarios() {
  const selectPhase = (focus, count) => rankScenarios(SCENARIOS.filter((item) => !item.baseline && item.focus === focus))
    .slice(0, count)
    .sort((a, b) => a.duration - b.duration);
  return [
    ...selectPhase("chunk", 2),
    ...selectPhase("speed", 2),
    ...selectPhase("response", 3),
  ];
}

function rankScenarios(items) {
  return shuffle(items)
    .map((item) => ({ item, distance: Math.abs(item.level - profile.difficulty.level) * 2 + Math.abs(item.units - profile.difficulty.infoUnits) }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ item }) => item);
}

function updateViewAddress(name) {
  try {
    history.replaceState(null, "", `#${name}`);
  } catch (error) {
    console.warn("Could not update view address.", error);
  }
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
  session.intentSelection = null;
  session.methodEvidence = {};
  setStage("exerciseReady");
  const focusLabels = { chunk: "边听边压缩", speed: "渐进式提速", response: "理解与应答" };
  $("sessionLabel").textContent = session.mode === "baseline" ? "基线测试" : session.mode === "quick" ? "碎片训练" : session.mode === "focus" ? focusLabels[session.focus] : "系统训练";
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
  renderPreListenMethod(scenario);
}

function renderPreListenMethod(scenario) {
  const panel = $("preListenMethodPanel");
  panel.innerHTML = "";
  if (session.mode === "baseline" || session.methodId === "free") return panel.classList.add("hidden");
  panel.classList.remove("hidden");
  if (session.methodId === "slot") {
    panel.innerHTML = "<b>本题方法：信息槽位压缩</b><p>听的时候只更新五个位置：人物—任务—条件—时间—原因。</p>";
  } else if (session.methodId === "delayed") {
    panel.innerHTML = "<b>本题方法：先理解后应答</b><p>听完前不准备答案；结束后先确认核心意图和关键约束。</p>";
  } else {
    panel.innerHTML = `<b>本题方法：预测—监控—复盘</b><p>根据“${escapeHtml(scenario.category)}”预判两个最值得留意的信息类型。</p><div class="method-chip-grid">${SLOT_TYPES.map((type) => `<label><input type="checkbox" value="${type}"> ${INFO_LABELS[type]}</label>`).join("")}</div><small>请选择两个，才可播放。</small>`;
    const inputs = [...panel.querySelectorAll("input")];
    inputs.forEach((input) => input.addEventListener("change", () => {
      const selected = inputs.filter((item) => item.checked);
      if (selected.length > 2) input.checked = false;
      session.methodEvidence.predictedTypes = inputs.filter((item) => item.checked).map((item) => item.value);
      $("playButton").disabled = session.methodEvidence.predictedTypes.length !== 2;
    }));
    $("playButton").disabled = true;
  }
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
  const focusOffset = session?.focus === "speed" ? 0.08 : 0;
  return Math.max(0.8, Math.min(1.25, (scenario.rate || 0.92) + preferenceOffset + adaptiveOffset + focusOffset));
}

function playCurrentScenario() {
  if (!session || !currentScenario()) return;
  if (session.methodId === "meta" && (session.methodEvidence.predictedTypes || []).length !== 2) return showToast("请先预测两个重点信息类型");
  session.replayCount += 1;
  speakScenario(currentScenario(), false);
}

function replayCurrentScenario() {
  session.replayCount += 1;
  speakScenario(currentScenario(), false);
}

async function speakScenario(scenario, keepAnswerVisible) {
  stopSpeech();
  markFirstAction();
  $("playButton").disabled = true;
  $("skipAudioButton").classList.remove("hidden");
  $("audioStatus").textContent = "正在播放，请持续更新脑中的信息结构……";
  setStage("exerciseReady");
  $("preListenMethodPanel").querySelectorAll("input").forEach((input) => { input.disabled = true; });

  if (session.selectedSpeakerId && session.selectedSpeakerId !== SYSTEM_SPEAKER.id && voiceServiceState.available && speakerCatalogMap.has(session.selectedSpeakerId)) {
    try {
      $("audioStatus").textContent = "正在准备自然工作语音……";
      const { url, delivery } = await fetchVoiceAudio(scenario.id, session.selectedSpeakerId);
      const source = delivery;
      session.speakerId = session.selectedSpeakerId;
      session.voiceProfile = legacyVoiceProfileFromSpeakerId(session.selectedSpeakerId);
      session.audioSource = delivery === "cache" ? "cache" : "azure";
      session.audioProvider = "azure";
      session.audioDelivery = delivery;
      session.voiceVersion = 2;
      currentAudioUrl = url;
      currentAudio = new Audio(url);
      currentAudio.playbackRate = effectiveRate(scenario);
      currentAudio.onended = finishAudio;
      currentAudio.onerror = () => speakWithDevice(scenario, true);
      await currentAudio.play();
      $("audioStatus").textContent = source === "cache" ? "正在播放缓存的自然工作语音……" : "正在播放自然工作语音……";
      return;
    } catch (error) {
      console.warn("Cloud speech unavailable; using device voice.", error);
    }
  }
  speakWithDevice(scenario, session.selectedSpeakerId !== SYSTEM_SPEAKER.id);
}

function speakWithDevice(scenario, fromCloudFailure = false) {
  if (!session || currentScenario()?.id !== scenario.id) return;
  stopSpeech();
  session.speakerId = SYSTEM_SPEAKER.id;
  session.voiceProfile = legacyVoiceProfileFromSpeakerId(SYSTEM_SPEAKER.id);
  session.audioSource = "system";
  session.audioProvider = "system";
  session.audioDelivery = "system";
  session.voiceVersion = 2;
  $("audioStatus").textContent = fromCloudFailure ? "本题使用设备语音。" : "正在播放设备语音。";
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
    finishAudio();
  };
  utterance.onerror = () => {
    $("audioStatus").textContent = "朗读未完成，可重新播放或直接开始作答。";
    $("playButton").disabled = false;
  };
  speechSynthesis.speak(utterance);
}

async function fetchVoiceAudio(scenarioId, speakerId) {
  const endpoint = settings.ttsEndpoint.replace(/\/$/, "");
  const url = `${endpoint}/v1/tts/${encodeURIComponent(scenarioId)}?profile=${encodeURIComponent(speakerId)}&v=${TTS_VERSION}`;
  const cache = "caches" in window ? await caches.open(AUDIO_CACHE_NAME) : null;
  const cached = cache ? await cache.match(url) : null;
  if (cached) return { url: URL.createObjectURL(await cached.blob()), delivery: "cache" };
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok || !String(response.headers.get("content-type")).includes("audio")) throw new Error(`TTS ${response.status}`);
  if (cache) await cache.put(url, response.clone());
  return { url: URL.createObjectURL(await response.blob()), delivery: "network" };
}

async function previewSpeaker(speakerId) {
  stopSpeech();
  const button = document.querySelector(`[data-speaker-preview="${speakerId}"]`);
  if (button) button.disabled = true;
  const speaker = speakerCatalogMap.get(speakerId) || SYSTEM_SPEAKER;
  $("voiceSetupStatus").textContent = `\u6b63\u5728\u51c6\u5907\u201c${speaker.name}\u201d\u8bd5\u542c\u2026\u2026`;
  const previewScenario = SCENARIOS.find((item) => item.id === PREVIEW_SCENARIO_ID) || SCENARIOS[0];
  try {
    if (!voiceServiceState.available || speakerId === SYSTEM_SPEAKER.id || !settings.ttsEndpoint) throw new Error("cloud preview unavailable");
    const { url, delivery } = await fetchVoiceAudio(previewScenario.id, speakerId);
    const source = delivery;
    currentAudioUrl = url;
    currentAudio = new Audio(url);
    currentAudio.onended = () => { if (button) button.disabled = false; };
    await currentAudio.play();
    $("voiceSetupStatus").textContent = source === "cache" ? "\u8bd5\u542c\u6765\u81ea\u672c\u5730\u7f13\u5b58\u3002" : "\u8bd5\u542c\u6765\u81ea\u5b89\u5168\u8bed\u97f3\u4ee3\u7406\u3002";
  } catch (error) {
    if (!("speechSynthesis" in window)) {
      $("voiceSetupStatus").textContent = "\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u8bd5\u7528\u8bbe\u5907\u8bed\u97f3\uff0c\u8bf7\u6539\u7528 Safari \u6216 Chrome\u3002";
      return;
    }
    const utterance = new SpeechSynthesisUtterance(previewScenario.text);
    utterance.lang = "zh-CN";
    utterance.rate = settings.baseRate;
    utterance.onend = () => { if (button) button.disabled = false; };
    speechSynthesis.speak(utterance);
    $("voiceSetupStatus").textContent = "\u4e91\u8bed\u97f3\u4e0d\u53ef\u7528\uff0c\u5f53\u524d\u8bd5\u542c\u4e3a\u8bbe\u5907\u8bed\u97f3\u3002";
  } finally {
    setTimeout(() => { if (button) button.disabled = false; }, 12000);
  }
}

function finishAudio() {
  stopSpeech();
  session.audioFinishedAt = performance.now();
  session.firstActionAt = null;
  renderIntentStage();
}

function renderIntentStage() {
  const scenario = currentScenario();
  setStage("exerciseIntent");
  $("intentPrompt").textContent = scenario.intentCheck.prompt || "这段话的核心意图是什么？";
  $("intentOptions").innerHTML = "";
  scenario.intentCheck.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option;
    button.addEventListener("click", () => {
      markFirstAction();
      session.intentSelection = index;
      $("intentOptions").querySelectorAll("button").forEach((item, itemIndex) => item.classList.toggle("selected", itemIndex === index));
      updateIntentSubmitState();
    });
    $("intentOptions").appendChild(button);
  });
  renderMethodCheckpoint(scenario);
  updateIntentSubmitState();
}

function renderMethodCheckpoint(scenario) {
  const panel = $("methodCheckpoint");
  panel.innerHTML = "";
  if (session.methodId === "slot") {
    panel.innerHTML = `<h3>你刚才捕捉到了哪些槽位？</h3><div class="method-chip-grid">${SLOT_TYPES.map((type) => `<label><input type="checkbox" value="${type}"> ${INFO_LABELS[type]}</label>`).join("")}</div>`;
    panel.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
      session.methodEvidence.capturedSlots = [...panel.querySelectorAll("input:checked")].map((item) => item.value);
      updateIntentSubmitState();
    }));
  } else if (session.methodId === "meta") {
    panel.innerHTML = `<h3>监控与复盘</h3><label class="field-row">理解信心（1–5）<input id="confidenceInput" type="range" min="1" max="5" value="3"><b id="confidenceValue">3</b></label><label class="field-row">最不确定的信息<select id="uncertainTypeInput"><option value="">请选择</option>${Object.entries(INFO_LABELS).map(([type, label]) => `<option value="${type}">${label}</option>`).join("")}</select></label>`;
    $("confidenceInput").addEventListener("input", () => { $("confidenceValue").textContent = $("confidenceInput").value; session.methodEvidence.confidence = Number($("confidenceInput").value); updateIntentSubmitState(); });
    $("uncertainTypeInput").addEventListener("change", () => { session.methodEvidence.uncertainType = $("uncertainTypeInput").value; session.methodEvidence.reviewed = Boolean($("uncertainTypeInput").value); updateIntentSubmitState(); });
    session.methodEvidence.confidence = 3;
  } else if (session.methodId === "delayed") {
    panel.innerHTML = `<h3>${escapeHtml(scenario.constraintCheck.prompt)}</h3><div class="method-chip-grid constraints">${scenario.constraintCheck.options.map((option, index) => `<label><input type="checkbox" value="${index}"> ${escapeHtml(option)}</label>`).join("")}</div>`;
    panel.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
      session.methodEvidence.constraintSelection = [...panel.querySelectorAll("input:checked")].map((item) => Number(item.value));
      updateIntentSubmitState();
    }));
  }
}

function updateIntentSubmitState() {
  let ready = Number.isInteger(session.intentSelection);
  if (session.methodId === "slot") ready = ready && (session.methodEvidence.capturedSlots || []).length > 0;
  if (session.methodId === "meta") ready = ready && Boolean(session.methodEvidence.uncertainType);
  if (session.methodId === "delayed") ready = ready && (session.methodEvidence.constraintSelection || []).length > 0;
  $("submitIntentButton").disabled = !ready;
}

function submitIntentCheck() {
  session.intentScore = session.intentSelection === currentScenario().intentCheck.correct ? 1 : 0;
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
    return finalizeAttempt({ detailScore: session.checkedUnits.length / scenario.info.length, intentScore: session.intentScore, captured: session.checkedUnits });
  }
  const scores = scoreObjective(scenario);
  scores.intentScore = session.intentScore;
  finalizeAttempt(scores);
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

function calculateMethodScore(scenario, detailScore) {
  const actualTypes = [...new Set(scenario.info.map((unit) => unit.type).filter((type) => SLOT_TYPES.includes(type)))];
  if (session.methodId === "slot") return scoreSlotMethod(session.methodEvidence.capturedSlots || [], actualTypes);
  if (session.methodId === "meta") return scoreMetaMethod({
    predictedTypes: session.methodEvidence.predictedTypes || [],
    actualTypes,
    confidence: session.methodEvidence.confidence,
    detailScore,
    reviewed: session.methodEvidence.reviewed,
  });
  if (session.methodId === "delayed") return scoreDelayedMethod(session.intentScore, session.methodEvidence.constraintSelection || [], scenario.constraintCheck.correct);
  return null;
}

async function finalizeAttempt(scores) {
  const scenario = currentScenario();
  const detailScore = clampScore(scores.detailScore);
  const methodScore = calculateMethodScore(scenario, detailScore);
  const attempt = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    scenarioId: scenario.id,
    sessionId: session.id,
    category: scenario.category,
    mode: session.mode,
    focus: session.focus || null,
    completedAt: new Date().toISOString(),
    duration: scenario.duration,
    units: scenario.units,
    rate: effectiveRate(scenario),
    detailScore,
    intentScore: clampScore(scores.intentScore),
    methodId: session.methodId,
    methodScore,
    voiceProfile: session.voiceProfile,
    speakerId: session.speakerId,
    audioProvider: session.audioProvider,
    audioDelivery: session.audioDelivery,
    voiceVersion: session.voiceVersion,
    audioSource: session.audioSource,
    intentSelection: session.intentSelection,
    methodEvidence: typeof structuredClone === "function" ? structuredClone(session.methodEvidence) : JSON.parse(JSON.stringify(session.methodEvidence)),
    replayCount: Math.max(0, session.replayCount - 1),
    responseLatency: session.firstActionAt && session.audioFinishedAt ? Math.max(0, Math.round(session.firstActionAt - session.audioFinishedAt)) : null,
    capturedTypes: scores.captured.map((index) => scenario.info[index]?.type).filter(Boolean),
    missedTypes: scenario.info.filter((_, index) => !scores.captured.includes(index)).map((unit) => unit.type),
    recordingUsed: Boolean(recordingUrl),
    sessionComplete: false,
  };
  session.results.push(attempt);
  attempts.push(attempt);
  if (db) await putAttempt(attempt); else persistFallbackState();
  renderFeedback(attempt, scores.captured);
}

function renderFeedback(attempt, captured) {
  const scenario = currentScenario();
  setStage("exerciseFeedback");
  const percent = Math.round(attempt.detailScore * 100);
  $("resultScore").textContent = `${percent}%`;
  $("resultIntentScore").textContent = `${Math.round(attempt.intentScore * 100)}%`;
  $("resultMethodScore").textContent = Number.isFinite(attempt.methodScore) ? `${Math.round(attempt.methodScore * 100)}%` : "—";
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
  await markSessionComplete(results);
  if (session.mode === "baseline") {
    const passed = results.filter((item) => item.detailScore >= 0.7);
    profile.baselineComplete = true;
    profile.stableDuration = passed.length ? Math.max(...passed.map((item) => item.duration)) : 10;
    profile.difficulty.level = profile.stableDuration >= 30 ? 3 : profile.stableDuration >= 18 ? 2 : 1;
    profile.difficulty.infoUnits = profile.difficulty.level + 3;
    profile.baselineSummary = summarizeBaseline(results);
    showToast(`基线完成：当前稳定语段约 ${profile.stableDuration} 秒`);
  } else {
    adaptDifficulty();
    showToast(`训练完成：本次细节召回 ${Math.round(average * 100)}%`);
  }
  await persistProfile();
  session = null;
  renderDashboard();
  renderReport();
  switchView("report");
}

async function markSessionComplete(results) {
  results.forEach((attempt) => { attempt.sessionComplete = true; });
  if (db) await Promise.all(results.map((attempt) => putAttempt(attempt)));
  else persistFallbackState();
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
  const intent = week.length ? week.reduce((sum, item) => sum + item.intentScore, 0) / week.length : null;
  const onePass = week.length ? week.filter((item) => item.replayCount === 0).length / week.length : null;
  const latencies = week.map((item) => item.responseLatency).filter((value) => Number.isFinite(value));
  const latency = latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null;
  $("reportDuration").textContent = profile.stableDuration ? `${profile.stableDuration} 秒` : "待完成基线";
  $("reportDifficulty").textContent = profile.baselineComplete ? `难度 ${profile.difficulty.level} · ${profile.difficulty.infoUnits} 个信息点 · ${profile.difficulty.rate.toFixed(2)}×` : "起始难度尚未确定";
  $("reportRecall").textContent = recall === null ? "—" : `${Math.round(recall * 100)}%`;
  $("reportRing").style.setProperty("--score", `${recall === null ? 0 : recall * 100}%`);
  $("reportIntent").textContent = intent === null ? "—" : `${Math.round(intent * 100)}%`;
  $("reportOnePass").textContent = onePass === null ? "—" : `${Math.round(onePass * 100)}%`;
  $("reportLatency").textContent = latency === null ? "—" : `${(latency / 1000).toFixed(1)} 秒`;
  renderWeakTypes(week);
  renderHistory();
  renderMethodProgress();
  renderRecommendation(week, recall);
}

function renderMethodProgress() {
  const grid = $("methodProgressGrid");
  const baseline = profile.baselineSummary;
  if (!baseline) {
    grid.innerHTML = '<article class="method-progress-card empty"><b>需要新的基线</b><p>完成基线测试后，才能比较不同方法与首次能力起点的差异。</p></article>';
    return;
  }
  const labels = { improved: "明显进步", stable: "保持稳定", reinforce: "需要巩固", collecting: "数据积累中" };
  grid.innerHTML = ["slot", "meta", "delayed"].map((methodId) => {
    const all = attempts.filter((item) => item.methodId === methodId && item.sessionComplete !== false);
    const comparable = all.filter((item) => item.voiceProfile === baseline.voiceProfile);
    const progress = evaluateProgress(baseline, comparable.slice(-20));
    const trend = evaluateMethodTrend(all);
    const deltas = progress.status === "collecting"
      ? `<span>同音色 ${progress.count} / 5 题</span>`
      : `<span>信息 ${formatDelta(progress.detailDelta)} 分</span><span>意图 ${formatDelta(progress.intentDelta)} 分</span><span>稳定长度 ${formatDelta(progress.durationDelta)} 秒</span>`;
    const methodTrend = trend.count < 10 ? `方法执行 ${trend.count} / 10 题` : `方法执行前后变化 ${formatDelta(trend.delta)} 分`;
    return `<article class="method-progress-card ${progress.status}"><small>${TRAINING_METHODS[methodId].label}</small><strong>${labels[progress.status]}</strong><div>${deltas}</div><p>${methodTrend}</p></article>`;
  }).join("");
}

function formatDelta(value) {
  const number = Number(value) || 0;
  return `${number > 0 ? "+" : ""}${number}`;
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
  $("recentHistory").innerHTML = recent.length ? recent.map((item) => `<div class="history-row"><div><b>${escapeHtml(item.category)}</b><small>${formatDate(item.completedAt)} · ${item.duration} 秒${item.mode === "system" && item.sessionComplete === false ? " · 中断" : ""}</small></div><strong>${Math.round(item.detailScore * 100)}%</strong></div>`).join("") : '<p class="empty-state">还没有训练记录。</p>';
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
  return attempts.filter((item) => item.sessionComplete !== false && new Date(item.completedAt) >= start);
}

function uniqueSessionsThisWeek() {
  const groups = new Map();
  attemptsThisWeek().filter((item) => item.mode === "system").forEach((item) => {
    const id = item.sessionId || item.completedAt.slice(0,10);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(item);
  });
  return [...groups.values()].filter((items) => items.some((item) => item.sessionComplete === true) || items.length >= 7).length;
}

function syncSettingsForm() {
  $("weeklyGoalInput").value = String(settings.weeklyGoal);
  $("baseRateInput").value = String(settings.baseRate);
  $("reminderInput").checked = Boolean(settings.reminders);
  $("reminderTimeInput").value = settings.reminderTime || "20:00";
  $("speakerIdInput").value = resolvePreferredSpeakerId();
  $("speakerIdInput").disabled = !(voiceServiceState.available && speakerCatalog.length > 0);
  $("ttsEndpointInput").value = settings.ttsEndpoint || "";
}

async function saveSettings() {
  settings.weeklyGoal = Number($("weeklyGoalInput").value);
  settings.baseRate = Number($("baseRateInput").value);
  settings.reminders = $("reminderInput").checked;
  settings.reminderTime = $("reminderTimeInput").value || "20:00";
  const selectedSpeakerId = $("speakerIdInput").value || resolvePreferredSpeakerId();
  if (voiceServiceState.available && speakerCatalogMap.has(selectedSpeakerId)) {
    settings.speakerId = selectedSpeakerId;
    settings.voiceProfile = legacyVoiceProfileFromSpeakerId(settings.speakerId);
  }
  settings.ttsEndpoint = $("ttsEndpointInput").value.trim().replace(/\/$/, "");
  const preferredSpeakerId = speakerCatalogMap.has(selectedSpeakerId) ? selectedSpeakerId : resolvePreferredSpeakerId();
  await refreshSpeakerPreferences(preferredSpeakerId);
  await persistSettings();
  if (window.webkit?.messageHandlers?.scheduleReminder) {
    window.webkit.messageHandlers.scheduleReminder.postMessage({
      enabled: settings.reminders,
      weeklyGoal: settings.weeklyGoal,
      time: settings.reminderTime,
    });
  } else if (settings.reminders) {
    showToast("\u63d0\u9192\u504f\u597d\u5df2\u4fdd\u5b58\uff1b\u5b89\u88c5\u7248\u4f1a\u6309\u6b64\u65f6\u95f4\u53d1\u9001\u901a\u77e5");
    renderDashboard();
    return;
  }
  renderDashboard();
  showToast("\u8bbe\u7f6e\u5df2\u4fdd\u5b58\u5728\u672c\u673a");
}

function exportData() {
  const payload = { app: "聆听训练", version: 1, exportedAt: new Date().toISOString(), profile, settings, attempts };
  const json = JSON.stringify(payload, null, 2);
  if (window.webkit?.messageHandlers?.shareBackup) {
    window.webkit.messageHandlers.shareBackup.postMessage(json);
    showToast("正在打开 iPhone 分享面板");
    return;
  }
  const blob = new Blob([json], { type: "application/json" });
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
  } else {
    localStorage.removeItem(FALLBACK_KEY);
  }
  attempts = [];
  profile = mergeProfile(defaultProfile);
  persistFallbackState();
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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
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

function loadFallbackState() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || "{}");
  } catch (error) {
    console.warn("Could not read compatibility storage.", error);
    return {};
  }
}

function persistFallbackState() {
  if (storageMode !== "localstorage") return;
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify({ profile, settings, attempts }));
  } catch (error) {
    console.error("Could not save compatibility storage.", error);
    showToast("本机存储空间不足，请先导出训练记录");
  }
}

async function persistProfile() {
  if (db) await setMeta(PROFILE_KEY, profile); else persistFallbackState();
}

async function persistSettings() {
  if (db) await setMeta(SETTINGS_KEY, settings); else persistFallbackState();
}

function updateStorageStatus() {
  const element = $("storageStatus");
  if (!element) return;
  element.textContent = storageMode === "indexeddb"
    ? "训练记录保存在 iPhone 本地数据库；录音不会持久保存或上传。"
    : "当前使用兼容存储保存训练记录；建议定期导出备份。";
}

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

window.handleReminderStatus = (status) => {
  if (status === "scheduled") showToast("训练提醒已安排");
  if (status === "disabled") showToast("训练提醒已关闭");
  if (status === "denied") {
    settings.reminders = false;
    $("reminderInput").checked = false;
    persistSettings();
    showToast("未获得通知权限，可在 iPhone 设置中开启");
  }
};
