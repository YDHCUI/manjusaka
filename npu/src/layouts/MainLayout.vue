<script setup>
import { computed, watch, nextTick, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Monitor,
  Connection,
  Document,
  Key,
  Setting,
  Headset,
  Aim,
  Service,
  Fold,
  Expand,
  SwitchButton,
  User,
  MagicStick,
  Tickets,
  Brush,
  Check,
  List,
  ChatRound,
  Link,
  Box,
} from '@element-plus/icons-vue'
import { useAppStore, THEMES } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import MatrixRain from '@/components/MatrixRain.vue'
import lilyBg from '@/assets/lily/lily-bg.svg'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const menus = [
  { index: '/aichat', title: 'AI渗透', icon: ChatRound },
  { index: '/agents', title: '在线主机', icon: Monitor },
  { index: '/proxy', title: '隧道代理', icon: Connection },
  { index: '/files', title: '敏感文件', icon: Document },
  { index: '/passwords', title: '密码收集', icon: Key },
  { index: '/tasks', title: '任务管理', icon: List },
  { index: '/listeners', title: '连接管理', icon: Headset },
  { index: '/projects', title: '目标设定', icon: Aim },
  { index: '/bots', title: '机器人', icon: Service },
  { index: '/skills', title: '技能管理', icon: MagicStick },
  { index: '/plugins', title: '插件库', icon: Box },
  { index: '/mcpkeys', title: 'MCP密钥', icon: Link },
  { index: '/logs', title: '系统日志', icon: Tickets },
  { index: '/settings', title: '全局设置', icon: Setting },
]

const activeMenu = computed(() => {
  if (route.path.startsWith('/agents')) return '/agents'
  return route.path
})

function routeKey(r) {
  if (r.name === 'AgentDetail') return `agent-${r.params.id}`
  return r.path
}

const keepAliveInclude = computed(() => {
  return appStore.evictAgentId ? ['AgentList'] : ['AgentList', 'AgentDetail']
})

watch(
  () => appStore.evictAgentId,
  async (id) => {
    if (!id) return

    await nextTick()
    await nextTick()
    appStore.clearEvict()
  }
)

function handleSelect(index) {
  if (index !== route.path) {
    router.push(index)
  }
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    type: 'warning',
    confirmButtonText: '退出',
    cancelButtonText: '取消',
  })
    .then(() => {
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}

const clock = ref('00:00:00')
const uptime = ref('00:00:00')
const sessionStart = Date.now()
let clockTimer = null

// license 授权信息展示 (左下角): 授权用户 / 授权时间
const licenseUser = computed(() => appStore.license.user || 'UNLICENSED')
const licenseState = computed(() => appStore.license.state)
const licenseRange = computed(() => {
  const lic = appStore.license
  if (!lic.user) return '基础功能模式'
  const fmt = (ts) => {
    const d = new Date(ts * 1000)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }
  return `${fmt(lic.issued_at)} ~ ${fmt(lic.expire_at)}`
})

function pad(n) {
  return String(n).padStart(2, '0')
}
function updateClock() {
  const d = new Date()
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const diff = Math.floor((Date.now() - sessionStart) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  uptime.value = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  appStore.loadLicense()
})
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <el-container class="layout-wrapper">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '210px'" class="layout-aside">
      <div class="logo" @click="appStore.toggleSidebar()" :title="appStore.sidebarCollapsed ? '展开菜单' : '收起菜单'">
        <el-icon v-if="appStore.sidebarCollapsed" class="logo-toggle-icon"><Expand /></el-icon>
        <template v-else>
          <span class="logo-text">牛屎花</span>
          <el-icon class="logo-fold-icon"><Fold /></el-icon>
        </template>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        background-color="transparent"
        @select="handleSelect"
      >
        <el-menu-item v-for="m in menus" :key="m.index" :index="m.index">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
      
      <div class="sidebar-footer">
        <div class="sidebar-status-line">
          <span class="hud-dot" :class="{ off: !appStore.licenseValid }"></span>
          <span class="license-user" :title="licenseUser">{{ licenseUser }}</span>
        </div>
        <div class="sidebar-license" :class="{ expired: licenseState === 'expired' }">{{ licenseRange }}</div>
        <div class="sidebar-version">v1.0 // 牛屎花</div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar()">
            <component :is="appStore.sidebarCollapsed ? Expand : Fold" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta && route.meta.title">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        
        <div class="header-hud">
          <span class="hud-item">
            <span class="hud-dot"></span>
            <span class="hud-label">SYS</span>
            <span class="hud-val">ONLINE</span>
          </span>
          <span class="hud-sep">│</span>
          <span class="hud-item">
            <span class="hud-label">UPTIME</span>
            <span class="hud-val mono">{{ uptime }}</span>
          </span>
          <span class="hud-sep">│</span>
          <span class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-val mono">{{ clock }}</span>
          </span>
        </div>

        
        <div class="header-agents-stat">
          <span class="ag-item">
            <span class="ag-label">主机</span>
            <span class="ag-val">{{ appStore.agentStats.total }}</span>
          </span>
          <span class="ag-sep">│</span>
          <span class="ag-item">
            <span class="ag-dot on"></span>
            <span class="ag-label">已连接</span>
            <span class="ag-val on">{{ appStore.agentStats.online }}</span>
          </span>
          <span class="ag-sep">│</span>
          <span class="ag-item">
            <span class="ag-dot warn"></span>
            <span class="ag-label">仅心跳</span>
            <span class="ag-val warn">{{ appStore.agentStats.offline }}</span>
          </span>
          <span class="ag-sep">│</span>
          <span class="ag-item">
            <span class="ag-dot danger"></span>
            <span class="ag-label">已超时</span>
            <span class="ag-val danger">{{ appStore.agentStats.timeout }}</span>
          </span>
        </div>

        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="theme-btn">
              <el-icon><Brush /></el-icon>
              <el-tag
                :color="THEMES.find(t => t.value === appStore.theme)?.color || '#ff8c42'"
                effect="dark"
                size="small"
                class="theme-tag"
              >
                {{ THEMES.find(t => t.value === appStore.theme)?.label || '主题' }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="t in THEMES"
                  :key="t.value"
                  @click="appStore.setTheme(t.value)"
                >
                  <span class="theme-option">
                    <span class="theme-icon">{{ t.icon }}</span>
                    <span>{{ t.label }}</span>
                    <el-icon v-if="appStore.theme === t.value" class="theme-check"><Check /></el-icon>
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span class="username">{{ authStore.username || 'admin' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">
                  <el-icon><User /></el-icon> 个人信息
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <div class="main-bg-rain">
          <MatrixRain charset="matrix" color="#3c3f44" head-color="#ff8c42" :font-size="12" :speed="0.8" :opacity="0.06" />
        </div>
        <!-- 曼珠沙华: 右下角背景花丛 (暗色, 衬在内容层之下) -->
        <div class="main-bg-lily" :style="{ backgroundImage: `url(${lilyBg})` }"></div>
        <div class="main-scanline"></div>
        <div class="main-content">
          <router-view v-slot="{ Component, route }">
            <keep-alive :include="keepAliveInclude" :max="12">
              <component :is="Component" :key="routeKey(route)" />
            </keep-alive>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-wrapper {
  height: 100%;
}

.layout-aside {
  background: var(--tk-bg-side);
  border-right: 1px solid var(--tk-border);
  box-shadow: var(--tk-shadow-side);
  transition: width 0.2s;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.logo {
  position: relative;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid var(--tk-border);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  &:hover {
    background: var(--tk-accent-hover);
  }

  .logo-text {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 3px;
    color: var(--tk-accent);
    text-shadow: 0 0 8px var(--tk-accent-glow);
    font-family: 'Consolas', monospace;
  }
  .logo-fold-icon {
    position: absolute;
    right: 12px;
    color: var(--tk-accent-dim);
    font-size: 16px;
  }
  .logo-toggle-icon {
    color: var(--tk-accent);
    font-size: 22px;
    text-shadow: 0 0 8px var(--tk-accent-glow);
  }
}

.layout-aside :deep(.el-menu) {
  border-right: none;
  background: transparent !important;
}
.layout-aside :deep(.el-menu-item) {
  font-family: 'Consolas', monospace;
  letter-spacing: 1px;
  color: var(--tk-accent-dim);
  &:hover {
    background-color: var(--tk-accent-hover) !important;
    color: var(--tk-accent) !important;
  }
  &.is-active {
    background: var(--tk-accent-active) !important;
    color: var(--tk-accent) !important;
    border-left: 2px solid var(--tk-accent);
    text-shadow: 0 0 8px var(--tk-accent-glow);
  }
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px 16px;
  border-top: 1px solid var(--tk-border);
  font-family: 'Consolas', monospace;
  font-size: 11px;
  color: var(--tk-accent-dark);
  letter-spacing: 1px;
  user-select: none;

  .sidebar-status-line {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--tk-accent-dim);
    overflow: hidden;
    .hud-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--tk-accent);
      box-shadow: 0 0 5px var(--tk-accent);
      animation: hud-blink 2s ease-in-out infinite;
      flex-shrink: 0;
      &.off {
        background: #ff3b3b;
        box-shadow: 0 0 5px #ff3b3b;
        animation: none;
      }
    }
    .license-user {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .sidebar-license {
    margin-top: 4px;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &.expired {
      color: #ff3b3b;
      opacity: 0.9;
    }
  }
  .sidebar-version {
    margin-top: 4px;
    opacity: 0.6;
  }
}

.layout-header {
  background: var(--tk-bg-header);
  border-bottom: 1px solid var(--tk-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .collapse-btn {
    font-size: 20px;
    cursor: pointer;
    color: var(--tk-accent-dim);
    &:hover {
      color: var(--tk-accent);
    }
  }

  .header-hud {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Consolas', monospace;
    font-size: 12px;
    color: var(--tk-accent-dim);
    letter-spacing: 1px;
    user-select: none;

    .hud-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .hud-label {
      color: var(--tk-accent-dark);
      font-size: 11px;
    }
    .hud-val {
      color: var(--tk-accent-soft);
      &.mono {
        color: var(--tk-accent);
        text-shadow: 0 0 4px var(--tk-accent-glow);
      }
    }
    .hud-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--tk-accent);
      box-shadow: 0 0 6px var(--tk-accent);
      animation: hud-blink 2s ease-in-out infinite;
    }
    .hud-sep {
      color: var(--tk-border);
      font-size: 14px;
    }
  }

  @keyframes hud-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .header-agents-stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    letter-spacing: 1px;
    user-select: none;

    .ag-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ag-label {
      color: var(--tk-accent-dark);
      font-size: 13px;
    }
    .ag-val {
      color: var(--tk-accent-soft);
      font-weight: 700;
      font-size: 16px;
      &.on { color: var(--tk-accent); }
      &.warn { color: #ffaa00; }
      &.danger { color: #ff3b3b; }
    }
    .ag-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      &.on {
        background: var(--tk-accent);
        box-shadow: 0 0 5px var(--tk-accent);
      }
      &.warn {
        background: #ffaa00;
        box-shadow: 0 0 5px #ffaa00;
      }
      &.danger {
        background: #ff3b3b;
        box-shadow: 0 0 5px #ff3b3b;
      }
    }
    .ag-sep {
      color: var(--tk-border);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right .theme-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: var(--tk-accent-soft);
    font-family: 'Consolas', monospace;
    &:hover {
      color: var(--tk-accent);
    }
    .theme-tag {
      border: none !important;
      color: #fff !important;
      font-size: 12px;
      font-family: 'Consolas', monospace;
    }
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
    .theme-icon { font-size: 16px; }
    .theme-check { margin-left: auto; color: var(--el-color-primary); }
  }

  .header-right .user-info {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: var(--tk-accent-soft);
    font-family: 'Consolas', monospace;
    &:hover {
      color: var(--tk-accent);
    }
    .username {
      font-size: 14px;
    }
  }
}

.layout-main {
  position: relative;
  background: var(--tk-bg-page);
  padding: 0;
  overflow: auto;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      linear-gradient(rgba(255, 140, 66, 0.014) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 140, 66, 0.014) 1px, transparent 1px);
    background-size: 40px 40px, 40px 40px;
  }
}

.main-bg-rain {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 曼珠沙华: 右下角背景花丛, 低透明度氛围层 (z0 在内容层 z1 之下) */
.main-bg-lily {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(560px, 46vw);
  aspect-ratio: 700 / 640;
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: contain;
  z-index: 0;
  pointer-events: none;
  opacity: 0.3;
  filter: brightness(0.85) saturate(0.9);
}

.main-scanline {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(255, 255, 255, 0.02) 3px,
    transparent 4px
  );
}

.main-content {
  position: relative;
  z-index: 1;
  height: 100%;
}
</style>
