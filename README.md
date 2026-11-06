# Manjusaka - 牛屎虾


<div align="center">

![Rust](https://img.shields.io/badge/Rust-1.85%2B-orange?logo=rust)
![License](https://img.shields.io/badge/License-GPL--3.0-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)

**高性能 · 高安全 · 全平台 · 开源免费**

### 📈 Star 历史曲线

![GitHub stars](https://img.shields.io/github/stars/ydhcui/manjusaka?style=social)
![GitHub forks](https://img.shields.io/github/forks/ydhcui/manjusaka?style=social)

[![Star History Chart](https://api.star-history.com/svg?repos=ydhcui/manjusaka&type=Date)](https://star-history.com/#ydhcui/manjusaka&Date)

</div>


## 牛屎虾

https://github.com/ydhcui/manjusaka

Manjusaka（牛屎虾）——基于 Rust 的全平台远程管理平台，以 **AI 决策与执行分离**架构为核心：AI 仅负责分析与规划，执行端在远端运行，避免 AI 直接操作本地环境。实现全平台支持、插件生态与趣味交互的完美融合。

### ✨ 特性

- 🦀 **纯血 Rust**：极致性能，极致安全，拒绝历史包袱
- 🌐 **全平台制霸**：Windows、Linux、macOS 通吃，甚至能在树莓派上跑
- 🔥 **AI决策分离**：AI 只动脑，不动手，再也不怕"龙虾"清空你的本机文件
- 🚀 **分段加载**：先上线再装逼，npc1 轻量级，npc2 全功能，按需加载
- 🖥️ **虚拟桌面**：远程桌面不仅看得见，还能摸得着（VNC 模式）
- 🗄️ **文件管理**：分块传输、断点续传，大文件传输稳如老狗
- 🕳️ **隧道玩法**：端口转发、SOCKS5 代理，内网穿透玩出花
- 🤖 **QQ智能助手**：在 QQ 上直接让 AI 帮你内网渗透，摸鱼渗透两不误
- 🧩 **插件生态**：支持 BOF、Net、EXE 等插件，想加啥功能就加啥，插件文档自动同步为 AI 技能
- 💬 **AI聊天**：基于 adk-rust 框架，通过聊天的方式进行渗透，危险操作弹窗确认
- 🔐 **多协议传输**：npc1 支持 HTTP / S3 对象存储信箱（OSS/MinIO 中转，不直接建连），npc2 支持 TCP/KCP/WebSocket，另有 SSH 原生直连；传输层 trait 化，可扩展 icmp、mqtt 等
- 🐚 **原生 SSH 连接**：无需在目标安装 Agent，直接 SSH 协议接管终端/SFTP/代理
- 🔌 **内置 MCP**：14 个 nps_* 工具内置在 nps 服务中（HTTP JSON-RPC + 令牌鉴权），Claude / Cursor 直接接入，无需独立网关
- 🗝️ **数据库加密**：SQLCipher 全库加密，密钥随机派生

---

## 🏗️ 架构设计

```mermaid
flowchart TD
    subgraph Server["管理服务器 (NPS)"]
        WebAPI["Web API + WebSocket<br/>Poem + OpenAPI :33000"]
        McpEnd["内置 MCP 端点 /mcp<br/>JSON-RPC 2.0 + 令牌"]
        AgentMgr["Agent 状态管理<br/>AppState + SQLCipher"]
        AIBot["AI 渗透<br/>adk-rust + Skills + Memory"]
        Bots["机器人<br/>QQ / TG / 企微 / 钉钉 / 飞书"]
    end

    subgraph Agents["客户端"]
        NPC1["NPC1<br/>HTTP :31000 / S3 信箱"]
        NPC2["NPC2<br/>全功能 Agent<br/>终端/VNC/SFTP/SOCKS5"]
        SSH["SSH 原生连接<br/>russh 持久会话"]
    end

    OSS["S3 兼容对象存储<br/>（OSS / MinIO，可选）"]

    subgraph Frontend["前端 (NPU)"]
        SPA["Vue3 SPA<br/>Element Plus + xterm + noVNC"]
    end

    subgraph AIClients["AI 客户端"]
        Claude["Claude Desktop / Cursor"]
    end

    SPA -->|"HTTPS + WebSocket"| WebAPI
    Claude -->|"HTTP JSON-RPC + Bearer"| McpEnd
    WebAPI --> AgentMgr
    AgentMgr <-->|"Noise + Yamux"| NPC2
    AgentMgr <-->|"HTTP API"| NPC1
    AgentMgr <-->|"russh + direct-tcpip"| SSH
    NPC1 <-->|"轮询读写信箱对象"| OSS
    AgentMgr <-->|"服务端 3s 轮询"| OSS
    Bots --> AIBot
    AIBot -->|"RPC / SSH exec"| NPC2
```

### Workspace 结构

```
manjusaka/
├── Cargo.toml              # Workspace 根配置
├── build.ps1               # 一键编译脚本（Windows + WSL Linux/macOS）
├── docker-deploy.sh        # Docker 一键部署脚本
├── nps/                    # 管理服务器（控制端）
│   ├── src/
│   │   ├── main.rs         # 启动入口（getopts：--scheme http|https）
│   │   ├── core/           # 核心逻辑（状态/SSH/SRDI/数据库密钥）
│   │   ├── models/         # SeaORM 数据模型（SQLCipher）
│   │   ├── npc/            # 客户端管理（npc1 传输 trait: http/s3 + npc2）
│   │   ├── npu/            # Web API + WebSocket + 内置 MCP 端点
│   │   ├── ops/            # 统一工具层（16 个 nps_*，AI 渗透与 MCP 共享）
│   │   ├── aibot/          # AI 渗透（adk-rust 工具/技能/记忆/确认）
│   │   ├── bots/           # 机器人（QQ/TG/企微/钉钉/飞书/Webhook）
│   │   └── protos/         # Protobuf 协议
├── npc1/                   # 轻量客户端（HTTP 直连 / S3 信箱信标）
├── npc2/                   # 增强客户端（全功能 Agent）
├── stub/                   # NPC2 独立可执行拼接加载器
├── npu/                    # Vue3 前端
├── protos/                 # Protobuf 定义（workspace 共享）
├── libs/                   # 共享库
│   ├── transport/          # 传输层抽象（HTTP/S3/ICMP + TCP/KCP/WS）
│   ├── noise/              # Noise 协议加密
│   ├── crypto/             # AES-GCM 加密
│   ├── utils/              # 通用工具
│   ├── coffee/             # BOF 加载器
│   ├── memexec/            # 内存 PE 加载
│   ├── rustclr/            # .NET CLR 托管
│   ├── conpty/             # Windows 伪终端
│   ├── enigo/              # 跨平台输入模拟
│   ├── rustvncserver/      # VNC 服务器
│   └── clipboard/          # 剪贴板重定向
├── license/                # 授权生成器源码（产物复制到 scripts/）
├── scripts/                # 运维工具（license_gen / migratedb 迁移）
├── payloads/               # 预编译植入物
├── plugins/                # 插件库（运行时填充）
├── skills/                 # AI 技能 + 插件技能（运行时填充）
├── certs/                  # TLS 证书
└── data/                   # 数据目录
```

### 技术栈

- **编程语言**: Rust
- **Web 框架**: Poem + Poem-OpenAPI
- **数据库**: SQLite + SQLCipher 全库加密（通过 SeaORM）
- **AI 框架**: adk-rust（adk-core + adk-model openai）
- **异步运行时**: Tokio
- **序列化**: Protocol Buffers
- **加密**: AWS-LC-RS, X25519-Dalek, AES-GCM, SQLCipher
- **网络**: HTTP/HTTPS, S3 兼容对象存储, WebSocket, KCP, SSH
- **系统交互**: sysinfo, netstat2, libloading
- **前端**: Vue3 + Element Plus + xterm.js + noVNC

### 通信协议

- **控制通道**: API + WebSocket
- **数据通道**: 自定义二进制协议
- **文件传输**: 分块传输，断点续传
- **屏幕传输**: 智能压缩，增量更新

---

## 🧩 核心组件

### NPS — 管理服务器

NPS 是整个系统的控制中心，基于 **Poem** Web 框架 + **SeaORM** + **SQLite** 构建。

**启动流程（`nps/src/main.rs`）：**

1. 创建 `data/`、`payloads/`、`plugins/`、`skills/` 目录
2. 初始化日志（写入 `nps.log`，支持运行时调整级别）
3. 连接 SQLite 数据库（`nps.db`，SQLCipher 全库加密），建表并初始化默认数据
4. 加载活跃项目到内存
5. 启动 QQ/Telegram 等机器人
6. 启动 Agent 心跳监控循环（30s 间隔广播状态）
7. 启动 NPC2 监听器（TCP/WS/KCP）与 S3 项目轮询器
8. 启动 NPC1 HTTP 门面（`:31000`）
9. 启动 Web 管理 API（`:33000`，默认 TLS；`--scheme http` 时不启用）

**双监听器设计：**

| 端口 | 模块 | 用途 |
|------|------|------|
| 31000 | `npc::npc1` | HTTP 门面：脚本分发、信标通信、Payload 下载、验证码诱饵 |
| 33000 | `npu::start` | 管理 API：TLS + Cookie 认证 + WebSocket 推送 |

**Web API 服务（14 个 OpenAPI 模块）：**

| 模块 | 路径前缀 | 功能 |
|------|----------|------|
| UserApi | `/login` `/loginbyauth` | 用户认证、会话管理 |
| ListenApi | `/listen*` | 监听器 CRUD |
| ProjectApi | `/project*` | 目标项目 CRUD |
| AgentApi | `/agentget` `/agentinfo` `/agentnote` | Agent 列表、详情、备注 |
| ProxyApi | `/proxyadd` `/proxylist` `/proxystop` | SOCKS5 代理 / 端口转发 |
| FileApi | `/sftp/*` `/file*` `/s3*` | SFTP 文件管理、文件库、S3 云存储 |
| PassApi | `/pass*` | 密码收集结果 |
| SettingApi | `/setting*` | 全局设置 |
| SkillApi | `/skill*` | AI 技能管理 |
| PluginApi | `/plugin*` | 插件上传、列表、内容 |
| NoticeApi | `/bot*` | 机器人管理 |
| AiBotApi | `/aichat*` `/chatsession*` | AI 渗透会话 |
| McpKeyApi | `/mcpkey*` | MCP 接入密钥管理 |
| LogApi | `/log*` | 系统日志查看 |

另有内置 MCP 端点 `POST /mcp`（JSON-RPC 2.0，纯令牌鉴权，见下文）。

**认证机制：**

- Cookie 名 `AUTH`，HttpOnly，24 小时有效期
- `AuthMiddleware` 拦截所有请求，白名单：`/captcha`、`/login`、`/loginbyauth`
- 自定义 `UserSessionStorage`：支持按用户名清除所有会话（密码重置后触发）
- 后台每 60s 清理过期会话

**状态管理（`core/state.rs`）：** `AppState` 持有共享状态（全部 `Arc<Mutex<>>`）：`conn`（SQLite 连接）、`projects`（活跃项目）、`agents`（在线 Agent）、`events`（事件队列）、`agent_tasks`（任务快照）、`clients`（WebSocket 前端）、`listens`（监听器停止信号）、`proxys`（代理实例）、`payloads`（临时下载地址）。

**NpsAgent 统一抽象：**

```rust
struct NpsAgent {
    ntype: String,                              // "npc1" | "npc2" | "ssh"
    npc1: protos::nps::Agent,                    // Agent 基本信息
    npc2: Option<YamuxControl>,                 // NPC2 yamux 多路复用
    ssh: Option<Arc<russh::client::Handle>>,     // SSH 持久会话
    ctrl: Option<mpsc::Sender<()>>,              // 控制通道
}
```

无论 Agent 是 NPC2 回连还是 SSH 原生连接，最终都统一为 `NpsAgent` 并通过 `AgentEvent` 广播给前端。

### NPC1 — 轻量客户端

NPC1 是轻量信标 Agent，适合初次植入。传输层已 trait 化，支持两种回连方式：

- **HTTP 直连**：回连 nps 的 NPC1 HTTP 门面（`:31000`），GET 拉取任务 / POST 回传结果
- **S3 对象存储信箱**（dead-drop 模型）：与 nps 不直接建连，双方轮询同一批对象交换数据；
  适合目标出网受限但可访问对象存储（阿里云 OSS / MinIO）的场景

**首次上线即拿配置**：npc1 可默认只内嵌 ip/key 等最小信息，首次经 HTTP 上线后
由服务端下发 S3 信箱配置（含项目级 ak/sk），之后改由 S3 通道上线。

**S3 信箱对象布局（单桶多项目）：**

```
{route}/{sha256(agentid)}/up.dat     Agent → NPS 事件（单槽位，处理完删除）
{route}/{sha256(agentid)}/hb.dat     心跳标记（只看存在性）
{route}/{sha256(agentid)}/down.dat   NPS → Agent 配置类事件（读取后删除 = ACK）
{route}/{sha256(agentid)}/task.dat   NPS → Agent 任务类事件（读取后删除 = ACK）
```

目录名为 agentid 的 sha256 单向哈希，桶内列举不暴露 agent 身份；服务端固定 3s 轮询。

**工作流程：**

1. 解密内嵌 DNA 配置（AES）
2. 发送 `Agent` 上线信息（用户名、主机名、内网 IP、PID、平台、架构）
3. 循环：拉取任务 → AES-CBC 解密 → 执行 → 回传结果 → 随机休眠

**反检测特性：**

- 随机心跳抖动（jitter）
- Hook `GetExtendedTcpTable` 隐藏 TCP ESTABLISHED 连接
- `obfstr` 编译期字符串混淆
- AES 加密的内嵌配置
- 伪装验证码流量（未知路由返回 CAPTCHA 图片）

**通信：** Protobuf 消息体，AES-CBC 加密，Base64 编码；S3 模式下为对象读写。

### NPC2 — 增强客户端

NPC2 是全功能 Agent，基于 `russh` 构建，支持终端、VNC、SFTP、SOCKS5 等。

**连接方式：**

| 传输 | 代码 | 方向 | 说明 |
|------|------|------|------|
| ws | `spawn_listener<WebsocketTransport>` | 反向 | Agent 回连 |
| tcp | `spawn_listener<TcpTransport>` | 反向 | 同上 |
| kcp | `spawn_listener<KcpTransport>` | 反向 | 同上，UDP |
| ftcp | `spawn_connecter<TcpTransport>` | 正向 | Agent监听  |
| fkcp | `spawn_connecter<KcpTransport>` | 正向 | 同上 |
| ssh | `ssh_connecter` | 正向 | NPS 原生 SSH 连接目标 |

**连接建立流程（`npc2/src/core.rs`）：**

1. 构建 `Agent` 信息（sysinfo 采集）
2. 创建 `NoiseConfig` 加密配置
3. 根据 `ctype` 选择 `spawn_connecter`（dial）或 `spawn_listener`（bind）
4. Noise 握手（5s 超时）→ 协议握手 → 注册 Agent
5. 建立 `YamuxSession`（多路复用），获取 `control` 句柄
6. 广播 `AgentEvent{status:"create"}` 到前端
7. 循环监听 yamux 事件和控制信号

**内置 SSH 服务器（`npc2/src/rssh.rs`）：**

NPC2 内嵌一个 SSH 服务器（`russh::server`），支持以下 subsystem：

| Subsystem | 功能 |
|-----------|------|
| sftp | 文件传输（`russh_sftp`） |
| socks5 | SOCKS5 代理（`fast_socks5`） |
| rpc | Agent 工具调用 |
| vnc | 远程桌面（Win/macOS） |

**Agent 工具层（`npc2/src/agents/`）：** 通过 `rpc` subsystem 接收 `ToolAct` 指令，注册了 8 个工具处理器：

| 工具 | 功能 | 限制 |
|------|------|------|
| `shell` | 执行 Shell 命令 | 60s 超时 |
| `file_read` | 读取文件 | 最大 10MB |
| `file_write` | 写入文件 | 自动创建目录 |
| `http_get` | HTTP 请求 | — |
| `process_list` | 进程列表 | sysinfo |
| `process_kill` | 结束进程 | — |
| `netstat` | 网络连接 | netstat/ss |
| `plugin_exec` | 执行插件 | DLL/BOF/EXE/.NET |

**终端（`npc2/src/terminal/`）：**

- Windows：优先 ConPTY，回退 Pipe 终端
- Unix：标准 PTY

**VNC 虚拟桌面（`npc2/src/vnc.rs`）：**

- 基于 `rustvncserver`（纯 Rust VNC 服务器，支持 11 种编码）
- 输入模拟通过 `enigo`（键盘/鼠标）
- 单例模式，多用户共享同一 VNC 实例

**平台特性：**

- **端口复用**：Windows 用 `netsh portproxy`，Linux 用 `iptables REDIRECT`
- **进程隐藏**：Windows hook TCP 表，Linux 使用 `init_hide_process`

### MCP — 内置 AI 协议端点

MCP（Model Context Protocol）服务**内置在 nps 中**（`nps/src/npu/mcp.rs`），无独立组件，
端点 `POST /{admin}/mcp`，JSON-RPC 2.0 over HTTP，支持单条/批量：

```
AI 客户端 (Claude/Cursor) ←HTTP JSON-RPC + Bearer令牌→ NPS /mcp ←统一分发→ nps/src/ops 工具层
```

**鉴权（纯令牌，不复用登录 Cookie）：** `Authorization: Bearer <token>` /
`X-Api-Key` / `?auth=`；令牌两种：`mcpk_` 前缀专用密钥（Web「MCP密钥」页管理，
可按密钥限定工具子集、启停、重置）或 `userauth`（全量权限）。

**暴露的 15 个工具（统一 nps_ 前缀，与 AI 渗透同源）：** `nps_create_project`、
`nps_list_projects`、`nps_create_agent`、`nps_create_ssh`、`nps_load_npc2`、
`nps_list_hosts`、`nps_execute_command`、`nps_read_file`、`nps_write_file`、
`nps_create_socks5`、`nps_screenshot`、`nps_list_dir`、`nps_search_files`、
`nps_list_plugins`、`nps_plugin_exec`（`nps_curl` 仅 AI 渗透可用）。

典型链路：`nps_create_project` → `nps_create_agent` →（目标执行上线）→ `nps_list_hosts`
→ `nps_load_npc2` → 确认 npc2=true 后执行命令/文件/代理/插件操作。

客户端配置选 HTTP（Streamable HTTP）类型，URL 填 `https://<host>:33000/<admin>/mcp`。

### NPU — Web 前端

**技术栈：**

| 层 | 技术 |
|----|------|
| 框架 | Vue 3.5（Composition API） |
| 路由 | vue-router 4（Hash 模式） |
| 状态 | Pinia 2 |
| UI | Element Plus 2.8 |
| 终端 | xterm.js 5.5 |
| 远程桌面 | noVNC 1.7 |
| 序列化 | protobufjs（与 Rust prost 互通） |
| 构建 | Vite 5.4 |

前端构建产物（`npu/dist`）通过 `rust-embed` 在编译期嵌入 nps 二进制，访问路径 `/<nps.admin>/static`。

**主机详情页 Tab：**

| Tab | NPC2 Agent | SSH Agent |
|-----|-----------|-----------|
| NPC 详情 | ✅ | ✅ |
| 命令控制台 | ✅ | ✅ |
| 虚拟终端 | ✅ | ✅ |
| 文件管理 | ✅ | ✅ |
| 虚拟桌面 | ✅ | ❌ |
| 进程管理 | ✅ | ❌ |
| 网络管理 | ✅ | ❌ |
| 插件执行 | ✅ | ❌ |
| 维权管理 | ✅（Win/Linux） | ❌ |
| AI渗透 | ✅ | ✅ |

登录后默认跳转「AI 渗透」首页（`/` → `/aichat`）。

**多主题：** 黑客风 / 商务风 / 少女粉 / 科技蓝，通过 localStorage 持久化。

---

## 📚 共享库

| 库 | 路径 | 功能 |
|----|------|------|
| **transport** | `libs/transport/` | 传输层抽象：Transport1（同步 HTTP / S3 / ICMP）、Transport2（异步 TCP/KCP/WS），支持 SOCKS5 代理；含 S3Client（AWS SigV4 签名，OSS/MinIO 兼容） |
| **noise** | `libs/noise/` | Noise 协议加密流（X25519 + snowstorm），用于 NPC2 传输层加密 |
| **crypto** | `libs/crypto/` | AES-256-GCM + deflate 压缩，用于 NPC1 HTTP 通信加密 |
| **utils** | `libs/utils/` | 通用工具：WebSocket Key 计算、PID 获取、时间戳、UUID、SHA |
| **coffee** | `libs/coffee/` | BOF（Beacon Object File）加载器，解析 COFF 并执行 |
| **memexec** | `libs/memexec/` | 内存 PE 加载器，不落地文件执行 EXE/DLL |
| **rustclr** | `libs/rustclr/` | .NET CLR 托管，内存执行 .NET 程序集 |
| **conpty** | `libs/conpty/` | Windows Pseudo Console，支持 ConPTY 和回退方案 |
| **enigo** | `libs/enigo/` | 跨平台输入模拟（键盘/鼠标），用于 VNC 远程控制 |
| **rustvncserver** | `libs/rustvncserver/` | 纯 Rust VNC 服务器（RFB 协议），支持 11 种编码 |
| **clipboard** | `libs/clipboard/` | 剪贴板重定向，支持 VNC 剪贴板共享 |

> 依赖按需引入：npc1/npc2 仅引用用到的传输实现（icmp 暂未接入载荷），按体积最小化裁剪。

---

## 🔄 传输层

`libs/transport/` 定义了两层传输抽象：

### Transport1 — 同步阻塞

用于 NPC1 的 HTTP 通信：

```
HttpTransport (reqwest blocking)
  ├── 每次 send() = 一次完整 HTTP 请求-响应
  ├── 支持 SOCKS5 代理
  └── Hook GetExtendedTcpTable 隐藏连接
```

### Transport2 — 异步非阻塞

用于 NPC2 和 SSH 的实时双向通信：

| 实现 | 协议 | 特点 |
|------|------|------|
| TcpTransport | TCP | 可选 TLS（自签证书跳过验证） |
| KcpTransport | KCP/UDP | 高可靠低延迟 |
| WebsocketTransport | WebSocket | 可选 WSS TLS |
| IcmpTransport | ICMP | 半双工 / 全双工 Echo |

**SOCKS5 代理支持：** 所有 Transport2 实现 `proxy_dial(addr, proxyaddr)` 方法。`proxyaddr` 非空时通过 SOCKS5 代理连接，格式：`socks5://user:pass@host:port`（`tokio_socks` crate 实现）。

---

## 🔐 通信协议与加密

### NPC1 — HTTP / S3 信箱

**HTTP 直连：**

```
Agent ← HTTP → NPS (:31000)
      ↑ AES-CBC 加密
      ↑ Protobuf 序列化
      ↑ Base64 编码
```

- 信标：GET 拉取任务，POST 回传结果
- 加密：`crypto::AesCrypt`（AES-256-GCM + deflate）

**S3 信箱（dead-drop）：** 双方轮询 `{route}/{sha256(agentid)}/{up|hb|down|task|other}.dat`
对象交换数据，下行单槽位、读取后删除即 ACK；服务端固定 3s 轮询。
npc1 传输层为 `Npc1Transport` trait（`nps/src/npc/npc1/`），http/s3 均为其实现，
后续可扩展 icmp、mqtt 等。

### NPC2 — Noise + Yamux

```
Agent ← Noise 握手 → NPS
      ← Yamux 多路复用 →
        ├── SSH Channel (终端/SFTP/VNC/SOCKS5)
        ├── RPC Channel (工具调用)
        └── Proxy Channel (端口转发)
```

- 加密：`noise::NoiseConfig`（X25519 + ChaChaPoly，基于 snowstorm）
- 多路复用：`tokio_yamux`
- 握手超时：5s

### SSH — russh

```
NPS ← russh → 目标 SSH 服务器
     ← direct-tcpip → (端口转发 / SOCKS5)
     ← channel session → (终端 / SFTP)
```

- 认证：密码优先，私钥回退
- SOCKS5 代理：本地处理握手 + `direct-tcpip` 转发
- 持久会话：`Arc<Handle>` 多 channel 复用

---

## 🐚 SSH 原生连接

NPS 支持直接通过 SSH 协议连接目标主机，无需在目标安装 Agent。

**配置（`listens::Model`）：**

| 字段 | 含义 |
|------|------|
| `onlineaddr` | SSH 服务器地址（如 `175.27.224.234:22`） |
| `noise` | SSH 用户名 |
| `enckey` | SSH 密码（可为空，回退私钥） |
| `config` | SSH 私钥 PEM（可为空） |
| `proxyaddr` | SOCKS5 代理地址（可为空） |
| `transport` | `"ssh"` |

**连接流程（`npc2::ssh_connecter`）：**

1. `RsshSession::connect_session()` — 建立 SSH 连接（可选 SOCKS5 代理 → russh 握手 → 密码认证，失败回退私钥）
2. `gather_system_info()` — 执行命令采集系统信息（hostname、用户名、架构、平台、PID、工作目录、内网 IP）
3. `convert_ssh_to_agent()` — 转换为 `Agent` 并注册
4. 广播上线事件，维持持久会话直到停止信号

**功能支持：**

| 功能 | 实现方式 |
|------|----------|
| 终端 | `channel_open_session` + pty + shell |
| SFTP | `channel.request_subsystem("sftp")` + `russh_sftp` |
| SOCKS5 代理 | 本地 SOCKS5 握手 + `channel_open_direct_tcpip` |
| 端口转发 | `channel_open_direct_tcpip` |
| 系统信息 | `channel.exec()` 执行命令 |

---

## 🤖 AI 决策与执行分离

### 架构

```
用户 ← Web/机器人 → AI 渗透 (NPS, adk-rust) ← RPC/SSH exec → Agent (NPC2/SSH)
                        ↓
                 分析 + 规划 + 调用工具
```

AI 助手**不直接执行操作**，而是通过 RPC 调用远端 Agent 上的工具。所有执行在 Agent 端完成，NPS 仅传递指令和结果。

### AI 工具集（21 个，统一 nps_ 前缀）

**统一操作层（`nps/src/ops/`，与 MCP 端点同源同名）— 16 个：**

| 工具 | 功能 |
|------|------|
| `nps_create_project` | 新建项目（HTTP / S3 信箱两种回连形式） |
| `nps_list_projects` | 项目列表 |
| `nps_create_agent` | 生成木马并返回下载 URL / 一键上线命令（4h 有效） |
| `nps_create_ssh` | 原生 SSH 连接器（先测连成功才入库） |
| `nps_load_npc2` | 加载/升级 NPC2 |
| `nps_list_hosts` | 在线主机列表 |
| `nps_execute_command` | 执行命令（NPC2 走 RPC；SSH 直连走 SSH exec） |
| `nps_read_file` / `nps_write_file` | 读/写文件（text/base64，读上限 16MB） |
| `nps_create_socks5` | 开 SOCKS5 入口进目标内网 |
| `nps_screenshot` | 截屏（归档敏感文件） |
| `nps_list_dir` | 目录列表 |
| `nps_search_files` | 按文件名通配符递归搜索（NPC2 本地遍历；SSH 直连降级 find/dir） |
| `nps_list_plugins` / `nps_plugin_exec` | 插件查询/按平台架构匹配执行 |
| `nps_curl` | 目标主机内置 HTTP 客户端（仅 AI 渗透，不进 MCP） |

**会话层（`nps/src/aibot/tools/`）— 5 个：** `nps_set_id`（设定目标主机）、
`nps_skill_read`（读技能）、`nps_memory_store` / `nps_memory_recall` / `nps_memory_forget`（长期记忆）。

参数顺序统一：ID 类（project_id/agent_id）→ 必填 → 可选。

### 危险操作确认

- `ai.blacklist` 设置项（逗号分隔正则，不分大小写）命中「工具名 + 参数」即暂停，
  前端弹确认卡等待用户放行/拒绝；同批多个高危操作并行弹卡、独立计时
- AI 可主动标记 `confirm: true`（附 `confirm_reason`）请求确认
- 确认超时 = `ai.tool_timeout`（默认 300s），超时/停止均视为拒绝

### AI 技能（Skills）

技能是 Markdown 格式的指令文件（`skills/<名>.skill.md`），AI 通过 `nps_skill_read` 工具按需加载。
系统提示词指示 AI 自动发现和加载相关技能；插件文档也自动同步到此处（见插件系统）。

### 记忆系统

- **混合检索**：向量余弦相似度（0.7）+ SQLite FTS5 关键词（0.3）融合排序
- `ai_memories_fts` 虚拟表镜像 `ai_memories`，触发器自动同步
- 命中记忆仅注入 LLM 上下文，不在前端展示
- Embedding 缓存表（`ai_embedding_cache`）避免重复计算

### 机器人集成

| 平台 | 驱动 |
|------|------|
| QQ | `bots/qq.rs`（基于 `botrs`） |
| Telegram | `bots/tg.rs` |
| 企业微信 / 钉钉 / 飞书 | `bots/wecom.rs` / `bots/ding.rs` / `bots/feishu.rs` |
| 微信个人号 | `bots/wxilink.rs`（iLink 扫码） |
| 通用 | `bots/webhook.rs`（任意网关） |

消息流：用户消息 → 机器人 → AI 助手 → 工具调用 → 回复用户。

---

## 🧩 插件系统

NPC1 和 NPC2 都支持插件加载和执行；「插件库」页面统一管理（左侧列表 + 右侧 Markdown 说明文档）：

| 类型 | 架构 | 加载器 | 说明 |
|------|------|--------|------|
| dll | Windows | `libloading` | 动态加载 .dll |
| so | Linux | `libloading` | 动态加载 .so |
| dylib | macOS | `libloading` | 动态加载 .dylib |
| exe | Windows | `memexec` | 内存加载 PE，不落地 |
| elf | Linux | `memelfc` | 内存加载 ELF |
| net | Windows x64 | `rustclr` | 内存执行 .NET 程序集 |
| bof | 跨平台 | `coffee` | Beacon Object File |

**上传注册约定：**

- 插件名只允许英文字母 + 数字；文件名 `名称.平台.架构.exe`（如 `wyth.windows.x86_64.exe`）
- 多平台同名文件归并为同一基础名，执行时按目标平台/架构自动匹配对应文件
- 插件 `description` 与 `skills/<插件名>.skill.md` 双向同步（上传/修改/初始化时同步写入；删除不同步）
- AI 可用 `nps_list_plugins` 查插件库、`nps_skill_read` 读用法文档

**安全措施：**

- 临时文件随机命名（6 字符），60s 后自动删除
- 插件数据驻留内存直到执行
- 上传限制：4MB（`MAX_PLUGIN_FILE_BYTES`）

**BOF 插件 (coffee) 约定：**

- 入口默认 `go`，参数按原始字节传入（无参 BOF 留空即可）
- 输出函数：`BeaconPrintf`（支持 `%d %u %x %X %p %s %S %c %ld %lld %02x` 宽度/精度等）
- Win32 API 需用 CS BOF 惯例符号声明（如 `WINBASEAPI DWORD WINAPI kernel32$GetFileSize(...)`），
  普通 MSVC 导入符号无法解析（与 Cobalt Strike BOF 生态一致，mingw/MSVC 均可编译）
- 仅支持同架构执行（x86 BOF 不能跑在 x64 npc2 上）

---

## 🕳️ 代理与隧道

### SOCKS5 代理

```
浏览器 ← SOCKS5 → NPS (本地端口) ← SSH direct-tcpip → 目标
```

**SSH 代理实现（`core/rssh.rs::proxy`）：**

1. 接受本地 TCP 连接
2. 本地完成 SOCKS5 握手（支持用户名/密码认证）
3. 解析目标地址
4. 通过 SSH `channel_open_direct_tcpip` 连接目标
5. 双向转发数据

**NPC2 代理实现：** 通过 yamux 通道连接 NPC2 的 SSH 服务器，请求 `socks5` subsystem（由 NPC2 内的 `fast_socks5` 处理）。

### 端口转发

指定 `remote_addr` 时，直接通过 `channel_open_direct_tcpip` 建立端口映射：

```
本地端口 ← NPS → SSH 服务器 → remote_addr
```

---

## 🚀 构建与部署

### 环境要求

- Rust 1.85+（推荐 nightly）
- Protocol Buffers 编译器（`protoc`）
- NASM（aws-lc-rs 依赖，Windows 放置于 `.tools/nasm-2.16.03/` 或 PATH）
- Node.js 18+（前端构建）
- Linux/macOS 交叉编译：WSL（Windows）或原生 Linux 环境
- macOS 交叉编译额外素材（放 `../obj/` 或 `.tools/`，build.ps1 自动引导）：
  - `zig11.tar.xz`：zig 0.11（WSL1 内核不支持 zig 0.13 缓存 rename 语义，
    交叉 darwin 必须用 0.11，自动解压到 WSL `/root/zig11`）
  - `MacOSX11.3.sdk/`：macOS SDK（phracker/MacOSX-SDKs 的 11.3 版）
  - `libclang.so`：netstat2 bindgen 依赖（pip wheel `libclang` 解出，
    自动复制到 WSL `/root/libclang`）

### 一键编译（推荐）

使用项目根目录的 `build.ps1`，自动完成前端构建、全平台编译、产物复制到 `payloads/`：

```powershell
# 完整构建（Windows 全部目标 + WSL Linux/macOS）
# 双击 build.bat 或命令行运行均可（自动绕过执行策略）
.\build.bat

# 或直接调用 ps1
.\build.ps1 -WindowsOnly     # 只构建 Windows 目标
.\build.ps1 -LinuxOnly       # 只构建 Linux/macOS 目标（通过 WSL）
.\build.ps1 -SkipFrontend    # 跳过前端构建（npu/dist 已是最新时）
.\build.ps1 -SkipMac         # 跳过 macOS 目标
```

产物映射：

| 源 | 目标 |
|----|-------------------|
| `@target/x86_64-pc-windows-msvc/release/nps.exe` | `payloads/nps.exe` |
| `@target/x86_64-pc-windows-msvc/release/license_gen.exe` | `scripts/license_gen.exe` |
| `@target/x86_64-pc-windows-msvc/payload/npc1.exe` | `payloads/npc1.windows.x86_64.dat` |
| `@target/x86_64-pc-windows-msvc/payload-unwind/npc2.dll` | `npc2.windows.x86_64.dat` |
| `@target/x86_64-pc-windows-msvc/payload/stub.exe` | `stub.windows.x86_64.dat` |
| `@target/i686-pc-windows-msvc/payload/npc1.exe` | `npc1.windows.x86.dat` |
| `@target/i686-pc-windows-msvc/payload-unwind/npc2.dll` | `npc2.windows.x86.dat` |
| `@target/i686-pc-windows-msvc/payload/stub.exe` | `stub.windows.x86.dat` |
| `@target/x86_64-unknown-linux-gnu/payload/npc1` | `npc1.linux.x86_64.dat`（gnu.2.12） |
| `@target/x86_64-unknown-linux-gnu/payload-unwind/libnpc2.so` | `npc2.linux.x86_64.dat`（gnu.2.12） |
| `@target/x86_64-unknown-linux-gnu/payload/stub` | `stub.linux.x86_64.dat`（gnu.2.12） |
| `@target/x86_64-unknown-linux-gnu/release/nps` | `nps` |
| `@target/aarch64-unknown-linux-gnu/payload/npc1` | `npc1.linux.aarch64.dat`（gnu.2.17） |
| `@target/aarch64-unknown-linux-gnu/payload-unwind/libnpc2.so` | `npc2.linux.aarch64.dat`（gnu.2.17） |
| `@target/aarch64-unknown-linux-gnu/payload/stub` | `stub.linux.aarch64.dat`（gnu.2.17） |
| `@target/x86_64-apple-darwin/payload/npc1` | `npc1.macos.x86_64.dat` |
| `@target/x86_64-apple-darwin/payload-unwind/libnpc2.dylib` | `npc2.macos.x86_64.dat` |
| `@target/x86_64-apple-darwin/payload/stub` | `stub.macos.x86_64.dat` |
| `@target/aarch64-apple-darwin/payload/npc1` | `npc1.macos.aarch64.dat` |
| `@target/aarch64-apple-darwin/payload-unwind/libnpc2.dylib` | `npc2.macos.aarch64.dat` |
| `@target/aarch64-apple-darwin/payload/stub` | `stub.macos.aarch64.dat` |

> npc2 独立可执行形态不再预编译 exe/elf 模板：nps 下载时用
> `stub.{os}.{arch}.dat`（加载器）+ `npc2.{os}.{arch}.dat`（DLL/SO/dylib）
> 现场拼接（stub + 库 + 12 字节 footer），并嵌入监听器 DNA 生成独立可执行文件
> （Windows 为 exe、Linux 为 elf、macOS 为 osx 后缀下载）。
>
> macOS 链接优化：C 代码用 zig 0.11 cc 交叉编译，最终链接用 rustup 自带
> rust-lld（ld64 flavor），`-dead_strip`/`-s` 真实生效，npc2.macos.x86_64
> 实测 11.92MB → 4.04MB；npc2 用 `cargo rustc --crate-type cdylib` 纯 cdylib
> 覆盖（避免 rlib 双产物约束多出 ~1.1MB）。

### 手动编译

```bash
# 编译前端
cd npu && npm install && npm run build

# 编译管理服务器（release，日志正常）
cargo build --release -p nps --target x86_64-pc-windows-msvc

# 编译植入物（npc1/stub 用 payload 极限体积 panic=abort；
# npc2 单独用 payload-unwind：注入态 panic 只终止所在线程，不杀宿主 npc1 进程）
cargo build --profile payload -p npc1 -p stub --target x86_64-pc-windows-msvc
cargo build --profile payload-unwind -p npc2 --target x86_64-pc-windows-msvc
cargo build --profile payload -p npc1 -p stub --target i686-pc-windows-msvc
cargo build --profile payload-unwind -p npc2 --target i686-pc-windows-msvc

# Linux（在 WSL / Linux 环境中，zig 按低版本 glibc 符号表链接，CentOS 6 glibc 2.12 可跑）
cargo zigbuild --profile payload -p npc1 -p stub --target x86_64-unknown-linux-gnu.2.12
cargo zigbuild --profile payload-unwind -p npc2 --target x86_64-unknown-linux-gnu.2.12
cargo zigbuild --profile payload -p npc1 -p stub --target aarch64-unknown-linux-gnu.2.17
cargo zigbuild --profile payload-unwind -p npc2 --target aarch64-unknown-linux-gnu.2.17

# macOS（同样在 WSL 中交叉编译；WSL1 必须用 zig 0.11，见上文环境要求）
export SDKROOT=/path/to/MacOSX11.3.sdk
export PATH=/root/zig11:$PATH
export LIBCLANG_PATH=/root/libclang                        # netstat2 bindgen
export CFLAGS_aarch64_apple_darwin="-D__ARM_NEON=1 -D__ARM_FEATURE_CRYPTO=1"
export BINDGEN_EXTRA_CLANG_ARGS_aarch64_apple_darwin="--sysroot=$SDKROOT"
export BINDGEN_EXTRA_CLANG_ARGS_x86_64_apple_darwin="--sysroot=$SDKROOT"
cargo zigbuild --profile payload -p npc1 -p stub --target x86_64-apple-darwin
cargo zigbuild --profile payload-unwind -p npc2 --target x86_64-apple-darwin
cargo zigbuild --profile payload -p npc1 -p stub --target aarch64-apple-darwin
cargo zigbuild --profile payload-unwind -p npc2 --target aarch64-apple-darwin

# Linux nps（原生 gnu 动态链接，跑自家服务器）
cargo build --release -p nps --target x86_64-unknown-linux-gnu
```

**Profile 说明（`Cargo.toml`）：**

```toml
[profile.release]          # nps 使用：保留 unwind，保证 log 正常输出
strip = "symbols"
debug = 0
opt-level = "z"
lto = true
codegen-units = 1
panic = "unwind"

[profile.payload]          # npc1/stub 使用：极限体积
inherits = "release"
panic = "abort"

[profile.payload-unwind]   # npc2 使用：同 payload 但 panic=unwind
inherits = "payload"
panic = "unwind"
```

> 注意：`panic = "abort"` 不能用于默认 release —— 实测 abort + opt-level="z" + lto 组合会误编译 log crate 的级别检查，导致 nps 所有 `log::` 宏静默无输出。npc2 必须用 unwind：它以 DLL/SO 形态运行在宿主进程（npc1/stub/注入目标）内，abort 会连带杀死宿主（fastfail 0xC0000409），VNC 控制提权窗口等异常场景 panic 时 npc1 会一起退出；unwind 只终止所在线程，配合 vnc.rs 内的 catch_unwind 兑底后 VNC 会话可自恢复。

### 运行

```bash
# 启动管理服务器（内置前端，默认 https）
./nps

# 开发调试用 http（也可用 --https 显式指定）
./nps --scheme http
```

启动参数（getopts）：`--scheme http|https`（缩写 `--http` / `--https`）；
优先级：CLI > 环境变量 `NPS_SCHEME` > 默认 https。

默认端口：

- NPS Web API：`https://0.0.0.0:33000`（`nps.admin` 前缀首次启动随机生成，见启动日志）
- NPS NPC1 HTTP：`http://0.0.0.0:31000`
- 前端访问：`https://localhost:33000/<nps.admin>/static`

**环境变量引导（显式设置时每次启动覆盖写入库）：**

| 环境变量 | 作用 | 缺省值 |
|---|---|---|
| `NPS_USERNAME` | 登录用户名（同时复用为数据库加密密钥成分） | `manjusaka` |
| `NPS_PASSWORD` | 登录密码 | 随机 15 位 |
| `NPS_LISTPORT` | 管理端口 | `33000` |
| `NPS_ADMIN` | 管理后台路由 | 随机 10 位 |
| `NPS_SCHEME` | 服务协议 http/https | `https` |

首次启动在控制台打印「初始配置」块（用户名/密码/管理端口/协议/后台地址），务必保存。

### Docker 一键部署

```bash
bash docker-deploy.sh           # 部署（默认）
bash docker-deploy.sh logs      # 日志 / restart / down / status
```

生成 `docker/` 目录（compose + 随机凭据 .env + 持久卷），默认 host 网络；
整个工作目录挂卷，换镜像不丢数据。详见脚本注释。

### 数据库

SQLite 存储于 `nps.db`（**SQLCipher 全库加密**，密钥 = SHA256(用户名 + salt)，
用户名取 `NPS_USERNAME`），首次启动自动建表并初始化默认用户。
旧明文库迁移用 `scripts/migratedb`（Go 运维工具，加密/解密双向）：

```bash
./scripts/migratedb                 # 加密：nps.db -> nps.db.enc
./scripts/migratedb --decrypt       # 解密：nps.db.enc -> nps.db
```

### TLS 证书

首次启动自动生成自签名证书（rcgen, ECDSA P-256）并保存到 `certs/server.crt` 与 `certs/server.key`；
之后启动复用已有证书。如需自备证书，直接替换这两个文件即可。

### License 授权

软件带简单的授权控制：**npc1 基础功能不受限，npc2 相关操作（加载 NPC2 / 生成 NPC2 / 进程注入 /
npc2 载荷下载）在前端需要有效授权**，过期或无授权时点击会提示并拦截。

用 `license_gen`（构建产物在 `scripts/license_gen.exe`，运营者自用，勿随 nps 交付给客户）生成授权文件：

```powershell
# 授权用户 testuser 一年
.\scripts\license_gen.exe -u "testuser" -d 365

# 授权到指定日期 (该日结束前有效)
.\scripts\license_gen.exe -u "testuser" -e 2027-08-26

# 指定输出路径 (默认 license.dat)
.\scripts\license_gen.exe -u "testuser" -d 365 -o license.dat
```

把生成的 `license.dat` 放到 **nps 工作目录**（与 `nps.db` 同级），重启 nps 生效；
前端左下角会显示授权用户与有效期（过期显示红色）。license 内容为
`AES-256-GCM(key 混淆嵌入) + base64` 的 `{user, issued_at, expire_at}`，防篡改。

---

## 📖 使用流程

1. **配置监听器**：设置协议（tcp/kcp/ws/ssh）、监听地址、上线地址。反向连接填本地监听地址，正向连接填目标地址。上线地址改为外网IP。
2. **创建目标项目**：设置回调地址（外网 IP）、路由、密钥，关联监听器。
3. **生成 Agent**：在项目页面生成 NPC1 植入物，获取上线命令或可执行文件。
4. **NPC1 上线**：在目标主机执行 NPC1，Agent 通过 HTTP 回连上线。
5. **加载 NPC2**：在主机详情页点击加载 NPC2，NPS 下发 NPC2 植入物，NPC2 回连并建立全功能通道。
6. **操作主机**：通过详情页的 Tab 使用终端、文件管理、虚拟桌面、代理等功能。
7. **SSH 连接（可选）**：创建 transport=ssh 的监听器，填写目标 SSH 地址和凭据。NPS 直接通过 SSH 协议连接，支持终端和 SFTP，无需在目标安装 Agent。
8. **AI 辅助（可选）**：通过 Web 界面的 AI 渗透页交互（危险操作弹窗确认）；配置 QQ/Telegram 机器人在聊天中远程操作；Claude / Cursor 等 MCP 客户端直接接入内置 MCP 端点（Web「MCP密钥」页创建密钥）。

> 修改相关设置后需要重启应用生效。

### API 文档

```bash
# 生成 API 文档
cargo doc --workspace --open
```

---


## 📸 功能截图

### NPS登录地址
![](https://github.com/YDHCUI/manjusaka/blob/main/images/0.png)

### 创建监听器
![](https://github.com/YDHCUI/manjusaka/blob/main/images/1.png)

### 创建目标项目
![](https://github.com/YDHCUI/manjusaka/blob/main/images/2.png)

### 管理界面
![](https://github.com/YDHCUI/manjusaka/blob/main/images/3.png)

### 操作界面
![](https://github.com/YDHCUI/manjusaka/blob/main/images/4.png)

### 虚拟终端
![](https://github.com/YDHCUI/manjusaka/blob/main/images/5.png)

### 虚拟桌面
![](https://github.com/YDHCUI/manjusaka/blob/main/images/10.png)

### 文件管理
![](https://github.com/YDHCUI/manjusaka/blob/main/images/6.png)

### 生成agent
![](https://github.com/YDHCUI/manjusaka/blob/main/images/7.png)

### 推送机器人配置
![](https://github.com/YDHCUI/manjusaka/blob/main/images/8.png)

### 技能管理
![](https://github.com/YDHCUI/manjusaka/blob/main/images/9.png)

### AI渗透
![](https://github.com/YDHCUI/manjusaka/blob/main/images/11.png)

### MCP配置
![](https://github.com/YDHCUI/manjusaka/blob/main/images/12.png)

---

## 📝 更新日志

### v2.2

1、AI 渗透迁移到 adk-rust 框架；工具统一为 nps_ 前缀（15 操作工具 + 5 会话工具），与 MCP 同源

2、MCP 内置进 nps（POST /mcp，JSON-RPC 2.0 + 令牌鉴权），移除独立 mcp 网关；新增「MCP密钥」管理页（可按密钥限工具子集）

3、npc1 传输层 trait 化，新增 S3 对象存储信箱模式（OSS/MinIO 中转，不直接建连，桶内 sha256 目录不暴露 agent 身份）

4、数据库 SQLCipher 全库加密（密钥随用户名派生）；新增 scripts/migratedb（Go）双向迁移工具

5、AI 危险操作确认：ai.blacklist 正则命中或 AI 主动标记 confirm 即弹窗等待用户放行/拒绝，超时视为拒绝

6、敏感文件支持 S3 云存储（s3.* 设置 + /s3list 等接口）；插件库页面上传注册，description 与 skills/<名>.skill.md 双向同步

7、nps 启动参数 --scheme http|https（getopts）；环境变量引导 NPS_USERNAME/NPS_PASSWORD/NPS_LISTPORT/NPS_ADMIN/NPS_SCHEME，首启随机 admin 路由

8、插件/任务改用 Protobuf 帧协议（JSON 兼容代码清除）；前端 AI 输出统一 WebSocket ChatEvent 流（含 confirm 事件）与消息队列

9、Docker 一键部署脚本 docker-deploy.sh；macOS 产物体积优化（rust-lld 链接，npc2.macos 21MB → 4MB）

10、新增 Linux 权限维持（systemd/cron/profile）、nps_create_ssh 原生 SSH 连接器工具、备用地址池

### v2.1

1、npc2 支持独立客户端生成：DLL/SO 产物可直接生成独立 EXE/ELF 形态（npc2exe），内嵌 DNA 配置，无需 npc1 加载即可直连监听上线，前端“生成客户端”对话框新增 NPC2 载荷类型

2、npc2 支持 BOF 插件（coffee）：手写格式化器替代 CRT `_vsnprintf`、RWX 跳板池解决远距离调用、运行时变参蹦床（x64/x86）、修复栈对齐崩溃、LTO 下零堆化

3、exe 插件改为 memexec 内存加载执行，不再弹出控制台黑框

4、日志详情清空时同步清空服务端日志

5、新增一键编译脚本 build.ps1：前端 + Windows 全目标 + WSL Linux 自动编译并复制产物到 payloads/

6、新增 Windows x86 与 Linux aarch64 产物支持

7、进程注入 npc2 改用全新 id 上线，不再顶掉同 id 会话

### v1.2

1、 支持插件、net、bof、exe可执行插件等

2、 支持AI Agent模式：将决策端和执行端分离架构，AI仅负责分析与规划，执行端在远端运行，确保安全

3、加入QQ支持  在qq上面直接让ai帮你内网渗透


### v1.1

1、实现插件支持, bof、crl 等插件

2、实现getpass插件适配

3、增加win7支持

4、修复vnc退出时自动点击右键的bug


### v1.0

1、 rust重构、支持tcp，分段加载，交互shell

2、 动态修改监听器

3、 nps支持https

4、 推送方式改回ws

5、 修复漏洞

6、 优化ui布局， 增加vnc查看功能 251208

7、 卸载npc2、vnc界面自适应 20251209

8、 加入vnc远程控制模式、优化vnc图像更新机制、优化界面 20251210

9、 修改vnc成单例模式，解决多用户连接时的cpu占用问题 20251214


---

# 免责声明

本工具仅面向合法授权的企业安全建设行为，如您需要测试本工具的可用性，请自行搭建靶机环境。

在使用本工具进行检测时，您应确保该行为符合当地的法律法规，并且已经取得了足够的授权。请勿对非授权目标进行扫描。

此工具仅限于安全研究和教学，用户承担因使用此工具而导致的所有法律和相关责任！ 作者不承担任何法律和相关责任！

如您在使用本工具的过程中存在任何非法行为，您需自行承担相应后果，我们将不承担任何法律及连带责任。


## 交流

加V

![a8e5625b211ad3b3c435e9403ebae9f](https://github.com/YDHCUI/buut/assets/46884495/6c667bb1-7eae-464f-afbd-3f0d67cbcbcb)
