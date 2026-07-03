import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../04-实现/web/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../04-实现/web/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../04-实现/web/styles.css", import.meta.url), "utf8");
const sw = readFileSync(new URL("../04-实现/web/sw.js", import.meta.url), "utf8");

const checks = [
  ["记忆法注册表存在", app.includes("const MEMORY_METHODS") && app.includes("DEFAULT_MEMORY_METHOD_IDS")],
  ["设置中有记忆法开关容器", html.includes('id="memoryMethodSettings"') && app.includes("renderMemoryMethodSettings")],
  ["保存设置会写入启用的记忆法", app.includes("readEnabledMemoryMethods") && app.includes("state.settings.memoryMethods")],
  ["实际页面只显示启用方法", app.includes("getEnabledMemoryMethods()") && app.includes("filter((method) => enabled.has(method.id))")],
  ["每种记忆法输出结构化具体内容", app.includes("renderMethodContent") && app.includes("method-step-list") && app.includes("method-evidence")],
  ["新增具体内容生成器", app.includes("buildKeywordImage") && app.includes("buildDualCoding") && app.includes("buildMethodOfLoci")],
  ["首次进入教程存在", html.includes('id="onboardingDialog"') && app.includes("showOnboardingIfNeeded") && app.includes("onboardingSeen")],
  ["教程可从设置重新打开", html.includes('id="tutorialButton"') && app.includes("openOnboarding")],
  ["教程覆盖主要功能", app.includes("学习入口") && app.includes("词库切换") && app.includes("三周抽查") && app.includes("本地备份")],
  ["教程样式存在", css.includes(".tutorial-card") && css.includes(".tutorial-steps")],
  ["资源版本升级到v15", html.includes("app.js?v=15") && html.includes("styles.css?v=15") && sw.includes("word-tuo-pwa-v15")],
];

const failed = checks.filter(([, pass]) => !pass);
checks.forEach(([name, pass]) => console.log(`${pass ? "PASS" : "FAIL"} ${name}`));
if (failed.length) process.exit(1);
