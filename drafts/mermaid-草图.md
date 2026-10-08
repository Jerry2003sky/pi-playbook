# Mermaid 草图（临时文件，合并前删除）

配色约定：蓝 = 主模型 / 决策，绿 = 廉价档 / 执行，灰 = 存储，琥珀 = 问题，红 = 代价。

## 1. README：核心理念

> 贵的模型做决策，便宜的模型做执行；上下文能剪就剪，能写盘就写盘。

```mermaid
flowchart LR
    M(["主模型<br/>GPT-6 Astra · GPT-6.1 Sol<br/><small>推理 · 架构 · 审阅</small>"])

    subgraph cheap ["执行档 · deepseek-flash"]
        P("pico 子代理")
        S("剪枝摘要")
        N("会话命名")
    end

    D[("本地磁盘")]

    M <-- 委托 / 只回摘要 --> P
    P -- 大报告 --> D
    M -- 历史工具输出 --> S
    M -- 会话内容 --> N

    classDef main fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef cheapN fill:#dcfce7,stroke:#22c55e,stroke-width:1.5px,color:#14532d
    classDef store fill:#f3f4f6,stroke:#9ca3af,color:#374151
    class M main
    class P,S,N cheapN
    class D store
    style cheap fill:none,stroke:#22c55e,stroke-dasharray:5 4
```

## 2. 01 理念与路线：缺口 → 阶段

```mermaid
flowchart LR
    G1("基本能力缺口<br/><small>不能联网 · 会话难找回</small>") --> S1("基础阶段<br/><small>联网 · 会话命名</small>")
    G2("体验与效率缺口<br/><small>搜索慢 · 消耗看不见 · 模型乱猜</small>") --> S2("进阶阶段<br/><small>搜索增强 · 上下文观察 · 缓存监控 · 结构化提问</small>")
    G3("架构缺口<br/><small>单模型 · 单上下文</small>") --> S3("高阶阶段 · 对 pi 改动最深<br/><small>子代理 · 上下文剪枝</small>")
    UI("界面与观测 · 任意阶段可装<br/><small>工具渲染 · 启动页头 · 速度仪表</small>")

    classDef gap fill:#fef3c7,stroke:#f59e0b,color:#78350f
    classDef s1 fill:#e0f2fe,stroke:#38bdf8,color:#0c4a6e
    classDef s2 fill:#bfdbfe,stroke:#3b82f6,color:#1e3a8a
    classDef s3 fill:#c7d2fe,stroke:#4f46e5,stroke-width:2px,color:#312e81
    classDef side fill:#f3f4f6,stroke:#9ca3af,stroke-dasharray:5 4,color:#374151
    class G1,G2,G3 gap
    class S1 s1
    class S2 s2
    class S3 s3
    class UI side
```

## 3. 06 pico：一次委托的流程

```mermaid
flowchart TB
    A(["主模型拿到任务"])
    A -- 几次工具调用就能做完 --> Self("主模型自己做")
    A -- 量大、范围明确 --> T("写自包含任务书<br/><small>可附 slug</small>")
    T --> P("pico 执行<br/><small>看不到主会话历史，只按任务书干活</small>")
    P -- 结果较短 --> R1("直接回结论<br/><small>file:line · 假设 · 未完成项</small>")
    P -- 给了 slug，或超过约 50 行 --> D[("报告写盘<br/><small>reports/时间戳-slug.md</small>")]
    D --> R2("只回 3–5 行结论<br/><small>+ 文件路径 + 章节列表</small>")
    R1 --> M(["主模型上下文只进摘要"])
    R2 --> M

    classDef main fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef cheapN fill:#dcfce7,stroke:#22c55e,stroke-width:1.5px,color:#14532d
    classDef store fill:#f3f4f6,stroke:#9ca3af,color:#374151
    class A,Self,T,M main
    class P,R1,R2 cheapN
    class D store
```

## 4. 04 pi-condense：剪枝怎么处理工具输出

```mermaid
flowchart TB
    A("已用过的工具输出<br/><small>读文件 · 跑命令 · 搜索结果</small>")
    A -- 受保护的工具 / 路径<br/>或批次不足 minBatchChars --> K("原样保留")
    A -- 其余批次 --> P("摘要模型压缩<br/><small>deepseek-flash</small>")
    P --> C("上下文只留简短 stub")
    P --> I[("原文归档<br/>会话本地索引")]
    I -. 需要时按引用取回 .-> C
    P -. 改动前缀 .-> X("代价：提示缓存被打断")

    classDef base fill:#f3f4f6,stroke:#9ca3af,color:#374151
    classDef keep fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    classDef cheapN fill:#dcfce7,stroke:#22c55e,stroke-width:1.5px,color:#14532d
    classDef cost fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    class A,I base
    class K,C keep
    class P cheapN
    class X cost
```

## 5. 01 / 04 整体架构（替换原来的字符画）

04 的版本多一个 SubagentWorkflow，01 的版本去掉它。

```mermaid
flowchart TB
    M(["主模型 · GPT-6.1 Sol"])

    M --> P("pico 子代理<br/><small>deepseek-flash · 机械执行、报告写盘</small>")
    M --> W("SubagentWorkflow<br/><small>需要时做批量脚本编排</small>")
    M --> Q("ask_user_question<br/><small>需求不明时弹结构化问卷</small>")
    M --> C("pi-condense 剪枝<br/><small>deepseek-flash 摘要</small>")

    C -. 观测 .-> O("观测仪表<br/><small>pi-context-view 占用图<br/>pi-cache-graph 命中率<br/>pi-token-speed 速度</small>")

    classDef main fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef cheapN fill:#dcfce7,stroke:#22c55e,stroke-width:1.5px,color:#14532d
    classDef tool fill:#f3f4f6,stroke:#9ca3af,color:#374151
    classDef watch fill:#fef3c7,stroke:#f59e0b,stroke-dasharray:5 4,color:#78350f
    class M main
    class P,C cheapN
    class W,Q tool
    class O watch
```
