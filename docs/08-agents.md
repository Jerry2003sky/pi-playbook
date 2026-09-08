# 子代理：pico.md

子代理（subagents）功能由 [`@tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents) 提供——Claude Code 风格的自主子代理：`Agent` 工具派发，可前台/后台/并行运行，中途可 `steer_subagent` 干预，跑完可 `get_subagent_result` 取结果。

自定义代理定义在 Markdown 文件里（YAML frontmatter + 正文 system prompt）：

- 全局：`~/.pi/agent/agents/<name>.md`（本仓库的 [`config/agents/pico.md`](../config/agents/pico.md)）
- 项目：`.pi/agents/<name>.md`（项目级覆盖全局同名）

## pico.md 的 frontmatter

```yaml
---
description: Executes substantial, well-scoped tasks selected for delegation by the parent. Best suited to independent parallel work or large bounded investigations with concise results. Routine lookups, short Q&A, and small edits stay with the parent. Much cheaper than the main model and keeps raw output out of the main context. Give it a self-contained prompt; it sees nothing else.
display_name: Pico
model: deepseek/deepseek-v4.1-flash-expires-on-0910
thinking: max
prompt_mode: replace
inherit_context: false
extensions: [pi-fff, pi-web-access]
skills: true
tools: find, grep, ls, bash, read, edit, write
---
```

| 字段 | 取值 | 含义 |
|------|------|------|
| `description` | 一段英文 | 出现在 `Agent` 工具的 `subagent_type` 描述里，主模型选型时读它；这里把范围收窄到“父代理挑出来的大块任务”——适合独立并行工作或结果简洁的大范围调查，常规查找、短问答和小改留在主会话 |
| `display_name` | `Pico` | 界面上显示的名字 |
| `model` | `deepseek/deepseek-v4.1-flash-expires-on-0910` | 子代理用的模型，DeepSeek 的执行档，由 `models.json` 给内置 deepseek provider 追加（见 [07-models.md](07-models.md)）；ID 带 0910 到期标注，换模型时同步更新这里、models.json 和 settings.json 的 enabledModels |
| `thinking` | `max` | 执行档模型成本低，思考强度拉满也划算，效果显著好于低档 |
| `prompt_mode` | `replace` | 正文整体替换默认 system prompt（`append` 是追加） |
| `inherit_context` | `false` | 不继承主会话历史——保持隔离，节省上下文 |
| `extensions` | 两个扩展 | 给子代理配工具扩展：fff（搜索）、web-access（联网） |
| `skills` | `true` | 加载技能 |
| `tools` | 白名单 | 七件基础工具（find/grep/ls/bash/read/edit/write），防套娃无 `Agent`——控制子代理的能力边界 |

两个设计要点：

1. **工具白名单限定可用工具。** 这份配置列出文件工具与 `bash`；pi-fff 的 `override` 模式提供 FFF 版 `find`/`grep`，与全局搜索纪律一致（见 [09-agents-md.md](09-agents-md.md)）。`bash` 仍具备删除、推送等能力；正文要求这些操作取得任务的显式授权，执行安全依赖代理遵守指令。嵌套委托由子代理插件的权限设置控制。
2. **模型分工。** 主模型（GPT-6 Astra）干推理和决策，DeepSeek V4.1 Flash 干执行。委托任务的规格写清楚，执行档照着执行即可，主力模型的 token 留给决策。

## 正文 prompt 的设计

正文（system prompt）共四段，每段解决一个问题：

1. **自我包含**——“你看到的一切都在 prompt 里”。子代理看不到主会话历史，所以委托方必须写自包含的任务书；这一段让子代理知道缺信息时该“检查一下”还是“停下问”。
2. **执行纪律**——上来就干；搜索在内置 find/grep（FFF 实现）与 bash 之间自选，bash 侧 fd/rg 优先；读文件只读任务需要的区域，改动最小化。
3. **返回契约**——最后一条消息是委托方唯一能看到的东西：先说结论、带 file:line、交代假设和遗留。
4. **大报告规则**——委托方在任务书里给 slug（不带时间戳），子代理自己补时间戳前缀写盘；没给路径且发现超过 ~50 行时自己起 slug。文件落在 `~/.pi/agent/reports/<时间戳>-<slug>.md`，最后消息只带 3-5 行结论 + 路径 + 节清单。这是关键设计：**大文件内容不进主会话上下文**，省主模型的 token。

## 与主会话的配合

这套配置的整体分工见 [09-agents-md.md](09-agents-md.md) 的“委托决策规则”：全局 AGENTS.md 规定了什么时候委托、什么时候自己做，pico.md 定义了被委托方怎么干活。两者是一对。
