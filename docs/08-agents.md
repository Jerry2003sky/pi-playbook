# 子代理：pico.md

子代理（subagents）功能由 [`@tintinweb/pi-subagents`](https://github.com/tintinweb/pi-subagents) 提供——Claude Code 风格的自主子代理：`Agent` 工具派发，可前台/后台/并行运行，中途可 `steer_subagent` 干预，跑完可 `get_subagent_result` 取结果。

自定义代理定义在 Markdown 文件里（YAML frontmatter + 正文 system prompt）：

- 全局：`~/.pi/agent/agents/<name>.md`（本仓库的 [`config/agents/pico.md`](../config/agents/pico.md)）
- 项目：`.pi/agents/<name>.md`（项目级覆盖全局同名）

## pico.md 的 frontmatter

```yaml
---
description: Runs substantial, well-scoped tasks on a cheaper model and returns a concise summary, keeping raw output out of the parent's context. Good fits — repo-wide recon, independent implementation slices of a larger change, test authoring, long test/build runs, multi-source web research. Each call costs a minute or more (cold start, thinking, re-reading files), so the parent handles anything it can finish in a few tool calls itself — lookups, short Q&A, small edits and fixes. Give it a self-contained prompt; it sees nothing else.
display_name: Pico
model: deepseek/deepseek-flash
thinking: high
prompt_mode: replace
inherit_context: false
extensions: [pi-fff, pi-web-access]
skills: true
tools: find, grep, ls, bash, read, edit, write
---
```

| 字段 | 取值 | 含义 |
|------|------|------|
| `description` | 一段英文 | 出现在 `Agent` 工具的 `subagent_type` 描述里，主模型决定是否委派时读它。这里写明两件事：适合的活（仓库级调研、独立实现切片、写测试、长测试/构建、多源联网调研），以及每次调用至少一分钟的固定开销，让主模型把几次工具调用能完成的活留给自己。措辞与 AGENTS.md 的委托规则一致 |
| `display_name` | `Pico` | 界面上显示的名字 |
| `model` | `deepseek/deepseek-flash` | 子代理用的模型，DeepSeek 的执行档；接入与思考档位见 [07-models.md](07-models.md)。换模型时同步检查这里、models.json 和 settings.json 的 enabledModels |
| `thinking` | `high` | 思考档位直接决定子代理的返回速度。调研、机械编辑这类活用 high 足够；结果质量明显下滑时再调回 max |
| `prompt_mode` | `replace` | 正文整体替换默认 system prompt（`append` 是追加） |
| `inherit_context` | `false` | 不继承主会话历史——保持隔离，节省上下文 |
| `extensions` | 两个扩展 | 声明加载 pi-fff（搜索）和 pi-web-access（联网）；实际可用工具以子代理会话的加载、激活结果为准 |
| `skills` | `true` | 加载技能 |
| `tools` | 内置工具列表 | 七件基础工具（find/grep/ls/bash/read/edit/write）；扩展工具由 `extensions` 和 `ext:` 选择器控制，嵌套委托由 `allowed_subagents` 控制 |

两个设计要点：

1. **内置工具与扩展分开选择。** `tools` 列表覆盖子代理插件识别的全部七个内置工具，因此 `Agent` 工具描述将 pico 的工具显示为 `*`。`extensions` 声明加载 pi-fff 和 pi-web-access，`ext:<扩展>/<工具>` 可进一步筛选扩展工具。主会话通过 `override` 使用 FFF 版 `find` / `grep`；子代理会话还可能同时暴露 `fffind` / `ffgrep`。联网工具的可用性需要在实际子代理会话核对加载与激活结果。pico 省略 `allowed_subagents`，插件据此关闭嵌套委托。`bash` 仍具备删除、推送等能力；正文要求这些操作取得任务的显式授权，执行安全依赖代理遵守指令。
2. **模型分工。** 主模型（GPT-6.1 Sol）干推理和决策，DeepSeek Flash 干执行。委托任务的规格写清楚，执行档照着执行即可，主力模型的 token 留给决策。

## 正文 prompt 的设计

正文（system prompt）共五段，每段解决一个问题：

1. **自我包含**——“你看到的一切都在 prompt 里”。子代理看不到主会话历史，所以委托方必须写自包含的任务书；这一段让子代理知道缺信息时该“检查一下”还是“停下问”。
2. **云盘排除区**——子代理看不到全局 AGENTS.md，排除路径在正文里单独列一遍；任务涉及这些路径时报告冲突，由主会话处理。
3. **执行纪律**——上来就干；正文给出 find/grep 与 bash 的选择原则，实际工具名以当前会话暴露的工具为准，bash 侧 fd/rg 优先；读文件只读任务需要的区域，改动最小化；只做任务本身，范围外的改进写进报告留给主会话决定。
4. **返回契约**——最终消息先说结论、带 file:line、交代假设和遗留。后台完成通知提供预览，主代理可用 `get_subagent_result` 读取完整结果。
5. **大报告规则**——委托方在任务书里只给 slug，子代理自己取时间戳、拼路径写盘；没给 slug 且发现超过 ~50 行时自己起 slug。文件落在 `~/.pi/agent/reports/<时间戳>-<slug>.md`，最后消息只带 3-5 行结论 + 路径 + 节清单。这是关键设计：**大文件内容不进主会话上下文**，省主模型的 token。

## 与主会话的配合

这套配置的整体分工见 [09-agents-md.md](09-agents-md.md) 的“委托决策规则”：全局 AGENTS.md 规定了什么时候委托、什么时候自己做，pico.md 定义了被委托方怎么干活。两者是一对。
