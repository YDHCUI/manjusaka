import http from './index.js'

export function passList(params = {}) {
  return http.post('/passlist', params)
}

export function passDelete(id) {
  return http.post('/passdelete', { id })
}

export function passUpdate(data) {
  return http.post('/passupdate', data)
}
