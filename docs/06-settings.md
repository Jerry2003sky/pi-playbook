# settings.json 详解

pi 的全局设置。完整文件见 [`config/settings.json`](../config/settings.json)。

- **全局路径**：`~/.pi/agent/settings.json`
- **项目级覆盖**：`.pi/settings.json`（嵌套对象合并，项目值优先）
- 也可以进 TUI 后用 `/settings` 改常用项

pi 内建设置项的权威文档是 [官方 settings.md](https://github.com/earendilw/pi/blob/main/docs/settings.md)。本文件里的 `tokenSpeed` 和 `contextPrune` 两段由插件写入，参数手册见 [05-界面与观测.md](05-界面与观测.md)（pi-token-speed）和 [04-高阶阶段.md](04-高阶阶段.md)（pi-condense）。

## 基础外观

| 配置 | 值 | 含义 |
|------|----|------|
| `theme` | `"dark"` | 深色主题 |
| `tuiMode` | `"fullscreen"` | 实验性全屏 TUI（常规为 `"regular"`），输出区占满终端 |
| `fullscreenScrollbar` | `"auto"` | 滚动时临时显示滚动条，仅在 fullscreen 模式生效 |
| `fullscreenCopyOnSelect` | `false` | 全屏模式下的选中即复制开关 |
| `enableSkillCommands` | `false` | 把技能暴露为斜杠命令的开关 |
| `editorPaddingX` | `1` | 输入编辑器水平留白（0-3），1 档视觉上更舒服 |
| `lastChangelogVersion` | — | pi 内部记录已读 changelog 版本，别手动改 |

## 默认模型

```json
"defaultProvider": "zai-coding-cn",
"defaultModel": "glm-5.3",
"defaultThinkingLevel": "xhigh"
```

- `defaultProvider` + `defaultModel`：每次启动 pi 时默认用的模型，会话内可用 `/model` 临时切换。主力是 GLM-5.3（智谱编程订阅，zai-coding-cn 供应商，与 pico 子代理用的 glm-5.3-flash 同门）。
- `defaultThinkingLevel`：`xhigh`，默认高档思考强度。模型 `thinkingLevelMap` 里缺的档位会自动落到最近的支持档；切到映射了 xhigh 的模型（如 Claude Fable 5.1）时按原档跑。

## defaultTools

```json
"defaultTools": ["find", "grep", "bash", "read", "edit", "write", "ls"]
```

默认激活的内置工具白名单，只管 pi 自己的内置工具。`find`/`grep` 也在列——pi-fff 的 `override` 模式把这两个内置工具的实现换成 FFF，工具名与白名单位置照旧，全局 AGENTS.md 的搜索纪律据此写，见 [09-agents-md.md](09-agents-md.md)。

## packages

10 个 npm 包，pi 启动时加载它们的扩展、技能和命令。按阶段分组介绍见 [02-基础阶段.md](02-基础阶段.md)、[03-进阶阶段.md](03-进阶阶段.md)、[04-高阶阶段.md](04-高阶阶段.md) 与 [05-界面与观测.md](05-界面与观测.md)：

```json
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

Ctrl+P 循环切换模型时出现的列表，见 [07-models.md](07-models.md)。
