# models.json 与模型接入

模型相关配置分两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商/模型的行为覆盖与自定义模型（本文件的主角） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | Ctrl+P 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **这份文件保存本机需要的模型覆盖与自定义接入。** 当前文件分两类条目：给内置 `kimi-coding` 的一条 `modelOverrides`，覆盖 `kimi-for-coding` 的显示名、上下文窗口与档位；以及 `zenmux`、`akile-claude`、`akile-gpt` 三个自建供应商下的四条模型定义——Claude Fable 5.1 两个渠道、GPT-5.3 Codex Spark、GPT-6 Astra。

## 自定义供应商与模型定义

```json
{
  "providers": {
    "kimi-coding": {
      "modelOverrides": {
        "kimi-for-coding": {
          "name": "Kimi K2.8 Preview",
          "contextWindow": 1048576,
          "thinkingLevelMap": {
            "minimal": null,
            "medium": null,
            "xhigh": null,
            "max": "max"
          }
        }
      }
    },
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
    }
  }
}
```

读法：

- `baseUrl` / `api` / `id` / `name`：接入方式与模型标识。zenmux 与 akile-claude 走 Anthropic 消息格式（`anthropic-messages`），akile-gpt 走 OpenAI Responses（`openai-responses`）。供应商键名自取；沿用内置 id（如 `kimi-coding`）时，`/login` 的凭证和内置模型目录直接可用，同一键下的 `modelOverrides` 改内置条目、`models` 追加新条目。`id` 必须与供应商侧的模型名一致（`/model` 里能看到完整列表）。文件里不写 `apiKey`，凭证由 `/login` 存到 `auth.json`；确实需要写在文件里时用 `$ENV_VAR` 或 `!command` 取值，不落明文。
- `reasoning` + `thinkingLevelMap`：声明这是思考模型，并把 pi 统一的七档（`off` 到 `max`）映射到它实际支持的档位。映射值是三态：写字符串 = 支持并原样下发给供应商；写 `null` = 不支持，选中后先向上取最近的支持档、再向下；键省略时，`off`–`high` 走供应商默认映射，`xhigh`/`max` 视为不支持。三个例子各自体现了这三种写法：Fable 5.1 把 `off`/`minimal` 标 `null`、`xhigh`/`max` 显式映射，`low`–`high` 省略走供应商默认；Spark 把 `max` 标 `null`、`low`–`xhigh` 显式；kimi-for-coding 的覆盖把 `minimal`/`medium`/`xhigh` 标 `null`、`max` 显式映射，`off`/`low`/`high` 省略走供应商默认。
- `input` / `contextWindow` / `maxTokens`：输入模态、上下文窗口、输出上限。
- `cost`：每百万 token 的价格（美元），供成本估算用。同一个 Fable 5.1，akile 渠道的定价比 zenmux 低一个量级（输入 $1.78 对 $10），两个渠道都留在清单里，按需要切换；kimi-for-coding 的覆盖不写 `cost`，沿用内置定价。
- `compat`：兼容开关。`forceAdaptiveThinking` / `supportsStrictTools` 用于 Anthropic 侧的两条 Fable 5.1，`supportsStrictMode` / `supportsOpenAIGrammarTools` 用于 akile-gpt 的两条，按渠道实际能力打开。DeepSeek 一类的国产兼容开关（`thinkingFormat: "deepseek"`、`maxTokensField: "max_tokens"` 等）已在上游目录里，不再写进本文件。

`deepseek/deepseek-flash` 使用 pi 的供应商模型目录，本文件中的 DeepSeek 临时定义已移除。迁移到另一台机器时，先运行 `pi update --models` 刷新目录，并完成对应供应商的 `/login`，再用 `/model` 确认 `deepseek-flash` 和 `kimi-for-coding` 可用；未知 id 的 `modelOverrides` 会被忽略。

**改内置模型用 `modelOverrides`，加全新模型用 `models`。** `modelOverrides` 按 id 匹配内置目录和扩展注册的模型，未知 id 忽略；`name` 只影响模型匹配和详情文字，列表与页脚仍显示 id；不写 `cost` 时保留内置定价。`kimi-for-coding` 的覆盖将上下文窗口设为 1048576，并显式关掉 `minimal`/`medium`/`xhigh` 三档。`models` 追加新条目，同 `id` 时覆盖内置定义——上面这份里 zenmux 与两个 akile 供应商用的是 `models`。

**换模型时的联动配置。** `models.json` 管模型接入；`settings.json` 的 `defaultProvider` / `defaultModel` 与 `modelThinkingLevels` 管默认模型和档位（见 [06-settings.md](06-settings.md)），`enabledModels` 管 Ctrl+P 清单。子代理、命名、剪枝分别使用 `pico.md` 的 `model`、`pi-autoname.json` 的 `model` / `fallbackModels`、`contextPrune.summarizerModel`。换模型时一起检查这些引用。

## enabledModels：Ctrl+P 切换清单

```jsonc
"enabledModels": [
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
  "openai-codex/gpt-5.6-luna",        // 廉价档：会话命名回退
  "zai-coding-cn/glm-5.3-flash",      // 廉价档备选
  "zenmux/claude-fable-5-1:google-vertex",  // 高端：Claude Fable 5.1
  "akile-claude/claude-fable-5-1",    // 高端：Fable 5.1 的低价渠道
  "akile-gpt/gpt-5.3-codex-spark",    // 廉价档备选
  "openai-codex/gpt-6-astra",        // 当前默认：GPT-6 Astra，启动档位 medium
  "akile-gpt/gpt-6-astra",            // 同款备用渠道，启动档位 medium
  "cerebras/qwen-3.8-27b",
  "kimi-coding/kimi-for-coding",      // models.json 覆盖：K2.8 Preview，启动档位 max
  "deepseek/deepseek-flash"           // 廉价档：pico、会话命名与剪枝摘要
]
```

只放进这个列表的模型会出现在 Ctrl+P 循环里；`/model` 里仍能手动选任何已接入模型。这份清单覆盖 10 个供应商 20 个模型，按用途分：

- **主力**：openai-codex/gpt-6-astra（默认；`modelThinkingLevels` 定 medium），akile-gpt 渠道同款备用
- **长上下文备选**：k3 / k3-256k / kimi-for-coding（Moonshot 编程订阅；kimi-for-coding 在本地配置为百万上下文）
- **廉价档**：openai-codex/gpt-5.6-luna（会话命名回退）、deepseek/deepseek-flash（pico 子代理、会话命名与剪枝摘要）、akile-gpt/gpt-5.3-codex-spark
- **其他备选**：cerebras/qwen-3.8-27b、zai-coding-cn/glm-5.3-flash
- **高端备选**：Claude Fable 5.1（zenmux / akile 双渠道）、gpt-6-astra（百万级上下文）、gpt-5.6-sol、grok-4.6、deepseek-v4-pro——长上下文或难任务时 `/model` 切换

## 自定义供应商

内置供应商列表见 [官方 providers.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)。接 OpenAI 兼容网关时，在 `models.json` 的 `providers` 段定义 `baseUrl` + `api`，新模型写进 `models` 数组，覆盖内置模型行为用 `modelOverrides`，格式详见 [官方 models.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)。上面文件里的 zenmux 与 akile-claude 是 Anthropic 兼容端点，akile-gpt 是 OpenAI Responses 兼容端点，kimi-coding 则是给内置 provider 覆盖一条模型。
