# 聆听训练语音代理

1. 在 Azure 创建 Speech 资源，记录密钥与区域（建议 East Asia）。
2. 在此目录安装依赖：`pnpm install`。
3. 写入密钥：`pnpm wrangler secret put AZURE_SPEECH_KEY` 和 `pnpm wrangler secret put AZURE_SPEECH_REGION`。
4. 部署：`pnpm deploy`。
5. 将返回的 `https://….workers.dev` 地址填入应用“设置 → 语音代理地址”。

代理只接受共享题库中的场景 ID，不接受任意文本。Azure 密钥只存在 Worker Secret 中。
