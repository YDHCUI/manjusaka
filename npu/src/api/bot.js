import http from './index.js'

export function botList(params = {}) {
  return http.post('/botlist', params)
}

export function botDelete(id) {
  return http.post('/botdelete', { id })
}

export function botUpdate(data) {
  return http.post('/botupdate', data)
}

export function botAction(id, payload = {}) {
  return http.post('/botaction', { id, ...payload })
}

export function botQrCode(id) {
  return http.post('/botqrcode', { id })
}
