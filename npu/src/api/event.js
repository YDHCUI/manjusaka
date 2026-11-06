import http from './index.js'
import { nps } from '@/utils/nps.js'

// Uint8Array → base64
//
// 原实现逐字节 `binary += String.fromCharCode(u8[i])`：每次拼接都要复制整个
// 累积字符串，复杂度 O(n²)，几十 MB 的 fw 分片就会把主线程卡死几秒。
// 这里按 8KB 分块调用 fromCharCode（参数个数可控，不会爆栈），整体 O(n)。
const B64_CHUNK = 0x8000

function bytesToBase64(uint8) {
  let binary = ''
  for (let i = 0; i < uint8.length; i += B64_CHUNK) {
    binary += String.fromCharCode.apply(null, uint8.subarray(i, i + B64_CHUNK))
  }
  return btoa(binary)
}

function encodeEventBase64(event, uid, sendto) {
  if (!event) return null
  event.id = uid
  event.sendto = sendto
  const errmsg = nps.AgentEvent.verify(event)
  if (errmsg) throw new Error(errmsg)
  const uint8 = nps.AgentEvent.encode(event).finish()
  return bytesToBase64(uint8)
}

export async function sendAgentEvent(event, uid, agentId) {
  const data = encodeEventBase64(event, uid, agentId)
  if (!data) return
  return http.post('/addevent', { id: agentId, data })
}

