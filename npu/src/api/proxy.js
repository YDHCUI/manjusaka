import http from './index.js'

export function proxyList() {
  return http.post('/proxylist', {})
}

export function proxyAdd(data) {
  return http.post('/proxyadd', data)
}

export function proxyStop(id) {
  return http.post('/proxystop', { id })
}
