# SwiftUI 原生版参考

这个目录保留为未来迁移到原生 iOS App 的参考实现。

当前第一交付版本是项目根目录的 PWA 网页 App，因为它不需要 Mac、Xcode、签名证书或 App Store，就可以在 iPhone/iPad Safari 中添加到主屏幕使用。

## 何时继续这里

满足以下任一条件后，再继续 SwiftUI 原生版：

- 有 Mac 和 Xcode
- 可以使用云 Mac 或远程 Mac
- 已准备 Apple Developer 账号和签名证书
- 明确需要 App Store、iCloud、Widget、通知等原生能力

## 当前状态

这里已有 SwiftUI 草案，包括：

- 本地词库模型
- 复习调度逻辑
- 首页、复习、词库、统计、设置页面
- 发音服务

这些文件未在当前 Windows 环境编译验证。正式迁移时，需要在 Xcode 中创建 iOS SwiftUI 项目后再接入和修正。
