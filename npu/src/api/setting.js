import http from './index.js'

export function settingList(params = {}) {
  return http.post('/settinglist', params)
}

export function settingDelete(id) {
  return http.post('/settingdelete', { id })
}

export function settingUpdate(items) {
  return http.post('/settingupdate', items)
}

export function restartNps() {
  return http.post('/restart', {}, { timeout: 10000 })
}

export function getLicenseInfo() {
  return http.post('/licenseinfo', {})
}
