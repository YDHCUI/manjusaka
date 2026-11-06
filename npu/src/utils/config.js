

const STORAGE_KEY = 'mjk:admin'

function readStoredAdmin() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function detectAdminFromPath() {
  const stored = readStoredAdmin()
  if (stored) return stored.replace(/^\/+|\/+$/g, '')

  const path = window.location.pathname || '/'

  const stripped = path.split('/static/')[0]
  const segs = stripped.split('/').filter(Boolean)
  return segs[0] || 'manjusaka'
}

let _admin = ''

export function getAdminPrefix() {
  if (!_admin) {
    _admin = detectAdminFromPath()
  }
  return _admin
}

export function setAdminPrefix(prefix) {
  _admin = String(prefix || '').replace(/^\/+|\/+$/g, '') || 'manjusaka'
  try {
    localStorage.setItem(STORAGE_KEY, _admin)
  } catch {

  }
}

export function getApiBase() {
  return '/' + getAdminPrefix()
}


export function wsUrl(path) {
  if (!path) return ''
  const p = path.startsWith('/') ? path : '/' + path
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return proto + '//' + window.location.host + getApiBase() + p
}



