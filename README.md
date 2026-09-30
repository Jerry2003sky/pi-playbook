# pi-playbook

一套 [pi](https://github.com/earendil-works/pi)（@earendil-works/pi-coding-agent）的**配置参考手册**。

这个仓库把一套日常在用的 pi 配置拆开来讲：每类配置解决什么问题，每个插件为什么装，每个参数管什么。配置来自作者本机，讲解写给所有想弄懂 pi 的人。

## 配置全貌

| 维度 | 内容 |
|------|------|
| **模型策略** | GPT-6.1 Sol 主力 + 廉价档做杂活，10 个供应商 17 个模型按场景切换 |
| **基础阶段**（2 个） | 联网搜索、会话命名——补 pi 本体最底层的能力缺口 |
| **进阶阶段**（4 个） | 搜索增强、上下文观察、缓存监控、结构化提问——效率与交互 |
| **高阶阶段**（2 个） | 子代理、上下文剪枝——架构级改造 |
| **界面与观测**（3 个） | 工具渲染美化、启动页头（本地定制）、速度仪表 |
| **自定义子代理** | `pico` 执行代理：便宜模型 + 自包含任务书 + 报告写盘 |
| **全局指令** | 委托决策规则、搜索纪律、云盘排除 |

整套配置可以浓缩成一句话：**贵的模型做决策，便宜的模型做执行；上下文能剪就剪，能写盘就写盘。**

## 阶段划分

插件分四类，依据是解决什么问题、改动 pi 有多深：

- **基础阶段**：补底层能力（联网、命名）。
- **进阶阶段**：提升效率与交互（搜索、观测、提问），各插件互不依赖。
- **高阶阶段**：架构级改造（子代理、剪枝），收益和代价都最大。
- **界面与观测**：单独一类，可在任意阶段安装，负责终端显示、输入框样式和运行指标。

分类思路详见 [docs/01-理念与路线.md](docs/01-理念与路线.md)。

## 文档导航

| 文档 | 内容 |
|------|------|
| [01-理念与路线](docs/01-理念与路线.md) | 三缺口、三条理念、阶段划分逻辑 |
| [02-基础阶段](docs/02-基础阶段.md) | 联网、会话命名（含阶段〇：装 pi、配模型） |
| [03-进阶阶段](docs/03-进阶阶段.md) | fff 搜索增强、上下文观察、缓存监控、结构化提问 |
| [04-高阶阶段](docs/04-高阶阶段.md) | 子代理、上下文剪枝 |
| [05-界面与观测](docs/05-界面与观测.md) | 工具渲染美化、启动页头（本地定制）、速度仪表、快捷键 |
| [06-settings](docs/06-settings.md) | settings.json 逐块注释 |
| [07-models](docs/07-models.md) | 模型、思考档位映射 |
| [08-agents](docs/08-agents.md) | pico 子代理设计 |
| [09-agents-md](docs/09-agents-md.md) | AGENTS.md 全局指令 |

## 目录结构

```
pi-playbook/
├── README.md                    # 你在这里
├── docs/                        # 讲解文档，见上方导航
├── plugins/
│   └── pi-claude-code-tui/      # 本地定制插件（完整源码 + 定制说明）
├── config/                      # 本机配置的脱敏副本
│   ├── settings.json            #   ~/.pi/agent/settings.json
│   ├── keybindings.json         #   ~/.pi/agent/keybindings.json（见 05）
│   ├── models.json              #   自定义供应商与模型接入（zenmux / akile 网关 + kimi-coding 模型覆盖，见 07）
│   ├── web-search.json          #   ~/.pi/agent/web-search.json
│   ├── pi-autoname.json         #   ~/.pi/agent/pi-autoname.json
│   ├── pi-fff.json              #   ~/.pi/agent/pi-fff.json（见 03）
│   ├── pi-claude-code-tui.json  #   ~/.pi/agent/pi-claude-code-tui.json（界面选择状态，见 05）
│   ├── agents/pico.md           #   ~/.pi/agent/agents/pico.md
│   ├── themes/dark-classic.json #   ~/.pi/agent/themes/dark-classic.json（自定义主题）
│   └── AGENTS.md                #   ~/.pi/agent/AGENTS.md
├── LICENSE
└── .gitignore
```

## 阅读方式

文档分两条线。主线是阶段文档（02–05），每个插件一节，依次讲它做什么、为什么装、我的配置、参数手册。支线（06–09）讲 pi 本体配置，以及我自己写的子代理和全局指令。

几点约定：

- `config/` 是本机配置的脱敏副本，文档里的“我的配置”与对应文件保持一致。
- 内容按 pi **0.99.1** 核对。
- 家目录统一写成 `~`；需要凭证的地方用环境变量名占位，按自己的环境设置。
- 安装命令标注本机已装的版本号；`settings.json` 的 `packages` 保持本机的无版本写法。
- 参数手册覆盖常用参数和相关行为，没写到的参数取插件默认值。

`settings.json` 当前选用自定义主题 `dark-classic`。套用这份配置前，先在仓库根目录安装主题：

```bash
mkdir -p ~/.pi/agent/themes
cp config/themes/dark-classic.json ~/.pi/agent/themes/
```

主题文件见 [`config/themes/dark-classic.json`](config/themes/dark-classic.json)，本地定制启动页头的安装步骤见 [`plugins/pi-claude-code-tui/INSTALL.md`](plugins/pi-claude-code-tui/INSTALL.md)。

`~/.agents/skills/` 下的外部技能在本机单独管理，本仓库只收录 `settings.json` 里的技能发现设置。`auth.json`、模型缓存、会话记录等运行数据都留在本机。

## 致谢

11 个插件中，10 个来自社区开发者，仓库地址列在各阶段文档每节开头；pi-claude-code-tui 是本地定制版，源码在 `plugins/` 目录。
