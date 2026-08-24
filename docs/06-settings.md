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
| `tuiMode` | `"regular"` | 常规 TUI；可选实验性 `"fullscreen"`（全屏模式） |
| `fullscreenScrollbar` | `"auto"` | 滚动时临时显示滚动条，仅在 fullscreen 模式生效 |
| `quietStartup` | `false` | 隐藏 pi 默认的启动横幅。之前配 pi-claude-code-tui 自定义启动头时设过 `true`（两者独立，互不影响），后来用回默认横幅，改回 `false` |
| `editorPaddingX` | `1` | 输入编辑器水平留白（0-3），1 档视觉上更舒服 |
| `lastChangelogVersion` | — | pi 内部记录已读 changelog 版本，别手动改 |

## 默认模型

```json
"defaultProvider": "zai-coding-cn",
"defaultModel": "glm-5.3",
"defaultThinkingLevel": "max"
```

- `defaultProvider` + `defaultModel`：每次启动 pi 时默认用的模型，会话内可用 `/model` 临时切换。主力是 GLM-5.3（智谱国内站，百万上下文，订阅制）。
- `defaultThinkingLevel`：`max` 表示默认拉满思考强度。七个档位从 `off` 到 `max`。选 `max` 的前提是模型支持（glm-5.3 支持 low/high/max 三档，选 max 落在最高档），追求质量而非速度。

## packages

10 个 npm 包，pi 启动时加载它们的扩展、技能和命令。按阶段分组介绍见 [02-基础阶段.md](02-基础阶段.md)、[03-进阶阶段.md](03-进阶阶段.md)、[04-高阶阶段.md](04-高阶阶段.md) 与 [05-界面与观测.md](05-界面与观测.md)：

```json
"packages": [
  "npm:pi-web-access",              // 联网搜索与网页抓取
  "npm:pi-context-view",            // 上下文查看
  "npm:pi-cache-graph",             // 提示缓存可视化
  "npm:@ff-labs/pi-fff",            // fffind / ffgrep 极速文件与内容搜索
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
