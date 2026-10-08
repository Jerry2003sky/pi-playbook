#!/usr/bin/env node
// 把 README.md 和 docs/*.md 里的全部 Mermaid 图汇总成一个本地网页，浅色、深色两种主题各渲染一遍，
// 用来在推送前检查语法错误和配色效果。网页从 jsdelivr 加载 mermaid，需要联网。
// 用法：node scripts/preview-mermaid.mjs（在仓库根目录运行），然后用浏览器打开它打印出的文件路径。
// 渲染出错的图会显示 “Syntax error”。GitHub 用的 Mermaid 版本可能不同，最终效果以 GitHub 页面为准。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const files = ["README.md", ...fs.readdirSync("docs").filter((f) => f.endsWith(".md")).sort().map((f) => `docs/${f}`)];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const blocks = [];
for (const f of files) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(/```mermaid\n([\s\S]*?)```/g)) blocks.push({ f, code: m[1] });
}

const column = (theme, bg, fg) =>
  `<div class="col" style="background:${bg};color:${fg}"><h2>${theme === "default" ? "浅色" : "深色"}</h2>` +
  blocks.map((b) => `<h3>${esc(b.f)}</h3><pre class="mermaid" data-theme="${theme}">${esc(b.code)}</pre>`).join("") +
  `</div>`;

const html = `<!doctype html><meta charset="utf-8"><title>Mermaid 预览</title>
<style>body{margin:0;display:flex;flex-wrap:wrap;font-family:-apple-system,sans-serif}.col{flex:1 1 480px;padding:16px}h3{font-size:13px;opacity:.7}</style>
${column("default", "#ffffff", "#1f2328")}${column("dark", "#0d1117", "#e6edf3")}
<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
for (const theme of ["default", "dark"]) {
  mermaid.initialize({ startOnLoad: false, theme });
  await mermaid.run({ nodes: document.querySelectorAll(\`pre[data-theme="\${theme}"]\`) });
}
</script>`;

const out = path.join(os.tmpdir(), "pi-playbook-mermaid-preview.html");
fs.writeFileSync(out, html);
console.log(`共 ${blocks.length} 张图，预览页面：${out}`);
