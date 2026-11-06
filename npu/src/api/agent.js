import http from './index.js'

export function agentList() {
  return http.get('/agentget')
}

export function agentDelete(id) {
  return http.post('/agentdel', { id })
}

export function agentStop(id) {
  return http.post('/npc2stop', { id })
}

export function agentInfo(id) {
  return http.post('/agentinfo', { id })
}

export function agentNote(id, data) {
  return http.post('/agentnote', { id, data })
}

export function generatePayload(data) {

  if (typeof data === 'string') {
    return http.post('/npc1uri', { id: '', data })
  }
  return http.post('/npc1uri', data)
}

export function pluginList() {
  return http.post('/pluglist', {})
}

export function sftpReadDir(aid, path) {
  return http.post(`/sftp/read_dir/${aid}`, { id: '', path })
}


export function sftpRemove(aid, type, path) {
  return http.post(`/sftp/remove/${aid}`, { id: type, path })
}

export function sftpRename(aid, oldPath, newPath) {
  return http.post(`/sftp/rename/${aid}`, { id: oldPath, path: newPath })
}

export function sftpUploadUrl(aid) {
  return `/sftp/upload/${aid}`
}

export function sftpDownloadPath(aid, path) {
  return `/sftp/download?id=${encodeURIComponent(aid)}&path=${encodeURIComponent(path)}`
}

export function agentAiChat(id, data) {
  return http.post('/agentaichat', { id, data })
}

export function taskList(id) {
  return http.post('/tasklist', { id })
}

export function taskQuery(id) {
  return http.post('/taskquery', { id })
}

export function taskAll() {
  return http.post('/taskall', {})
}

export function taskDeleteGlobal(agentId, index) {
  return http.post('/taskdelglobal', { agent_id: agentId, index })
}

export function taskReorder(agentId, from, to) {
  return http.post('/taskreorder', { agent_id: agentId, from, to })
}

export function taskDispatch(agentId, index) {
  return http.post('/taskdispatch', { agent_id: agentId, index })
}

export function taskDeleteAgent(id, taskId) {
  return http.post('/taskdelagent', { id, task_id: taskId })
}

export function agentProcList(id) {
  return http.post('/procList', { id })
}

export function agentProcKill(id, pid) {
  return http.post('/procKill', { id, pid })
}

// target 为前端当前目标项目 id, agent 归属项目查不到时后端回退使用
export function agentProcInject(id, pid, target = '') {
  return http.post('/procInject', { id, pid, target })
}

export function agentPersist(id, action, method, name, cmd, trigger) {
  return http.post('/persist', { id, action, method, name, cmd, trigger })
}

export function agentNetList(id) {
  return http.post('/netList', { id })
}

// NPC 配置（归属项目）：查询 / 修改（含回调地址队列）
export function npc1ConfGet(id) {
  return http.post('/npc1conf', { id })
}

export function npc1ConfSet(data) {
  return http.post('/npc1confset', data)
}

// target 为前端当前目标项目 id
export function agentScreen(id, target = '') {
  return http.post('/screen', { id, target })
}
