import { defineStore } from 'pinia'
import { getLicenseInfo } from '@/api/setting'

const COLLAPSE_KEY = 'mjk:sidebarCollapsed'
const THEME_KEY = 'mjk:theme'

export const THEMES = [
  { value: 'hacker', label: '默认主题', icon: '🖥️', color: '#ff8c42' },
  { value: 'business', label: '商务风', icon: '💼', color: '#3b6fd4' },
  { value: 'pink', label: '少女粉', icon: '🌸', color: '#ff6b9d' },
  { value: 'tech', label: '科技蓝', icon: '🔵', color: '#00d4ff' },
]

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem(COLLAPSE_KEY) === '1',

    evictAgentId: null,

    agentStats: { total: 0, online: 0, offline: 0, timeout: 0 },

    // license 授权信息 (state: none 无授权 / valid 有效 / expired 已过期)
    license: { user: '', issued_at: 0, expire_at: 0, state: 'none' },

    theme: localStorage.getItem(THEME_KEY) || 'hacker',
  }),
  getters: {
    licenseValid: (state) => state.license.state === 'valid',
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem(COLLAPSE_KEY, this.sidebarCollapsed ? '1' : '0')
    },

    requestEvict(agentId) {
      this.evictAgentId = agentId
    },

    clearEvict() {
      this.evictAgentId = null
    },

    setAgentStats(stats) {
      this.agentStats = stats
    },

    setTheme(theme) {
      this.theme = theme
      localStorage.setItem(THEME_KEY, theme)
      document.documentElement.setAttribute('data-theme', theme)
    },

    initTheme() {
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    async loadLicense() {
      try {
        const res = await getLicenseInfo()
        // 后端 ApiResponse 结构为 { code, message, result }
        if (res && res.result) {
          this.license = { ...this.license, ...res.result }
        }
      } catch {
        // 接口异常时保持默认 (无授权), 不影响其它功能
      }
    },
  },
})
