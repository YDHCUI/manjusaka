import http from './index.js'

export function listenList(params = {}) {
  return http.post('/listenlist', params)
}

export function listenDelete(id) {
  return http.post('/listendelete', { id })
}

export function listenUpdate(data) {
  return http.post('/listenupdate', data)
}

export function listenAction(id, isrun) {
  return http.post('/listenaction', { id, isrun })
}

// 直接下载 npc2 独立 exe/elf (嵌指定监听器 DNA), 返回 blob
export function npc2Download(data) {
  return http.post('/npc2download', data, { responseType: 'blob' })
}
