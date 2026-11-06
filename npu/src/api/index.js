import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getApiBase } from '@/utils/config'

const service = axios.create({
  baseURL: getApiBase(),
  withCredentials: true,
})

service.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }

    if (res == null || typeof res !== 'object') {
      return res
    }
    if (res.code === 200) {
      return res
    }

    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message || '未登录'))
    }
    const msg = res.message || res.msg || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(new Error(msg))
  },
  (error) => {
    const status = error.response && error.response.status
    if (status === 401) {
      handleUnauthorized()
    } else if (status === 404) {
      ElMessage.error('接口不存在 (404)，请检查 admin 前缀配置')
    } else {
      const msg = (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) || error.message || '网络错误'
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

let redirecting = false
function isOnLoginPage() {
  const hash = window.location.hash || ''
  const path = window.location.pathname || ''
  return /#\/login\b/.test(hash) || /(^|\/)login\b/.test(path)
}
function handleUnauthorized() {

  if (isOnLoginPage()) return
  if (redirecting) return
  redirecting = true
  ElMessage.warning('登录已过期，请重新登录')
  try {
    localStorage.removeItem('mjk:user')
  } catch {

  }
  setTimeout(() => {
    redirecting = false
    window.location.hash = '#/login'
    window.location.reload()
  }, 500)
}

export default service
