import http from './index.js'


export function login(data) {
  return http.post('/login', data)
}

export function changePassword(data) {
  return http.post('/password', data)
}

export function getUserProfile() {
  return http.post('/userinfo', {})
}

export function resetUserAuth() {
  return http.post('/resetauth', {})
}


