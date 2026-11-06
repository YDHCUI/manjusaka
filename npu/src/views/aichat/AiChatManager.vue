<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, ChatRound, Plus, Search } from '@element-plus/icons-vue'
import { sessionAll, sessionDelete, runningList } from '@/api/aichat'
import { formatTime, timeAgo } from '@/utils/format'
import AiChat from '@/views/agent/AiChat.vue'

defineOptions({ name: 'AiChatManager' })

const loading = ref(false)
const sessions = ref([])
const agents = ref([])
const keyword = ref('')
const nowTick = ref(Math.floor(Date.now() / 1000))
// 后台运行中的会话 id 集合 (徽标展示, 定时刷新)
const runningSet = ref(new Set())

// 聊天区域状态
const chatAgent = ref(null)
const chatSessionId = ref('')
const chatKey = ref(0) // 切换时强制重建 AiChat 组件

// 新建对话: 选择 agent
const agentPickerVisible = ref(false)
const agentKeyword = ref('')

const filteredSessions = computed(() => {
  if (!keyword.value.trim()) return sessions.value
  const kw = keyword.value.toLowerCase()
  return sessions.value.filter(
    (s) =>
      s.title?.toLowerCase().includes(kw) ||
      getAgentInfo(s.agent_id)?.username?.toLowerCase().includes(kw) ||
      getAgentInfo(s.agent_id)?.hostname?.toLowerCase().includes(kw) ||
      getAgentInfo(s.agent_id)?.intranet?.toLowerCase().includes(kw)
  )
})

const filteredAgents = computed(() => {
  if (!agentKeyword.value.trim()) return agents.value
  const kw = agentKeyword.value.toLowerCase()
  return agents.value.filter(
    (a) =>
      a.username?.toLowerCase().includes(kw) ||
      a.hostname?.toLowerCase().includes(kw) ||
      a.intranet?.toLowerCase().includes(kw) ||
      a.id?.toLowerCase().includes(kw)
  )
})

const agentMap = computed(() => {
  const m = {}
  for (const a of agents.value) {
    m[a.id] = a
  }
  return m
})

function getAgentInfo(agentId) {
  return agentMap.value[agentId]
}

function agentLabel(agentId) {
  if (agentId === 'nps') return 'NPS 本地'
  const a = getAgentInfo(agentId)
  if (!a) return (agentId || '').slice(0, 8) + '...'
  return `${a.username || '?'}@${a.intranet || '?'}`
}

function sessionTimeAgo(ts) {
  const r = timeAgo(ts, nowTick.value)
  return r.text
}

function formatSessionTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadSessions() {
  loading.value = true
  try {
    const res = await sessionAll()
    sessions.value = res.result?.sessions || []
    agents.value = res.result?.agents || []
    // 初次加载: 若有会话且尚未选择, 自动选择最近一条
    if (sessions.value.length && !chatAgent.value) {
      autoSelectLatest()
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
  loadRunning()
}

// 拉取后台运行中的会话列表 (离开页面后任务仍继续, 回来可见徽标)
async function loadRunning() {
  try {
    const res = await runningList()
    runningSet.value = new Set(res.result?.running || [])
  } catch {
    // 静默失败, 不影响列表
  }
}

function isRunning(sid) {
  return runningSet.value.has(sid)
}

function autoSelectLatest() {
  // 按 updated_at 降序, 取最近一条
  const sorted = [...sessions.value].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))
  if (sorted.length) {
    openSession(sorted[0])
  }
}

// 点击侧边栏会话 -> 加载到聊天区
function openSession(session) {
  const agent = getAgentInfo(session.agent_id)
  if (agent) {
    chatAgent.value = agent
  } else if (session.agent_id === 'nps') {
    chatAgent.value = { id: 'nps', username: 'NPS', intranet: '本地', hostname: 'NPS 服务端', platform: '', arch: '', npc2: false }
  } else {
    chatAgent.value = { id: session.agent_id }
  }
  chatSessionId.value = session.session_id
  chatKey.value++ // 强制重建 AiChat 组件
}

async function deleteSession(session, e) {
  e?.stopPropagation()
  try {
    await ElMessageBox.confirm(
      `确定删除会话「${session.title || '(空会话)'}」?`,
      '提示',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await sessionDelete(session.session_id)
    // 如果删除的是当前会话, 清空聊天
    if (session.session_id === chatSessionId.value) {
      chatAgent.value = null
      chatSessionId.value = ''
    }
    await loadSessions()
    ElMessage.success('已删除')
  } catch {
    // 错误已由拦截器处理
  }
}

function startNewChat() {
  agentPickerVisible.value = true
  agentKeyword.value = ''
}

function selectAgent(agent) {
  agentPickerVisible.value = false
  chatAgent.value = agent
  chatSessionId.value = ''
  chatKey.value++ // 强制重建 AiChat 组件
}

// 不选主机直接创建会话 (用于 NPS 端工具, 如查看主机列表)
function selectNoAgent() {
  agentPickerVisible.value = false
  chatAgent.value = { id: 'nps', username: 'NPS', intranet: '本地', hostname: 'NPS 服务端', platform: '', arch: '', npc2: false }
  chatSessionId.value = ''
  chatKey.value++
}

// AiChat 组件会话更新回调 (任务完成后刷新全局侧边栏)
function onSessionsUpdated() {
  loadSessions()
}

let tickTimer = null
onMounted(() => {
  loadSessions()
  tickTimer = setInterval(() => {
    nowTick.value = Math.floor(Date.now() / 1000)
    // 顺带刷新后台运行状态, 运行中的任务结束后徽标自动消失
    loadRunning()
  }, 5000)
})

onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<template>
  <div class="aichat-manager">
    <!-- 左侧: 全局会话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">会话记录</span>
        <div class="sidebar-actions">
          <el-button text size="small" :icon="Refresh" @click="loadSessions" :loading="loading">刷新</el-button>
          <el-button type="primary" :icon="Plus" size="small" @click="startNewChat">新建</el-button>
        </div>
      </div>
      <div class="sidebar-search">
        <el-input
          v-model="keyword"
          placeholder="搜索会话/主机"
          :prefix-icon="Search"
          clearable
          size="small"
        />
      </div>
      <div class="session-list" v-loading="loading">
        <div
          v-for="s in filteredSessions"
          :key="s.session_id"
          class="session-item"
          :class="{ active: s.session_id === chatSessionId }"
          @click="openSession(s)"
        >
          <el-icon class="session-icon"><ChatRound /></el-icon>
          <div class="session-info">
            <div class="session-title">
              {{ s.title || '(空会话)' }}
              <span v-if="isRunning(s.session_id)" class="running-badge">运行中</span>
            </div>
            <div class="session-meta">
              <span class="session-agent">{{ agentLabel(s.agent_id) }}</span>
              <span>·</span>
              <span>{{ s.message_count }} 条</span>
              <span>·</span>
              <span>{{ sessionTimeAgo(s.updated_at) }}</span>
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
        <div v-if="!filteredSessions.length && !loading" class="session-empty">
          {{ keyword ? '无匹配会话' : '暂无会话记录' }}
        </div>
      </div>
    </div>

    <!-- 右侧: 聊天区 -->
    <div class="chat-main">
      <AiChat
        v-if="chatAgent"
        :key="chatKey"
        :agent-id="chatAgent.id"
        :agent="chatAgent"
        :auto-select-session-id="chatSessionId"
        :hide-sidebar="true"
        @sessions-updated="onSessionsUpdated"
      />
      <div v-else class="chat-placeholder">
        <div class="placeholder-icon">◈</div>
        <div class="placeholder-text">选择左侧会话或点击「新建」开始对话</div>
        <el-button type="primary" :icon="Plus" @click="startNewChat" class="placeholder-btn">
          新建对话
        </el-button>
      </div>
    </div>

    <!-- 选择主机新建对话 -->
    <el-dialog
      v-model="agentPickerVisible"
      title="选择主机开始对话"
      width="600px"
      :close-on-click-modal="false"
    >
      <!-- 不选主机直接创建 -->
      <div class="agent-direct-create" @click="selectNoAgent">
        <el-icon class="direct-icon"><ChatRound /></el-icon>
        <div class="direct-info">
          <span class="direct-title">不选主机直接创建</span>
          <span class="direct-desc">用于查看主机列表等 NPS 端工具, 无需指定主机</span>
        </div>
        <el-icon class="direct-go"><ChatRound /></el-icon>
      </div>

      <div class="agent-picker-divider"><span>选择已连接主机</span></div>

      <el-input
        v-model="agentKeyword"
        placeholder="搜索主机名/用户名/IP"
        :prefix-icon="Search"
        clearable
        class="agent-search"
      />
      <div class="agent-list">
        <div
          v-for="a in filteredAgents"
          :key="a.id"
          class="agent-pick-item"
          :class="{ disabled: !a.npc2 }"
          @click="a.npc2 && selectAgent(a)"
        >
          <div class="agent-pick-info">
            <span class="agent-pick-name">
              {{ a.username }}@{{ a.intranet }}
              <el-tag v-if="!a.npc2" size="small" type="info" class="agent-offline-tag">未连接</el-tag>
            </span>
            <span class="agent-pick-detail">{{ a.hostname }} / {{ a.platform }} {{ a.arch }}</span>
          </div>
          <el-icon class="agent-pick-go" v-if="a.npc2"><ChatRound /></el-icon>
        </div>
        <div v-if="!filteredAgents.length" class="agent-pick-empty">
          暂无主机
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.aichat-manager {
  display: flex;
  flex-direction: row;
  height: 100%;
  background: var(--tk-bg-page);
  overflow: hidden;
}

/* ===== 左侧全局会话列表 ===== */
.chat-sidebar {
  display: flex;
  flex-direction: column;
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--tk-border);
  background: var(--tk-bg-panel);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--tk-border);
}

.sidebar-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--tk-accent);
  font-family: 'Consolas', monospace;
}

.sidebar-search {
  padding: 8px 12px;
  border-bottom: 1px solid var(--tk-border);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 2px solid transparent;
}

.session-item:hover {
  background: var(--tk-accent-hover);
}

.session-item.active {
  background: var(--tk-accent-hover);
  border-left-color: var(--tk-accent);
}

.session-icon {
  color: var(--tk-accent-dim);
  flex-shrink: 0;
  font-size: 16px;
}

.session-item.active .session-icon {
  color: var(--tk-accent);
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
  margin-bottom: 2px;
}

/* 后台运行中会话徽标 (任务独立于页面连接继续执行) */
.running-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0 5px;
  font-size: 10px;
  line-height: 16px;
  border-radius: 8px;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.15);
  border: 1px solid rgba(103, 194, 58, 0.4);
  vertical-align: 1px;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--tk-accent-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-agent {
  color: var(--tk-accent-soft);
  font-family: 'Consolas', monospace;
}

.session-delete-btn {
  opacity: 0;
  flex-shrink: 0;
  color: var(--tk-accent-dim);
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.session-empty {
  text-align: center;
  color: var(--tk-accent-dim);
  padding: 40px 12px;
  font-size: 13px;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 右侧聊天区 ===== */
.chat-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--tk-accent-dim);
}

.placeholder-icon {
  font-size: 48px;
  color: var(--tk-accent);
  opacity: 0.3;
}

.placeholder-text {
  font-size: 14px;
}

.placeholder-btn {
  margin-top: 8px;
}

/* Agent 选择对话框 */
.agent-search {
  margin-bottom: 12px;
}

.agent-list {
  max-height: 400px;
  overflow-y: auto;
}

.agent-pick-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--tk-border);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.agent-pick-item:hover {
  border-color: var(--tk-accent);
  background: var(--tk-accent-hover);
}

.agent-pick-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-pick-name {
  color: var(--tk-accent-soft);
  font-size: 14px;
  font-family: 'Consolas', monospace;
}

.agent-pick-detail {
  font-size: 11px;
  color: var(--tk-accent-dim);
}

.agent-pick-go {
  color: var(--tk-accent);
  font-size: 18px;
}

.agent-pick-empty {
  text-align: center;
  color: var(--tk-accent-dim);
  padding: 30px 0;
}

/* 不选主机直接创建 */
.agent-direct-create {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--tk-accent-soft);
  border-radius: 6px;
  margin-bottom: 12px;
  cursor: pointer;
  background: var(--tk-accent-hover);
  transition: all 0.15s;
}

.agent-direct-create:hover {
  border-color: var(--tk-accent);
  box-shadow: 0 0 8px var(--tk-accent-glow);
}

.direct-icon {
  color: var(--tk-accent);
  font-size: 24px;
  flex-shrink: 0;
}

.direct-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.direct-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--tk-accent);
  font-family: 'Consolas', monospace;
}

.direct-desc {
  font-size: 11px;
  color: var(--tk-accent-dim);
}

.direct-go {
  color: var(--tk-accent);
  font-size: 18px;
}

/* 分隔线 */
.agent-picker-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--tk-accent-dim);
  font-size: 12px;
}

.agent-picker-divider::before,
.agent-picker-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--tk-border);
}

/* 未连接 npc2 的主机禁用样式 */
.agent-pick-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.agent-pick-item.disabled:hover {
  border-color: var(--tk-border);
  background: transparent;
}

.agent-offline-tag {
  margin-left: 6px;
}
</style>
