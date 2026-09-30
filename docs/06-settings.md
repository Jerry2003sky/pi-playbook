# settings.json 详解

`settings.json` 是 pi 的全局设置，完整文件见 [`config/settings.json`](../config/settings.json)。

- **全局路径**：`~/.pi/agent/settings.json`
- **项目级覆盖**：`.pi/settings.json`（嵌套对象逐层合并，项目值优先）
- 常用项也可以在 TUI 里用 `/settings` 修改

内建设置项以 [官方 settings.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md) 为准。文件里的 `tokenSpeed` 和 `contextPrune` 两段属于插件，参数分别见 [05-界面与观测.md](05-界面与观测.md)（pi-token-speed）和 [04-高阶阶段.md](04-高阶阶段.md)（pi-condense）。本文逐块讲其余部分。

## 基础外观

| 配置 | 值 | 含义 |
|------|----|------|
| `theme` | `"dark-classic"` | 本地自定义主题（pi 内置主题为 `system`、`dark`、`light`）；副本见 [`config/themes/dark-classic.json`](../config/themes/dark-classic.json)，使用时复制到 `~/.pi/agent/themes/`，来源说明见 [05-界面与观测.md](05-界面与观测.md) |
| `tuiMode` | `"fullscreen"` | 实验性全屏 TUI（常规为 `"regular"`），输出区占满终端 |
| `fullscreenScrollbar` | `"auto"` | 全屏转录区滚动条：滚动或指针悬停时临时显示（`"always"` 常驻、`"hidden"` 关闭） |
| `fullscreenCopyOnSelect` | `false` | 全屏模式下选中即复制；pi 内建默认 `true`，这份配置关掉 |
| `editorPaddingX` | `1` | 输入框水平留白（0–3），1 看起来最舒服 |
| `lastChangelogVersion` | `"0.99.1"` | pi 自动记录的已读 changelog 版本，不用手动改 |

## 技能发现

```json
"enableSkillCommands": false,
"skills": ["-skills/guizang-ppt-skill/SKILL.md"]
```

pi 会自动从 `~/.pi/agent/skills/`、`~/.agents/skills/`、已装的包和项目目录发现技能，`skills` 数组用来在此基础上增删。前缀有三种：

- `!<glob>`：按通配符排除；
- `+<path>`：按精确路径强制包含；
- `-<path>`：按精确路径强制排除。

相对路径按各自的发现根目录解析：`~/.pi/agent/skills/` 的根是 `~/.pi/agent`，`~/.agents/skills/` 的根是 `~/.agents`。这里只有一条 `-` 规则，指向 `~/.agents/skills/guizang-ppt-skill/SKILL.md`，把这一个技能排除在外，其余照常加载。

`enableSkillCommands` 决定技能命令是否出现在交互式命令发现里（`/skill:<name>` 的补全和列表）。默认 `true`，这里关掉了。手动输入 `/skill:<name>` 依然有效，技能本身也照常进入技能列表、按需加载。

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

- `defaultProvider` + `defaultModel`：新会话的默认模型，会话内可用 `/model` 临时切换。当前主力是 GPT-6.1 Sol，走 openai-codex 订阅渠道（0.99.0 起界面显示为 “OpenAI Codex (legacy)”）。它也在 `enabledModels` 清单里，所以启动时会直接选中它。
- `defaultThinkingLevel`：`max`，全局兜底档位，只对没有专属条目的模型生效。
- `modelThinkingLevels`：按 `provider/modelId` 给模型设默认档位。新会话启动时的优先级是：**显式指定 > 模型专属条目 > `defaultThinkingLevel` > pi 内置默认 `medium`**。按这份配置，GPT-6.1 Sol 和 openai-codex 渠道的 Astra 起步用 high，akile-gpt 渠道的 Astra 用 medium，GLM-5.3、K3、kimi-for-coding 用 max。最终档位还会按模型实际支持的范围调整，映射规则见 [07-models.md](07-models.md)。
- `/model` 切换时同样依次看显式档位、模型专属条目、全局默认；三者都没有，就沿用当前会话的档位。续接旧会话时，优先恢复会话记录里的档位。修改入口：`/settings` 里的 “Default thinking level per model” 编辑 `modelThinkingLevels`；`/thinking` 手动调整当前档位，按 Ctrl+S 保存为 `defaultThinkingLevel`。

## 自动压缩

```json
"compaction": {
  "enabled": true
}
```

显式开启 pi 内建的自动压缩（默认值本来就是 `true`）。它在上下文快满时触发，作为最后一道保险；日常的上下文控制交给 `contextPrune` 逐批剪枝旧工具输出，参数见 [04-高阶阶段.md](04-高阶阶段.md)。pi 还提供 `compaction.reserveTokens`、`compaction.keepRecentTokens` 和按模型设置的 `compaction.modelOverrides`，这里只用了 `enabled`。

## defaultTools

```json
"defaultTools": ["find", "grep", "bash", "read", "edit", "write", "ls"]
```

启动时激活的工具。只写工具名时，这份列表整体替换 pi 的内建默认集（`read`、`bash`、`edit`、`write`）；写成 `+name` / `-name` 则在默认集上增减。`codemode`、`tool_search` 这类内建扩展工具也可以按名字启用。

这里额外打开了 `find`、`grep`、`ls`。`find`/`grep` 必须在列：pi-fff 的 `override` 模式把这两个工具的实现换成了 FFF，名字不变，全局 AGENTS.md 的搜索纪律正是基于这一点写的，见 [09-agents-md.md](09-agents-md.md)。

## packages

10 个 npm 包，pi 启动时加载它们提供的扩展、技能和命令。各包的介绍按阶段分布在 [02](02-基础阶段.md)、[03](03-进阶阶段.md)、[04](04-高阶阶段.md)、[05](05-界面与观测.md)。第 11 个插件 pi-claude-code-tui 是本地扩展，放在 `~/.pi/agent/extensions/`，不在这个列表里。

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

安装方式有两种：`pi install npm:<包名>@<版本>`，或者直接编辑 `packages` 数组后重启 pi。

## enabledModels

Ctrl+P 循环切换的模型清单，同时决定启动时选哪个模型：默认模型在清单里就用它，否则用清单第一个（`--model` 和续接会话不受此规则约束）。当前收录 10 个供应商的 17 个模型，详见 [07-models.md](07-models.md)。`/scoped-models` 可以直接编辑并保存清单；在 `/model` 里对清单外的模型按 Ctrl+S，会把它的 `provider/id` 追加进来。
