import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../04-实现/web/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../04-实现/web/index.html", import.meta.url), "utf8");
const sw = readFileSync(new URL("../04-实现/web/sw.js", import.meta.url), "utf8");

const getTodayBody = app.match(/function getTodayNewWords\(\) \{([\s\S]*?)\n\}/)?.[1] || "";

const checks = [
  ["每日新词按当前词库扣减今日已学", app.includes("countTodayNewCompletedForActiveCatalog") && getTodayBody.includes("countTodayNewCompletedForActiveCatalog()")],
  ["今日已学记录通过 wordId 找回词库", app.includes("findWord(record.wordId)") && app.includes('record.type !== "new-complete"')],
  ["当前词库还有未学词时才切新词", app.includes("getUnlearnedWordsForActiveCatalog") && getTodayBody.includes("getUnlearnedWordsForActiveCatalog().slice(0, remaining)")],
  ["首页有刷新今日新词按钮", html.includes('id="refreshNewWordsButton"') && app.includes("refreshDailyNewWords")],
  ["刷新会清除未完成的新词会话", app.includes('state.learningSession?.mode === "new"') && app.includes("state.learningSession = null")],
  ["没有当前词库新词时有明确提示", app.includes("showNoNewWordsGuidance") && app.includes("当前词库没有未学习单词")],
  ["资源版本升级到v17", html.includes("app.js?v=17") && html.includes("styles.css?v=17") && sw.includes("word-tuo-pwa-v17")],
];

const failed = checks.filter(([, pass]) => !pass);
checks.forEach(([name, pass]) => console.log(`${pass ? "PASS" : "FAIL"} ${name}`));
if (failed.length) process.exit(1);
