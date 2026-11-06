# Manjusaka 管理前端 (npu)

基于 Vue 3 + Element Plus + Vite 构建的管理控制台前端，编译产物会被 Rust 后端通过 `rust-embed` 嵌入，最终以单二进制方式发布。

## 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **Vue Router 4** (hash 路由)
- **Pinia** 状态管理
- **Element Plus** UI 组件库
- **@xterm/xterm** 终端模拟
- **Axios** HTTP 客户端
- **Vite** 构建

## 目录结构

```
npu/
├── src/
│   ├── api/              # 接口封装 (对应后端各模块)
│   ├── components/       # 通用组件
│   │   ├── terminal/     # 虚拟终端 (xterm + websocket)
│   │   ├── filemanager/  # 文件管理 (SFTP)
│   │   └── desktop/      # 虚拟桌面 (VNC/GDI/RDP)
│   ├── layouts/          # 主布局 (可收放左侧菜单)
│   ├── router/           # 路由 (含登录守卫)
│   ├── stores/           # Pinia (auth / app)
│   ├── styles/           # 全局样式
│   ├── utils/            # 工具 (config / format)
│   └── views/            # 页面
│       ├── agent/        # 在线主机 (列表 + 详情)
│       ├── proxy/        # 隧道代理
│       ├── file/         # 敏感文件
│       ├── password/     # 密码收集
│       ├── setting/      # 全局设置
│       ├── listen/       # 监听器
│       ├── project/      # 目标设定
│       └── bot/          # 机器人
├── index.html
├── vite.config.js
└── package.json
```

## 开发

```bash
cd npu
npm install
npm run dev      # 启动开发服务器 http://localhost:5173
```

开发模式下，`vite.config.js` 已配置代理：所有 `/manjusaka` 开头的请求(含 websocket)会被转发到 `https://127.0.0.1:33000`。请按需修改后端地址。

> 注意：后端 admin 前缀由数据库 `settings` 表的 `nps.admin` 决定(默认 `manjusaka`)。若修改了该值，请同步修改 `vite.config.js` 的代理路径，或在登录页点击「Admin 前缀设置」配置。

## 构建

```bash
npm run build    # 产物输出到 dist/
```

构建使用相对路径 (`base: './'`)，因此产物可被嵌入到后端任意 admin 前缀路径下(如 `/manjusaka/static/`)。后端在 `nps/src/npu/mod.rs` 中通过 `rust-embed` 嵌入 `../npu/dist`。

## 后端集成

后端路由 (`nps/src/npu/mod.rs`)：

```rust
.at("/", EmbeddedFileEndpoint::<Dist>::new("index.html"))  // 首页
.nest("/static/", EmbeddedFilesEndpoint::<Dist>::new())     // 静态资源
.nest("/", api_service.with(AuthMiddleware));               // API
```

访问方式：`https://<host>:<nps.listen端口>/<admin前缀>/` ，例如 `https://1.2.3.4:33000/manjusaka/`。

## 功能模块

| 菜单 | 路由 | 说明 |
|------|------|------|
| 在线主机 | `/agents` | 主机列表，点击「连接」在新标签页打开详情 |
| 主机详情 | `/agents/:id` | 详情/虚拟终端/文件管理/虚拟桌面 四个 Tab |
| 隧道代理 | `/proxy` | SOCKS / 端口转发代理管理 |
| 敏感文件 | `/files` | 采集文件与上传文件 |
| 密码收集 | `/passwords` | 凭据管理 |
| 全局设置 | `/settings` | 系统配置项 |
| 监听器 | `/listeners` | 监听器增删启停 |
| 目标设定 | `/projects` | 项目管理与当前目标切换 |
| 机器人 | `/bots` | 消息机器人配置 |

## 认证

采用 Cookie Session 方式(由后端 `poem` session 中间件管理)，前端只需 `withCredentials: true`，无需手动携带 token。未登录时后端返回 `code: 401`，前端自动跳转登录页。
