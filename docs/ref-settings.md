[pi-playbook](../README.md) › [参考](../README.md#参考) › **settings.json**

# settings.json 详解

`settings.json` 是 pi 的全局设置文件，完整脱敏副本见 [`config/settings.json`](../config/settings.json)。

- **全局路径**：`~/.pi/agent/settings.json`
- **项目级覆盖**：`.pi/settings.json`（嵌套对象逐层合并，项目值优先）
- 常用项可直接在 TUI 中通过 `/settings` 修改

内建设置项以 [官方 settings.md](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md) 为准。文件中的 `tokenSpeed` 和 `contextPrune` 两段属于插件配置，参数分别见 [05-界面与观测.md](05-界面与观测.md)（pi-token-speed）与 [04-高阶阶段.md](04-高阶阶段.md)（pi-condense）；顶层的 `groupToolCalls`、`terminalTheme` 属于 pi-claude-code-ui，同样见 [05-界面与观测.md](05-界面与观测.md)。本文逐块拆解其余本体设置。

## 基础外观

| 配置 | 值 | 含义 |
|------|----|------|
| `theme` | `"dark-classic"` | 本地自定义主题（pi 内置主题为 `system`、`dark`、`light`）；副本见 [`config/themes/dark-classic.json`](../config/themes/dark-classic.json)，使用时复制到 `~/.pi/agent/themes/`，来源说明见 [05-界面与观测.md](05-界面与观测.md) |
| `tuiMode` | `"fullscreen"` | TUI 渲染模式。<br>· `"fullscreen"`：pi 1.3.0 起默认的全屏 TUI，输出区占满终端<br>· `"regular"`：传统滚动模式 |
| `fullscreenScrollbar` | `"auto"` | 全屏转录区滚动条。<br>· `"auto"`：滚动或鼠标悬停时临时出现<br>· `"always"`：常驻<br>· `"hidden"`：隐藏 |
| `fullscreenCopyOnSelect` | `false` | 全屏模式下选中文字是否自动复制；pi 默认 `true`，本配置关闭 |
| `editorPaddingX` | `1` | 输入框水平留白（0–3），设为 `1` 视觉边距最舒适 |
| `lastChangelogVersion` | `"1.6.1"` | pi 自动记录的已读更新日志版本，无需手动维护 |
| `extensionChangelogVersions` | `{…}` | pi 自动记录的各扩展包已读更新日志版本，扩展升级后下次全新启动时据此展示新条目，无需手动维护 |

本机配置另含自动生成的设备标识 `deviceId`，不影响功能使用，脱敏副本已剔除。

## 技能发现

```json
"enableSkillCommands": false,
"skills": ["-skills/guizang-ppt-skill/SKILL.md"]
```

pi 会自动从 `~/.pi/agent/skills/`、`~/.agents/skills/`、已装包和项目目录扫描技能，`skills` 数组用于在此基础上微调增删，支持三种前缀：

- `!<glob>`：按通配符排除；
- `+<path>`：按精确路径强制包含；
- `-<path>`：按精确路径强制排除。

相对路径按各自的发现根目录解析：`~/.pi/agent/skills/` 的根是 `~/.pi/agent`，`~/.agents/skills/` 的根是 `~/.agents`。本机只写了一条 `-` 规则，精准排除 `~/.agents/skills/guizang-ppt-skill/SKILL.md`，其余技能照常加载。

`enableSkillCommands` 控制是否将技能命令暴露进交互式命令补全与列表（`/skill:<name>`）。默认值是 `true`，此处关掉以保持斜杠命令列表清爽；手动输入 `/skill:<name>` 仍然有效，技能本身也会正常进入技能清单并按需加载。

## 默认模型

```json
"defaultProvider": "openai-codex",
"defaultModel": "gpt-6.2-astra",
"defaultThinkingLevel": "high",
"modelThinkingLevels": {
  "akile-gpt/gpt-6-astra": "medium",
  "zai-coding-cn/glm-5.3": "max",
  "kimi-coding/k3": "max",
  "kimi-coding/kimi-for-coding": "max",
  "openai-codex/gpt-6.1-sol": "high",
  "openai-codex/gpt-6-astra": "high",
  "openai-codex/gpt-6-luna": "max",
  "deepseek/deepseek-flash": "max",
  "kimi-coding/k3-256k": "max"
}
```

- `defaultProvider: openai-codex`、`defaultModel: gpt-6.2-astra`：未通过 `--model` 指定且不续接旧会话时，默认从 `openai-codex/gpt-6.2-astra` 启动。会话内用 `/model` 临时切模型，按 <kbd>Ctrl</kbd>+<kbd>S</kbd> 可设为默认；若启用了 `enabledModels`，默认模型须在清单内才会优先选中。
- `defaultThinkingLevel`：`high`，全局兜底思考档位，仅作用于没有专属条目的模型。
- `modelThinkingLevels`：按 `provider/modelId` 指定模型专属默认档位。新会话启动时的决策优先级为：**显式指定 > 模型专属条目 > `defaultThinkingLevel` > pi 内置默认 `medium`**。按当前配置：GPT-6.1 Sol 与 openai-codex 渠道的 GPT-6 Astra 起步为 `high`，akile-gpt 渠道的 GPT-6 Astra 为 `medium`，GLM-5.3、K3、K3-256K、kimi-for-coding 和 deepseek-flash 为 `max`；GPT-6.2 Sol、GPT-6.2 Astra、K3.1 Pro 等没有专属条目的模型则由 `defaultThinkingLevel` 定为 `high`。Luna 同样记了 `max`，虽不在当前切换清单里，仍供会话命名失败回退等场景引用。最终下发档位会受模型自身支持范围裁剪，映射规则见 [ref-models.md](ref-models.md)。
- `/model` 切换模型时按同一优先级依次查找显式档位、模型专属条目和全局默认；三者皆无则沿用当前会话档位。续接旧会话时优先恢复会话记录里的档位。修改入口：`/settings` 中的 “Default thinking level per model” 可维护 `modelThinkingLevels`；`/thinking` 调整当前档位后按 <kbd>Ctrl</kbd>+<kbd>S</kbd> 可写回 `defaultThinkingLevel`。

## 自动压缩

```json
"compaction": {
  "enabled": true
}
```

显式保留 pi 内建自动压缩开启（默认值本就是 `true`）。未装上下文管理插件时，它在窗口快满时触发；接入 pi-clm 后，日常上下文整理交给模型自编辑，按阈值触发的原生压缩默认被 pi-clm 接管取消，仅保留请求溢出报错后的恢复压缩作为最后一道保险。`contextPrune` 的逐批剪枝目前处于关闭状态，两个插件的详细参数见 [04-高阶阶段.md](04-高阶阶段.md)。pi 另外提供 `compaction.reserveTokens`、`compaction.keepRecentTokens` 及按模型覆盖的 `compaction.modelOverrides`，本机仅配置了 `enabled`。

## 消息队列

```json
"steeringMode": "one-at-a-time"
```

agent 运行中途输入的引导消息（steering）会进入队列，待当前轮次工具调用结束后投递。`"one-at-a-time"` 每轮仅投递一条（也是 pi 默认值），`"all"` 则一次全部投递。同类的 `followUpMode` 控制 agent 完全结束后再处理的后续消息，此处保持未设。

## defaultTools

```json
"defaultTools": ["find", "grep", "read", "write", "edit", "bash", "ls", "codemode", "tool_search"]
```

定义启动时激活的工具集。直接列工具名会整体替换 pi 默认集（`read`、`bash`、`edit`、`write`）；写成 `+name` / `-name` 则是在默认集上增减。`codemode`、`tool_search` 这类内建扩展工具同样可按名启用。

本机额外启用了 `find`、`grep`、`ls`、`codemode` 与 `tool_search`：

- `codemode`：在 QuickJS 沙箱内批量编排工具调用、过滤输出，并可调用分类与图像模型。脚本不能直接访问本地文件系统或网络，但能经由工具和模型 API 触达外部服务——沙箱本身不收窄被调用工具的既有权限。
- `tool_search`：检索尚未向模型声明的延迟工具，并将命中项载入下一次请求的工具列表。
- `find` / `grep` 必须在列：pi-fff 的 `override` 模式正是把这两个工具的底层实现换成了 FFF，全局 AGENTS.md 的搜索纪律也完全建立在这点之上，见 [07-全局指令.md](07-全局指令.md)。

## packages

共 14 个包（12 个 npm 包、1 个 git 包、1 个本地路径），pi 启动时自动加载它们提供的扩展、技能与命令。各包详解按阶段分布在 [02](02-基础阶段.md)、[03](03-进阶阶段.md)、[04](04-高阶阶段.md)、[05](05-界面与观测.md)。第 15 个插件 `pi-claude-code-tui` 为本地扩展，安装时直接放进 `~/.pi/agent/extensions/`，不走此列表；本机目前未安装，源码保留在 `plugins/` 备用。

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
  "npm:@juicesharp/rpiv-ask-user-question",  // 结构化提问工具
  "git:github.com/DietrichGebert/ponytail",   // 精简改动的技能包
  "npm:@narumitw/pi-btw",                      // 旁路提问
  "~/Workplace/pi-clm",                        // 模型自己编辑上下文（本地检出的源码）
  "npm:pi-quote-blocks"                        // 引用回复
]
```

可通过 `pi install npm:<包名>@<版本>` 安装，或直接编辑 `packages` 数组后重启 pi。

## enabledModels

<kbd>Ctrl</kbd>+<kbd>P</kbd> 循环切换的模型白名单，同时也决定新会话的起始模型：默认模型在清单内就选它，否则取清单第一项（`--model` 与续接旧会话不受此限）。完整清单见 [ref-models.md](ref-models.md)。运行 `/scoped-models` 可交互编辑并保存清单；在 `/model` 里对清单外的模型按 <kbd>Ctrl</kbd>+<kbd>S</kbd>，也会自动把它的 `provider/id` 追加进来。

---

[返回目录](../README.md#参考)
