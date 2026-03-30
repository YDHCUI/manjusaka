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

Manjusaka（牛屎虾）——基于 Rust 的高性能远程管理平台，以 AI 决策与执行分离架构为核心，实现全平台支持、插件生态与趣味交互的完美融合。

### ✨ 特性

- 🦀 **纯血 Rust**：极致性能，极致安全，拒绝历史包袱
- 🌐 **全平台制霸**：Windows、Linux、macOS 通吃，甚至能在树莓派上跑
- 🔥 **AI决策分离**：AI 只动脑，不动手，再也不怕“龙虾”清空你的本机文件
- 🚀 **分段加载**：先上线再装逼，npc1 轻量级，npc2 全功能，按需加载
- 🖥️ **虚拟桌面**：远程桌面不仅看得见，还能摸得着（VNC 模式）
- 🗄️ **文件管理**：分块传输、断点续传，大文件传输稳如老狗
- 🕳️ **隧道玩法**：端口转发、SOCKS5 代理，内网穿透玩出花
- 🤖 **QQ智能助手**：在 QQ 上直接让 AI 帮你内网渗透，摸鱼渗透两不误
- 🧩 **插件生态**：支持 BOF、Net、EXE 等插件，想加啥功能就加啥
- 💬 **AI聊天**：内置大语言模型，通过聊天的方式来进行渗透

## 🏗️ 架构设计

### 项目结构
```
manjusaka/
├── Cargo.toml            # Workspace 根配置
├── nps/                  # 管理服务器
│   ├── src/
│   │   ├── core/         # 核心逻辑
│   │   ├── models/       # 数据模型
│   │   ├── npc/          # 客户端管理
│   │   ├── npu/          # 插件系统
│   │   ├── protos/       # 协议生成代码
├── npc1/                 # 基础客户端
│   ├── src/
│   │   ├── platform/     # 平台特定代码
│   │   └── *.rs          # 核心模块
├── npc2/                 # 增强客户端
│   ├── src/
│   │   ├── terminal/     # 终端功能
│   │   └── *.rs          # 核心模块
├── libs/                 # 共享库
│    ├── transport/       # 通用传输层
│    ├── utils/           # 通用操作库
│   ├── crypto/           # 通用加密库
│   ├── noise/            # 协议加密库
│   └── 其它第三方库适配
├── npu/                  # 前端代码
├── payloads/             # 植入物
└── plugins/              # 插件库
```

### 技术栈
- **编程语言**: Rust
- **Web 框架**: Poem + Poem-OpenAPI
- **数据库**: SQLite (通过 SeaORM)
- **异步运行时**: Tokio
- **序列化**: Protocol Buffers
- **加密**: AWS-LC-RS, X25519-Dalek, AES-GCM
- **网络**: HTTP/HTTPS, WebSocket, KCP, SSH
- **系统交互**: sysinfo, netstat2, libloading

### 通信协议
- **控制通道**: API + WebSocket
- **数据通道**: 自定义二进制协议
- **文件传输**: 分块传输，断点续传
- **屏幕传输**: 智能压缩，增量更新


## 🚀 快速开始

### 环境要求
- Rust 1.85+ (推荐 nightly 版本)
- Cargo 包管理器
- Protocol Buffers 编译器
- OpenSSL 开发库

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/ydhcui/manjusaka.git
cd manjusaka
```

2. **构建项目**
```bash
# 构建整个 workspace
cargo build --workspace --release


```

3. **启动服务**
```bash
# 启动管理服务器
./target/release/nps

```

4. **访问管理界面**

打开浏览器访问：`https://localhost:33000/manjusaka/static`



### API 文档
```bash
# 生成 API 文档
cargo doc --workspace --open
```


### 使用方法

1、添加监听器，上线地址改为外网IP

2、添加项目，回调地址改为外网IP，连接地址选刚才设置的监听器。

3、生成npc1 运行上线。

4、上线后连接npc1 加载npc2 等待回连。

5、修改相关设置后需要重启应用生效。


## 功能截图

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

### 新建隧道
![](https://github.com/YDHCUI/manjusaka/blob/main/images/8.png)

### 查看隧道
![](https://github.com/YDHCUI/manjusaka/blob/main/images/9.png)

### AI聊天功能
![](https://github.com/YDHCUI/manjusaka/blob/main/images/11.png)
![](https://github.com/YDHCUI/manjusaka/blob/main/images/12.png)


## 更新


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




## 体验地址
   


# 免责声明 
本工具仅面向合法授权的企业安全建设行为，如您需要测试本工具的可用性，请自行搭建靶机环境。

在使用本工具进行检测时，您应确保该行为符合当地的法律法规，并且已经取得了足够的授权。请勿对非授权目标进行扫描。

此工具仅限于安全研究和教学，用户承担因使用此工具而导致的所有法律和相关责任！ 作者不承担任何法律和相关责任！

如您在使用本工具的过程中存在任何非法行为，您需自行承担相应后果，我们将不承担任何法律及连带责任。


## 交流

加V 

![a8e5625b211ad3b3c435e9403ebae9f](https://github.com/YDHCUI/buut/assets/46884495/6c667bb1-7eae-464f-afbd-3f0d67cbcbcb)
