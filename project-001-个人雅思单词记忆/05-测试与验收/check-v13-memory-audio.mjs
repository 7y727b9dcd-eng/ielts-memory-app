import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../04-实现/web/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../04-实现/web/styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../04-实现/web/index.html", import.meta.url), "utf8");
const sw = readFileSync(new URL("../04-实现/web/sw.js", import.meta.url), "utf8");

const applyReviewBody = app.match(/function applyReview\(word, quality, type\) \{([\s\S]*?)\n\}/)?.[1] || "";
const dueWordsBody = app.match(/function getDueWords\(\) \{([\s\S]*?)\}/)?.[1] || "";

const checks = [
  ["学习卡片单词旁有朗读按钮", app.includes("learning-word-main") && app.includes("id=\"wordSpeakButton\"")],
  ["词库列表单词旁有朗读按钮", app.includes("word-title-row") && app.includes("inline-audio-button small")],
  ["朗读按钮有稳定样式", css.includes(".learning-word-main") && css.includes(".inline-audio-button")],
  ["自动朗读使用单一调度器", app.includes("function scheduleAutoSpeak") && !app.includes("setTimeout(() => speakWord(word), 120)")],
  ["播放前停止旧音频和系统朗读", app.includes("let currentAudio = null") && app.includes("function stopSpeaking") && app.includes("speechSynthesis.cancel()")],
  ["晚到的联网朗读会被取消", app.includes("let speakRequestId = 0") && app.includes("if (requestId !== speakRequestId) return")],
  ["学习页补音标不再触发二次渲染朗读", !app.includes("ensureWordLexicon(word, { rerender: true })")],
  ["记忆法扩展为八种", app.includes("八种记忆法") && app.includes("句子联想") && app.includes("主动回忆") && app.includes("搭配语境") && app.includes("中英反向回忆")],
  ["SM-2遗忘曲线字段存在", applyReviewBody.includes("easeFactor") && applyReviewBody.includes("intervalDays") && applyReviewBody.includes("nextReview = addDays")],
  ["到期复习按日期筛选", dueWordsBody.includes("word.nextReview <= todayKey()") && dueWordsBody.includes('word.status !== "new"')],
  ["资源版本升级到v17", html.includes("app.js?v=17") && html.includes("styles.css?v=17") && sw.includes("word-tuo-pwa-v17")],
];

const failed = checks.filter(([, pass]) => !pass);
checks.forEach(([name, pass]) => console.log(`${pass ? "PASS" : "FAIL"} ${name}`));
if (failed.length) {
  console.error(`\n${failed.length} checks failed.`);
  process.exit(1);
}
