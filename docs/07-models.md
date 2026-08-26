# models.json 与模型接入

模型相关配置分两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商/模型的行为覆盖与自定义模型（本文件的主角） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | Ctrl+P 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **这份文件经历过一次换血。** 早期它放的是 thinkingLevelMap 覆盖——pi 0.84.3 把那些修正（glm-5.3 等中国站模型、grok-4.6 的档位映射）收录进上游目录后，覆盖全部退役。现在它只干一件事：定义自定义模型 **GLM-5.3 Flash**——智谱新发的廉价档，上游目录还没跟上，先手工接入，给 pico 子代理当执行模型（见 [08-agents.md](08-agents.md)）。等上游目录收录后，这份定义同样可以退役。

## 自定义模型定义

```json
{
  "providers": {
    "zai-coding-cn": {
      "models": [
        {
          "id": "glm-5.3-flash",
          "name": "GLM-5.3 Flash",
          "api": "openai-completions",
          "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
          "reasoning": true,
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "low": "low",
            "medium": null,
            "high": "high",
            "xhigh": null,
            "max": "max"
          },
          "input": ["text", "image"],
          "contextWindow": 1000000,
          "maxTokens": 131072,
          "cost": {
            "input": 0.15,
            "output": 0.5,
            "cacheRead": 0.03,
            "cacheWrite": 0
          },
          "compat": {
            "supportsStore": false,
            "supportsDeveloperRole": false,
            "supportsReasoningEffort": true,
            "maxTokensField": "max_tokens",
            "thinkingFormat": "zai",
            "zaiToolStream": true
          }
        }
      ]
    }
  }
}
```

读法：

- `id` / `name` / `api` / `baseUrl`：模型标识、显示名、接入方式。GLM 的编码包走 OpenAI 兼容端点，`api: "openai-completions"` + `baseUrl` 两样就把新模型接进来——自定义模型的核心就是这三样。
- `reasoning` + `thinkingLevelMap`：声明这是思考模型，并把 pi 统一的七档（`off` 到 `max`）映射到它实际支持的档位。`null` = 该档位此模型不支持，选了会自动落到最近的支持档；glm-5.3-flash 与 glm-5.3 一样只支持 `low / high / max` 三档。
- `input` / `contextWindow` / `maxTokens`：输入模态（文本 + 图片）、百万上下文、输出上限。
- `cost`：每百万 token 的价格（美元），供成本估算用。
- `compat`：兼容开关。`thinkingFormat: "zai"` 让 pi 用智谱的思考格式传档位；`supportsStore` / `supportsDeveloperRole` 关掉对方不支持的字段，`zaiToolStream` 处理工具调用的流式返回。

模型名必须与供应商的定义一致（在 TUI 里 `/model` 可以看到完整列表）。改内置模型的行为用同一个 `providers.<供应商>` 键下的 `modelOverrides`；加全新模型用 `models` 数组——上面这份就是后者的实例。

## enabledModels：Ctrl+P 切换清单

```json
"enabledModels": [
  "deepseek/deepseek-v4-flash",       // 便宜快速
  "deepseek/deepseek-v4-pro",
  "fireworks/accounts/fireworks/models/qwen3p8-max",
  "kimi-coding/k3",
  "kimi-coding/k3-256k",              // 256K 长上下文版
  "kimi-coding/kimi-for-coding-highspeed",
  "openai-codex/gpt-5.6-sol",         // 高质搜索模型
  "xai/grok-4.6",
  "fireworks/accounts/fireworks/routers/kimi-k3-fast",
  "zai-coding-cn/glm-5.3",                     // 主力模型，默认
  "fireworks/accounts/fireworks/models/deepseek-v4-flash-0731",
  "openai-codex/gpt-5.6-luna",         // 廉价档：会话命名、剪枝摘要
  "zai-coding-cn/glm-5.3-flash"        // 廉价档：pico 子代理执行
]
```

只放进这个列表的模型会出现在 Ctrl+P 循环里；`/model` 里仍能手动选任何已接入模型。我保留的清单覆盖三档用途：

- **主力**：glm-5.3（百万上下文，性价比）
- **廉价档**：openai-codex/gpt-5.6-luna（会话命名、剪枝摘要）、glm-5.3-flash（pico 子代理）
- **高端备选**：gpt-5.6-sol、grok-4.6、deepseek-v4-pro、kimi k3 系列——长上下文或难任务时 `/model` 切换

## 自定义供应商

内置供应商列表见 [官方 providers.md](https://github.com/earendilw/pi/blob/main/docs/providers.md)。接 OpenAI 兼容网关时，在 `models.json` 的 `providers` 段定义 `baseUrl` + `api`，模型加在 `modelOverrides` 同一层级，格式详见 [官方 models.md](https://github.com/earendilw/pi/blob/main/docs/models.md)。
