<script setup>
import { ref, reactive, nextTick, onBeforeUnmount, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, RefreshLeft, Promotion, Delete, Plus, ChatRound, Download, EditPen } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { wsUrl } from '@/utils/config'
import { sessionList, sessionDelete, sessionClear, chatLogList, isSessionRunning } from '@/api/aichat.js'

const props = defineProps({
  agentId: { type: String, required: true },
  agent: { type: Object, default: () => ({}) },
  autoSelectSessionId: { type: String, default: '' },
  hideSidebar: { type: Boolean, default: false },
})

const emit = defineEmits(['sessions-updated'])

// ===== 基础工具 =====
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function shortName(name) {
  if (!name) return 'AI'
  return name.length > 2 ? name.slice(0, 2) : name
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ===== Markdown 渲染 =====
// 自定义 renderer: 给代码块加上可复制按钮容器
// 代码文本存模块级 codeStore (按钮只带 cid), 避免大代码块撑爆 DOM 属性
const codeStore = new Map()
let codeSeq = 0
const CODE_STORE_MAX = 600
const renderer = new marked.Renderer()
const origCode = renderer.code.bind(renderer)
renderer.code = (token) => {
  const codeText = String(token.text || '')
  const lang = String(token.lang || '').split(/\s+/)[0] || 'text'
  const cid = `c${++codeSeq}`
  codeStore.set(cid, codeText)
  if (codeStore.size > CODE_STORE_MAX) {
    codeStore.delete(codeStore.keys().next().value)
  }
  // 构建带表头的代码块, 原始 code 通过原 renderer 渲染
  const inner = origCode(token)
  return `<div class="md-code-block" data-lang="${escapeAttr(lang)}">
    <div class="md-code-head"><span class="md-code-lang">${escapeHtml(lang)}</span><button class="md-code-copy" data-cid="${cid}">复制</button></div>
    ${inner}
  </div>`
}
marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
})

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
function escapeAttr(s) {
  return escapeHtml(s)
}

// 渲染缓存: 同一段内容只 parse 一次 (流式期间其它消息/已完成分段不再重复渲染)
//
// 关键点: 流式每 120ms 产生一个新的文本版本, 它是"一次性"的 key;
// 已完成的段落则会在每次重渲染时反复命中。因此用 LRU(命中后移到队尾)
// + 总字符预算: 稳定内容一直被刷新留在缓存里, 流式中间产物自然被淘汰,
// 既不会重复 parse 长文本, 也不会被流式垃圾撑爆内存。
const mdCache = new Map()
const MD_CACHE_CHARS = 4 * 1024 * 1024 // 缓存总字符预算
const MD_ENTRY_MAX = 256 * 1024 // 单条上限（再大就每次 parse）
let mdCacheChars = 0

function parseMarkdown(text) {
  try {
    return marked.parse(text)
  } catch {
    return `<pre>${escapeHtml(text)}</pre>`
  }
}

function renderMarkdown(text) {
  if (!text) return ''
  const hit = mdCache.get(text)
  if (hit !== undefined) {
    // LRU: 命中后重新插入到队尾，保证"每次渲染都用到"的段不被淘汰
    mdCache.delete(text)
    mdCache.set(text, hit)
    return hit
  }
  const html = parseMarkdown(text)
  if (text.length <= MD_ENTRY_MAX) {
    mdCache.set(text, html)
    mdCacheChars += text.length + html.length
    while (mdCacheChars > MD_CACHE_CHARS && mdCache.size > 1) {
      const oldest = mdCache.keys().next().value
      const oldHtml = mdCache.get(oldest) || ''
      mdCache.delete(oldest)
      mdCacheChars -= oldest.length + oldHtml.length
    }
  }
  return html
}

// ===== 消息模型 =====
// 用户消息: { id, role: 'user', text, timestamp }
// AI 消息: { id, role: 'assistant', segments: [seg...], timestamp, status }
//   seg: { kind: 'text', content } | { kind: 'tool', id, name, args, status: 'running'|'done'|'error', success, output, error, collapsed } | { kind: 'thinking', content, collapsed }
const msgs = ref([])

// ===== 渐进渲染 =====
// 打开会话 = chatKey++ 整体重挂载, 长会话(92 条消息 ≈ 4k DOM 节点)一次性
// 插入会触发一次数百毫秒的全量布局, 是"点一下要等一会"的主因。
// 先只渲染最近 RENDER_INITIAL 条让界面立即可交互, 更早的消息分帧补齐。
const RENDER_INITIAL = 24
const RENDER_STEP = 24
const renderLimit = ref(RENDER_INITIAL)
const visibleMsgs = computed(() =>
  renderLimit.value >= msgs.value.length
    ? msgs.value
    : msgs.value.slice(-renderLimit.value)
)
const input = ref('')
const loading = ref(false)
const listRef = ref(null)
const inputRef = ref(null)

// ===== 会话管理 =====
const sessions = ref([])
const currentSessionId = ref('')
const sidebarCollapsed = ref(false)
const sessionsLoading = ref(false)

let ws = null
let cancelFlag = { stopped: false }
const userScrolledUp = ref(false)

// 当前正在构建的 AI 消息 (流式累积)
let activeMsg = null

// ===== 消息队列 =====
// 任务执行期间用户发送的消息先排队, 当前任务结束后自动按序取出处理
// 队列项: { id, text, queuedAt }
const queue = ref([])

// ===== 危险操作确认 =====
// 命中 ai.blacklist 的工具调用暂停, 等待用户放行/拒绝
// 多个待确认项按 id 叠加共存, 按到达顺序展示
// 項: { id, name, arguments, matched, resolved: null | true | false | 'timeout' | 'cancelled' }
const pendingConfirms = ref([])

// 确认结束后 (ConfirmClosed) 的状态文案
function confirmOutcomeText(c) {
  switch (c.resolved) {
    case true: return '✓ 已放行, 等待执行...'
    case false: return '✗ 已拒绝, 等待执行...'
    case 'timeout': return '⏱ 确认超时, 已自动拒绝'
    case 'cancelled': return '⏹ 任务已停止, 已自动拒绝'
    default: return ''
  }
}

function onListScroll() {
  const el = listRef.value
  if (!el) return
  // 距离底部 60px 以内视为“在底部”, 否则用户在看历史, 不再自动滚动
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  userScrolledUp.value = !nearBottom
}

function scrollToBottom(force = false) {
  nextTick(() => {
    if (listRef.value && (force || !userScrolledUp.value)) {
      // force 多为"加载会话后定位": 用 instant 一次到位。
      // smooth 会驱动一个数百毫秒的滚动动画, 期间每帧滚动事件都触发
      // scrollHeight 读取 + el-scrollbar update, 对长列表是持续的布局抖动。
      listRef.value.scrollTo({
        top: listRef.value.scrollHeight,
        behavior: force ? 'instant' : 'smooth',
      })
    }
  })
}

// 流式高频滚动: rAF 合并同帧多次调用 + instant 定位
// (smooth 滚动队列在高频 delta 下会堆积卡顿)
let scrollRafPending = false
function scheduleStreamScroll() {
  if (scrollRafPending) return
  scrollRafPending = true
  requestAnimationFrame(() => {
    scrollRafPending = false
    const el = listRef.value
    if (el && !userScrolledUp.value) {
      el.scrollTop = el.scrollHeight
    }
  })
}

// ===== 旧消息分帧补齐 =====
let fillRaf = null
function stopFillMsgs() {
  if (fillRaf) { cancelAnimationFrame(fillRaf); fillRaf = null }
}
function scheduleFillMsgs() {
  if (fillRaf) return
  const step = () => {
    fillRaf = null
    if (renderLimit.value >= msgs.value.length) return
    // 用户正在上翻历史时暂停补齐, 避免顶部插入导致内容跳动
    if (userScrolledUp.value) return
    renderLimit.value = Math.min(renderLimit.value + RENDER_STEP, msgs.value.length)
    scheduleStreamScroll() // 补齐期间保持贴底
    fillRaf = requestAnimationFrame(step)
  }
  fillRaf = requestAnimationFrame(step)
}

function focusInput() {
  nextTick(() => {
    const el = inputRef.value
    const ta = el?.$el?.querySelector('textarea') || el
    if (ta?.focus) ta.focus()
  })
}

// ===== 流式渲染节流 =====
// 每来一个 token 就改 seg.content，会触发整棵消息列表重渲染 + 整段 markdown
// 重新 parse（复杂度 O(n²)，长回答后期每个 token 几十毫秒），页面会被卡死。
// 这里把 token 累积到非响应式的 buffer（WeakMap，不进 Vue 响应式系统），
// 每 120ms 才把累计文本刷进 seg.content 触发一次渲染。
const streamBuf = new WeakMap()
let streamTimer = null
const STREAM_FLUSH_MS = 120

function flushSeg(seg) {
  if (!seg) return
  const buf = streamBuf.get(seg)
  if (buf !== undefined && seg.content !== buf) seg.content = buf
}

// 立即把缓冲刷到界面（分段落切换/任务结束时调用，保证不丢尾部内容）
function flushActiveStream() {
  if (streamTimer) {
    clearTimeout(streamTimer)
    streamTimer = null
  }
  if (!activeMsg) return
  const segs = activeMsg.segments
  if (segs.length) flushSeg(segs[segs.length - 1])
}

function scheduleFlush() {
  if (streamTimer) return
  streamTimer = setTimeout(() => {
    streamTimer = null
    if (!activeMsg) return
    const segs = activeMsg.segments
    if (segs.length) flushSeg(segs[segs.length - 1])
  }, STREAM_FLUSH_MS)
}

// 在当前 AI 消息上追加一个文本段 (或追加到最后一个文本段)
function appendTextDelta(delta) {
  if (!activeMsg) return
  const segs = activeMsg.segments
  let last = segs.length ? segs[segs.length - 1] : null
  // 如果上一段是思考过程, 自动折叠它, 开始新的文本段
  if (last && last.kind === 'thinking') {
    flushSeg(last)
    last.collapsed = true
    last = null
  }
  if (!last || last.kind !== 'text') {
    segs.push({ kind: 'text', content: '' })
    last = segs[segs.length - 1]
  }
  const prev = streamBuf.has(last) ? streamBuf.get(last) : last.content || ''
  streamBuf.set(last, prev + delta)
  scheduleFlush()
}

// 追加推理过程增量 (reasoning_content, 来自 R1 等推理模型)
function appendThinkingDelta(delta) {
  if (!activeMsg) return
  const segs = activeMsg.segments
  let last = segs.length ? segs[segs.length - 1] : null
  if (!last || last.kind !== 'thinking') {
    segs.push({ kind: 'thinking', content: '', collapsed: false })
    last = segs[segs.length - 1]
  }
  const prev = streamBuf.has(last) ? streamBuf.get(last) : last.content || ''
  streamBuf.set(last, prev + delta)
  scheduleFlush()
}

function setAssistantText(content) {
  if (!activeMsg) return
  // 流式版本里 text_delta 已经累积了整段文本, assistant_text 为冗余信号。
  // 仅在当前没有累积到内容时才用作回退。
  const segs = activeMsg.segments
  let last = segs.length ? segs[segs.length - 1] : null
  if (!last || last.kind !== 'text') {
    // 如果上一段是思考过程, 自动折叠
    if (last && last.kind === 'thinking') {
      flushSeg(last)
      last.collapsed = true
    }
    segs.push({ kind: 'text', content })
    streamBuf.set(segs[segs.length - 1], content)
  } else if (!last.content && !streamBuf.has(last)) {
    last.content = content
    streamBuf.set(last, content)
  }
}

function pushToolCall(tc) {
  if (!activeMsg) return
  // 分段切换前先把流式缓冲落盘, 否则尾部文字会丢
  flushActiveStream()
  // 如果上一段是思考过程, 自动折叠
  const segs = activeMsg.segments
  if (segs.length) {
    const last = segs[segs.length - 1]
    if (last.kind === 'thinking') last.collapsed = true
  }
  activeMsg.segments.push({
    kind: 'tool',
    id: tc.id,
    name: tc.name,
    args: tc.arguments || tc.args || '',
    status: 'running',
    success: false,
    output: '',
    error: null,
    collapsed: false,
  })
}

function applyToolResult(tr) {
  if (!activeMsg) return
  // 找到最后一个同 id 且未完成的 tool 段
  const segs = activeMsg.segments
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i]
    if (s.kind === 'tool' && s.id === tr.id && s.status === 'running') {
      s.status = tr.success ? 'done' : 'error'
      s.success = !!tr.success
      s.output = tr.output || ''
      s.error = tr.error || null
      // 长输出自动折叠, 避免刷屏; 短输出保持展开方便浏览
      s.collapsed = (s.output || s.error || '').length > 800
      return
    }
  }
}

// ===== WebSocket 通信 =====
// mode: { prompt } 开新任务 | { resume: sessionId } 附加后台运行中的任务
function connectStream(mode) {
  cancelFlag = { stopped: false }
  // 关闭旧连接 (onclose 有身份校验, 不会误刷新新任务状态)
  closeWs()
  const url = wsUrl(`/webproxy/aichat/${props.agentId}`)
  let sock = null
  try {
    sock = new WebSocket(url)
  } catch {
    finishWithError('无法建立 AI 连接')
    return
  }
  ws = sock

  sock.onopen = () => {
    if (mode.resume) {
      // 附加模式: 服务端先回放历史事件再续接实时流
      sock.send(JSON.stringify({ resume: true, sessionId: mode.resume }))
    } else {
      sock.send(JSON.stringify({ prompt: mode.prompt, sessionId: currentSessionId.value }))
    }
  }
  sock.onmessage = (evt) => handleWsMessage(evt)
  sock.onerror = () => {
    if (ws !== sock) return
    if (!cancelFlag.stopped) {
      finishWithError('连接异常')
    }
  }
  sock.onclose = () => {
    // 身份校验: 旧连接的关闭事件不能影响新任务 (队列自动续跑场景)
    if (ws !== sock) return
    if (loading.value && activeMsg) {
      flushActiveStream()
      // 异常断开但任务未完成: AI 任务在服务端后台继续, 可重新进入会话附加
      if (activeMsg.status !== 'done' && activeMsg.status !== 'error') {
        activeMsg.segments.push({ kind: 'text', content: '\n\n_连接已断开, 任务在后台继续_' })
        activeMsg.status = 'stopped'
      }
    }
    // 连接已断, 确认条无法回传; resume 附加时回放会重新展示
    pendingConfirms.value = []
    loading.value = false
    activeMsg = null
    ws = null
    // 任务结束后自动取队列中的下一条处理
    processQueue()
  }
}

function handleWsMessage(evt) {
  let data
  try {
    data = JSON.parse(typeof evt.data === 'string' ? evt.data : '')
  } catch {
    return
  }
  if (!data) return

  switch (data.type) {
    case 'started':
      // 任务开始 (服务端回执): 重建用户消息与 AI 消息壳
      // 新发指令与后台任务重新附加两种场景都由该事件驱动, 避免重复
      msgs.value.push({
        id: generateId(),
        role: 'user',
        text: data.prompt,
        timestamp: Date.now(),
      })
      activeMsg = newAssistantMsg()
      msgs.value.push(activeMsg)
      loading.value = true
      scrollToBottom(true)
      break
    case 'gone':
      // 附加的会话不存在 (未在运行/服务已重启): 保持数据库历史展示
      pendingConfirms.value = []
      loading.value = false
      closeWs()
      processQueue()
      break
    case 'thinking_delta':
      appendThinkingDelta(data.content)
      scheduleStreamScroll()
      break
    case 'text_delta':
      appendTextDelta(data.content)
      scheduleStreamScroll()
      break
    case 'assistant_text':
      setAssistantText(data.content)
      scheduleStreamScroll()
      break
    case 'tool_call':
      pushToolCall(data)
      scrollToBottom()
      break
    case 'confirm_required':
      // 危险操作待确认: 输入框上方按顺序叠加展示, 等待用户放行/拒绝
      pendingConfirms.value.push({
        id: data.id,
        name: data.name,
        arguments: data.arguments || '',
        matched: data.matched || '',
        resolved: null,
      })
      scrollToBottom()
      break
    case 'confirm_closed': {
      // 确认流程结束 (已回执/超时/停止): 更新对应卡片状态
      const c = pendingConfirms.value.find((x) => x.id === data.id)
      if (c) {
        if (data.outcome === 'timeout') c.resolved = 'timeout'
        else if (data.outcome === 'cancelled') c.resolved = 'cancelled'
        else if (c.resolved === null) c.resolved = data.outcome === 'allowed'
      }
      break
    }
    case 'tool_result':
      applyToolResult(data)
      // 确认的工具已有执行结果: 移除对应确认卡
      pendingConfirms.value = pendingConfirms.value.filter((x) => x.id !== data.id)
      scrollToBottom()
      break
    case 'done':
      flushActiveStream()
      if (activeMsg) {
        activeMsg.status = 'done'
      }
      pendingConfirms.value = []
      loading.value = false
      scrollToBottom()
      // 任务完成后刷新会话列表
      loadSessions()
      // 任务完成, 自动处理队列中的下一条
      processQueue()
      break
    case 'stopped':
      flushActiveStream()
      if (activeMsg) {
        activeMsg.status = 'stopped'
        activeMsg.segments.push({ kind: 'text', content: '\n\n_任务已停止_' })
      }
      pendingConfirms.value = []
      loading.value = false
      scrollToBottom()
      closeWs()
      loadSessions()
      // 停止后若队列非空, 继续处理下一条 (含优先发送插队场景)
      processQueue()
      break
    case 'error':
      finishWithError(data.message || 'AI 出错')
      break
    default:
      break
  }
}

function finishWithError(message) {
  pendingConfirms.value = []
  flushActiveStream()
  if (activeMsg) {
    activeMsg.status = 'error'
    activeMsg.segments.push({ kind: 'text', content: `\n\n**错误:** ${message}` })
  } else {
    // 没有 activeMsg 时直接补一条 AI 消息
    const m = newAssistantMsg()
    m.segments.push({ kind: 'text', content: `**错误:** ${message}` })
    m.status = 'error'
    msgs.value.push(m)
  }
  loading.value = false
  scrollToBottom()
  closeWs()
  processQueue()
}

function closeWs() {
  if (ws) {
    try {
      ws.close()
    } catch {
      // ignore
    }
    ws = null
  }
}

function newAssistantMsg() {
  return reactive({
    id: generateId(),
    role: 'assistant',
    segments: [],
    timestamp: Date.now(),
    status: 'pending', // pending | done | error | stopped
  })
}

// ===== 发送 / 停止 / 队列 =====
function sendMessage() {
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  // 任务执行中: 进入队列排队, 由任务结束后自动取出处理
  if (loading.value) {
    queue.value.push({ id: generateId(), text, queuedAt: Date.now() })
    return
  }
  startTask(text)
}

// 启动一个新任务 (用户消息由服务端 started 事件回驱, 与 resume 回放路径一致)
function startTask(text) {
  // 如果没有当前会话, 创建一个新会话
  if (!currentSessionId.value) {
    currentSessionId.value = generateId()
  }
  userScrolledUp.value = false
  loading.value = true
  scrollToBottom(true)
  connectStream({ prompt: text })
}

// 任务结束后调用: 队列非空则取出队首继续处理
function processQueue() {
  if (loading.value || !queue.value.length) return
  const next = queue.value.shift()
  startTask(next.text)
}

// 从队列删除消息
function removeQueueItem(id) {
  const i = queue.value.findIndex((q) => q.id === id)
  if (i !== -1) queue.value.splice(i, 1)
}

// 清空全部排队消息
function clearQueue() {
  queue.value = []
}

// 编辑队列消息: 移出队列并放回输入框
function editQueueItem(id) {
  const i = queue.value.findIndex((q) => q.id === id)
  if (i === -1) return
  const [item] = queue.value.splice(i, 1)
  input.value = item.text
  focusInput()
}

// 优先发送: 空闲则立即执行; 执行中则插到队首并停止当前任务,
// 停止完成后 processQueue 会优先取出这条
function prioritizeQueueItem(id) {
  const i = queue.value.findIndex((q) => q.id === id)
  if (i === -1) return
  const [item] = queue.value.splice(i, 1)
  if (!loading.value) {
    startTask(item.text)
    return
  }
  queue.value.unshift(item)
  stopTask()
}

function stopTask() {
  if (!loading.value) return
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ stop: true }))
  }
  cancelFlag.stopped = true
  // 界面立即给反馈, 等待后端 stopped/error 事件
  if (activeMsg) {
    activeMsg.status = 'stopped'
  }
}

// 危险操作确认: 回传用户决定, 按钮禁用直到对应 tool_result 到达
function resolveConfirm(allow, c) {
  if (!c || c.resolved !== null) return
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ confirm: { id: c.id, allow } }))
    c.resolved = allow
  }
}

// ===== 复制 / 重编辑 =====
function copyMessage(m) {
  const text = m.role === 'user' ? m.text : collectAssistantText(m)
  if (!navigator.clipboard) {
    ElMessage.warning('当前环境不支持复制')
    return
  }
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function collectAssistantText(m) {
  let out = ''
  for (const s of m.segments || []) {
    if (s.kind === 'thinking') {
      out += `\n[思考过程]\n${s.content}\n`
    } else if (s.kind === 'text') {
      out += s.content
    } else if (s.kind === 'tool') {
      out += `\n\n[工具 ${s.name}] ${s.success ? '✓' : '✗'}\n${s.output || s.error || ''}`
    }
  }
  return out.trim()
}

function fillFromMessage(m) {
  const text = m.role === 'user' ? m.text : collectAssistantText(m)
  input.value = text
  focusInput()
}

// 复制代码块 (事件委托)
function onListClick(e) {
  const btn = e.target.closest('.md-code-copy')
  if (!btn) return
  const code = codeStore.get(btn.getAttribute('data-cid') || '') || ''
  if (!navigator.clipboard) {
    ElMessage.warning('当前环境不支持复制')
    return
  }
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success('代码已复制')
    btn.textContent = '已复制'
    setTimeout(() => (btn.textContent = '复制'), 1500)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function toggleToolCollapse(seg) {
  seg.collapsed = !seg.collapsed
}

// 工具调用参数美化展示
function formatToolArgs(args) {
  if (!args) return ''
  try {
    return JSON.stringify(JSON.parse(args), null, 2)
  } catch {
    return args
  }
}

// AI 消息的最终文本 (用于复制)
const hasContent = computed(() => input.value.trim().length > 0)

// 思考指示器显示条件: 没有分段, 或最后一段是思考过程 (文本流式时由尾部光标指示)
function lastSegIsThinking(m) {
  const segs = m.segments
  if (!segs.length) return false
  return segs[segs.length - 1].kind === 'thinking'
}

// 流式文本段: 消息仍在生成且该段是最后一段 (文本分支内调用, 只需判断位置)
function isStreamingTextSeg(m, idx) {
  return m.status === 'pending' && idx === m.segments.length - 1
}

function handleKeydown(e) {
  // Enter 发送, Shift+Enter 换行; 输入法组合中不触发
  if (e.key === 'Enter' && !e.shiftKey) {
    if (e.isComposing) return
    e.preventDefault()
    sendMessage()
  }
}

function clearChat() {
  if (loading.value) {
    ElMessage.warning('任务执行中, 请先停止')
    return
  }
  msgs.value = []
  queue.value = []
  activeMsg = null
}

// ===== 导出聊天记录 =====
function formatFullTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 工具段转 Markdown (使用 4 个反引号围栏, 避免与内容中的代码块冲突)
function toolSegToMarkdown(seg) {
  const lines = [`### 🔧 工具调用: ${seg.name || '(未命名)'} (${seg.success === false ? '失败' : '成功'})`]
  if (seg.args) {
    lines.push('', '**参数**', '', '````', seg.args, '````')
  }
  if (seg.error) {
    lines.push('', '**错误**', '', '````', seg.error, '````')
  } else if (seg.output) {
    lines.push('', '**结果**', '', '````', seg.output, '````')
  }
  return lines.join('\n')
}

function buildExportText() {
  const lines = []
  lines.push('# AI 聊天记录', '')
  lines.push(`- 主机: ${props.agent?.username || '-'}@${props.agent?.intranet || '-'}${props.agent?.hostname ? ` (${props.agent.hostname})` : ''}`)
  const sess = sessions.value.find((s) => s.session_id === currentSessionId.value)
  if (sess?.title) {
    lines.push(`- 会话: ${sess.title}`)
  }
  lines.push(`- 导出时间: ${formatFullTime(Date.now())}`)
  lines.push(`- 消息数量: ${msgs.value.length}`)
  lines.push('', '---', '')

  for (const m of msgs.value) {
    const who = m.role === 'user' ? '我' : 'AI'
    lines.push(`## [${formatTime(m.timestamp)}] ${who}`, '')
    if (m.role === 'user') {
      lines.push(m.text || '')
    } else {
      const parts = []
      for (const seg of m.segments) {
        if (seg.kind === 'text' && seg.content) {
          parts.push(seg.content)
        } else if (seg.kind === 'thinking' && seg.content) {
          parts.push(`> 💭 **思考过程**\n> ${seg.content.replace(/\n/g, '\n> ')}`)
        } else if (seg.kind === 'tool') {
          parts.push(toolSegToMarkdown(seg))
        }
      }
      lines.push(parts.join('\n\n') || '(无内容)')
    }
    lines.push('', '---', '')
  }
  return lines.join('\n')
}

function exportChat() {
  if (!msgs.value.length) {
    ElMessage.warning('暂无聊天记录可导出')
    return
  }
  const sess = sessions.value.find((s) => s.session_id === currentSessionId.value)
  const title = (sess?.title || 'AI聊天记录').replace(/[\\/:*?"<>|\r\n]/g, '_').slice(0, 50)
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const filename = `${title}_${stamp}.md`

  const blob = new Blob([buildExportText()], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出: ${filename}`)
}

// ===== 会话管理 =====
async function loadSessions() {
  if (!props.agentId) return
  sessionsLoading.value = true
  try {
    const res = await sessionList(props.agentId)
    sessions.value = res.result?.sessions || []
  } catch {
    // 静默失败, 不干扰用户
  } finally {
    sessionsLoading.value = false
  }
  // 通知父组件会话列表已更新 (用于全局侧边栏刷新)
  emit('sessions-updated')
}

function newSession() {
  if (loading.value) {
    ElMessage.warning('任务执行中, 请先停止')
    return
  }
  currentSessionId.value = ''
  msgs.value = []
  queue.value = []
  activeMsg = null
  focusInput()
}

async function selectSession(session) {
  if (loading.value) {
    ElMessage.warning('任务执行中, 请先停止')
    return
  }
  if (session.session_id === currentSessionId.value) return
  currentSessionId.value = session.session_id
  msgs.value = []
  queue.value = []
  activeMsg = null

  try {
    const res = await chatLogList(session.session_id)
    const messages = res.result?.messages || []
    rebuildMsgsFromDb(messages)
  } catch {
    ElMessage.error('加载会话记录失败')
  }
  // 已持久化的历史加载完后, 若该会话仍在后台运行则附加续接
  // (进行中回合的用户消息与过程事件不在数据库, 由回放流重建)
  await maybeAttach(session.session_id)
  nextTick(() => scrollToBottom(true))
}

// 若会话任务在后台运行, 附加观察 (回放 + 实时续接)
async function maybeAttach(sid) {
  if (!sid) return
  try {
    const res = await isSessionRunning(sid)
    if (res.result?.running) {
      connectStream({ resume: sid })
    }
  } catch {
    // 查询失败不影响历史展示
  }
}

async function deleteSession(session, e) {
  e?.stopPropagation()
  try {
    await ElMessageBox.confirm('确定删除该会话?', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await sessionDelete(session.session_id)
    // 如果删除的是当前会话, 清空聊天
    if (session.session_id === currentSessionId.value) {
      currentSessionId.value = ''
      msgs.value = []
      queue.value = []
      activeMsg = null
    }
    await loadSessions()
    ElMessage.success('已删除')
  } catch {
    // 错误已由拦截器处理
  }
}

async function clearAllSessions() {
  if (loading.value) {
    ElMessage.warning('任务执行中, 请先停止')
    return
  }
  try {
    await ElMessageBox.confirm('确定清空所有会话记录?', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await sessionClear(props.agentId)
    currentSessionId.value = ''
    msgs.value = []
    queue.value = []
    activeMsg = null
    await loadSessions()
    ElMessage.success('已清空')
  } catch {
    // 错误已由拦截器处理
  }
}

// 从数据库消息记录重建 UI 消息列表
// OpenAI 格式: user / assistant(可能带 tool_calls) / tool(带 tool_call_id)
// UI 格式: user 消息独占一条; assistant + 后续 tool 消息合并为一条 AI 消息
function rebuildMsgsFromDb(messages) {
  const result = []
  let currentAiMsg = null

  for (const m of messages) {
    if (m.role === 'user') {
      // 用户消息独占一条
      result.push({
        id: m.id,
        role: 'user',
        text: m.content,
        timestamp: m.created_at * 1000,
      })
      currentAiMsg = null
    } else if (m.role === 'assistant') {
      // 开始一条新的 AI 消息
      currentAiMsg = reactive({
        id: m.id,
        role: 'assistant',
        segments: [],
        timestamp: m.created_at * 1000,
        status: 'done',
      })
      // 解析 tool_calls 并添加 tool 段
      let toolCalls = []
      if (m.tool_calls) {
        try { toolCalls = JSON.parse(m.tool_calls) } catch { /* ignore */ }
      }
      for (const tc of toolCalls) {
        currentAiMsg.segments.push({
          kind: 'tool',
          id: tc.id,
          name: tc.function?.name || tc.name || '',
          args: tc.function?.arguments || tc.arguments || '',
          status: 'done',
          success: true,
          output: '',
          error: null,
          collapsed: true,
        })
      }
      // 添加文本段
      if (m.content) {
        currentAiMsg.segments.push({ kind: 'text', content: m.content })
      }
      result.push(currentAiMsg)
    } else if (m.role === 'tool') {
      // 找到当前 AI 消息中对应的 tool 段并填充结果
      if (currentAiMsg) {
        const seg = currentAiMsg.segments.find(
          (s) => s.kind === 'tool' && s.id === m.tool_call_id
        )
        if (seg) {
          seg.output = m.content
          seg.success = !m.content.startsWith('错误:')
          if (!seg.success) {
            seg.status = 'error'
            seg.error = m.content
            seg.output = ''
          }
          // 历史加载: 短输出展开方便浏览, 长输出折叠 (与实时流保持一致)
          seg.collapsed = (seg.output || seg.error || '').length > 800
        }
      }
    }
  }

  msgs.value = result
  // 重置渐进渲染: 先渲染最近的条目, 旧消息分帧补齐
  renderLimit.value = RENDER_INITIAL
  scheduleFillMsgs()
}

function formatSessionTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(async () => {
  focusInput()
  await loadSessions()
  // 若指定了自动选择会话, 则加载该会话
  if (props.autoSelectSessionId) {
    const target = sessions.value.find(
      (s) => s.session_id === props.autoSelectSessionId
    )
    if (target) {
      selectSession(target)
    } else {
      // 会话列表中没有, 可能是其他 agent 的会话也直接加载历史
      currentSessionId.value = props.autoSelectSessionId
      try {
        const res = await chatLogList(props.autoSelectSessionId)
        rebuildMsgsFromDb(res.result?.messages || [])
      } catch {
        // 忽略
      }
      await maybeAttach(props.autoSelectSessionId)
      nextTick(() => scrollToBottom(true))
    }
  }
})

onBeforeUnmount(() => {
  // 断开仅脱离观察: AI 任务在服务端后台继续运行,
  // 回到页面重新选中会话即可回放续接 (maybeAttach)
  stopFillMsgs()
  if (streamTimer) {
    clearTimeout(streamTimer)
    streamTimer = null
  }
  if (ws) {
    try {
      ws.close()
    } catch {
      // ignore
    }
    ws = null
  }
})
</script>

<template>
  <div class="aichat-page">
    <!-- 左侧会话列表 -->
    <div v-if="!hideSidebar" class="chat-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span class="sidebar-title">会话记录</span>
        <el-button text size="small" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '≫' : '≪' }}
        </el-button>
      </div>
      <div v-show="!sidebarCollapsed" class="sidebar-body">
        <el-button class="new-session-btn" type="primary" :icon="Plus" @click="newSession" :disabled="loading">
          新建会话
        </el-button>
        <div class="session-list" v-loading="sessionsLoading">
          <div
            v-for="s in sessions"
            :key="s.session_id"
            class="session-item"
            :class="{ active: s.session_id === currentSessionId }"
            @click="selectSession(s)"
          >
            <el-icon class="session-icon"><ChatRound /></el-icon>
            <div class="session-info">
              <div class="session-title">{{ s.title || '(空会话)' }}</div>
              <div class="session-meta">
                <span>{{ s.message_count }} 条</span>
                <span>{{ formatSessionTime(s.updated_at) }}</span>
              </div>
            </div>
            <el-button
              text
              size="small"
              :icon="Delete"
              class="session-delete-btn"
              @click="deleteSession(s, $event)"
            />
          </div>
          <div v-if="!sessions.length && !sessionsLoading" class="session-empty">
            暂无会话记录
          </div>
        </div>
        <div v-if="sessions.length" class="sidebar-footer">
          <el-button text size="small" :icon="Delete" @click="clearAllSessions" :disabled="loading">
            清空全部
          </el-button>
        </div>
      </div>
      <div v-if="sidebarCollapsed && !hideSidebar" class="sidebar-collapsed-bar" @click="sidebarCollapsed = false">
        <el-icon><ChatRound /></el-icon>
        <span class="collapsed-count" v-if="sessions.length">{{ sessions.length }}</span>
      </div>
    </div>

    <!-- 右侧聊天区 -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="chat-status" :class="{ active: loading }"></div>
        <h1 class="chat-title">AI 助手</h1>
        <span class="chat-sep">·</span>
        <p class="chat-subtitle">
          {{ agent.username || '...' }}@{{ agent.intranet || '...' }} -
          {{ agent.process || '...' }}
        </p>
        <div class="flex-grow"></div>
        <el-button
          size="small"
          text
          :icon="Download"
          @click="exportChat"
          :disabled="!msgs.length"
        >导出</el-button>
        <el-button
          size="small"
          text
          :icon="Delete"
          @click="clearChat"
          :disabled="loading"
        >清空</el-button>
      </div>

      <div class="chat-body">
        <div class="message-list-wrapper" ref="listRef" @click="onListClick" @scroll="onListScroll">
          <div class="message-list">
          <div
            v-for="m in visibleMsgs"
            :key="m.id"
            class="message-item"
            :class="{ 'message-self': m.role === 'user' }"
          >
            <div class="message-avatar">
              <div class="avatar" :class="{ 'avatar-self': m.role === 'user' }">
                {{ m.role === 'user' ? '我' : shortName(agent.username) }}
              </div>
            </div>
            <div class="message-content-wrapper">
              <div class="message-bubble-row">
                <div
                  class="message-bubble"
                  :class="{ 'bubble-self': m.role === 'user', 'bubble-error': m.status === 'error', 'bubble-stopped': m.status === 'stopped' }"
                >
                  <!-- 用户消息: markdown 渲染 -->
                  <template v-if="m.role === 'user'">
                    <div class="md-body" v-html="renderMarkdown(m.text)"></div>
                  </template>

                  <!-- AI 消息: 分段渲染 -->
                  <template v-else>
                    <template v-for="(seg, idx) in m.segments" :key="idx">
                      <!-- 思考过程段: 可折叠卡片 (来自 reasoning 模型的推理 token) -->
                      <div v-if="seg.kind === 'thinking'" class="thinking-card">
                        <div class="thinking-card-head" @click="seg.collapsed = !seg.collapsed">
                          <span class="thinking-icon">💭</span>
                          <span class="thinking-title">思考过程</span>
                          <span class="thinking-toggle">{{ seg.collapsed ? '展开' : '折叠' }}</span>
                        </div>
                        <div v-show="!seg.collapsed" class="thinking-card-body">
                          <div class="md-body thinking-content" v-html="renderMarkdown(seg.content)"></div>
                        </div>
                      </div>
                      <!-- 文本段: markdown 渲染, 流式尾部带闪烁光标 -->
                      <template v-else-if="seg.kind === 'text'">
                        <div class="md-body" v-html="renderMarkdown(seg.content)"></div>
                        <span v-if="isStreamingTextSeg(m, idx)" class="stream-cursor"></span>
                      </template>
                      <!-- 工具段: 可折叠卡片 -->
                      <div v-else class="tool-card" :class="{ 'tool-error': seg.status === 'error' }">
                        <div class="tool-card-head" @click="toggleToolCollapse(seg)">
                          <span class="tool-icon" :class="seg.status">
                            <span v-if="seg.status === 'running'" class="tool-spinner"></span>
                            <span v-else-if="seg.status === 'done'">✓</span>
                            <span v-else>✗</span>
                          </span>
                          <span class="tool-name">{{ seg.name }}</span>
                          <span class="tool-state">{{ seg.status === 'running' ? '执行中' : (seg.success ? '成功' : '失败') }}</span>
                          <span class="tool-toggle">{{ seg.collapsed ? '展开' : '折叠' }}</span>
                        </div>
                        <div v-show="!seg.collapsed" class="tool-card-body">
                          <div v-if="seg.args" class="tool-args">
                            <div class="tool-section-label">参数</div>
                            <pre class="tool-pre">{{ formatToolArgs(seg.args) }}</pre>
                          </div>
                          <div v-if="seg.output || seg.error || seg.status === 'running'" class="tool-output">
                            <div class="tool-section-label">{{ seg.error ? '错误' : '结果' }}</div>
                            <pre v-if="seg.status === 'running'" class="tool-pre tool-running">等待执行结果...</pre>
                            <pre v-else-if="seg.error" class="tool-pre tool-error-pre">{{ seg.error }}</pre>
                            <pre v-else class="tool-pre">{{ seg.output }}</pre>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- 思考中指示器 (无分段或思考流式时显示) -->
                    <div v-if="m.status === 'pending' && (!m.segments.length || lastSegIsThinking(m))" class="thinking-indicator">
                      <span class="typing-dot"></span>
                      <span class="typing-dot"></span>
                      <span class="typing-dot"></span>
                    </div>
                  </template>
                </div>

                <!-- 消息操作按钮 -->
                <div class="message-actions">
                  <el-button
                    text
                    size="small"
                    :icon="CopyDocument"
                    @click="copyMessage(m)"
                    title="复制"
                  />
                  <el-button
                    v-if="m.role === 'user'"
                    text
                    size="small"
                    :icon="RefreshLeft"
                    @click="fillFromMessage(m)"
                    title="编辑并重发"
                  />
                  <el-button
                    v-else
                    text
                    size="small"
                    :icon="RefreshLeft"
                    @click="fillFromMessage(m)"
                    title="填入输入框"
                  />
                </div>
              </div>
              <div class="message-time">{{ formatTime(m.timestamp) }}</div>
            </div>
          </div>

          <div v-if="!msgs.length && !loading" class="chat-empty">
            <div class="empty-icon">◈</div>
            <div>输入消息开始与 AI 助手对话</div>
            <div class="empty-hint">AI 将实时展示思考过程与工具调用 · Enter 发送</div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <!-- 危险操作确认: 命中 ai.blacklist 的工具调用暂停等待放行/拒绝, 多个按顺序叠加 -->
      <div v-if="pendingConfirms.length" class="confirm-stack">
        <div v-for="c in pendingConfirms" :key="c.id" class="confirm-bar">
          <span class="confirm-icon">⚠</span>
          <div class="confirm-info">
            <div class="confirm-title">
              危险操作确认
              <span class="confirm-tool">{{ c.name }}</span>
            </div>
            <div class="confirm-meta">
              命中规则: <code>{{ c.matched }}</code>
            </div>
            <div class="confirm-args" :title="c.arguments">
              {{ c.arguments || '(无参数)' }}
            </div>
          </div>
          <div class="confirm-actions">
            <template v-if="c.resolved === null">
              <el-button size="small" type="danger" plain @click="resolveConfirm(false, c)">拒绝</el-button>
              <el-button size="small" type="success" @click="resolveConfirm(true, c)">放行</el-button>
            </template>
            <span v-else class="confirm-resolved">
              {{ confirmOutcomeText(c) }}
            </span>
          </div>
        </div>
      </div>
      <!-- 消息队列: 任务执行期间发送的消息排队等待处理 -->
      <div v-if="queue.length" class="task-queue">
        <div class="queue-head">
          <span class="queue-title">待处理队列</span>
          <span class="queue-count">{{ queue.length }} 条</span>
          <el-button text size="small" :icon="Delete" class="queue-clear-btn" @click="clearQueue" title="清空全部排队消息">清空</el-button>
        </div>
        <div class="queue-body">
          <div
            v-for="(q, idx) in queue"
            :key="q.id"
            class="queue-item"
            :class="{ 'queue-first': idx === 0 }"
          >
            <span class="queue-index">{{ idx + 1 }}</span>
            <div class="queue-text" :title="q.text">{{ q.text }}</div>
            <div class="queue-actions">
              <el-button text size="small" :icon="Delete" @click="removeQueueItem(q.id)" title="从队列删除" />
              <el-button text size="small" :icon="EditPen" @click="editQueueItem(q.id)" title="编辑: 放回输入框" />
              <el-button text size="small" :icon="Promotion" class="queue-send-btn" @click="prioritizeQueueItem(q.id)" :title="loading ? '停止当前任务并优先发送' : '立即发送'" />
            </div>
          </div>
        </div>
      </div>

      <div class="composer" :class="{ 'is-loading': loading }">
        <el-input
          ref="inputRef"
          v-model="input"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 10 }"
          placeholder="输入指令，Enter 发送，Shift+Enter 换行；任务执行中发送将自动排队"
          @keydown="handleKeydown"
          class="composer-input"
        />
        <div class="composer-toolbar">
          <span class="composer-hint">
            <kbd>Enter</kbd> 发送 <span class="hint-sep">·</span> <kbd>⇧Enter</kbd> 换行
          </span>
          <div class="composer-btns">
            <button v-if="loading" class="composer-btn composer-btn-stop" @click="stopTask">
              <span class="stop-sq"></span>
              <span>停止</span>
            </button>
            <button
              class="composer-btn composer-btn-send"
              :disabled="!hasContent"
              @click="sendMessage"
            >
              <el-icon><Promotion /></el-icon>
              <span>{{ loading ? '排队' : '发送' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.aichat-page {
  display: flex;
  flex-direction: row;
  height: 100%;
  background: var(--tk-bg-card);
  overflow: hidden;
}

/* ===== 会话侧边栏 ===== */
.chat-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  min-width: 260px;
  border-right: 1px solid var(--tk-border);
  background: var(--tk-bg-panel);
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
}
.chat-sidebar.collapsed {
  width: 44px;
  min-width: 44px;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--tk-border);
}
.sidebar-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--tk-accent-soft);
}
.sidebar-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.new-session-btn {
  margin: 8px 10px 4px;
  width: calc(100% - 20px);
}
.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 6px;
}
.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
  position: relative;
}
.session-item:hover {
  background: var(--tk-accent-hover);
}
.session-item.active {
  background: var(--tk-accent-soft);
}
.session-icon {
  color: var(--tk-accent-dim);
  flex-shrink: 0;
}
.session-info {
  flex: 1;
  min-width: 0;
}
.session-title {
  font-size: 13px;
  color: var(--tk-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.session-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--tk-accent-dim);
  margin-top: 2px;
}
.session-delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.session-item:hover .session-delete-btn {
  opacity: 1;
}
.session-empty {
  text-align: center;
  color: var(--tk-accent-dim);
  font-size: 13px;
  padding: 20px 0;
}
.sidebar-footer {
  padding: 8px 10px;
  border-top: 1px solid var(--tk-border);
  text-align: center;
}
.sidebar-collapsed-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  cursor: pointer;
  padding: 10px 0;
  color: var(--tk-accent-dim);
  position: relative;
}
.sidebar-collapsed-bar:hover {
  color: var(--tk-accent);
}
.collapsed-count {
  position: absolute;
  bottom: 16px;
  font-size: 11px;
  color: var(--tk-accent-dim);
}

/* ===== 聊天主区域 ===== */
.chat-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--tk-border);
}
.flex-grow {
  flex: 1;
}
.chat-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--tk-accent);
  box-shadow: 0 0 8px var(--tk-accent);
  flex-shrink: 0;
  transition: background 0.2s;
}
.chat-status.active {
  animation: pulse-status 1.2s infinite;
}
@keyframes pulse-status {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.chat-title {
  font-size: 16px;
  margin: 0;
  color: var(--tk-accent);
  text-shadow: 0 0 8px var(--tk-accent-glow);
  font-family: 'Consolas', monospace;
}
.chat-sep {
  color: var(--tk-accent-dim);
}
.chat-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--tk-accent-dim);
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.message-list-wrapper {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  /* 渲染隔离: 视口外的消息整体跳过 Layout/Style/Paint。
     页面曾有 92 条消息 ×markdown/工具块 ≈ 4k DOM 节点同处一棵布局树,
     任何 18 个节点的变化都要重排全树(实测单次 20-35ms)。
     content-visibility 让重排范围收缩到可见条目, 初始挂载也免于全量布局。
     contain-intrinsic-size 用最后渲染尺寸做占位, 滚动条长度基本稳定。 */
  content-visibility: auto;
  contain-intrinsic-size: auto 180px;
}
/* 全宽消息: 用户与 AI 消息均占满一行, 随容器宽度响应式自适应 */
/* 头像统一在左侧, 用户消息靠 bubble-self 背景色区分 */
.message-avatar {
  flex-shrink: 0;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background: var(--tk-accent-active);
  border: 1px solid var(--tk-accent);
  color: var(--tk-accent);
  text-shadow: 0 0 6px var(--tk-accent-glow);
}
.avatar-self {
  background: var(--tk-accent-hover);
  border-color: var(--tk-accent-soft);
  color: var(--tk-accent-soft);
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.message-bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--tk-bg-panel);
  border: 1px solid var(--tk-border);
  color: var(--tk-accent-soft);
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
  max-width: 100%;
  flex: 1;
  min-width: 0;
}
.bubble-self {
  background: var(--tk-accent-hover);
  border-color: var(--tk-accent-dim);
}
.bubble-error {
  border-color: var(--el-color-danger, #f56c6c);
}
.bubble-stopped {
  border-color: var(--el-color-warning, #e6a23c);
}
.message-text {
  white-space: pre-wrap;
}

.message-actions {
  opacity: 0;
  transition: opacity 0.15s;
  align-self: center;
  display: flex;
  gap: 2px;
}
.message-item:hover .message-actions {
  opacity: 1;
}
.message-time {
  font-size: 11px;
  color: var(--tk-accent-dim);
  opacity: 0.7;
}

/* ===== Markdown 渲染 ===== */
.md-body {
  margin: 0;
}
.md-body :deep(p) {
  margin: 0 0 8px 0;
}
.md-body :deep(p:last-child) {
  margin-bottom: 0;
}
.md-body :deep(h1),
.md-body :deep(h2),
.md-body :deep(h3),
.md-body :deep(h4) {
  margin: 12px 0 6px;
  color: var(--tk-accent);
  font-weight: bold;
}
.md-body :deep(h1) { font-size: 18px; }
.md-body :deep(h2) { font-size: 16px; }
.md-body :deep(h3) { font-size: 15px; }
.md-body :deep(h4) { font-size: 14px; }
.md-body :deep(ul),
.md-body :deep(ol) {
  margin: 6px 0;
  padding-left: 22px;
}
.md-body :deep(li) {
  margin: 2px 0;
}
.md-body :deep(code) {
  background: var(--tk-bg-card);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: var(--tk-accent);
}
.md-body :deep(pre) {
  background: var(--tk-bg-card);
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 6px 0;
}
.md-body :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--tk-accent-soft);
}
.md-body :deep(blockquote) {
  border-left: 3px solid var(--tk-accent-dim);
  padding-left: 10px;
  margin: 6px 0;
  color: var(--tk-accent-dim);
}
.md-body :deep(a) {
  color: var(--tk-accent);
  text-decoration: underline;
}
.md-body :deep(table) {
  border-collapse: collapse;
  margin: 6px 0;
  font-size: 13px;
}
.md-body :deep(th),
.md-body :deep(td) {
  border: 1px solid var(--tk-border);
  padding: 4px 8px;
}
.md-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--tk-border);
  margin: 10px 0;
}

/* 代码块容器 */
.md-body :deep(.md-code-block) {
  background: var(--tk-bg-card);
  border: 1px solid var(--tk-border);
  border-radius: 6px;
  margin: 6px 0;
  overflow: hidden;
}
.md-body :deep(.md-code-head) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  background: var(--tk-bg-panel);
  border-bottom: 1px solid var(--tk-border);
  font-size: 12px;
}
.md-body :deep(.md-code-lang) {
  color: var(--tk-accent-dim);
  font-family: 'Consolas', monospace;
}
.md-body :deep(.md-code-copy) {
  background: none;
  border: 1px solid var(--tk-border);
  color: var(--tk-accent-soft);
  border-radius: 3px;
  padding: 1px 8px;
  cursor: pointer;
  font-size: 11px;
}
.md-body :deep(.md-code-copy:hover) {
  background: var(--tk-accent-hover);
  color: var(--tk-accent);
}
.md-body :deep(.md-code-block pre) {
  margin: 0;
  border-radius: 0;
  border: none;
  max-height: 480px;
  overflow-y: auto;
}

/* 流式输出尾部闪烁光标 */
.stream-cursor {
  display: inline-block;
  width: 8px;
  height: 15px;
  margin-top: 4px;
  border-radius: 1px;
  background: var(--tk-accent);
  box-shadow: 0 0 6px var(--tk-accent-glow);
  animation: cursor-blink 1s steps(1) infinite;
}
@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* ===== 思考过程卡片 (reasoning_content) ===== */
.thinking-card {
  border: 1px dashed var(--tk-border);
  border-radius: 6px;
  margin: 6px 0;
  background: var(--tk-bg-panel);
  overflow: hidden;
}
.thinking-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
}
.thinking-icon {
  font-size: 14px;
}
.thinking-title {
  color: var(--tk-accent-dim);
  font-weight: 500;
}
.thinking-toggle {
  margin-left: auto;
  color: var(--tk-accent-dim);
  font-size: 11px;
  opacity: 0.7;
}
.thinking-card-body {
  padding: 8px 12px;
  border-top: 1px dashed var(--tk-border);
}
.thinking-content {
  color: var(--tk-accent-dim);
  font-size: 13px;
  font-style: italic;
  opacity: 0.85;
}
.thinking-content :deep(p) {
  margin: 4px 0;
}

/* ===== 工具卡片 ===== */
.tool-card {
  border: 1px solid var(--tk-border);
  border-radius: 6px;
  margin: 6px 0;
  background: var(--tk-bg-card);
  overflow: hidden;
}
.tool-card.tool-error {
  border-color: var(--el-color-danger, #f56c6c);
}
.tool-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--tk-bg-panel);
  cursor: pointer;
  user-select: none;
  font-size: 13px;
}
.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
}
.tool-icon.done {
  color: var(--el-color-success, #67c23a);
}
.tool-icon.error {
  color: var(--el-color-danger, #f56c6c);
}
.tool-icon.running {
  color: var(--tk-accent);
}
.tool-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--tk-accent-dim);
  border-top-color: var(--tk-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.tool-name {
  color: var(--tk-accent);
  font-family: 'Consolas', monospace;
  font-weight: bold;
}
.tool-state {
  color: var(--tk-accent-dim);
  font-size: 12px;
}
.tool-toggle {
  margin-left: auto;
  color: var(--tk-accent-dim);
  font-size: 11px;
  opacity: 0.7;
}
.tool-card-body {
  padding: 8px 10px;
}
.tool-section-label {
  font-size: 11px;
  color: var(--tk-accent-dim);
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tool-pre {
  margin: 0 0 8px 0;
  padding: 8px;
  background: var(--tk-bg-panel);
  border-radius: 4px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  color: var(--tk-accent-soft);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
  overflow-y: auto;
}
.tool-pre:last-child {
  margin-bottom: 0;
}
.tool-pre.tool-running {
  color: var(--tk-accent-dim);
  font-style: italic;
}
.tool-pre.tool-error-pre {
  color: var(--el-color-danger, #f56c6c);
}

/* 思考指示器 */
.thinking-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 4px 0;
  align-items: center;
}
.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tk-accent);
  animation: typing-blink 1.4s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

.chat-empty {
  text-align: center;
  color: var(--tk-accent-dim);
  padding: 60px 20px;
  font-size: 13px;
}
.empty-icon {
  font-size: 40px;
  color: var(--tk-accent);
  text-shadow: 0 0 12px var(--tk-accent-glow);
  margin-bottom: 12px;
}
.empty-hint {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.7;
}

/* ===== 消息队列 (输入框上方) ===== */
.task-queue {
  display: flex;
  flex-direction: column;
  border: 1px dashed var(--tk-border);
  border-radius: 10px;
  background: var(--tk-bg-panel);
  margin-bottom: 10px;
  max-height: 200px;
  overflow: hidden;
  flex-shrink: 0;
}
.queue-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-bottom: 1px dashed var(--tk-border);
  flex-shrink: 0;
}
.queue-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--tk-accent);
  font-family: 'Consolas', monospace;
}
.queue-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--tk-accent-dim);
}
.queue-body {
  overflow-y: auto;
}
.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px;
  font-size: 13px;
}
.queue-item + .queue-item {
  border-top: 1px solid color-mix(in srgb, var(--tk-border) 55%, transparent);
}
.queue-item:hover {
  background: var(--tk-accent-hover);
}
.queue-index {
  flex-shrink: 0;
  min-width: 18px;
  text-align: center;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: var(--tk-accent-dim);
}
.queue-first .queue-index {
  color: var(--tk-accent);
  font-weight: bold;
}
.queue-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--tk-accent-soft);
}
.queue-actions {
  display: flex;
  flex-shrink: 0;
}
.queue-send-btn {
  color: var(--tk-accent) !important;
}
.queue-clear-btn {
  margin-left: 8px;
  padding: 2px 6px;
  height: auto;
  color: var(--tk-accent-dim);
}
.queue-clear-btn:hover {
  color: #f56c6c !important;
  background: color-mix(in srgb, #f56c6c 10%, transparent) !important;
}

/* ===== 危险操作确认条 ===== */
.confirm-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.confirm-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, #f56c6c 45%, var(--tk-border));
  border-radius: 10px;
  background: color-mix(in srgb, #f56c6c 8%, var(--tk-bg-panel));
  flex-shrink: 0;
}
.confirm-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #f56c6c;
}
.confirm-info {
  flex: 1;
  min-width: 0;
}
.confirm-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--tk-accent-soft);
}
.confirm-tool {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: #f56c6c;
  background: color-mix(in srgb, #f56c6c 12%, transparent);
}
.confirm-meta {
  margin-top: 3px;
  font-size: 11px;
  color: var(--tk-accent-dim);
}
.confirm-meta code {
  font-family: 'Consolas', monospace;
  color: var(--tk-accent);
}
.confirm-args {
  margin-top: 3px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: var(--tk-accent-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.confirm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.confirm-resolved {
  font-size: 12px;
  color: var(--tk-accent-dim);
  white-space: nowrap;
}

/* ===== 输入区 ===== */
.chat-footer {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--tk-border);
  background: var(--tk-bg-card);
}
.composer {
  background: var(--tk-bg-input);
  border: 1px solid var(--tk-border);
  border-radius: 12px;
  padding: 10px 12px 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.composer:focus-within {
  border-color: var(--tk-accent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--tk-accent) 30%, transparent),
    0 0 22px color-mix(in srgb, var(--tk-accent) 12%, transparent);
}
.composer.is-loading {
  animation: composer-pulse 1.6s ease-in-out infinite;
}
@keyframes composer-pulse {
  0%, 100% { border-color: var(--tk-border); }
  50% { border-color: color-mix(in srgb, var(--tk-accent) 55%, var(--tk-border)); }
}
.composer-input {
  --el-input-bg-color: transparent;
}
:deep(.composer-input .el-textarea__inner) {
  background: transparent;
  border: none;
  box-shadow: none !important;
  padding: 2px 2px 0;
  color: var(--tk-accent-soft);
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.65;
  letter-spacing: 0.2px;
}
:deep(.composer-input .el-textarea__inner::placeholder) {
  color: var(--tk-accent-dark);
}
:deep(.composer-input .el-textarea__inner.is-disabled) {
  background: transparent;
  opacity: 0.55;
}
.composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed color-mix(in srgb, var(--tk-border) 70%, transparent);
}
.composer-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--tk-accent-dim);
  user-select: none;
}
.composer-hint kbd {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 10.5px;
  color: var(--tk-accent-dim);
  background: color-mix(in srgb, var(--tk-bg-page) 65%, var(--tk-bg-input));
  border: 1px solid var(--tk-border);
  border-radius: 4px;
  padding: 1px 5px;
  line-height: 1.5;
}
.hint-sep {
  opacity: 0.5;
}
.composer-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}
.composer-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.composer-btn-send {
  color: var(--tk-accent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tk-accent) 24%, transparent),
    color-mix(in srgb, var(--tk-accent) 10%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--tk-accent) 65%, transparent);
}
.composer-btn-send:hover:not(:disabled) {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tk-accent) 36%, transparent),
    color-mix(in srgb, var(--tk-accent) 16%, transparent)
  );
  border-color: var(--tk-accent);
  box-shadow: 0 0 14px color-mix(in srgb, var(--tk-accent) 30%, transparent);
}
.composer-btn-send:active:not(:disabled) {
  transform: translateY(1px);
}
.composer-btn-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.composer-btn-stop {
  color: var(--btn-danger-color);
  background: var(--btn-danger-bg);
  border: 1px solid var(--btn-danger-border);
}
.composer-btn-stop:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 14px color-mix(in srgb, var(--btn-danger-border) 35%, transparent);
}
.stop-sq {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: var(--btn-danger-border);
  animation: stop-blink 1.2s ease-in-out infinite;
}
@keyframes stop-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* ===== 响应式: 窄屏收窄边距与头像 ===== */
@media (max-width: 900px) {
  .message-list-wrapper {
    padding: 10px;
  }
  .message-item {
    gap: 8px;
  }
  .avatar {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  .message-bubble {
    padding: 10px 12px;
  }
  .composer-hint {
    display: none;
  }
  .queue-text {
    font-size: 12px;
  }
}
</style>
