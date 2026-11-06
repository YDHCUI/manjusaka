<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { wsUrl } from '@/utils/config'

const props = defineProps({
  agentId: { type: String, required: true },
})

const containerRef = ref(null)
const loading = ref(false)
let term = null
let fitAddon = null
let ws = null
let resizeObserver = null

function encodeVarint(n) {
  const out = []
  while (n > 0x7f) {
    out.push((n & 0x7f) | 0x80)
    n >>>= 7
  }
  out.push(n & 0x7f)
  return out
}
function encodeResize(cols, rows) {

  const c = encodeVarint((cols << 1) ^ (cols >> 31))
  const r = encodeVarint((rows << 1) ^ (rows >> 31))
  const body = [1, ...encodeVarint(c.length), ...c, 2, ...encodeVarint(r.length), ...r]

  return [0x12, ...encodeVarint(body.length), ...body]
}
function encodeData(text) {
  const bytes = Array.from(new TextEncoder().encode(text))

  const body = [0x0a, ...encodeVarint(bytes.length), ...bytes]

  return [0x0a, ...encodeVarint(body.length), ...body]
}

function sendResize(cols, rows) {
  if (!ws || ws.readyState !== 1) return
  ws.send(new Uint8Array(encodeResize(cols, rows)))
}

function doConnect() {
  if (!props.agentId) {
    ElMessage.warning('缺少主机ID')
    return
  }
  loading.value = true
  // 连接前把真实终端尺寸带在 URL 上, 服务端随 pty-req 下发,
  // 目标端 ConPTY/PTY 初始宽度即正确, 避免回显在中间错误换行
  const cols = term ? term.cols : 80
  const rows = term ? term.rows : 25
  const url = wsUrl(`/webproxy/ssh/${props.agentId}?cols=${cols}&rows=${rows}`)
  ws = new WebSocket(url)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    loading.value = false
    if (term) {
      term.writeln('\r\n\x1b[32m[已连接]\x1b[0m')
      nextTick(() => {
        fitAddon && fitAddon.fit()
        const dims = term.cols + 'x' + term.rows
        sendResize(term.cols, term.rows)
        term.focus()
      })
    }
  }

  ws.onmessage = (evt) => {
    if (!term) return
    let text
    if (typeof evt.data === 'string') {
      text = evt.data
    } else {
      const arr = new Uint8Array(evt.data)
      text = new TextDecoder().decode(arr)
    }
    term.write(text)
  }

  ws.onerror = () => {
    loading.value = false
    if (term) term.writeln('\r\n\x1b[31m[连接错误]\x1b[0m')
  }

  ws.onclose = () => {
    loading.value = false
    if (term) term.writeln('\r\n\x1b[33m[连接已断开]\x1b[0m')
  }
}

function initTerminal() {
  term = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: '#000000',
      foreground: '#c8c8c8',
      cursor: '#c8c8c8',
      selectionBackground: 'rgba(255, 255, 255, 0.25)',
    },
  })
  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(containerRef.value)
  try {
    fitAddon.fit()
  } catch {

  }

  term.onData((data) => {
    if (ws && ws.readyState === 1) {
      ws.send(new Uint8Array(encodeData(data)))
    }
  })

  resizeObserver = new ResizeObserver(() => {
    if (fitAddon && term) {
      try {
        fitAddon.fit()
        sendResize(term.cols, term.rows)
      } catch {

      }
    }
  })
  resizeObserver.observe(containerRef.value)
}

function reconnect() {
  if (ws) {
    try {
      ws.close()
    } catch {

    }
    ws = null
  }
  if (term) term.clear()
  doConnect()
}

onMounted(() => {
  nextTick(() => {
    initTerminal()
    doConnect()
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (ws) {
    try {
      ws.close()
    } catch {

    }
    ws = null
  }
  if (term) {
    term.dispose()
    term = null
  }
})

defineExpose({ reconnect })
</script>

<template>
  <div class="terminal-page">
    <div ref="containerRef" class="terminal-wrapper" v-loading="loading"></div>
    <el-button class="reconnect-btn" size="small" type="primary" @click="reconnect">重连</el-button>
  </div>
</template>

<style scoped>
.terminal-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.terminal-wrapper {
  flex: 1;
  min-height: 0;
  padding: 6px;
}
.reconnect-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}
</style>
