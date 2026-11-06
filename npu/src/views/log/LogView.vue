<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPause, VideoPlay, Delete, Search, Download } from '@element-plus/icons-vue'
import { logTail, setLogLevel, logClear } from '@/api/log'

defineOptions({ name: 'LogView' })

const LEVELS = [
  { value: 'ALL', label: '全部', color: 'var(--log-all)' },
  { value: 'ERROR', label: 'ERROR', color: '#ff4d4f' },
  { value: 'WARN', label: 'WARN', color: '#ffa940' },
  { value: 'INFO', label: 'INFO', color: 'var(--log-info)' },
  { value: 'DEBUG', label: 'DEBUG', color: 'var(--log-debug)' },
  { value: 'TRACE', label: 'TRACE', color: 'var(--log-trace)' },
]

const logBoxRef = ref(null)

const lines = ref([])

let nextOffset = null
const autoScroll = ref(true)
const paused = ref(false)
const loading = ref(false)
const activeLevel = ref('ALL')
const keyword = ref('')
// 清空时递增, 使在途的轮询响应作废, 避免旧内容在清空后回填
let pollGen = 0

const MAX_LINES = 5000

const LEVEL_RE = /\s(ERROR|WARN|INFO|DEBUG|TRACE)\b/
function parseLevel(text) {
  const m = text.match(LEVEL_RE)
  return m ? m[1] : 'OTHER'
}

const displayLines = computed(() => {
  const lvl = activeLevel.value
  const kw = keyword.value.trim().toLowerCase()
  if (lvl === 'ALL' && !kw) return lines.value
  return lines.value.filter((l) => {
    if (lvl !== 'ALL' && l.level !== lvl) return false
    if (kw && !l.text.toLowerCase().includes(kw)) return false
    return true
  })
})

function levelColor(text) {
  const lvl = parseLevel(text)
  const found = LEVELS.find((l) => l.value === lvl)
  return found ? found.color : 'var(--log-info)'
}

async function poll() {
  if (paused.value) return
  if (loading.value) return // 上一轮还未返回, 跳过本轮, 避免并发重复追加
  const gen = pollGen
  loading.value = true
  try {
    const data = await logTail(nextOffset)
    if (gen !== pollGen) return // 清空后丢弃过期响应
    if (!data) return
    const content = data.content || ''
    if (content) {
      const newLines = content.split('\n')

      const appended = newLines
        .filter((l, i) => l.length > 0 || i === newLines.length - 1)
        .map((l) => ({ level: parseLevel(l), text: l }))
        .filter((l) => l.text.length > 0)
      if (appended.length) {
        lines.value.push(...appended)
        if (lines.value.length > MAX_LINES) {
          lines.value = lines.value.slice(-MAX_LINES)
        }
        if (autoScroll.value) {
          nextTick(scrollToBottom)
        }
      }
    }
    nextOffset = data.size
  } catch {

  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  const el = logBoxRef.value
  if (el) el.scrollTop = el.scrollHeight
}

let timer = null
function startPolling() {
  stopPolling()
  poll()
  timer = setInterval(poll, 5000)
}
function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function togglePause() {
  paused.value = !paused.value
  if (paused.value) {
    ElMessage.info('已暂停日志拉取')
  } else {
    ElMessage.success('已恢复日志拉取')
    poll()
  }
}

async function clearLogs() {
  pollGen++ // 使在途轮询作废
  lines.value = []
  nextOffset = null
  try {
    await logClear()
    ElMessage.success('已清空 (含服务端日志)')
    poll() // 立即拉取截断后的新日志 (含 "日志已由前端清空" 行)
  } catch {
    // 服务端清空失败时仅清了本地, 提示但不回滚
    ElMessage.warning('本地已清空, 服务端日志清空失败')
  }
}

function onScroll() {
  const el = logBoxRef.value
  if (!el) return

  autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < 30
}

watch(keyword, () => {
  autoScroll.value = false
})

const levelCounts = computed(() => {
  const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0, OTHER: 0 }
  for (const l of lines.value) {
    counts[l.level] = (counts[l.level] || 0) + 1
  }
  return counts
})

function exportLogs() {
  const text = displayLines.value.map((l) => l.text).join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `nps-${Date.now()}.log`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('已导出')
}

onMounted(startPolling)
onBeforeUnmount(stopPolling)

const BACKEND_LEVELS = ['error', 'warn', 'info', 'debug', 'trace']
const backendLevel = ref('info')
const levelLoading = ref(false)

async function changeBackendLevel() {
  levelLoading.value = true
  try {
    await setLogLevel(backendLevel.value)
    ElMessage.success(`后台日志等级已切换为 ${backendLevel.value}`)
  } catch {

  } finally {
    levelLoading.value = false
  }
}
</script>

<template>
  <div class="page-container log-page">

    <div class="toolbar">

      <div class="level-filter">
        <button
          v-for="lv in LEVELS"
          :key="lv.value"
          class="level-btn"
          :class="{ active: activeLevel === lv.value }"
          :style="activeLevel === lv.value ? { color: lv.color, borderColor: lv.color } : {}"
          @click="activeLevel = lv.value"
        >
          {{ lv.label }}
          <span v-if="lv.value !== 'ALL' && levelCounts[lv.value]" class="level-count">
            {{ levelCounts[lv.value] }}
          </span>
        </button>
      </div>

      <div class="flex-grow"></div>

      <span class="level-label">后台等级</span>
      <el-select
        v-model="backendLevel"
        size="small"
        style="width: 110px"
        :loading="levelLoading"
        @change="changeBackendLevel"
      >
        <el-option v-for="lv in BACKEND_LEVELS" :key="lv" :label="lv.toUpperCase()" :value="lv" />
      </el-select>

      <el-input
        v-model="keyword"
        placeholder="关键词过滤"
        :prefix-icon="Search"
        clearable
        size="small"
        style="width: 200px"
      />
      <el-button
        size="small"
        :type="paused ? 'success' : 'warning'"
        :icon="paused ? VideoPlay : VideoPause"
        @click="togglePause"
      >
        {{ paused ? '继续' : '暂停' }}
      </el-button>
      <el-button size="small" :icon="Download" @click="exportLogs">导出</el-button>
      <el-button size="small" type="danger" :icon="Delete" @click="clearLogs">清空</el-button>
    </div>

    <div ref="logBoxRef" class="log-box" @scroll="onScroll">
      <div v-if="!displayLines.length && !loading" class="log-empty">
        暂无日志数据...
      </div>
      <pre v-for="(line, idx) in displayLines" :key="idx" class="log-line" :style="{ color: levelColor(line.text) }">{{ line.text }}</pre>
    </div>

    <div class="status-bar">
      <span class="status-dot" :class="paused ? 'off' : 'on'"></span>
      <span class="status-text">{{ paused ? '已暂停' : '实时拉取中' }}</span>
      <span class="status-sep">|</span>
      <span>共 {{ lines.length }} 行</span>
      <span class="status-sep">|</span>
      <span>显示 {{ displayLines.length }} 行</span>
      <div class="flex-grow"></div>
      <label class="auto-scroll-toggle">
        <input type="checkbox" v-model="autoScroll" />
        自动滚动到底部
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.log-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.level-label {
  font-size: 12px;
  color: var(--tk-accent-dim);
  font-family: 'Consolas', monospace;
  white-space: nowrap;
}

.level-filter {
  display: flex;
  gap: 4px;
}

.level-btn {
  background: transparent;
  border: 1px solid var(--tk-border);
  color: var(--tk-accent-dim);
  padding: 4px 12px;
  font-size: 12px;
  font-family: 'Consolas', monospace;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.5px;
  &:hover {
    background: var(--tk-accent-hover);
  }
}

.level-count {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.7;
}

.flex-grow {
  flex: 1;
}

.log-box {
  flex: 1;
  min-height: 0;
  background: var(--tk-bg-page);
  border: 1px solid var(--tk-border);
  border-radius: 4px;
  padding: 10px 12px;
  overflow-y: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: inset 0 0 30px var(--tk-accent-hover);
}

.log-empty {
  color: var(--tk-accent-dim);
  opacity: 0.5;
  text-align: center;
  padding-top: 40px;
  font-family: 'Consolas', monospace;
}

.log-line {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-box::-webkit-scrollbar {
  width: 8px;
}
.log-box::-webkit-scrollbar-track {
  background: var(--tk-bg-page);
}
.log-box::-webkit-scrollbar-thumb {
  background: var(--tk-border);
  border-radius: 4px;
  &:hover {
    background: var(--tk-accent-soft);
  }
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--tk-accent-dim);
  font-family: 'Consolas', monospace;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  &.on {
    background: var(--tk-accent);
    box-shadow: 0 0 6px var(--tk-accent);
    animation: pulse 1.5s infinite;
  }
  &.off {
    background: #ffa940;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-sep {
  opacity: 0.4;
}

.auto-scroll-toggle {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  input {
    cursor: pointer;
  }
}
</style>
