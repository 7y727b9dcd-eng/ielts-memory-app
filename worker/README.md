# 聆听训练语音代理

1. 在 Azure 创建 Speech 资源，记录密钥与区域（建议 East Asia）。
2. 在此目录安装依赖：`pnpm install`。
3. 写入密钥：`pnpm wrangler secret put AZURE_SPEECH_KEY` 和 `pnpm wrangler secret put AZURE_SPEECH_REGION`。
4. 部署：`pnpm deploy`。
5. 将返回的 `https://….workers.dev` 地址填入应用“设置 → 语音代理地址”。

代理只接受共享题库中的场景 ID，不接受任意文本。Azure 密钥只存在 Worker Secret 中。

- 健康检查：`GET /v1/health`
  - 缺少任一 Azure Secret 时返回 `503` 与 `{ ok:false, service:"listening-training-tts", version:2, azureConfigured:false }`
  - 两个 Secret 都存在时返回 `200` 与 `{ ok:true, service:"listening-training-tts", version:2, azureConfigured:true }`
- 语音接口：`GET /v1/tts/{scenarioId}?profile={speakerId}&v=2`
  - 仅支持 `lin_xiao`、`chen_yu`、`su_ning`
  - 仅支持共享题库里的场景 ID
  - 输出始终为 MP3
  - `lin_xiao` / `chen_yu` 使用 Azure 风格参数；`su_ning` 不包 `mstts:express-as`
