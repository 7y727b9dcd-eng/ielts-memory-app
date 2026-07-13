import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, "..");
const web = resolve(project, "04-实现", "web");

const app = readFileSync(resolve(web, "app.js"), "utf8");
const index = readFileSync(resolve(web, "index.html"), "utf8");
const sw = readFileSync(resolve(web, "sw.js"), "utf8");

const switchViewBody = app.match(/function switchView\(name\) \{([\s\S]*?)\n\}/)?.[1] || "";
const renderLibraryBody = app.match(/function renderLibrary\(\) \{([\s\S]*?)\n\}/)?.[1] || "";

const checks = [
  ["导航切换不再全量 renderAll", !switchViewBody.includes("renderAll()")],
  ["按页面懒渲染", app.includes("renderActiveView")],
  ["词库分页大小存在", app.includes("const LIBRARY_PAGE_SIZE")],
  ["词库有加载更多按钮", index.includes('id="loadMoreLibraryButton"')],
  ["词库显示当前加载数量", index.includes('id="libraryCounter"')],
  ["词库只渲染当前页", renderLibraryBody.includes("slice(0, libraryVisibleCount)")],
  ["切换词库重置加载页数", app.includes("resetLibraryWindow")],
  ["词库选择跟随当前学习词库", app.includes("syncLibraryCatalogWithActive")],
  ["单词支持音频 URL 字段", app.includes("audioUrl")],
  ["在线词典音标音频接口", app.includes("api.dictionaryapi.dev/api/v2/entries/en")],
  ["在线音频兜底源存在", app.includes("dict.youdao.com/dictvoice")],
  ["发音优先播放网络音频", app.includes("playWordAudio")],
  ["词根记忆法使用扩展词根表", app.includes("COMMON_ROOTS")],
  ["资源版本已升级", index.includes("app.js?v=16") && sw.includes("word-tuo-pwa-v16")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(failed.map(([name]) => `FAIL ${name}`).join("\n"));
  process.exit(1);
}

console.log("PASS performance and lexicon feature");
