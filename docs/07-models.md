# models.json 与模型接入

模型相关配置分两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商/模型的行为覆盖与自定义模型（本文件的主角） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | Ctrl+P 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **这份文件经历过两次换血。** 早期它放的是 thinkingLevelMap 覆盖——pi 0.84.3 把那些修正（glm-5.3 等中国站模型、grok-4.6 的档位映射）收录进上游目录后，覆盖全部退役；之后手工接入的 GLM-5.3 Flash 定义也被上游收录，同样退役。现在它只干一件事：定义三个自定义供应商，把聚合网关后面的模型接进 pi——zenmux 与 akile 两个渠道的 Claude Fable 5.1，以及 akile 的 GPT-5.3 Codex Spark（后者是剪枝摘要的廉价档，见 [04-高阶阶段.md](04-高阶阶段.md)）。

## 自定义供应商与模型定义

```json
{
  "providers": {
    "zenmux": {
      "baseUrl": "https://zenmux.ai/api/anthropic",
      "api": "anthropic-messages",
      "models": [
        {
          "id": "claude-fable-5-1:google-vertex",
          "name": "Claude Fable 5.1",
          "reasoning": true,
          "input": ["text", "image"],
          "contextWindow": 1000000,
          "maxTokens": 128000,
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "xhigh": "xhigh",
            "max": "max"
          },
          "compat": {
            "forceAdaptiveThinking": true,
            "supportsStrictTools": true
          },
          "cost": {
            "input": 10,
            "output": 50,
            "cacheRead": 0.25,
            "cacheWrite": 12.5
          }
        }
      ]
    },
    "akile-claude": {
      "baseUrl": "https://ai.akile.ai",
      "api": "anthropic-messages",
      "models": [
        {
          "id": "claude-fable-5-1",
          "name": "Claude Fable 5.1",
          "reasoning": true,
          "input": ["text", "image"],
          "contextWindow": 1000000,
          "maxTokens": 128000,
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "xhigh": "xhigh",
            "max": "max"
          },
          "compat": {
            "forceAdaptiveThinking": true,
            "supportsStrictTools": true
          },
          "cost": {
            "input": 1.78,
            "output": 8.87,
            "cacheRead": 0.045,
            "cacheWrite": 2.22
          }
        }
      ]
    },
    "akile-gpt": {
      "baseUrl": "https://ai.akile.ai/v1",
      "api": "openai-responses",
      "models": [
        {
          "id": "gpt-5.3-codex-spark",
          "name": "GPT-5.3 Codex Spark",
          "reasoning": true,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "low": "low",
            "medium": "medium",
            "high": "high",
            "xhigh": "xhigh",
            "max": null
          },
          "compat": {
            "supportsStrictMode": true,
            "supportsOpenAIGrammarTools": true
          },
          "cost": {
            "input": 0.078,
            "output": 0.62,
            "cacheRead": 0.0078,
            "cacheWrite": 0
          }
        }
      ]
    }
  }
}
```

读法：

- `baseUrl` / `api` / `id` / `name`：接入方式与模型标识。zenmux 和 akile-claude 走 Anthropic 消息格式（`anthropic-messages`），akile-gpt 走 OpenAI Responses（`openai-responses`）——供应商键名自取，模型加在该键下的 `models` 数组里。
- `reasoning` + `thinkingLevelMap`：声明这是思考模型，并把 pi 统一的七档（`off` 到 `max`）映射到它实际支持的档位。`null` = 该档位此模型不支持，选了会自动落到最近的支持档；Fable 5.1 只映射 `xhigh`/`max` 两档，Spark 映射 `low` 到 `xhigh`。
- `input` / `contextWindow` / `maxTokens`：输入模态、上下文窗口、输出上限。
- `cost`：每百万 token 的价格（美元），供成本估算用。同一个 Fable 5.1，akile 渠道的定价比 zenmux 低一个量级（输入 $1.78 对 $10），两个渠道都留在清单里，按需要切换。
- `compat`：兼容开关。`forceAdaptiveThinking` / `supportsStrictTools` 是 Anthropic 侧的开关，`supportsStrictMode` / `supportsOpenAIGrammarTools` 是 OpenAI 侧的，按渠道实际能力打开。

模型名必须与供应商的定义一致（在 TUI 里 `/model` 可以看到完整列表）。改内置模型的行为用同一个 `providers.<供应商>` 键下的 `modelOverrides`；加全新模型用 `models` 数组——上面这份就是后者的实例。

## enabledModels：Ctrl+P 切换清单

```json
"enabledModels": [
  "deepseek/deepseek-v4-flash",       // 便宜快速
  "deepseek/deepseek-v4-pro",
  "fireworks/accounts/fireworks/models/qwen3p8-max",
  "kimi-coding/k3",                   // Moonshot 编程订阅，百万上下文
  "kimi-coding/k3-256k",              // 256K 长上下文版
  "kimi-coding/kimi-for-coding-highspeed",
  "openai-codex/gpt-5.6-sol",         // 高质搜索模型
  "xai/grok-4.6",
  "fireworks/accounts/fireworks/routers/kimi-k3-fast",
  "zai-coding-cn/glm-5.3",            // 主力模型，默认
  "fireworks/accounts/fireworks/models/deepseek-v4-flash-0731",
  "openai-codex/gpt-5.6-luna",        // 廉价档：会话命名
  "zai-coding-cn/glm-5.3-flash",      // 廉价档：pico 子代理执行
  "zenmux/claude-fable-5-1:google-vertex",  // 高端：Claude Fable 5.1
  "akile-claude/claude-fable-5-1",    // 高端：Fable 5.1 的低价渠道
  "akile-gpt/gpt-5.3-codex-spark",    // 廉价档：剪枝摘要
  "openai-codex/gpt-6-astra"         // 高端：GPT-6 Astra，272K 上下文
]
```

只放进这个列表的模型会出现在 Ctrl+P 循环里；`/model` 里仍能手动选任何已接入模型。我保留的清单覆盖三档用途：

- **主力**：glm-5.3（智谱编程订阅，默认）
- **长上下文备选**：k3 / k3-256k（Moonshot 编程订阅，百万上下文）
- **廉价档**：openai-codex/gpt-5.6-luna（会话命名）、glm-5.3-flash（pico 子代理）、akile-gpt/gpt-5.3-codex-spark（剪枝摘要）
- **高端备选**：Claude Fable 5.1（zenmux / akile 双渠道）、gpt-6-astra（272K 上下文）、gpt-5.6-sol、grok-4.6、deepseek-v4-pro——长上下文或难任务时 `/model` 切换

## 自定义供应商

内置供应商列表见 [官方 providers.md](https://github.com/earendilw/pi/blob/main/docs/providers.md)。接 OpenAI 兼容网关时，在 `models.json` 的 `providers` 段定义 `baseUrl` + `api`，模型加在 `modelOverrides` 同一层级，格式详见 [官方 models.md](https://github.com/earendilw/pi/blob/main/docs/models.md)。上面文件里的 zenmux、akile-claude、akile-gpt 就是三个活例：两个 Anthropic 兼容端点，一个 OpenAI Responses 兼容端点。
