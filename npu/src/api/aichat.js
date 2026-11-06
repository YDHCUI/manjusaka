import http from './index.js'

export function sessionList(agentId) {
  return http.post('/chatsessionlist', { agent_id: agentId })
}

export function sessionAll() {
  return http.post('/chatsessionall', {})
}

export function sessionDelete(sessionId) {
  return http.post('/chatsessiondelete', { session_id: sessionId })
}

export function sessionClear(agentId) {
  return http.post('/chatsessionclear', { agent_id: agentId })
}

export function chatLogList(sessionId) {
  return http.post('/chatloglist', { session_id: sessionId })
}

// 查询后台运行中的 AI 会话 (任务独立于页面连接继续执行)
export function runningList() {
  return http.post('/aichatrunning', {})
}

// 查询单个会话是否在后台运行
export function isSessionRunning(sessionId) {
  return http.post('/aichatisrun', { session_id: sessionId })
}
