import dayjs from './dayjs-mini.js'

// 兼容 protobufjs 的 Long 对象（大事件为避免深拷贝不做 toObject 转换，
// 64 位整数字段会以 Long 形式出现，Number(Long) 是 NaN）
function toNum(v) {
  if (v == null) return NaN
  if (typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber()
  return Number(v)
}

export function formatTime(ts) {
  if (!ts && ts !== 0) return '-'
  const n = toNum(ts)
  if (isNaN(n)) return '-'

  const ms = n > 1e12 ? n : n * 1000
  return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
}

export function formatSize(bytes) {
  if (bytes == null || bytes === '') return '-'
  const n = toNum(bytes)
  if (isNaN(n) || n < 0) return '-'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

export function platformColor(platform) {
  const p = String(platform || '').toLowerCase()
  if (p.includes('win')) return '#00ff41'
  if (p.includes('linux') || p.includes('unix')) return '#39ff6a'
  if (p.includes('dar') || p.includes('mac') || p.includes('osx')) return '#88ff99'
  return '#2a9d44'
}

export function timeAgo(ts, now) {
  const n = toNum(ts)
  const cur = now == null ? Math.floor(Date.now() / 1000) : now
  if (!isFinite(n) || n <= 0) return { text: '-', seconds: Infinity, alive: false }
  const secs = Math.max(cur - n, 0)
  let text
  if (secs < 60) text = `${secs}s`
  else if (secs < 3600) text = `${Math.floor(secs / 60)}m`
  else if (secs < 86400) text = `${Math.floor(secs / 3600)}h`
  else text = `${Math.floor(secs / 86400)}d`
  return { text, seconds: secs, alive: secs <= 100 }
}

