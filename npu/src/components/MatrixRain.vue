<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({

  charset: { type: String, default: 'binary' },

  color: { type: String, default: '#3c3f44' },

  headColor: { type: String, default: '#ff8c42' },

  fontSize: { type: Number, default: 14 },

  speed: { type: Number, default: 1 },

  opacity: { type: Number, default: 0.85 },
})

const canvasRef = ref(null)
let ctx = null
let raf = null
let columns = []
let width = 0
let height = 0
let fontSize = props.fontSize

// 帧率限制：背景动画不需要 60fps，节流后大幅降低 CPU 占用
const FRAME_INTERVAL = 1000 / 15 // ~15fps
let lastFrameTime = 0

const BIN = '01'
const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'
const HEX = '0123456789ABCDEF'

function pickCharset() {
  if (props.charset === 'matrix') return KANA
  if (props.charset === 'hex') return HEX
  if (props.charset === 'mixed') return BIN + KANA
  return BIN
}

function randChar(set) {
  return set[Math.floor(Math.random() * set.length)]
}

function resize() {
  const dpr = window.devicePixelRatio || 1
  const c = canvasRef.value
  width = c.clientWidth
  height = c.clientHeight
  c.width = width * dpr
  c.height = height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  fontSize = props.fontSize
  const colCount = Math.floor(width / fontSize)
  columns = new Array(colCount).fill(0).map(() => ({
    y: Math.random() * -height,
    speed: (0.5 + Math.random() * 1.2) * props.speed,
    chars: [],
    len: 8 + Math.floor(Math.random() * 22),
  }))
}

function draw(now) {
  // 节流：跳过过快的帧，避免 60fps 全屏重绘造成 CPU 飙升
  if (now - lastFrameTime < FRAME_INTERVAL) {
    raf = requestAnimationFrame(draw)
    return
  }
  lastFrameTime = now

  const set = pickCharset()

  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.fillRect(0, 0, width, height)
  ctx.font = `${fontSize}px "Consolas", "Courier New", monospace`
  ctx.textBaseline = 'top'

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    const x = i * fontSize

    col.chars.unshift(randChar(set))
    if (col.chars.length > col.len) col.chars.pop()

    for (let j = 0; j < col.chars.length; j++) {
      const y = col.y - j * fontSize
      if (y < -fontSize || y > height) continue
      if (j === 0) {
        ctx.fillStyle = props.headColor
        // shadowBlur 开销极大，这里改用普通填充即可保持视觉且省 CPU
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      } else {

        const alpha = Math.max(0, 1 - j / col.len)
        ctx.fillStyle = hexToRgba(props.color, alpha)
        ctx.shadowBlur = 0
      }
      ctx.fillText(col.chars[j], x, y)
    }
    ctx.shadowBlur = 0

    col.y += col.speed * fontSize * 0.18
    if (col.y - col.len * fontSize > height) {
      col.y = Math.random() * -height
      col.len = 8 + Math.floor(Math.random() * 22)
      col.speed = (0.5 + Math.random() * 1.2) * props.speed
    }
  }

  raf = requestAnimationFrame(draw)
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

let resizeObserver = null

// 标签页隐藏时暂停动画循环: 挂在 MainLayout 的背景动画在后台标签页
// 仍会以 15fps 持续重绘, 空耗 CPU
function onVisibilityChange() {
  if (document.hidden) {
    stopDraw()
  } else {
    startDraw()
  }
}
function startDraw() {
  if (raf == null) raf = requestAnimationFrame(draw)
}
function stopDraw() {
  if (raf != null) { cancelAnimationFrame(raf); raf = null }
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  resize()
  lastFrameTime = 0
  startDraw()
  resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(canvasRef.value)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  stopDraw()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <canvas ref="canvasRef" class="matrix-rain" :style="{ opacity }"></canvas>
</template>

<style scoped>
.matrix-rain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
