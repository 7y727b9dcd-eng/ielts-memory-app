import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, "..");
const android = resolve(project, "04-实现", "android");
const workflow = resolve(project, "..", ".github", "workflows", "build-word-tuo-apk.yml");

const files = {
  settings: resolve(android, "settings.gradle"),
  rootBuild: resolve(android, "build.gradle"),
  appBuild: resolve(android, "app", "build.gradle"),
  manifest: resolve(android, "app", "src", "main", "AndroidManifest.xml"),
  activity: resolve(android, "app", "src", "main", "java", "com", "personal", "wordtuo", "MainActivity.java"),
  strings: resolve(android, "app", "src", "main", "res", "values", "strings.xml"),
  workflow
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, existsSync(file) ? readFileSync(file, "utf8") : ""])
);

const checks = [
  ["安卓工程存在", existsSync(android)],
  ["包名正确", content.appBuild.includes('applicationId "com.personal.wordtuo.android"')],
  ["主屏幕名称为单词TUO", content.strings.includes("单词TUO")],
  ["WebView 载入本地网页", content.activity.includes("file:///android_asset/web/index.html?v=10")],
  ["启用本地存储", content.activity.includes("setDomStorageEnabled(true)")],
  ["允许发音和影视在线资源", content.manifest.includes("android.permission.INTERNET")],
  ["GitHub Action 构建 APK", content.workflow.includes("assembleDebug")],
  ["GitHub Action 拷贝 Web 资源", content.workflow.includes("04-实现/web") && content.workflow.includes("android_asset")],
  ["GitHub Action 发布下载分支", content.workflow.includes("word-tuo-apk-artifacts")],
  ["APK 输出名明确", content.workflow.includes("WordTUO-Android.apk")]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(failed.map(([name]) => `FAIL ${name}`).join("\n"));
  process.exit(1);
}

console.log("PASS android apk feature");
