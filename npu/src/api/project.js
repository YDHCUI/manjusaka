import http from './index.js'

export function projectList(params = {}) {
  return http.post('/projectlist', params)
}

export function projectDelete(id) {
  return http.post('/projectdelete', { id })
}

export function projectUpdate(data) {
  return http.post('/projectupdate', data)
}
