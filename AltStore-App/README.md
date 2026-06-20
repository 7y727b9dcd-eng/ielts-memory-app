# AltStore 安装版

这个目录把根目录的雅思单词 PWA 包装成 iPhone/iPad 原生容器，并通过 GitHub Actions 生成供 AltStore 安装的未签名 IPA。

## 为什么需要 GitHub Actions

Windows 可以运行 AltServer 并安装 IPA，但不能直接使用 Xcode 编译 iOS App。GitHub Actions 的 macOS 构建机负责生成 IPA，AltStore 再使用你的 Apple ID 对 IPA 签名并安装。

## 生成 IPA

1. 在 GitHub 创建一个仓库。
2. 将整个项目上传到仓库，默认分支使用 `main`。
3. 打开仓库的 `Actions` 页面。
4. 选择 `Build AltStore IPA`。
5. 点击 `Run workflow`。
6. 构建完成后，在运行记录底部下载 `IELTSMemory-AltStore` artifact。
7. 解压 artifact，得到 `IELTSMemory-AltStore.ipa`。

构建流程不需要上传 Apple ID、证书或密码。生成的是未签名 IPA，签名由 AltStore 在安装时完成。

## Windows 安装

1. 在 Windows 安装 AltServer，并按 AltStore 官方步骤把 AltStore 安装到 iPhone/iPad。
2. Windows 电脑和设备保持在同一 Wi-Fi。
3. 在设备上打开 AltStore。
4. 进入 `My Apps`，点击左上角 `+`。
5. 从“文件”中选择 `IELTSMemory-AltStore.ipa`。
6. 等待 AltStore 完成签名和安装。

AltStore 使用个人开发证书签名应用，并通过桌面端 AltServer 安装和刷新。免费 Apple ID 通常需要定期刷新，因此 Windows 上的 AltServer需要保持可用。

## 更新网页内容

修改根目录的以下文件后，重新运行 GitHub Actions 即可生成新版 IPA：

- `index.html`
- `styles.css`
- `app.js`
- `icons/`

## 技术结构

- `Sources/`：SwiftUI + WKWebView 容器
- `Web/`：构建时由工作流自动复制 PWA 文件
- `project.yml`：XcodeGen 项目配置
- `.github/workflows/build-altstore-ipa.yml`：云端 IPA 构建流程

## 当前限制

- 当前 Windows 环境不能直接编译验证 iOS 工程，最终编译结果以 GitHub Actions 为准。
- 原生容器内不依赖 Service Worker；PWA 文件直接打包进 App，可离线使用。
- 导出备份会调用 iOS 分享面板。
