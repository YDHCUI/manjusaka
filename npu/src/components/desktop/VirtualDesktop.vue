<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { wsUrl } from '@/utils/config'

const props = defineProps({
  agentId: { type: String, required: true },

  mode: { type: String, default: 'vnc' },

  // 目标主机平台，用于判断是否为 Windows（仅 Windows 显示 RDP）
  platform: { type: String, default: '' },
})
const emit = defineEmits(['update:mode'])

// 仅 Windows 主机才提供 RDP 协议切换
const isWindows = computed(() =>
  (props.platform || '').toLowerCase().includes('windows'),
)
const desktopModes = computed(() => {
  const modes = [{ label: 'VNC', value: 'vnc' }]
  if (isWindows.value) modes.push({ label: 'RDP', value: 'rdp' })
  return modes
})

const wrapperRef = ref(null)
const stageRef = ref(null)
const cursorLayerRef = ref(null)
const statusRef = ref('未连接')
const connected = ref(false)
const fullscreen = ref(false)
const viewOnly = ref(false)

let rfb = null

// VNC 悬浮鼠标：跟随本地指针，点击时显示涟漪，便于看到点了哪里
let localCursorHandlers = null

// 按键丢失安全网：最后已知 buttons 状态（1左 2右 4中）
// 浏览器在某些场景（窗口失焦/系统弹窗/Alt+Tab/指针移出浏览器）不会派发
// mouseup，导致远端按键卡在按下状态。这里追踪状态并在丢失场景主动合成释放。
let lastButtons = 0
let lostInputGuard = null

// 鼠标位置/点击状态 HUD（显示在画布上的一层）
const cursorPos = ref({ x: 0, y: 0 })
const cursorStatus = ref('空闲')
const cursorActive = ref(false)

// 模拟鼠标红点（模板渲染，跟随本地指针）：
// VNC 服务端不采集光标（帧里没有远程鼠标），需要在画面上叠加一个模拟光标。
// 远端光标形状已渲染时（RDP 指针/未来 VNC 服务端光标）隐藏，避免双光标。
const dotVisible = computed(
  () => connected.value && cursorActive.value && !remoteCursorActive.value,
)

// 点击涟漪（模板渲染的响应式列表，动画结束后自动移除）
let rippleSeq = 0
const ripples = ref([])
function spawnRipple(x, y) {
  const id = ++rippleSeq
  ripples.value.push({ id, x, y })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 700)
}

// 按下状态：点击时红点缩小反馈
const cursorPressed = ref(false)

// 远端光标是否已渲染：
// - VNC：服务端发送光标形状（_cursorImage.w>0）则为 true；
//   否则强制使用本地光标层（圆点选项虽启用，但 3px 圆点过小，
//   同时关闭内置圆点避免双光标）
// - RDP：收到指针更新则为 true，指针隐藏为 false
const remoteCursorActive = ref(false)

// VNC 服务端光标支持探测：服务端光标形状会随帧更新到达，
// 连接后轮询 _cursorImage（noVNC 私有字段，向后兼容用可选链）
let vncCursorPoll = null
function startVncCursorPoll() {
  stopVncCursorPoll()
  vncCursorPoll = setInterval(() => {
    if (!rfb) { stopVncCursorPoll(); return }
    const img = rfb._cursorImage
    if (img && img.w > 0) {
      // 服务端支持光标：切回远程光标，隐藏本地蓝点
      remoteCursorActive.value = true
      if (!rfb.showDotCursor) rfb.showDotCursor = true
      stopVncCursorPoll()
    }
  }, 2000)
}
function stopVncCursorPoll() {
  if (vncCursorPoll) {
    clearInterval(vncCursorPoll)
    vncCursorPoll = null
  }
}

// RDP 凭据对话框状态
const rdpCredDialog = ref({
  visible: false,
  username: '',
  password: '',
})

// rustrdp-wasm 会话
let rdpInit = null       // wasm init() 返回 (默认导出)
let rdpController = null  // RdpController 实例 (键盘/鼠标输入)
let rdpCanvas = null     // RDP 渲染 canvas
let rdpResizeObserver = null
let rdpConnecting = false // RDP 连接进行中标志（用于位图回调判定首次连接）
let rdpWs = null          // rustrdp-wasm 内部创建的 WebSocket 实例（用于断开时安全清理）
let rdpSessionEpoch = 0   // 会话纪元：每次连接/断开递增，用于过滤过期回调

import RFB from '@novnc/novnc/core/rfb.js'

// 将任意错误对象（含 WASM/JsValue 抛出的非 Error 对象）格式化为可读字符串
function formatError(e) {
  if (e == null) return '未知错误'
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message || e.toString()

  // WASM/JsValue 错误：尝试常见字段
  const msg = e.message || e.reason || e.description || e.error?.message
  if (msg) return String(msg)
  try {
    const s = JSON.stringify(e)
    if (s && s !== '{}') return s
  } catch {
    /* ignore */
  }
  return String(e)
}

async function connectVnc() {
  if (!wrapperRef.value) return
  disconnect()
  statusRef.value = '连接中...'
  try {

    // 不使用 innerHTML='' 清空 — Vue 管理的 .canvas-mask 会在 connected=true 时自动移除
    // disconnect() 已清理旧会话

    viewOnly.value = true
    const action = props.mode || 'vnc'
    const url = wsUrl(`/webproxy/${action}/${props.agentId}`)
    rfb = new RFB(wrapperRef.value, url, {
      credentials: {},
      shared: false,
      repeaterID: '',
      showDotCursor: true,
      scaleViewport: true,
    })

    rfb.addEventListener('connect', () => {
      connected.value = true
      statusRef.value = '已连接'
      rfb.viewOnly = viewOnly.value
      // 圆点光标选项已启用（构造参数）；服务端不支持光标形状时（现状），
      // noVNC 只会显示 3px 圆点且过小 — 改为强制本地光标层，
      // 关闭内置圆点避免双光标；若探测到服务端光标则自动切回
      remoteCursorActive.value = false
      if (rfb.showDotCursor) rfb.showDotCursor = false
      startVncCursorPoll()
    })

    rfb.addEventListener('disconnect', (e) => {
      connected.value = false
      stopVncCursorPoll()
      remoteCursorActive.value = false
      statusRef.value = '已断开'
      if (e && e.detail && e.detail.clean === false) {
        ElMessage.error('远程桌面连接已断开')
      }
      rfb = null
    })

    rfb.addEventListener('credentialsrequired', () => {
      const password = window.prompt('请输入 VNC 密码:')
      if (password !== null && rfb) {
        rfb.sendCredentials({ password })
      }
    })

    rfb.addEventListener('securityfailure', (e) => {
      statusRef.value = '认证失败'
      ElMessage.error('VNC 认证失败: ' + (e?.detail?.reason || ''))
    })

    rdpResizeObserver = new ResizeObserver(() => {
      if (rfb && !rfb.viewOnly) {
        rfb.scaleViewport = true
      }
    })
    rdpResizeObserver.observe(wrapperRef.value)
  } catch (e) {
    statusRef.value = '连接失败'
    ElMessage.error('VNC 连接失败: ' + formatError(e))
  }
}

// ── rustrdp-wasm 渲染与输入 ──────────────────────────────────────────────
// 键盘 scancode 映射表（参考 libs/rustrdp/static/index.html）
const RDP_KEYMAP = {
  Escape: 0x0001, Digit1: 0x0002, Digit2: 0x0003, Digit3: 0x0004,
  Digit4: 0x0005, Digit5: 0x0006, Digit6: 0x0007, Digit7: 0x0008,
  Digit8: 0x0009, Digit9: 0x000a, Digit0: 0x000b, Minus: 0x000c,
  Equal: 0x000d, Backspace: 0x000e, Tab: 0x000f,
  KeyQ: 0x0010, KeyW: 0x0011, KeyE: 0x0012, KeyR: 0x0013,
  KeyT: 0x0014, KeyY: 0x0015, KeyU: 0x0016, KeyI: 0x0017,
  KeyO: 0x0018, KeyP: 0x0019, BracketLeft: 0x001a, BracketRight: 0x001b,
  Enter: 0x001c, ControlLeft: 0x001d,
  KeyA: 0x001e, KeyS: 0x001f, KeyD: 0x0020, KeyF: 0x0021,
  KeyG: 0x0022, KeyH: 0x0023, KeyJ: 0x0024, KeyK: 0x0025,
  KeyL: 0x0026, Semicolon: 0x0027, Quote: 0x0028, Backquote: 0x0029,
  ShiftLeft: 0x002a, Backslash: 0x002b,
  KeyZ: 0x002c, KeyX: 0x002d, KeyC: 0x002e, KeyV: 0x002f,
  KeyB: 0x0030, KeyN: 0x0031, KeyM: 0x0032,
  Comma: 0x0033, Period: 0x0034, Slash: 0x0035, ShiftRight: 0x0036,
  NumpadMultiply: 0x0037, AltLeft: 0x0038, Space: 0x0039, CapsLock: 0x003a,
  F1: 0x003b, F2: 0x003c, F3: 0x003d, F4: 0x003e, F5: 0x003f,
  F6: 0x0040, F7: 0x0041, F8: 0x0042, F9: 0x0043, F10: 0x0044,
  ScrollLock: 0x0046,
  Numpad7: 0x0047, Numpad8: 0x0048, Numpad9: 0x0049,
  NumpadSubtract: 0x004a, Numpad4: 0x004b, Numpad5: 0x004c,
  Numpad6: 0x004d, NumpadAdd: 0x004e, Numpad1: 0x004f,
  Numpad2: 0x0050, Numpad3: 0x0051, Numpad0: 0x0052,
  NumpadDecimal: 0x0053, F11: 0x0057, F12: 0x0058, NumpadEqual: 0x0059,
  // 扩展键 (0xE0xx)
  NumpadEnter: 0xe01c, ControlRight: 0xe01d, NumpadDivide: 0xe035,
  PrintScreen: 0xe037, AltRight: 0xe038, NumLock: 0xe045,
  Pause: 0xe046, Home: 0xe047, ArrowUp: 0xe048, PageUp: 0xe049,
  ArrowLeft: 0xe04b, ArrowRight: 0xe04d, End: 0xe04f,
  ArrowDown: 0xe050, PageDown: 0xe051, Insert: 0xe052,
  Delete: 0xe053, MetaLeft: 0xe05b, MetaRight: 0xe05c,
  ContextMenu: 0xe05d,
  IntlRo: 0x0073, KanaMode: 0x0070, IntlYen: 0x007d,
  Convert: 0x0079, NonConvert: 0x007b,
}
const RDP_KBDFLAGS_EXTENDED = 0x0100

function rdpCodeToScancode(code) {
  const v = RDP_KEYMAP[code]
  if (!v) return null
  if (v >= 0xe000) return { flags: RDP_KBDFLAGS_EXTENDED, scancode: v & 0xff }
  return { flags: 0, scancode: v }
}

// 服务器端鼠标指针缓存
const rdpPointerCache = new Map()

function rdpOnPointerHide() {
  if (rdpCallbackEpoch !== rdpSessionEpoch) return
  if (rdpCanvas) rdpCanvas.style.cursor = 'none'
  remoteCursorActive.value = false
}
function rdpOnPointerCached(idx) {
  if (rdpCallbackEpoch !== rdpSessionEpoch) return
  const css = rdpPointerCache.get(idx)
  if (css && rdpCanvas) rdpCanvas.style.cursor = css
  if (css) remoteCursorActive.value = true
}
function rdpOnPointerUpdate(idx, xorBpp, hotX, hotY, w, h, andMask, xorData) {
  if (rdpCallbackEpoch !== rdpSessionEpoch) return
  const css = buildRdpCursorCss(xorBpp, hotX, hotY, w, h, andMask, xorData)
  if (!css) return
  rdpPointerCache.set(idx, css)
  if (rdpCanvas) rdpCanvas.style.cursor = css
  remoteCursorActive.value = true
}

// 将 RDP 指针掩码数据转为 CSS cursor url
function buildRdpCursorCss(xorBpp, hotX, hotY, w, h, andMask, xorData) {
  if (w <= 0 || h <= 0) return null
  const off = document.createElement('canvas')
  off.width = w; off.height = h
  const octx = off.getContext('2d')
  const img = octx.createImageData(w, h)
  const px = img.data

  const andStride = ((w + 15) >> 4) << 1
  const andBit = (x, y) => {
    const srcY = h - 1 - y
    const o = srcY * andStride + (x >> 3)
    if (o >= andMask.length) return 1
    return (andMask[o] >> (7 - (x & 7))) & 1
  }

  if (xorBpp === 1) {
    const xorStride = andStride
    for (let y = 0; y < h; y++) {
      const srcY = h - 1 - y
      for (let x = 0; x < w; x++) {
        const a = andBit(x, y)
        const xo = xorStride * srcY + (x >> 3)
        const xb = xo < xorData.length ? (xorData[xo] >> (7 - (x & 7))) & 1 : 0
        const o = (y * w + x) << 2
        if (a === 0 && xb === 0) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 255 }
        else if (a === 0 && xb === 1) { px[o] = 255; px[o + 1] = 255; px[o + 2] = 255; px[o + 3] = 255 }
        else if (a === 1 && xb === 0) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0 }
        else { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 255 }
      }
    }
  } else if (xorBpp === 32) {
    const stride = w * 4
    for (let y = 0; y < h; y++) {
      const srcY = h - 1 - y
      for (let x = 0; x < w; x++) {
        const s = srcY * stride + x * 4
        const o = (y * w + x) << 2
        if (s + 3 >= xorData.length) { px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0; continue }
        const b = xorData[s], g = xorData[s + 1], r = xorData[s + 2], a = xorData[s + 3]
        if (a !== 0) { px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = a }
        else if (andBit(x, y) === 0) { px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255 }
        else { px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0 }
      }
    }
  } else if (xorBpp === 24) {
    const stride = ((w * 3 + 1) >> 1) << 1
    for (let y = 0; y < h; y++) {
      const srcY = h - 1 - y
      for (let x = 0; x < w; x++) {
        const s = srcY * stride + x * 3
        const o = (y * w + x) << 2
        if (s + 2 >= xorData.length) { px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0; continue }
        if (andBit(x, y) === 0) { px[o] = xorData[s + 2]; px[o + 1] = xorData[s + 1]; px[o + 2] = xorData[s]; px[o + 3] = 255 }
        else { px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0 }
      }
    }
  } else {
    return null
  }

  octx.putImageData(img, 0, 0)
  const dataUrl = off.toDataURL('image/png')
  const hx = Math.max(0, Math.min(w - 1, hotX | 0))
  const hy = Math.max(0, Math.min(h - 1, hotY | 0))
  return `url("${dataUrl}") ${hx} ${hy}, default`
}

// WebCodecs H.264 解码器
let rdpH264Dec = null
let rdpH264Timestamp = 0
const rdpH264FramePos = new Map()

function rdpH264Supported() {
  // 部分 Chromium 套壳浏览器存在残缺的 WebCodecs (有 VideoDecoder 构造器
  // 但缺静态/实例方法), 连 prototype.configure 一起验证
  return (
    typeof VideoDecoder !== 'undefined' &&
    typeof EncodedVideoChunk !== 'undefined' &&
    typeof VideoDecoder.prototype.configure === 'function'
  )
}

function rdpCreateH264Decoder(width, height) {
  if (!rdpH264Supported()) return null
  try {
    const decoder = new VideoDecoder({
      output(frame) {
        const pos = rdpH264FramePos.get(frame.timestamp)
        rdpH264FramePos.delete(frame.timestamp)
        const x = pos ? pos.x : 0
        const y = pos ? pos.y : 0
        if (rdpCallbackEpoch === rdpSessionEpoch && rdpCanvas) {
          const ctx = rdpCanvas.getContext('2d')
          if (ctx) ctx.drawImage(frame, x, y)
        }
        frame.close()
      },
      error(e) {
        console.warn('WebCodecs H.264 decoder error:', e)
      },
    })
    decoder.configure({
      codec: 'avc1.42E01E',
      codedWidth: width,
      codedHeight: height,
      optimizeForLatency: true,
    })
    return decoder
  } catch (e) {
    console.warn('create H264 decoder err:', e)
    return null
  }
}

// Web Audio PCM 调度器
let rdpAudioCtx = null
let rdpAudioNextAt = 0
const RDP_AUDIO_LOOKAHEAD = 0.15
const RDP_AUDIO_MAX_QUEUE = 2.0

function rdpOnAudio(sampleRate, channels, bitsPerSample, uint8Data) {
  if (rdpCallbackEpoch !== rdpSessionEpoch) return
  if (!rdpAudioCtx || rdpAudioCtx.state === 'closed') return
  const bytesPerSample = bitsPerSample >> 3
  const numSamples = uint8Data.byteLength / (channels * bytesPerSample)
  if (numSamples === 0) return

  const audioBuf = rdpAudioCtx.createBuffer(channels, numSamples, sampleRate)
  if (bitsPerSample === 16) {
    const int16 = new Int16Array(uint8Data.buffer, uint8Data.byteOffset, uint8Data.byteLength >> 1)
    for (let ch = 0; ch < channels; ch++) {
      const out = audioBuf.getChannelData(ch)
      for (let i = 0; i < numSamples; i++) out[i] = int16[i * channels + ch] / 32768.0
    }
  } else if (bitsPerSample === 8) {
    for (let ch = 0; ch < channels; ch++) {
      const out = audioBuf.getChannelData(ch)
      for (let i = 0; i < numSamples; i++) out[i] = (uint8Data[i * channels + ch] - 128) / 128.0
    }
  }

  const src = rdpAudioCtx.createBufferSource()
  src.buffer = audioBuf
  src.connect(rdpAudioCtx.destination)
  const now = rdpAudioCtx.currentTime
  if (rdpAudioNextAt < now + RDP_AUDIO_LOOKAHEAD) rdpAudioNextAt = now + RDP_AUDIO_LOOKAHEAD
  if (rdpAudioNextAt > now + RDP_AUDIO_MAX_QUEUE) rdpAudioNextAt = now + RDP_AUDIO_LOOKAHEAD
  src.start(rdpAudioNextAt)
  rdpAudioNextAt += audioBuf.duration
}

// 当前会话纪元（供回调判断是否已过期）
let rdpCallbackEpoch = 0

// 位图更新回调: 将 RDP 位图绘制到 canvas
let rdpBitmapDebugLogged = false
function rdpOnBitmap(x, y, w, h, bpp, data) {
  if (rdpCallbackEpoch !== rdpSessionEpoch || !rdpCanvas) return
  // 首个位图 = 连接已建立（位图只在登录完成、进入会话循环后才会到达）
  if (rdpConnecting && !connected.value) {
    connected.value = true
    statusRef.value = '已连接'
    rdpConnecting = false
  }
  // 首个位图调试输出（帮助诊断黑白方块问题）
  if (!rdpBitmapDebugLogged) {
    rdpBitmapDebugLogged = true
    const bytes0 = data instanceof Uint8Array ? data : new Uint8Array(data)
    const sample = []
    for (let i = 0; i < Math.min(16, bytes0.length); i++) sample.push(bytes0[i])
    console.log('[RDP] 首个位图: x=%d y=%d w=%d h=%d bpp=%d dataLen=%d 前16字节=%s',
      x, y, w, h, bpp, bytes0.length, sample.join(','))
  }
  if (w <= 0 || h <= 0) return
  const ctx = rdpCanvas.getContext('2d')
  if (!ctx) return

  // 确保是 Uint8Array（WASM 可能传递 ArrayBuffer 或其他类型化数组）
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const bytesPerPx = bpp === 32 ? 4 : bpp === 24 ? 3 : 2
  const expectedLen = w * h * bytesPerPx
  if (bytes.length < expectedLen) {
    // 数据不足，跳过此位图（避免越界读取产生乱码）
    return
  }

  const imageData = ctx.createImageData(w, h)
  const pixels = imageData.data
  for (let i = 0; i < w * h; i++) {
    const src = i * bytesPerPx
    const dst = i * 4
    let r, g, b
    if (bpp === 32) {
      // BGRA → RGBA
      b = bytes[src]; g = bytes[src + 1]; r = bytes[src + 2]
    } else if (bpp === 24) {
      // BGR → RGBA
      b = bytes[src]; g = bytes[src + 1]; r = bytes[src + 2]
    } else {
      // 16-bpp RGB565
      const px = bytes[src] | (bytes[src + 1] << 8)
      const r5 = (px >> 11) & 0x1F
      const g6 = (px >> 5) & 0x3F
      const b5 = px & 0x1F
      r = (r5 << 3) | (r5 >> 2)
      g = (g6 << 2) | (g6 >> 4)
      b = (b5 << 3) | (b5 >> 2)
    }
    pixels[dst] = r
    pixels[dst + 1] = g
    pixels[dst + 2] = b
    pixels[dst + 3] = 255
  }
  ctx.putImageData(imageData, x, y)
}

// H.264 NAL 回调
let rdpH264DebugLogged = false
function rdpOnH264(destX, destY, isKey, uint8Data) {
  if (rdpCallbackEpoch !== rdpSessionEpoch) return
  if (!rdpH264Dec || rdpH264Dec.state === 'closed') return
  if (!rdpH264DebugLogged) {
    rdpH264DebugLogged = true
    console.log('[RDP] 首个 H264 NAL: destX=%d destY=%d isKey=%d dataLen=%d 解码器状态=%s',
      destX, destY, isKey, uint8Data.length, rdpH264Dec.state)
  }
  rdpH264Timestamp += 1000
  rdpH264FramePos.set(rdpH264Timestamp, { x: destX, y: destY })
  try {
    rdpH264Dec.decode(new EncodedVideoChunk({
      type: isKey ? 'key' : 'delta',
      timestamp: rdpH264Timestamp,
      data: uint8Data,
    }))
  } catch (e) {
    console.warn('onH264 decode error:', e)
  }
}

// 键盘/鼠标事件处理器引用（便于卸载时移除）
let rdpEventHandlers = null

function setupRdpCanvasEventHandlers() {
  if (!rdpCanvas) return
  const onKeyDown = (e) => {
    if (!rdpController) return
    e.preventDefault()
    const k = rdpCodeToScancode(e.code)
    if (k) rdpController.key_down(k.flags, k.scancode)
  }
  const onKeyUp = (e) => {
    if (!rdpController) return
    e.preventDefault()
    const k = rdpCodeToScancode(e.code)
    if (k) rdpController.key_up(k.scancode)
  }
  const getXY = (e) => {
    const rect = rdpCanvas.getBoundingClientRect()
    const scaleX = rdpCanvas.width / rect.width
    const scaleY = rdpCanvas.height / rect.height
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    }
  }
  const onMouseMove = (e) => {
    if (!rdpController) return
    const { x, y } = getXY(e)
    rdpController.mouse_move(x, y)
  }
  const onMouseDown = (e) => {
    if (!rdpController) return
    e.preventDefault()
    rdpCanvas.focus()
    // 捕获指针：拖出画布后释放时仍能把 mouseup 投递到画布，避免远端按键卡住
    try {
      rdpCanvas.setPointerCapture(e.pointerId)
    } catch {
      /* 非指针事件或已释放时忽略 */
    }
    const { x, y } = getXY(e)
    const btn = e.button === 0 ? 1 : e.button === 1 ? 3 : 2
    rdpController.mouse_button(btn, true, x, y)
  }
  const onMouseUp = (e) => {
    if (!rdpController) return
    try {
      if (rdpCanvas.hasPointerCapture(e.pointerId)) {
        rdpCanvas.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* 忽略 */
    }
    const { x, y } = getXY(e)
    const btn = e.button === 0 ? 1 : e.button === 1 ? 3 : 2
    rdpController.mouse_button(btn, false, x, y)
  }
  const onWheel = (e) => {
    if (!rdpController) return
    e.preventDefault()
    rdpController.mouse_wheel(e.deltaY > 0 ? -120 : 120)
  }
  const onContextMenu = (e) => e.preventDefault()

  rdpCanvas.addEventListener('keydown', onKeyDown)
  rdpCanvas.addEventListener('keyup', onKeyUp)
  rdpCanvas.addEventListener('mousemove', onMouseMove)
  rdpCanvas.addEventListener('mousedown', onMouseDown)
  rdpCanvas.addEventListener('mouseup', onMouseUp)
  rdpCanvas.addEventListener('wheel', onWheel, { passive: false })
  rdpCanvas.addEventListener('contextmenu', onContextMenu)
  rdpEventHandlers = { onKeyDown, onKeyUp, onMouseMove, onMouseDown, onMouseUp, onWheel, onContextMenu }
}

function teardownRdpCanvasEventHandlers() {
  if (!rdpCanvas || !rdpEventHandlers) return
  rdpCanvas.removeEventListener('keydown', rdpEventHandlers.onKeyDown)
  rdpCanvas.removeEventListener('keyup', rdpEventHandlers.onKeyUp)
  rdpCanvas.removeEventListener('mousemove', rdpEventHandlers.onMouseMove)
  rdpCanvas.removeEventListener('mousedown', rdpEventHandlers.onMouseDown)
  rdpCanvas.removeEventListener('mouseup', rdpEventHandlers.onMouseUp)
  rdpCanvas.removeEventListener('wheel', rdpEventHandlers.onWheel)
  rdpCanvas.removeEventListener('contextmenu', rdpEventHandlers.onContextMenu)
  rdpEventHandlers = null
}

async function connectRdp() {
  if (!wrapperRef.value) return
  disconnect()
  statusRef.value = '连接中...'

  // 不使用 innerHTML='' 清空 — Vue 管理的 .canvas-mask 会在 connected=true 时自动移除
  // disconnect() 已移除旧的 RDP canvas
  const canvas = document.createElement('canvas')
  canvas.tabIndex = 0
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.background = '#000'
  canvas.style.outline = 'none'
  wrapperRef.value.appendChild(canvas)
  rdpCanvas = canvas

  try {
    // 加载 rustrdp-wasm 模块
    const rdpMod = await import('@/lib/rustrdp/rustrdp_wasm.js')
    const init = rdpMod.default || rdpMod
    if (typeof init === 'function') {
      rdpInit = await init()
    }

    // 从凭据对话框获取用户名和密码
    // 用户名支持 DOMAIN\user 或 user@domain 格式，自动拆分域
    const rawUser = rdpCredDialog.value.username || ''
    let username = rawUser
    let domain = ''
    const backslashIdx = rawUser.indexOf('\\')
    if (backslashIdx >= 0) {
      domain = rawUser.substring(0, backslashIdx)
      username = rawUser.substring(backslashIdx + 1)
    } else if (rawUser.includes('@')) {
      const atIdx = rawUser.indexOf('@')
      username = rawUser.substring(0, atIdx)
      domain = rawUser.substring(atIdx + 1)
    }
    const password = rdpCredDialog.value.password || ''

    // rustrdp-wasm 连接目标由 WebSocket 透传给 SSH 通道决定，无需指定目标地址；
    // 分辨率使用固定默认值，连接后服务器会返回实际桌面尺寸。
    // 降低分辨率以压缩传输数据量（画质与带宽的平衡）
    const rdpWidth = 1024
    const rdpHeight = 640
    canvas.width = rdpWidth
    canvas.height = rdpHeight

    // 初始化 H.264 解码器与音频上下文
    rdpH264Timestamp = 0
    rdpH264FramePos.clear()
    rdpH264Dec = rdpCreateH264Decoder(rdpWidth, rdpHeight)
    rdpPointerCache.clear()
    rdpBitmapDebugLogged = false
    rdpH264DebugLogged = false
    canvas.style.cursor = 'default'
    try { rdpAudioCtx = new AudioContext({ latencyHint: 'playback' }) } catch { rdpAudioCtx = null }
    rdpAudioNextAt = 0

    const url = wsUrl(`/webproxy/rdp/${props.agentId}`)

    statusRef.value = 'RDP 握手中...'
    rdpConnecting = true
    rdpWs = null
    const myEpoch = ++rdpSessionEpoch
    rdpCallbackEpoch = myEpoch

    // 连接超时检测
    const timeoutId = setTimeout(() => {
      if (rdpConnecting && myEpoch === rdpSessionEpoch && !connected.value) {
        rdpConnecting = false
        statusRef.value = 'RDP 连接超时'
        ElMessage.error('RDP 握手超时（60秒）— 请检查浏览器控制台(F12)获取详细错误信息')
      }
    }, 60000)

    // 拦截 rustrdp-wasm 内部创建的 WebSocket 实例
    // 在 disconnect() 时需要清除其事件处理器并关闭连接，
    // 否则 WASM 闭包被 drop 后浏览器仍调用已释放的闭包导致崩溃
    const OrigWebSocket = window.WebSocket
    const wsTracker = {
      ws: null,
      active: true,
    }
    window.WebSocket = function (wsUrl, protocols) {
      const ws = protocols !== undefined ? new OrigWebSocket(wsUrl, protocols) : new OrigWebSocket(wsUrl)
      if (wsTracker.active) {
        wsTracker.ws = ws
        rdpWs = ws
      }
      return ws
    }
    window.WebSocket.prototype = OrigWebSocket.prototype
    Object.setPrototypeOf(window.WebSocket, OrigWebSocket)

    const restoreWs = () => {
      wsTracker.active = false
      if (window.WebSocket !== OrigWebSocket) {
        window.WebSocket = OrigWebSocket
      }
    }

    // 非阻塞调用 connect()，用 .then/.catch 处理结果
    // 位图回调会在 connect() resolve 之前就把状态更新为已连接
    rdpMod.connect(
      url,
      domain,
      username,
      password,
      rdpWidth,
      rdpHeight,
      rdpOnBitmap,
      rdpOnH264,
      rdpOnAudio,
      rdpOnPointerHide,
      rdpOnPointerCached,
      rdpOnPointerUpdate,
    ).then(controller => {
      restoreWs()
      if (myEpoch !== rdpSessionEpoch) {
        // 已是过期会话（用户在连接期间切换了模式）— 清理并退出
        try { controller.free() } catch { }
        return
      }
      clearTimeout(timeoutId)
      rdpController = controller
      rdpConnecting = false
      // 位图回调可能已将状态更新为已连接
      if (!connected.value) {
        connected.value = true
        statusRef.value = '已连接'
      }
      setupRdpCanvasEventHandlers()
      canvas.focus()
    }).catch(e => {
      restoreWs()
      if (myEpoch !== rdpSessionEpoch) return // 过期会话，静默忽略
      clearTimeout(timeoutId)
      rdpConnecting = false
      if (!connected.value) {
        statusRef.value = 'RDP 连接失败'
        ElMessage.error('RDP 连接失败: ' + formatError(e))
      }
    })

    // 轮询检查 WebSocket 是否已创建，捕获后立即恢复原构造器
    const wsPoll = setInterval(() => {
      if (wsTracker.ws || !wsTracker.active) {
        clearInterval(wsPoll)
        restoreWs()
      }
    }, 10)
    // 安全超时：5 秒后无论如何恢复构造器
    setTimeout(() => { clearInterval(wsPoll); restoreWs() }, 5000)
  } catch (e) {
    statusRef.value = 'RDP 连接失败'
    ElMessage.error('RDP 连接失败: ' + formatError(e))
    rdpController = null
  }
}

function connect() {
  if (!props.agentId) {
    ElMessage.warning('缺少主机ID')
    return
  }
  if (props.mode === 'rdp') {
    // RDP 模式：先弹出凭据对话框
    rdpCredDialog.value.visible = true
  } else {
    connectVnc()
  }
}

// RDP 凭据对话框确认
function confirmRdpCredentials() {
  const u = (rdpCredDialog.value.username || '').trim()
  const p = rdpCredDialog.value.password || ''
  if (!u) {
    ElMessage.warning('请输入 Windows 用户名')
    return
  }
  if (!p) {
    ElMessage.warning('请输入密码')
    return
  }
  rdpCredDialog.value.visible = false
  connectRdp()
}

function disconnect() {
  rdpConnecting = false
  rdpSessionEpoch++ // 使所有进行中的 .then/.catch 回调失效
  stopVncCursorPoll()
  lastButtons = 0 // 断开时无需再释放远端按键，仅复位本地追踪状态
  if (rfb) {
    try {
      rfb.disconnect()
    } catch {

    }
    rfb = null
  }
  teardownRdpCanvasEventHandlers()

  // 关键：先清除 WebSocket 事件处理器并关闭连接，再释放 WASM 控制器。
  // rustrdp-wasm 的 WsTransport 将 onmessage/onclose 作为 wasm-bindgen Closure 存储；
  // 直接 free() 控制器会 drop 这些 Closure，但 WebSocket 的事件处理器仍指向已释放的
  // WASM 内存，后续任何 WS 事件都会触发 "closure invoked after being dropped" 崩溃。
  if (rdpWs) {
    try {
      rdpWs.onopen = null
      rdpWs.onmessage = null
      rdpWs.onerror = null
      rdpWs.onclose = null
      if (rdpWs.readyState === WebSocket.OPEN || rdpWs.readyState === WebSocket.CONNECTING) {
        rdpWs.close()
      }
    } catch { }
    rdpWs = null
  }

  if (rdpController) {
    try {
      rdpController.free()
    } catch {

    }
    rdpController = null
  }
  if (rdpH264Dec) {
    try { rdpH264Dec.close() } catch { }
    rdpH264Dec = null
  }
  if (rdpAudioCtx) {
    try { rdpAudioCtx.close() } catch { }
    rdpAudioCtx = null
    rdpAudioNextAt = 0
  }
  if (rdpResizeObserver) {
    rdpResizeObserver.disconnect()
    rdpResizeObserver = null
  }
  // 移除命令式注入的 RDP canvas（避免与 Vue patch 冲突）
  if (rdpCanvas && rdpCanvas.parentNode) {
    rdpCanvas.parentNode.removeChild(rdpCanvas)
  }
  rdpCanvas = null
  // 不使用 innerHTML='' 清空 wrapper — 那会移除 Vue 管理的 .canvas-mask 导致
  // Vue patch 崩溃（"Cannot set properties of null (setting '__vnode')"）。
  // noVNC 的 screen 在 rfb.disconnect() 中已被移除；RDP canvas 在下面单独移除。
  remoteCursorActive.value = false
  connected.value = false
  // Vue 会根据 connected=false 自动显示 .canvas-mask
}

function setMode(v) {
  emit('update:mode', v)
}

function setViewMode(v) {
  if (!rfb) {
    ElMessage.warning('请先连接远程桌面')
    return
  }
  viewOnly.value = v
  rfb.viewOnly = v
  ElMessage.success(v ? '已切换到查看模式' : '已切换到控制模式')
}

function toggleFullscreen() {
  const el = stageRef.value || wrapperRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function onFsChange() {
  fullscreen.value = !!document.fullscreenElement
}

// 创建跟随鼠标的悬浮指针，并在点击位置生成涟漪；同时更新位置/状态 HUD
// 关键：noVNC 在 canvas 上调用 ev.stopPropagation()，且画布元素是连接后才
// 动态注入的。最稳妥的做法是在 document 上用捕获阶段监听（document 是事件链
// 顶端，捕获阶段必然在 noVNC 的目标处理之前触发），再按画布矩形判断指针是否
// 落在画布内。
function setupLocalCursor() {
  // 惰性读取画布矩形，避免在 setup 时元素还未注入
  const stageRect = () => {
    const stage = stageRef.value || wrapperRef.value
    return stage ? stage.getBoundingClientRect() : null
  }
  const inBounds = (x, y, rect) =>
    x >= 0 && y >= 0 && x <= rect.width && y <= rect.height

  const onMove = (e) => {
    lastButtons = e.buttons
    const rect = stageRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const inside = inBounds(x, y, rect)
    if (inside) {
      cursorPos.value = { x, y }
      cursorStatus.value = buttonsStatus(e.buttons)
      cursorActive.value = true
    } else {
      cursorActive.value = false
    }
  }
  const onDown = (e) => {
    lastButtons = e.buttons
    const rect = stageRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (!inBounds(x, y, rect)) return
    cursorPos.value = { x, y }
    cursorStatus.value = buttonsStatus(e.buttons)
    cursorActive.value = true
    cursorPressed.value = true
    if (connected.value) {
      spawnRipple(x, y)
    }
  }
  const onUp = (e) => {
    lastButtons = e.buttons
    cursorPressed.value = false
    const rect = stageRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cursorPos.value = { x, y }
    cursorStatus.value = buttonsStatus(e.buttons)
  }

  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('mousedown', onDown, true)
  document.addEventListener('mouseup', onUp, true)
  localCursorHandlers = { onMove, onDown, onUp }
}

// 将鼠标 buttons 位掩码转为可读状态文本
function buttonsStatus(buttons) {
  const parts = []
  if (buttons & 1) parts.push('左键')
  if (buttons & 2) parts.push('右键')
  if (buttons & 4) parts.push('中键')
  if (buttons & 8) parts.push('后退')
  if (buttons & 16) parts.push('前进')
  return parts.length ? parts.join('+') + ' 按下' : '空闲'
}

// 在点击位置生成一个短暂涟漪（响应式列表驱动，动画结束后自动移除）

function teardownLocalCursor() {
  if (localCursorHandlers) {
    document.removeEventListener('mousemove', localCursorHandlers.onMove, true)
    document.removeEventListener('mousedown', localCursorHandlers.onDown, true)
    document.removeEventListener('mouseup', localCursorHandlers.onUp, true)
  }
  localCursorHandlers = null
  // 注意：cursor-layer 内的红点/涟漪由 Vue 模板渲染，
  // 这里绝不能 innerHTML='' 清空（会破坏 Vue patch），只满响应式状态
  ripples.value = []
  cursorActive.value = false
}

// ── 按键丢失安全网 ────────────────────────────────────────────────
// 场景：mousedown 后浏览器未派发 mouseup（窗口失焦/系统弹窗/Alt+Tab/
// 指针移出浏览器后释放/触板手势 pointercancel），远端鼠标会卡在按下状态。
// 处理：合成 buttons=0 的 mouseup ——
// - VNC：直接派发到画布（handler 读 ev.buttons 全量快照，0 即全部释放）；
//   若 noVNC 捕获代理卡住，再向 window 派发一次触发 releaseCapture
// - RDP：handler 按 e.button 逐键释放，需对每个按住的键分别合成
function releaseHeldButtons() {
  if (lastButtons === 0) return
  const held = lastButtons
  lastButtons = 0
  cursorPressed.value = false
  cursorStatus.value = '空闲'

  // 最后已知指针位置（stage 相对）→ 视口坐标
  const stage = stageRef.value || wrapperRef.value
  const rect = stage ? stage.getBoundingClientRect() : null
  const clientX = rect ? rect.left + cursorPos.value.x : 0
  const clientY = rect ? rect.top + cursorPos.value.y : 0
  const init = {
    bubbles: true,
    cancelable: true,
    view: window,
    detail: 1,
    clientX,
    clientY,
    buttons: 0,
  }

  if (props.mode === 'rdp') {
    if (!rdpController || !rdpCanvas) return
    // [buttons 位, button 索引]：左 1→0，右 2→2，中 4→1
    const btnMap = [
      [1, 0],
      [2, 2],
      [4, 1],
    ]
    for (const [bit, idx] of btnMap) {
      if (held & bit) {
        rdpCanvas.dispatchEvent(new MouseEvent('mouseup', { ...init, button: idx }))
      }
    }
    return
  }

  // VNC：先直接派发到画布 —— handler 读 ev.buttons 全量快照，0 即全部释放
  // （所有浏览器路径均生效，重复的 mask=0 幂等无害）。
  // 若 noVNC 的捕获代理仍卡住（mousedown 后 mouseup 丢失时全屏透明代理层
  // 不会搬除，会阻塞后续点击），再向 window 派发一次：_captureProxy 会把
  // 克隆事件转发到画布并自动 releaseCapture。
  const canvas = wrapperRef.value
    ? wrapperRef.value.querySelector('canvas.noVnc_canvas')
    : null
  if (!canvas) return
  canvas.dispatchEvent(new MouseEvent('mouseup', { ...init, button: 0 }))
  if (document.captureElement) {
    window.dispatchEvent(new MouseEvent('mouseup', { ...init, button: 0 }))
  }
}

function setupLostInputGuard() {
  const onBlur = () => releaseHeldButtons()
  // 指针离开浏览器窗口（relatedTarget 为空表示移出文档）
  const onLeave = (e) => {
    if (!e.relatedTarget) releaseHeldButtons()
  }
  const onPointerCancel = () => releaseHeldButtons()
  // 切换标签页/最小化时若仍有按键按住，同样视为丢失
  const onVisibility = () => {
    if (document.hidden) releaseHeldButtons()
  }
  window.addEventListener('blur', onBlur)
  document.addEventListener('mouseleave', onLeave)
  document.addEventListener('pointercancel', onPointerCancel, true)
  document.addEventListener('visibilitychange', onVisibility)
  lostInputGuard = { onBlur, onLeave, onPointerCancel, onVisibility }
}

function teardownLostInputGuard() {
  if (!lostInputGuard) return
  window.removeEventListener('blur', lostInputGuard.onBlur)
  document.removeEventListener('mouseleave', lostInputGuard.onLeave)
  document.removeEventListener('pointercancel', lostInputGuard.onPointerCancel, true)
  document.removeEventListener('visibilitychange', lostInputGuard.onVisibility)
  lostInputGuard = null
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFsChange)
  setupLocalCursor()
  setupLostInputGuard()
})

onBeforeUnmount(() => {
  disconnect()
  teardownLocalCursor()
  teardownLostInputGuard()
  document.removeEventListener('fullscreenchange', onFsChange)
})

watch(
  () => props.mode,
  (newMode, oldMode) => {
    if (newMode === oldMode) return
    const wasConnected = connected.value
    disconnect() // 始终清理（含 RDP: 关闭 WASM 会话/H264/音频/canvas）
    if (wasConnected) {
      connect()
    }
  },
)

// 当平台变为非 Windows 时，若当前处于 RDP 模式则回退到 VNC
watch(
  isWindows,
  (win) => {
    if (!win && props.mode === 'rdp') {
      emit('update:mode', 'vnc')
    }
  },
)
</script>

<template>
  <div class="desktop-page">
    <div class="desktop-toolbar">
      <el-button
        size="small"
        :type="connected ? 'danger' : 'primary'"
        :loading="statusRef === '连接中...' || statusRef === 'RDP 握手中...'"
        @click="connected ? disconnect() : connect()"
      >
        {{ connected ? '断开' : '连接' }}
      </el-button>

      <template v-if="mode !== 'rdp'">
        <el-button
          size="small"
          :type="viewOnly ? '' : 'primary'"
          @click="setViewMode(false)"
        >控制模式</el-button>
        <el-button
          size="small"
          :type="viewOnly ? 'primary' : ''"
          @click="setViewMode(true)"
        >查看模式</el-button>
      </template>

      <span class="status">
        状态: <el-tag size="small" :type="connected ? 'success' : 'info'">{{ statusRef }}</el-tag>
      </span>

      <div class="flex-grow"></div>

      <span class="mode-label">协议:</span>
      <el-radio-group :model-value="mode" size="small" @update:model-value="setMode">
        <el-radio-button v-for="m in desktopModes" :key="m.value" :value="m.value">
          {{ m.label }}
        </el-radio-button>
      </el-radio-group>

      <el-button size="small" @click="toggleFullscreen">
        {{ fullscreen ? '退出全屏' : '全屏' }}
      </el-button>
    </div>

    <div class="canvas-stage" ref="stageRef">
      <div ref="wrapperRef" class="canvas-wrapper">
        <div v-if="!connected" class="canvas-mask">
          <el-empty :description="`点击「连接」开始 ${mode.toUpperCase()} 远程桌面`" />
        </div>
      </div>
      <div ref="cursorLayerRef" class="cursor-layer">
        <!-- 模拟鼠标红点：直接叠加在 VNC 画面上，跟随本地指针 -->
        <div
          v-show="dotVisible"
          class="local-cursor-dot"
          :class="{ pressed: cursorPressed }"
          :style="{ left: cursorPos.x + 'px', top: cursorPos.y + 'px' }"
        ></div>
        <div
          v-for="r in ripples"
          :key="r.id"
          class="cursor-click-ripple"
          :style="{ left: r.x + 'px', top: r.y + 'px' }"
        ></div>
      </div>
      <div class="cursor-hud-layer">
        <div class="cursor-hud" v-if="connected && cursorActive">
          <span class="hud-row">位置: {{ cursorPos.x }}, {{ cursorPos.y }}</span>
          <span class="hud-row">状态: {{ cursorStatus }}</span>
        </div>
      </div>
    </div>

    <!-- RDP 凭据对话框 -->
    <el-dialog
      v-model="rdpCredDialog.visible"
      title="RDP 连接凭据"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input
            v-model="rdpCredDialog.username"
            placeholder="DOMAIN\\user 或 user@domain 或 user"
            @keyup.enter="confirmRdpCredentials"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="rdpCredDialog.password"
            type="password"
            show-password
            placeholder="Windows 账户密码"
            @keyup.enter="confirmRdpCredentials"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rdpCredDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmRdpCredentials">连接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.desktop-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}
.desktop-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  position: relative;
  z-index: 10;
}
.desktop-toolbar .flex-grow {
  flex: 1;
}
.desktop-toolbar .status {
  font-size: 13px;
  color: var(--tk-accent-dim);
}
.mode-label {
  font-size: 13px;
  color: var(--tk-accent-dim);
  white-space: nowrap;
}
.canvas-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}
.canvas-stage:fullscreen {
  background: #000;
}
.canvas-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #161618;
  border: 1px solid #3c3f44;
  border-radius: 4px;
  overflow: hidden;
}
.canvas-stage:fullscreen .canvas-wrapper {
  border: none;
  border-radius: 0;
}
.canvas-wrapper :deep(canvas) {
  max-width: 100%;
  max-height: 100%;
}

.canvas-wrapper :deep(.noVnc_screen),
.canvas-wrapper :deep(.noVnc_canvas) {
  position: relative !important;
  max-width: 100%;
  max-height: 100%;
}
.cursor-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 20;
}
.cursor-hud-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 22;
}
.cursor-hud {
  position: absolute;
  left: 8px;
  bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(78, 161, 255, 0.4);
  border-radius: 6px;
  color: #dfe6f0;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
}
.hud-row {
  display: block;
}
.local-cursor-dot {
  position: absolute;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.9);
  border: 1.5px solid #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  z-index: 21;
  transition: transform 0.08s ease-out;
}
.local-cursor-dot.pressed {
  transform: scale(0.7);
}
.cursor-click-ripple {
  position: absolute;
  width: 36px;
  height: 36px;
  margin: -18px 0 0 -18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 59, 48, 0.9);
  box-shadow: 0 0 10px rgba(255, 59, 48, 0.45);
  pointer-events: none;
  z-index: 21;
  animation: ripple-expand 0.55s cubic-bezier(0.16, 0.84, 0.44, 1) forwards;
}
/* 中心闪光 */
.cursor-click-ripple::after {
  content: '';
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.65);
  animation: ripple-flash 0.3s ease-out forwards;
}
@keyframes ripple-expand {
  0% {
    transform: scale(0.25);
    opacity: 1;
  }
  70% {
    opacity: 0.6;
  }
  100% {
    transform: scale(2.1);
    opacity: 0;
  }
}
@keyframes ripple-flash {
  0% {
    transform: scale(0.2);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
.canvas-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}
</style>
