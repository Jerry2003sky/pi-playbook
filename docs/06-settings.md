# settings.json 详解

pi 的全局设置。完整文件见 [`config/settings.json`](../config/settings.json)。

- **全局路径**：`~/.pi/agent/settings.json`
- **项目级覆盖**：`.pi/settings.json`（嵌套对象合并，项目值优先）
- 也可以进 TUI 后用 `/settings` 改常用项

pi 内建设置项的权威文档是 [官方 settings.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md)。本文件里的 `tokenSpeed` 和 `contextPrune` 两段由插件写入，参数手册见 [05-界面与观测.md](05-界面与观测.md)（pi-token-speed）和 [04-高阶阶段.md](04-高阶阶段.md)（pi-condense）。

## 基础外观

| 配置 | 值 | 含义 |
|------|----|------|
| `theme` | `"dark-classic"` | 本地自定义主题（pi 内置主题为 `system`、`dark`、`light`）；副本见 [`config/themes/dark-classic.json`](../config/themes/dark-classic.json)，使用时复制到 `~/.pi/agent/themes/`，来源说明见 [05-界面与观测.md](05-界面与观测.md) |
| `tuiMode` | `"fullscreen"` | 实验性全屏 TUI（常规为 `"regular"`），输出区占满终端 |
| `fullscreenScrollbar` | `"auto"` | 全屏转录区滚动条：滚动或指针悬停时临时显示（`"always"` 常驻、`"hidden"` 关闭） |
| `fullscreenCopyOnSelect` | `false` | 全屏模式下选中即复制；pi 内建默认 `true`，这份配置关掉 |
| `editorPaddingX` | `1` | 输入编辑器水平留白（0-3），1 档视觉上更舒服 |
| `lastChangelogVersion` | `"0.99.1"` | pi 内部记录已读 changelog 版本，别手动改 |

## 技能发现

```json
"enableSkillCommands": false,
"skills": ["-skills/guizang-ppt-skill/SKILL.md"]
```

pi 从 `~/.pi/agent/skills/`、`~/.agents/skills/`、包和项目目录自动发现技能；`skills` 数组是这层发现的增删覆盖。前缀有三种：`!<glob>` 通配排除、`+<path>` 精确强制包含、`-<path>` 精确强制排除。相对路径按各自的发现根目录解析——`~/.pi/agent/skills/` 的根是 `~/.pi/agent`，`~/.agents/skills/` 的根是 `~/.agents`。这里只有一条 `-`，命中的是 `~/.agents/skills/guizang-ppt-skill/SKILL.md`，只把它排除出发现范围，其余技能照常加载。

`enableSkillCommands` 控制技能命令是否出现在交互式命令发现（`/skill:<name>` 的补全与列表）里，默认 `true`，这份配置关掉；手动输入的 `/skill:<name>` 仍有效，技能本身也照常加入技能列表按需加载。

## 默认模型

```json
"defaultProvider": "openai-codex",
"defaultModel": "gpt-6.1-sol",
"defaultThinkingLevel": "max",
"modelThinkingLevels": {
  "openai-codex/gpt-6-astra": "high",
  "akile-gpt/gpt-6-astra": "medium",
  "zai-coding-cn/glm-5.3": "max",
  "kimi-coding/k3": "max",
  "kimi-coding/kimi-for-coding": "max",
  "openai-codex/gpt-6.1-sol": "high"
}
```

- `defaultProvider` + `defaultModel`：新会话默认使用的模型，会话内可用 `/model` 临时切换。当前主力是 GPT-6.1 Sol，走 openai-codex 订阅渠道（0.99.0 起界面里显示为 “OpenAI Codex (legacy)”）。它也在 `enabledModels` 清单内，启动选择优先采用这个默认值。
- `defaultThinkingLevel`：`max`，全局兜底思考档，只在模型没有专属条目时生效。
- `modelThinkingLevels`：按 `provider/modelId` 配置模型专属默认档位。新会话启动时，显式指定的档位优先，其后依次是**模型专属条目 > `defaultThinkingLevel` > pi 内置默认 `medium`**。按这份配置，GPT-6.1 Sol 与 openai-codex 渠道的 Astra 起步用 high，akile-gpt 渠道的 Astra 用 medium，GLM-5.3、K3 和 kimi-for-coding 用 max。最终档位还会按模型支持范围调整，映射规则见 [07-models.md](07-models.md)。
- `/model` 切换也优先用显式档位、模型专属条目和全局默认；三者均未设置时沿用当前会话档位。续接会话优先恢复会话记录。`/settings` 的 “Default thinking level per model” 编辑 `modelThinkingLevels`；`/thinking` 的手选调整当前档位，Ctrl+S 则保存 `defaultThinkingLevel`。

## 自动压缩

```json
"compaction": {
  "enabled": true
}
```

显式启用 pi 内建的自动会话压缩（内建默认也为 `true`）。它在上下文空间不足时触发，与 `contextPrune` 对旧工具输出做的逐批剪枝分工不同；剪枝参数见 [04-高阶阶段.md](04-高阶阶段.md)。pi 还提供 `compaction.reserveTokens`、`compaction.keepRecentTokens` 与按模型的 `compaction.modelOverrides`，这份配置只用 `enabled`。

## defaultTools

```json
"defaultTools": ["find", "grep", "bash", "read", "edit", "write", "ls"]
```

启动时激活的工具集合。纯名称列表替换 pi 的内建默认集（`read`、`bash`、`edit`、`write`），这份配置把 `find`、`grep`、`ls` 一并打开；`+name` 与 `-name` 条目在继承的选择上增减，`codemode`、`tool_search` 这类内建扩展工具也可以列名启用。`find`/`grep` 在列的原因：pi-fff 的 `override` 模式把这两个内置工具的实现换成 FFF，工具名与列表位置照旧，全局 AGENTS.md 的搜索纪律据此写，见 [09-agents-md.md](09-agents-md.md)。

## packages

10 个 npm 包，pi 启动时加载它们的扩展、技能和命令。按阶段分组介绍见 [02-基础阶段.md](02-基础阶段.md)、[03-进阶阶段.md](03-进阶阶段.md)、[04-高阶阶段.md](04-高阶阶段.md) 与 [05-界面与观测.md](05-界面与观测.md)：

```jsonc
"packages": [
  "npm:pi-web-access",              // 联网搜索与网页抓取
  "npm:pi-context-view",            // 上下文查看
  "npm:pi-cache-graph",             // 提示缓存可视化
  "npm:@ff-labs/pi-fff",            // FFF 极速搜索（override 接管内置 find/grep）
  "npm:pi-claude-code-ui",          // Claude Code 风格 UI
  "npm:@tintinweb/pi-subagents",    // 子代理管理
  "npm:pi-token-speed",             // token 速度显示
  "npm:pi-condense",                // 上下文剪枝（settings.json 的 contextPrune 段）
  "npm:pi-autoname",                // 会话自动命名
  "npm:@juicesharp/rpiv-ask-user-question"  // 结构化提问工具
]
```

安装方式：`pi install npm:<包名>@<版本>`（官方命令）或直接改 `packages` 数组后重启。

## enabledModels

Ctrl+P 循环切换的模型清单，也是启动选择的范围：新会话启动时，默认模型在清单内就用它，否则取清单第一个；`--model` 与续接会话不走这条规则。当前收录 10 个供应商 17 个模型，见 [07-models.md](07-models.md)。`/scoped-models` 可直接编辑并保存这份清单；`/model` 里 Ctrl+S 保存的清单外模型会被追加一条 `provider/id`。
