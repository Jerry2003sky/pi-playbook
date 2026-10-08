# models.json 与模型接入

模型相关的配置分在两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商/模型的行为覆盖与自定义模型（本文件的主角） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | Ctrl+P 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **models.json 只放本机需要的模型覆盖和自定义接入。** 目前有两类条目：一条针对内置 `kimi-coding` 的 `modelOverrides`，改 `kimi-for-coding` 的显示名、上下文窗口和思考档位；另外三条是自建供应商 `zenmux`、`akile-claude`、`akile-gpt` 下的模型定义——两个渠道的 Claude Fable 5.1，以及 GPT-6 Astra。

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

逐个字段看：

- **`baseUrl` / `api` / `id` / `name`**：接入地址、协议和模型标识。zenmux 和 akile-claude 用 Anthropic 消息格式（`anthropic-messages`），akile-gpt 用 OpenAI Responses（`openai-responses`）。供应商键名可以自己起；如果沿用内置 id（如 `kimi-coding`），`/login` 存的凭证和内置模型目录都能直接用，这时 `modelOverrides` 改内置条目，`models` 追加新条目。`id` 必须和供应商那边的模型名一致（`/model` 里能看到完整列表）。文件里不写 `apiKey`，凭证由 `/login` 存进 `auth.json`；非写不可时，用 `$ENV_VAR` 或 `!command` 取值，避免明文。
- **`reasoning` + `thinkingLevelMap`**：声明这是思考模型，并把 pi 统一的七档（`off` 到 `max`）对应到模型实际支持的档位。每个键有三种写法：
  - 写字符串：支持该档，字符串原样发给供应商；
  - 写 `null`：不支持，选中时先向上找最近的支持档，找不到再向下；
  - 不写：`off`–`high` 走 API 默认映射，`xhigh`/`max` 视为不支持。

  `modelOverrides` 里的映射和内置条目逐键合并，没写的键保留内置映射。具体到这份文件：两条 Fable 5.1 把 `off`/`minimal` 设为 `null`，显式映射 `xhigh`/`max`，`low`–`high` 不写、走 API 默认；GPT-6 Astra 把 `off`/`minimal` 设为 `null`，其余五档全部显式映射；kimi-for-coding 的覆盖关掉 `minimal`/`medium`/`xhigh`，保留 `max`，`off`/`low`/`high` 沿用内置映射（`off` 即关闭思考，`low`/`high` 原样下发）。
- **`input` / `contextWindow` / `maxTokens`**：输入模态、上下文窗口、输出上限。
- **`cost`**：每百万 token 的美元价格，用于成本估算。同样是 Fable 5.1，akile 渠道的配置价格更低（输入 $1.78 对 $10，约为 zenmux 的 18%）；两个渠道都留着，按需切换。kimi-for-coding 的覆盖没写 `cost`，沿用内置定价。
- **`compat`**：兼容开关，按渠道的实际能力打开。两条 Anthropic 侧的 Fable 5.1 开 `forceAdaptiveThinking` / `supportsStrictTools`，akile-gpt 的 GPT-6 Astra 开 `supportsStrictMode` / `supportsOpenAIGrammarTools`。DeepSeek 这类国产模型的兼容开关（`thinkingFormat: "deepseek"`、`maxTokensField: "max_tokens"` 等）上游目录已经内置，这里不必再写。

`deepseek/deepseek-flash` 直接用 pi 的供应商模型目录，之前放在这里的 DeepSeek 临时定义已经删掉。迁移到新机器时，先运行 `pi update --models` 刷新目录，完成对应供应商的 `/login`，再到 `/model` 里确认 `deepseek-flash` 和 `kimi-for-coding` 都能用——目录里没有的 id，`modelOverrides` 会直接忽略，覆盖也就不生效。

**改内置模型用 `modelOverrides`，加新模型用 `models`。**

- `modelOverrides` 按 id 匹配内置目录和扩展注册的模型，未知 id 忽略。字段逐项覆盖，`thinkingLevelMap` 逐键合并，不写 `cost` 就保留内置定价。`name` 用于 `/model` 搜索和切换提示，模型列表和页脚显示的仍是 `id`。这份文件给 `kimi-for-coding` 写了显示名 `Kimi K2.8 Preview` 和 `contextWindow: 1048576`，并关掉 `minimal`/`medium`/`xhigh` 三档。
- `models` 追加新条目，`id` 相同时覆盖内置定义。zenmux 和两个 akile 供应商用的就是它。

**换模型时要连带检查的地方。** `models.json` 只管接入。其余引用散在各处：

- `settings.json` 的 `modelThinkingLevels`：模型专属档位；若另设 `defaultProvider` / `defaultModel`，也要一起检查（本机未设置，见 [06-settings.md](06-settings.md)）；
- `settings.json` 的 `enabledModels`：Ctrl+P 清单；
- `pico.md` 的 `model`：子代理；
- `pi-autoname.json` 的 `model` / `fallbackModels`：会话命名；
- `contextPrune.summarizerModel`：剪枝摘要。

## enabledModels：Ctrl+P 切换清单

```jsonc
"enabledModels": [
  "openai-codex/gpt-6-astra",         // 当前新会话首选，启动档位 high
  "openai-codex/gpt-6.1-sol",         // 主力备选，启动档位 high
  "kimi-coding/k3",                  // Moonshot 编程订阅，百万上下文
  "kimi-coding/k3-256k",             // 256K 长上下文版
  "kimi-coding/kimi-for-coding",     // models.json 覆盖：K2.8 Preview，启动档位 max
  "xai/grok-4.7",
  "deepseek/deepseek-flash",         // 廉价档：pico、会话命名与剪枝摘要
  "deepseek/deepseek-v4-pro",
  "zai-coding-cn/glm-5.3",           // GLM 备选，启动档位 max
  "akile-gpt/gpt-6-astra",           // 同款备用渠道，启动档位 medium
  "akile-claude/claude-fable-5-1",   // Fable 5.1 的低价渠道
  "zenmux/claude-fable-5-1:google-vertex"  // Fable 5.1 备用渠道
]
```

Ctrl+P 只在这份清单里循环，启动时也从清单里挑模型：默认模型在清单里就用它，否则用第一个（`--model` 和续接会话除外）。条目格式和 `--models` 参数相同，支持精确 id、模糊匹配、不区分大小写的 glob，以及 `:<thinking>` 后缀；这里全部用精确 id。`/model` 默认只列清单内的模型，按 Tab 可切到全部；`/scoped-models` 可以直接编辑并保存清单。

这份清单包含 8 个供应商的 12 个模型。本机没有指定默认模型，所以普通新会话从第一项 GPT-6 Astra 起步；`--model` 和续接会话例外。按用途分：

- **主力**：openai-codex/gpt-6-astra 和 openai-codex/gpt-6.1-sol（`modelThinkingLevels` 均定 high），akile-gpt 渠道的 Astra 做备用（启动档位 medium）
- **长上下文备选**：k3 / k3-256k / kimi-for-coding（Moonshot 编程订阅；kimi-for-coding 在本地配置为百万上下文）
- **廉价档**：deepseek/deepseek-flash（pico 子代理、会话命名、剪枝摘要）
- **其他备选**：zai-coding-cn/glm-5.3、Claude Fable 5.1（zenmux / akile 双渠道）、grok-4.7、deepseek-v4-pro

`openai-codex/gpt-6-luna` 不在当前 Ctrl+P 清单里，但仍保留在 `pi-autoname.json` 的 `fallbackModels` 和 `modelThinkingLevels` 中。`enabledModels` 限制启动选择和循环切换，不是禁止清单外模型使用的权限列表。

## 自定义供应商

内置供应商列表见 [官方 providers.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)。接入兼容网关的步骤：在 `models.json` 的 `providers` 段定义 `baseUrl` 和 `api`，新模型写进 `models` 数组，要改内置模型就用 `modelOverrides`。完整格式见 [官方 models.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)。

对照上面的文件：zenmux 和 akile-claude 是 Anthropic 兼容端点，akile-gpt 是 OpenAI Responses 兼容端点，kimi-coding 是在内置供应商上覆盖一个模型。
