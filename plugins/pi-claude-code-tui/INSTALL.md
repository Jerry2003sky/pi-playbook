# pi-claude-code-tui（本地定制版）

基于 [Phoobobo/pi-claude-code-tui](https://github.com/Phoobobo/pi-claude-code-tui) v0.1.13 的本地定制版，原包 MIT 协议（见 `LICENSE`）。

**功能**：给 pi 的 TUI 加上 Claude Code 风格启动页头（动画 π 徽标、当前模型/思考档位/工作目录、常用命令提示）+ Codex 风格全封闭圆角输入框（带 │ 侧边）。

## 本目录与上游的差异

以下定制均以 `LOCAL MODIFICATION` 注释标在源码里，升级上游时可对照保留：

| 改动 | 位置 | 效果 |
|------|------|------|
| 徽标单元格 `███` → `██` | `extensions/claude-code-startup.ts` | 徽标整体更窄更轻 |
| 标题/徽标颜色从主题 accent 改为固定灰白 `#EEEEEE` | 同上 | 页头观感更稳定，不随主题切换变色 |
| 提示分割线从“最大 22 字符”改为拉满右栏宽度减 1 | 同上 | 与左栏边距对齐 |
| 输入框从半开放边框（只有上下圆角边）改为全封闭圆角边框 | `extensions/render-utils.ts` | 两侧 │ 边线，新增 padOnly 辅助函数保证边框不截断编辑器行 |
| `/use-claude-code-tui` / `/use-default-tui` 的选择持久化到 `~/.pi/agent/pi-claude-code-tui.json` | `extensions/claude-code-startup.ts` | 重启后保持所选界面；上游为会话级切换，重启即回 |
| 移除输入框光标 restyle | 两个文件 | 保留 pi 原生反色光标 |

## 安装

```bash
# 1. 在仓库根目录执行：把本插件目录复制到 pi 的全局扩展目录
cp -r plugins/pi-claude-code-tui ~/.pi/agent/extensions/

# 2. 重启 pi，启动页即生效；或在会话内 /use-claude-code-tui 手动应用
pi
```

切换/还原：`/use-default-tui` 回 pi 原生界面；两个命令的选择都会持久化，重启后保持。

> 为什么不用 npm 安装：这个目录里有我的定制，npm 装的是上游原版。想要原版可以 `npm install pi-claude-code-tui` 后放到同一目录（注意保留本目录的定制 diff）。

## 状态文件

`~/.pi/agent/pi-claude-code-tui.json` 记录当前界面选择（`useDefault`），由插件在切换时写入、启动时读回；上游原版无此文件。除它之外无配置参数，装上即生效；其余定制需要改源码（如上表）。
