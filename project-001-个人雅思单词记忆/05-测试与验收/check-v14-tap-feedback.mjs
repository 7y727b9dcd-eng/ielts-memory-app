import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../04-实现/web/styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../04-实现/web/index.html", import.meta.url), "utf8");
const sw = readFileSync(new URL("../04-实现/web/sw.js", import.meta.url), "utf8");

const checks = [
  ["移动端点击高亮使用界面色", css.includes("-webkit-tap-highlight-color: var(--tap-quiet)")],
  ["点击高亮不是系统蓝色", !/tap-highlight-color:\s*(blue|#00f|#0000ff|rgb\\(0,\\s*0,\\s*255\\))/i.test(css)],
  ["定义低对比按压色", css.includes("--tap-quiet: rgba(21, 32, 25, .12)") && css.includes("--tap-pressed: rgba(21, 32, 25, .08)")],
  ["按钮和导航有按压态", css.includes(":where(button, a, summary, .option-button, .nav-item):active")],
  ["键盘焦点仍可见", css.includes(":focus-visible") && css.includes("--focus-ring")],
  ["资源版本升级到v17", html.includes("styles.css?v=17") && html.includes("app.js?v=17") && sw.includes("word-tuo-pwa-v17")],
];

const failed = checks.filter(([, pass]) => !pass);
checks.forEach(([name, pass]) => console.log(`${pass ? "PASS" : "FAIL"} ${name}`));
if (failed.length) process.exit(1);
