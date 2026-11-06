import http from './index.js'

// MCP 接入密钥管理 (per-key 工具权限)
export function mcpKeyList() {
  return http.post('/mcpkeylist', {})
}

export function mcpKeyCreate(data) {
  return http.post('/mcpkeycreate', data)
}

export function mcpKeyUpdate(data) {
  return http.post('/mcpkeyupdate', data)
}

export function mcpKeyDelete(id) {
  return http.post('/mcpkeydelete', { id })
}

// MCP 可用工具元数据 (勾选工具权限用)
export function mcpKeyTools() {
  return http.post('/mcpkeytools', {})
}
