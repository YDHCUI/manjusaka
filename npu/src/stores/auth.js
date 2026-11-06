import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'

const USER_KEY = 'mjk:user'
const TARGET_KEY = 'mjk:target'

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// 目标项目 id 纯前端保存(按浏览器隔离), 同一账号多处登录互不影响
function loadTarget() {
  try {
    return localStorage.getItem(TARGET_KEY) || ''
  } catch {
    return ''
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadUser(),
    localTarget: loadTarget(),
  }),
  getters: {
    isLogin: (s) => !!s.user,
    username: (s) => (s.user && s.user.username) || '',
    role: (s) => (s.user && s.user.role) || '',
    // 本地已选项目优先, 未选过时回退登录返回的 userpid
    target: (s) => s.localTarget || (s.user && s.user.target) || '',
  },
  actions: {
    setTarget(id) {
      this.localTarget = id
      try {
        localStorage.setItem(TARGET_KEY, id)
      } catch {

      }
    },
    async login(form) {
      const res = await loginApi(form)
      if (res && res.result) {
        this.user = res.result
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(this.user))
        } catch {

        }
      }
      return res
    },
    logout() {
      this.user = null
      try {
        localStorage.removeItem(USER_KEY)
      } catch {

      }
    },
  },
})
