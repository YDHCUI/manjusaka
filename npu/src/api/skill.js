import http from './index.js'

export function skillList(keyword) {
  return http.post('/skilllist', { keyword: keyword || undefined })
}

export function skillInfo(name) {
  return http.post('/skillinfo', { name })
}

export function skillCreate(data) {

  return http.post('/skillcreate', data)
}

export function skillUpdate(data) {

  return http.post('/skillupdate', data)
}

export function skillDelete(name) {
  return http.post('/skilldelete', { name })
}

export function validateSkillName(name) {
  const t = (name || '').trim()
  if (!t) return '名称不能为空'
  let s = t
  if (s.toLowerCase().endsWith('.md')) {
    s = s.slice(0, -3).trim()
  }
  if (!s) return '名称不能为空'
  if (s.length > 128) return '名称过长'
  if (s.includes('..') || s.includes('/') || s.includes('\\')) {
    return '名称不能包含路径或 ..'
  }
  if (/[\x00-\x1f\x7f]/.test(s)) return '名称不能包含控制字符'
  if (/[<>:"|?*]/.test(s)) return '名称不能包含保留字符'
  if (s.startsWith('.') || s.endsWith('.') || s.endsWith(' ')) {
    return '名称不能以 . 开头或结尾，不能以空格结尾'
  }
  return null
}

export function skillFileBody(row) {
  return (row && row.prompts && row.prompts[0]) || ''
}
