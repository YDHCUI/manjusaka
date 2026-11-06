import http from './index.js'

export function logTail(offset = null) {
  return http.post('/logtail', { offset }).then((res) => res && res.result)
}

export function logClear() {
  return http.post('/logclear').then((res) => res && res.result)
}

export function setLogLevel(level) {
  return http.post('/loglevel', { level }).then((res) => res && res.result)
}
