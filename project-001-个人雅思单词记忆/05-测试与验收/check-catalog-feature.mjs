import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, "..");
const web = resolve(project, "04-实现", "web");

const index = readFileSync(resolve(web, "index.html"), "utf8");
const app = readFileSync(resolve(web, "app.js"), "utf8");
const sw = readFileSync(resolve(web, "sw.js"), "utf8");
const vocabPath = resolve(web, "data", "pep-highschool-2019.json");
const vocabScriptPath = resolve(web, "data", "pep-highschool-2019.js");

const checks = [
  ["词库页有词库选择器", index.includes('id="catalogSelect"')],
  ["设置页有学习词库选择器", index.includes('id="activeCatalogInput"')],
  ["高中词库数据文件存在", existsSync(vocabPath)],
  ["高中词库脚本存在", existsSync(vocabScriptPath) && index.includes("pep-highschool-2019.js?v=10")],
  ["学习队列按当前词库过滤", app.includes("filterWordsByActiveCatalog")],
  ["可导入高中词库", app.includes("importHighSchoolCatalog")],
  ["PWA 缓存包含高中词库", sw.includes("pep-highschool-2019.json")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(failed.map(([name]) => `FAIL ${name}`).join("\n"));
  process.exit(1);
}

const data = JSON.parse(readFileSync(vocabPath, "utf8"));
if (!Array.isArray(data.words) || data.words.length < 250) {
  console.error(`FAIL 高中词库数量不足：${data.words?.length ?? 0}`);
  process.exit(1);
}

console.log(`PASS catalog feature, high-school words: ${data.words.length}`);
