# models.json 与模型接入

模型相关配置分两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商/模型的行为覆盖与自定义模型（本文件的主角） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | Ctrl+P 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **这份文件经历过两次换血。** 早期它放的是 thinkingLevelMap 覆盖——pi 0.84.3 把那些修正（glm-5.3 等中国站模型、grok-4.6 的档位映射）收录进上游目录后，覆盖全部退役；之后手工接入的 GLM-5.3 Flash 定义也被上游收录，同样退役。现在它定义四个供应商条目：zenmux 与 akile 两个渠道的 Claude Fable 5.1、akile 的 GPT-5.3 Codex Spark 与 GPT-6 Astra（Spark 是剪枝摘要的廉价档，见 [04-高阶阶段.md](04-高阶阶段.md)），以及 deepseek 供应商下的一条临时模型。

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
        },
        {
          "id": "gpt-6-astra",
          "name": "GPT-6 Astra",
          "reasoning": true,
          "input": ["text", "image"],
          "contextWindow": 1050000,
          "maxTokens": 128000,
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "low": "low",
            "medium": "medium",
            "high": "high",
            "xhigh": "xhigh",
            "max": "max"
          },
          "compat": {
            "supportsStrictMode": true,
            "supportsOpenAIGrammarTools": true
          },
          "cost": {
            "input": 0.443,
            "output": 2.215,
            "cacheRead": 0.0443,
            "cacheWrite": 0.554
          }
        }
      ]
    },
    "deepseek": {
      "baseUrl": "https://api.deepseek.com",
      "api": "openai-completions",
      "models": [
        {
          "reasoning": true,
          "compat": {
            "supportsStore": false,
            "supportsDeveloperRole": false,
            "maxTokensField": "max_tokens",
            "requiresReasoningContentOnAssistantMessages": true,
            "thinkingFormat": "deepseek"
          },
          "thinkingLevelMap": {
            "minimal": null,
            "low": "low",
            "medium": null,
            "high": "high",
            "max": "max"
          },
          "id": "deepseek-v4.1-flash-expires-on-0910",
          "name": "DeepSeek V4.1 Flash (Expires 0910)",
          "input": ["text", "image"],
          "contextWindow": 1048576,
          "maxTokens": 134144
        }
      ]
    }
  }
}
```

读法：

- `baseUrl` / `api` / `id` / `name`：接入方式与模型标识。zenmux 和 akile-claude 走 Anthropic 消息格式（`anthropic-messages`），akile-gpt 走 OpenAI Responses（`openai-responses`），deepseek 走 OpenAI 兼容的 Chat Completions（`openai-completions`）。供应商键名自取；沿用内置 id（如 `deepseek`）时，`/login deepseek` 的凭证和内置模型目录都直接可用，`models` 里的条目追加到该供应商。
- `reasoning` + `thinkingLevelMap`：声明这是思考模型，并把 pi 统一的七档（`off` 到 `max`）映射到它实际支持的档位。映射值是三态：写字符串 = 支持并原样下发给供应商；写 `null` = 不支持，选了会先向上取最近的支持档、再向下；键省略时，`off`–`high` 走供应商默认映射，`xhigh`/`max` 视为不支持。三个例子各自体现了这三种写法：Fable 5.1 把 `off`/`minimal` 标 `null`、`xhigh`/`max` 显式映射，`low`–`high` 省略走供应商默认；Spark 把 `max` 标 `null`、`low`–`xhigh` 显式；DeepSeek 那条把 `minimal`/`medium` 标 `null`、`low`/`high`/`max` 显式。
- `input` / `contextWindow` / `maxTokens`：输入模态、上下文窗口、输出上限。
- `cost`：每百万 token 的价格（美元），供成本估算用。同一个 Fable 5.1，akile 渠道的定价比 zenmux 低一个量级（输入 $1.78 对 $10），两个渠道都留在清单里，按需要切换；DeepSeek 那条没写 `cost`。
- `compat`：兼容开关。`forceAdaptiveThinking` / `supportsStrictTools` 是 Anthropic 侧的，`supportsStrictMode` / `supportsOpenAIGrammarTools` 是 OpenAI 侧的；DeepSeek 条目用的是 OpenAI 兼容侧的一组：`supportsStore: false`、`supportsDeveloperRole: false`、`maxTokensField: "max_tokens"`、`requiresReasoningContentOnAssistantMessages: true`、`thinkingFormat: "deepseek"`，按渠道实际能力打开。

**DeepSeek 那条是临时定义。** 模型 ID 自带 `expires-on-0910` 到期标注；它不在 pi 内置目录里，所以由 `models.json` 手工接入。临近标注日期时应确认可用性；换模型时同步更新 `models.json` 的模型定义、`settings.json` 的 `enabledModels`，以及 `pico` 的 `model`（见 [08-agents.md](08-agents.md)）。

模型名必须与供应商的定义一致（在 TUI 里 `/model` 可以看到完整列表）。改内置模型的行为用同一个 `providers.<供应商>` 键下的 `modelOverrides`；加全新模型用 `models` 数组——上面这份里 zenmux/akile 用的就是后者，deepseek 段则是给内置 provider 追加一条自定义模型（内置模型保留，同 `id` 的条目会覆盖内置定义）。

## enabledModels：Ctrl+P 切换清单

```json
"enabledModels": [
  "deepseek/deepseek-v4-flash",       // 便宜快速
  "deepseek/deepseek-v4-pro",
  "fireworks/accounts/fireworks/models/qwen3p8-max",
  "kimi-coding/k3",                   // Moonshot 编程订阅，百万上下文
  "kimi-coding/k3-256k",              // 256K 长上下文版
  "kimi-coding/kimi-for-coding-highspeed",
  "openai-codex/gpt-5.6-sol",         // 高端：Sol，启动档位 high
  "xai/grok-4.6",
  "fireworks/accounts/fireworks/routers/kimi-k3-fast",
  "zai-coding-cn/glm-5.3",            // GLM 备选，启动档位 max
  "fireworks/accounts/fireworks/models/deepseek-v4-flash-0731",
  "openai-codex/gpt-5.6-luna",        // 廉价档：会话命名
  "zai-coding-cn/glm-5.3-flash",      // 廉价档备选
  "zenmux/claude-fable-5-1:google-vertex",  // 高端：Claude Fable 5.1
  "akile-claude/claude-fable-5-1",    // 高端：Fable 5.1 的低价渠道
  "akile-gpt/gpt-5.3-codex-spark",    // 廉价档：剪枝摘要
  "openai-codex/gpt-6-astra",        // 当前默认：GPT-6 Astra，启动档位 medium
  "akile-gpt/gpt-6-astra",            // 同款备用渠道：GPT-6 Astra
  "cerebras/qwen-3.8-27b",
  "deepseek/deepseek-v4.1-flash-expires-on-0910"  // 临时模型：pico 子代理执行，ID 标注 0910 到期
]
```

只放进这个列表的模型会出现在 Ctrl+P 循环里；`/model` 里仍能手动选任何已接入模型。这份清单覆盖 10 个供应商 20 个模型，按用途分：

- **主力**：openai-codex/gpt-6-astra（默认；`modelThinkingLevels` 定 medium），akile-gpt 渠道同款备用
- **长上下文备选**：k3 / k3-256k（Moonshot 编程订阅，百万上下文）
- **廉价档**：openai-codex/gpt-5.6-luna（会话命名）、deepseek/deepseek-v4.1-flash-expires-on-0910（pico 子代理，临时模型）、akile-gpt/gpt-5.3-codex-spark（剪枝摘要）
- **其他备选**：cerebras/qwen-3.8-27b、zai-coding-cn/glm-5.3-flash
- **高端备选**：Claude Fable 5.1（zenmux / akile 双渠道）、gpt-6-astra（百万级上下文）、gpt-5.6-sol、grok-4.6、deepseek-v4-pro——长上下文或难任务时 `/model` 切换

## 自定义供应商

内置供应商列表见 [官方 providers.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)。接 OpenAI 兼容网关时，在 `models.json` 的 `providers` 段定义 `baseUrl` + `api`，新模型写进 `models` 数组，覆盖内置模型行为用 `modelOverrides`，格式详见 [官方 models.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)。上面文件里的 zenmux 与 akile-claude 是 Anthropic 兼容端点，akile-gpt 是 OpenAI Responses 兼容端点，deepseek 则是给内置 provider 追加一条临时模型。
