# models.json 与模型接入

模型相关配置分两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商/模型的行为覆盖（本文件的主角） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | Ctrl+P 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **这份文件已退役，保留作示例。** 它写于 pi 内置模型目录还没跟上新模型的时期。pi 0.84.3 把上面这些修正（glm-5.3 等中国站模型、grok-4.6 的档位映射）收录进了上游模型目录，本机已不再需要这份覆盖。新模型发布、上游目录设错档位时，仍按这个文件的写法在 `~/.pi/agent/models.json` 里覆盖。

## 思考等级映射（thinkingLevelMap）

pi 统一用七个思考档位：`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。但每个供应商对“思考强度”的支持不同：有的只支持三档，有的用 `reasoning_effort` 参数。`modelOverrides` 里的 `thinkingLevelMap` 把 pi 的七档映射到该模型实际支持的档位：

```json
{
  "providers": {
    "zai-coding-cn": {
      "modelOverrides": {
        "glm-5.3": {
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "low": "low",
            "medium": null,
            "high": "high",
            "xhigh": null,
            "max": "max"
          },
          "compat": { "supportsReasoningEffort": true }
        }
      }
    },
    "xai": {
      "modelOverrides": {
        "grok-4.6": {
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "low": "low",
            "medium": "medium",
            "high": "high",
            "xhigh": "xhigh"
          },
          "compat": { "supportsReasoningEffort": true }
        }
      }
    }
  }
}
```

读法：

- `null` = 该档位此模型不支持，选了会自动落到最近的支持档。
- glm-5.3 只支持 `low / high / max` 三档；grok-4.6 支持 `low` 到 `xhigh` 四档（没有 `max`）。
- `supportsReasoningEffort: true` 表示供应商接受 `reasoning_effort` 参数，pi 会直接透传档位值。

模型名必须与供应商的定义一致（在 TUI 里 `/model` 可以看到完整列表）。给自定义/私有供应商加模型时，`modelOverrides` 挂在同一个 `providers.<供应商>` 键下。

## enabledModels：Ctrl+P 切换清单

```json
"enabledModels": [
  "deepseek/deepseek-v4-flash",       // 便宜快速，fast 子代理专用
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
  "openai-codex/gpt-5.6-luna"             // 廉价档：会话命名、剪枝摘要
]
```

只放进这个列表的模型会出现在 Ctrl+P 循环里；`/model` 里仍能手动选任何已接入模型。我保留的清单覆盖三档用途：

- **主力**：glm-5.3（百万上下文，性价比）
- **廉价档**：openai-codex/gpt-5.6-luna（会话命名、剪枝摘要）、deepseek-v4-flash（fast 子代理）
- **高端备选**：gpt-5.6-sol、grok-4.6、deepseek-v4-pro、kimi k3 系列——长上下文或难任务时 `/model` 切换

## 自定义供应商

内置供应商列表见 [官方 providers.md](https://github.com/earendilw/pi/blob/main/docs/providers.md)。接 OpenAI 兼容网关时，在 `models.json` 的 `providers` 段定义 `baseUrl` + `api`，模型加在 `modelOverrides` 同一层级，格式详见 [官方 models.md](https://github.com/earendilw/pi/blob/main/docs/models.md)。
