# 子代理：pico.md

子代理（subagents）功能由 [`@tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents) 提供——Claude Code 风格的自主子代理：`Agent` 工具派发，可前台/后台/并行运行，中途可 `steer_subagent` 干预，跑完可 `get_subagent_result` 取结果。

自定义代理定义在 Markdown 文件里（YAML frontmatter + 正文 system prompt）：

- 全局：`~/.pi/agent/agents/<name>.md`（本仓库的 [`config/agents/pico.md`](../config/agents/pico.md)）
- 项目：`.pi/agents/<name>.md`（项目级覆盖全局同名）

## pico.md 的 frontmatter

```yaml
---
description: Default delegation target for well-specified work — codebase recon, packaged search/read errands, implementation from a clear spec, mechanical edits, tests, review passes, bulky-output commands, web research. Much cheaper than the main model and keeps raw output out of the main context. Give it a self-contained prompt; it sees nothing else.
display_name: Pico
model: zai-coding-cn/glm-5.3-flash
thinking: max
prompt_mode: replace
inherit_context: false
extensions: [pi-fff, pi-web-access]
skills: true
tools: read, ls, bash, edit, write
---
```

| 字段 | 取值 | 含义 |
|------|------|------|
| `description` | 一段英文 | 出现在 `Agent` 工具的 `subagent_type` 描述里，主模型选型时读它；要写清楚**适合什么任务** |
| `display_name` | `Pico` | 界面上显示的名字 |
| `model` | `zai-coding-cn/glm-5.3-flash` | 子代理用的模型。选最便宜的 flash 档，自定义接入方式见 [07-models.md](07-models.md)——子代理干的活用不着主力模型 |
| `thinking` | `max` | flash 便宜，思考强度拉满也划算，效果显著好于低档 |
| `prompt_mode` | `replace` | 正文整体替换默认 system prompt（`append` 是追加） |
| `inherit_context` | `false` | 不继承主会话历史——保持隔离，节省上下文 |
| `extensions` | 两个扩展 | 给子代理配工具扩展：fff（搜索）、web-access（联网） |
| `skills` | `true` | 加载技能 |
| `tools` | 白名单 | 只给基础工具，**没有 `Agent` 和网络之外的重量级工具**——控制子代理的能力边界 |

两个设计要点：

1. **工具白名单是权限边界。** 子代理没有 `Agent` 工具（不让它再套娃），也没有删除类危险操作的空间；白名单只管内置工具，搜索由 pi-fff 扩展接管——override 模式下 `grep`/`find` 就是 FFF 实现，与全局搜索纪律一致（见 [09-agents-md.md](09-agents-md.md)）；正文里又加了一条“禁止 rm -rf / git push 等破坏性操作”的双保险。
2. **模型分工。** 主模型（k3）干推理和决策，flash 干执行。委托任务的规格写清楚，flash 照着执行即可，每 token 成本差好几倍。

## 正文 prompt 的设计

正文（system prompt）共四段，每段解决一个问题：

1. **自我包含**——“你看到的一切都在 prompt 里”。子代理看不到主会话历史，所以委托方必须写自包含的任务书；这一段让子代理知道缺信息时该“检查一下”还是“停下问”。
2. **执行纪律**——上来就干，用 FFF 驱动的 grep/find 做搜索，读文件只读任务需要的区域，改动最小化。
3. **返回契约**——最后一条消息是委托方唯一能看到的东西：先说结论、带 file:line、交代假设和遗留。
4. **大报告规则**——委托方在任务书里给 slug（不带时间戳），子代理自己补时间戳前缀写盘；没给路径且发现超过 ~50 行时自己起 slug。文件落在 `~/.pi/agent/reports/<时间戳>-<slug>.md`，最后消息只带 3-5 行结论 + 路径 + 节清单。这是关键设计：**大文件内容不进主会话上下文**，省主模型的 token。

## 与主会话的配合

这套配置的整体分工见 [09-agents-md.md](09-agents-md.md) 的“委托决策规则”：全局 AGENTS.md 规定了什么时候委托、什么时候自己做，pico.md 定义了被委托方怎么干活。两者是一对。
