[pi-playbook](../README.md) › [参考](../README.md#参考) › **models.json**

# models.json 与模型接入

模型相关配置拆在两处：

| 文件 | 职责 |
|------|------|
| `~/.pi/agent/models.json` | 供应商 / 模型的行为覆盖与自定义模型定义（本文重点） |
| `~/.pi/agent/settings.json` 的 `enabledModels` | <kbd>Ctrl</kbd>+<kbd>P</kbd> 循环切换的模型清单 |

完整文件见 [`config/models.json`](../config/models.json)。

> **`models.json` 只写本机确需覆盖或额外接入的条目。** 当前包含两部分：一是对内置 `kimi-coding` 的 `modelOverrides`，用来修正 `kimi-for-coding` 的显示名、上下文窗口与思考档位；二是在自建供应商 `zenmux`、`akile-claude`、`akile-gpt` 下声明的三个自定义模型——zenmux 的 Claude Fable 5.1、akile 的 Claude Fable 5.2，以及 GPT-6 Astra。

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
          "id": "claude-fable-5-2",
          "name": "Claude Fable 5.2",
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
            "input": 1.4304,
            "output": 7.152,
            "cacheRead": 0.03576,
            "cacheWrite": 1.788
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

逐字段说明：

- **`baseUrl` / `api` / `id` / `name`**：分别指定接入地址、协议和模型标识。`zenmux` 与 `akile-claude` 走 Anthropic 消息协议（`anthropic-messages`），`akile-gpt` 走 OpenAI Responses（`openai-responses`）。供应商键名可自由命名；若沿用内置 ID（如 `kimi-coding`），则直接复用 `/login` 凭证和内置模型目录，其中 `modelOverrides` 用来改写内置条目，`models` 用来追加新条目。`id` 必须与上游接口模型名严格一致（可在 `/model` 中查看完整列表）。文件里不写 `apiKey`，凭证交由 `/login` 存入 `auth.json`；确需写在文件内时应采用 `$ENV_VAR` 或 `!command`，杜绝明文。
- **`reasoning` + `thinkingLevelMap`**：声明推理模型，并将 pi 统一的七个思考档位（`off` 到 `max`）映射到上游实际支持的档位。每个键有三种写法：
  - 字符串：支持该档，原样下发给上游；
  - `null`：不支持，选中时优先向上取最近的支持档，找不到再向下；
  - 省略：`off`–`high` 走协议默认映射，`xhigh` / `max` 视为不支持。

  `modelOverrides` 中的映射与内置条目逐键合并，未写的键保留内置规则。落实到本文件：两条 Fable 禁用 `off` / `minimal`，显式开启 `xhigh` / `max`，`low`–`high` 省略以走协议默认；GPT-6 Astra 禁用 `off` / `minimal`，其余五档全部显式映射；`kimi-for-coding` 的覆盖关掉 `minimal` / `medium` / `xhigh` 并保留 `max`，`off` / `low` / `high` 沿用内置映射（`off` 即关闭思考，`low` / `high` 原样下发）。
- **`input` / `contextWindow` / `maxTokens`**：输入模态、上下文窗口与单次输出上限。
- **`cost`**：每百万 token 美元单价，供费用估算使用。akile 渠道的 Fable 5.2 配置单价远低于 zenmux 的 Fable 5.1（输入 $1.4304 对 $10，约 14%），两个渠道并存便于按需切换；`kimi-for-coding` 未覆盖 `cost`，沿用内置定价。
- **`compat`**：按渠道实际能力开启的兼容开关。Anthropic 侧两条 Fable 开启 `forceAdaptiveThinking` 与 `supportsStrictTools`，akile-gpt 的 GPT-6 Astra 开启 `supportsStrictMode` 与 `supportsOpenAIGrammarTools`。DeepSeek 等国产模型的兼容参数（如 `thinkingFormat: "deepseek"`、`maxTokensField: "max_tokens"`）上游目录已经内置，不必重复声明。

`deepseek/deepseek-flash` 直接走 pi 内置供应商目录，早期手写的 DeepSeek 临时定义已移除。迁移到新机器时，先跑一次 `pi update --models` 刷新模型目录、完成各供应商的 `/login`，再到 `/model` 确认 `deepseek-flash` 和 `kimi-for-coding` 均已就绪——目录中不存在的 id 会被 `modelOverrides` 直接忽略，覆盖自然不会生效。

**改内置模型用 `modelOverrides`，加新模型用 `models`。**

- `modelOverrides` 按 id 匹配内置目录及扩展注册的模型，未知 id 静默忽略。各字段逐项覆盖，`thinkingLevelMap` 逐键合并，省略 `cost` 即保留内置定价。`name` 用于 `/model` 搜索与切换提示，列表和页脚展示的仍是 `id`。本文件为 `kimi-for-coding` 覆盖了显示名 `Kimi K2.8 Preview` 与 `contextWindow: 1048576`，并禁用 `minimal` / `medium` / `xhigh` 三档。
- `models` 用于追加新定义，若 `id` 与内置条目重复则整条替换。`zenmux` 与两个 akile 供应商用的都是这一写法。

**换模型时要连带核对的位置。** `models.json` 只负责接入，其余引用分散在五处：

- `settings.json` 的 `modelThinkingLevels`：模型专属思考档位；若同时调整了 `defaultProvider` / `defaultModel`，也须一并检查（见 [ref-settings.md](ref-settings.md)）；
- `settings.json` 的 `enabledModels`：<kbd>Ctrl</kbd>+<kbd>P</kbd> 切换清单；
- `pico.md` 的 `model`：执行子代理；
- `pi-autoname.json` 的 `model` / `fallbackModels`：会话命名；
- `contextPrune.summarizerModel`：剪枝摘要模型。

## enabledModels：Ctrl+P 切换清单

```jsonc
"enabledModels": [
  "openai-codex/gpt-6.2-sol",        // 500K 上下文，由 defaultThinkingLevel 定为 high
  "openai-codex/gpt-6.2-astra",      // 默认模型，由 defaultThinkingLevel 定为 high
  "kimi-coding/k3.1-pro",            // 百万上下文，由 defaultThinkingLevel 定为 high
  "kimi-coding/k3",                  // Moonshot 编程订阅，百万上下文
  "kimi-coding/k3-256k",             // 256K 长上下文版
  "kimi-coding/kimi-for-coding",     // models.json 覆盖：K2.8 Preview，启动档位 max
  "xai/grok-4.7",
  "deepseek/deepseek-flash",         // 廉价档：pico、会话命名与剪枝摘要
  "deepseek/deepseek-v4-pro",
  "akile-gpt/gpt-6-astra",           // GPT-6 Astra 备用渠道，启动档位 medium
  "zenmux/claude-fable-5-1:google-vertex",  // Fable 5.1
  "akile-claude/claude-fable-5-2",          // Fable 5.2 的低价渠道
  "google/gemini-4-neon",
  "google/gemini-4-carbon",
  "google/gemini-4-hydrogen",
  "google/gemini-4-argon"
]
```

<kbd>Ctrl</kbd>+<kbd>P</kbd> 只在这份清单内循环，新会话启动时同样从中挑选模型：默认模型在列就选它，否则取清单第一项（`--model` 与续接会话除外）。条目语法同 `--models`，支持精确 id、模糊匹配、不区分大小写的 glob 及 `:<thinking>` 后缀；本配置统一写精确 id。`/model` 默认只展示清单内模型，按 Tab 可切到全部；运行 `/scoped-models` 可直接编辑并保存清单。

当前默认模型为 `openai-codex/gpt-6.2-astra`，已列入清单，因此普通新会话均从它起步。主力模型会随新版本持续更替，没有固定的主次之分，以下只按来源与分工归类：

- **GPT 系列**：`openai-codex/gpt-6.2-sol`、`openai-codex/gpt-6.2-astra`（均由 `defaultThinkingLevel` 定为 high），另留 `akile-gpt` 渠道的 GPT-6 Astra 作备用（启动档位 medium）
- **Kimi（Moonshot 编程订阅）**：`k3.1-pro`（无专属档位，由 `defaultThinkingLevel` 定为 high），以及 `k3` / `k3-256k` / `kimi-for-coding`（`kimi-for-coding` 在本地覆盖为百万上下文）
- **Gemini 系列**：`google/gemini-4-neon`、`google/gemini-4-carbon`、`google/gemini-4-hydrogen`、`google/gemini-4-argon`（均为百万上下文，由 `defaultThinkingLevel` 定为 high）
- **廉价档**：`deepseek/deepseek-flash`（承担 pico 子代理、会话命名与剪枝摘要）
- **其他备选**：Claude Fable 5.1（zenmux）、Claude Fable 5.2（akile）、`grok-4.7`、`deepseek-v4-pro`

`openai-codex/gpt-6-luna` 不在当前 <kbd>Ctrl</kbd>+<kbd>P</kbd> 清单中，但仍保留在 `pi-autoname.json` 的 `fallbackModels` 和 `modelThinkingLevels` 里。`enabledModels` 只约束启动挑选与循环切换，并非禁止调用清单外模型的权限边界。

## 自定义供应商

内置供应商全表见 [官方 providers.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)。接入兼容网关的做法很直接：在 `models.json` 的 `providers` 段声明 `baseUrl` 与 `api`，新模型写进 `models` 数组，修改内置模型则用 `modelOverrides`，完整字段规范见 [官方 models.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)。

对照上文配置：`zenmux` 与 `akile-claude` 属于 Anthropic 兼容端点，`akile-gpt` 属于 OpenAI Responses 兼容端点，`kimi-coding` 则是在内置供应商之上覆盖单个模型。

---

[返回目录](../README.md#参考)
