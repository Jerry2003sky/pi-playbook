#!/usr/bin/env node
// 检查 README.md 和 docs/*.md 里的本地链接：目标文件是否存在、#锚点是否对得上标题。
// 锚点按 GitHub 的规则生成：转小写，去掉标点（保留字母、数字、-、_、空格），空格换成 -，重名标题依次加 -1、-2。
// 用法：node scripts/check-links.mjs（在仓库根目录运行；有坏链接时退出码为 1）
import fs from "node:fs";
import path from "node:path";

const slug = (s) =>
  s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "").replace(/ /g, "-");
const stripCode = (t) => t.replace(/```[\s\S]*?```/g, "");

const files = ["README.md", ...fs.readdirSync("docs").filter((f) => f.endsWith(".md")).map((f) => `docs/${f}`)];

const anchors = {};
for (const f of files) {
  const seen = {};
  anchors[f] = [...stripCode(fs.readFileSync(f, "utf8")).matchAll(/^#{1,6} (.+)$/gm)].map((m) => {
    let s = slug(m[1].replace(/`/g, ""));
    if (s in seen) s = `${s}-${++seen[s]}`;
    else seen[s] = 0;
    return s;
  });
}

let checked = 0;
let bad = 0;
for (const f of files) {
  for (const m of stripCode(fs.readFileSync(f, "utf8")).matchAll(/\]\(([^)\s]+)\)/g)) {
    const url = m[1];
    if (/^(https?:|mailto:)/.test(url)) continue;
    checked++;
    const [p, a] = url.split("#");
    const target = p ? path.normalize(path.join(path.dirname(f), decodeURI(p))) : f;
    if (!fs.existsSync(target)) {
      console.log(`文件不存在  ${f}  →  ${url}`);
      bad++;
    } else if (a !== undefined && target.endsWith(".md") && !anchors[target]?.includes(decodeURI(a))) {
      console.log(`锚点不存在  ${f}  →  ${url}`);
      bad++;
    }
  }
}
console.log(`检查了 ${checked} 个本地链接，${bad} 个有问题`);
process.exit(bad ? 1 : 0);
