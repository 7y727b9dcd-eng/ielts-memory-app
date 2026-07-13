import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../04-实现/web/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../04-实现/web/index.html", import.meta.url), "utf8");
const sw = readFileSync(new URL("../04-实现/web/sw.js", import.meta.url), "utf8");

const defaultMethods = app.match(/const DEFAULT_MEMORY_METHOD_IDS = \[([^\]]+)\]/)?.[1] || "";
const renderMemoryMethodsBody = app.match(/function renderMemoryMethods\(word\) \{([\s\S]*?)\n\}/)?.[1] || "";
const renderRecallBody = app.match(/function renderRecallStage\(word, session, isReview\) \{([\s\S]*?)\n\}/)?.[1] || "";
const renderSceneBody = app.match(/function renderSceneStage\(word, session\) \{([\s\S]*?)\n\}/)?.[1] || "";
const renderWordListBody = app.match(/function renderWordList\(container, words, compact\) \{([\s\S]*?)\n\}/)?.[1] || "";
const saveSettingsBody = app.match(/function saveSettings\(event\) \{([\s\S]*?)\n\}/)?.[1] || "";

const checks = [
  ["默认记忆法改为精简组合，避免学习页一次展示过多模块", defaultMethods.includes('"morphology"') && defaultMethods.includes('"phonetic"') && defaultMethods.includes('"sentence"') && defaultMethods.includes('"retrieval"') && !defaultMethods.includes('"scene"') && !defaultMethods.includes('"keyword"')],
  ["旧版全开默认会迁移为精简组合，但用户手动设置会保留", app.includes("LEGACY_ALL_MEMORY_METHOD_IDS") && app.includes("memoryMethodsCustomized") && app.includes("sameMethodSet(ids, LEGACY_ALL_MEMORY_METHOD_IDS)")],
  ["设置保存时标记为用户自定义，之后开关能稳定生效", saveSettingsBody.includes("memoryMethodsCustomized = true") && saveSettingsBody.includes("readEnabledMemoryMethods()")],
  ["学习页记忆法显示使用可见方法过滤，而不是无条件显示全部开启项", app.includes("function getVisibleMemoryMethods(word)") && renderMemoryMethodsBody.includes("getVisibleMemoryMethods(word)")],
  ["影视语境记忆法只有存在片段且开关开启时才显示", app.includes("function shouldUseVideoStage(word)") && app.includes('method.id === "scene"') && app.includes("return shouldUseVideoStage(word)")],
  ["记忆法默认折叠，降低学习卡片复杂度", !app.includes('index === 0 ? "open" : ""')],
  ["新词回忆后只有存在视频片段才进入影视阶段，否则直接完成并进入遗忘曲线", renderRecallBody.includes("shouldUseVideoStage(word)") && renderRecallBody.includes('session.stage = "scene"') && renderRecallBody.includes('applyReview(word, quality, "new-complete")')],
  ["旧会话停在影视阶段但没有片段时会自动完成，不再显示查找视频入口", renderSceneBody.includes("!shouldUseVideoStage(word)") && renderSceneBody.includes('applyReview(word, session.pendingQuality, "new-complete")') && !renderSceneBody.includes("findSceneButton")],
  ["词库列表只有已保存视频片段的单词才显示影视语境按钮", renderWordListBody.includes("hasVideoClips(word)") && renderWordListBody.includes('data-action="scene"')],
  ["资源版本升级到 v17，避免手机继续使用旧缓存", html.includes("app.js?v=17") && html.includes("styles.css?v=17") && sw.includes("word-tuo-pwa-v17")],
];

const failed = checks.filter(([, pass]) => !pass);
checks.forEach(([name, pass]) => console.log(`${pass ? "PASS" : "FAIL"} ${name}`));
if (failed.length) process.exit(1);
