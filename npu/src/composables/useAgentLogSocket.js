import { ref, onBeforeUnmount } from 'vue'
import { nps } from '@/utils/nps.js'
import { wsUrl } from '@/utils/config'

let sharedUid = null
let sharedWs = null
let sharedConnected = null
let sharedLastEvent = null
let refCount = 0

function generateUid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  )
}

function ensureShared() {
  if (sharedWs) return
  sharedUid = generateUid()
  sharedConnected = ref(false)
  sharedLastEvent = ref(null)
  const url = wsUrl(`/webproxy/log/${sharedUid}`)
  try {
    sharedWs = new WebSocket(url)
  } catch {
    sharedWs = null
    return
  }
  sharedWs.binaryType = 'arraybuffer'

  sharedWs.onopen = () => {
    sharedConnected.value = true
  }
  sharedWs.onclose = () => {
    sharedConnected.value = false
  }
  sharedWs.onerror = () => {
    sharedConnected.value = false
  }
  sharedWs.onmessage = (evt) => {
    decodeMessage(evt.data)
  }
}

function decodeMessage(data) {
  try {
    let bytes
    if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data)
    } else if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => {
        decodeBytes(new Uint8Array(buf))
      })
      return
    } else {
      return
    }
    decodeBytes(bytes)
  } catch {

  }
}

// 大事件阈值：超过这个体积不再做 toObject 深拷贝
//
// nps 侧已经把文件分片内容从推送里剥离（见 slim_event），这里是第二道防线：
// protobufjs 的 decode 只解析字段头、bytes 字段是原 buffer 的视图（零拷贝），
// 而 toObject({defaults:true}) 会把每个 bytes 字段复制一份新数组，
// 几十 MB 的事件足以让主线程卡住甚至 OOM。
const LARGE_EVENT_BYTES = 1024 * 1024

function decodeBytes(bytes) {
  try {
    const event = nps.AgentEvent.decode(bytes)
    // 大事件直接用 protobuf 消息对象（字段语义一致，bytes 为视图不复制）
    sharedLastEvent.value =
      bytes.length > LARGE_EVENT_BYTES
        ? event
        : nps.AgentEvent.toObject(event, {
            bytes: Uint8Array,
            longs: Number,
            enums: String,
            defaults: true,
          })
  } catch {

  }
}

export function useAgentLogSocket() {
  ensureShared()
  refCount++

  function connect() {
    ensureShared()
  }

  function disconnect() {

    refCount = Math.max(0, refCount - 1)
    if (refCount === 0 && sharedWs) {
      try {
        sharedWs.close()
      } catch {

      }
      sharedWs = null
      sharedUid = null
      if (sharedConnected) sharedConnected.value = false
      // 释放最后一条事件：可能是几百 MB 的 Uint8Array 视图，持有整个 buffer
      if (sharedLastEvent) sharedLastEvent.value = null
    }
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    uid: sharedUid,
    connected: sharedConnected || ref(false),
    lastEvent: sharedLastEvent || ref(null),
    connect,
    disconnect,
  }
}
