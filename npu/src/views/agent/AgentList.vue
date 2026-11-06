<script setup>
import { ref, computed, onMounted, onActivated, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Delete, Link, Edit } from '@element-plus/icons-vue'
import { agentList, agentDelete, agentNote } from '@/api/agent'
import { useAgentLogSocket } from '@/composables/useAgentLogSocket'
import { platformColor, timeAgo } from '@/utils/format'
import { useAppStore } from '@/stores/app'

defineOptions({ name: 'AgentList' })

const router = useRouter()
const appStore = useAppStore()
const loading = ref(false)
const list = ref([])
const keyword = ref('')
const autoRefresh = ref(true)
let timer = null

// 多选删除
const selectedRows = ref([])
const batchDeleting = ref(false)
function onSelectionChange(rows) {
  selectedRows.value = rows || []
}
async function handleBatchDelete() {
  const rows = selectedRows.value
  if (!rows.length) return
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${rows.length} 台主机？删除后不可恢复`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  batchDeleting.value = true
  let ok = 0
  let fail = 0
  // 逐个删除, 避免并发请求风暴
  for (const row of rows) {
    try {
      await agentDelete(row.id)
      ok++
      delete agentMap.value[row.id]
    } catch {
      fail++
    }
  }
  batchDeleting.value = false
  list.value = Object.values(agentMap.value)
  if (fail === 0) {
    ElMessage.success(`已删除 ${ok} 台主机`)
  } else {
    ElMessage.warning(`删除完成: 成功 ${ok} 台, 失败 ${fail} 台`)
  }
}

const nowTick = ref(Math.floor(Date.now() / 1000))
let tickTimer = null
function startTick() {
  stopTick()
  tickTimer = setInterval(() => {
    nowTick.value = Math.floor(Date.now() / 1000)
  }, 5000)
}
function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

const { lastEvent, connect } = useAgentLogSocket()
const agentMap = ref({})

watch(lastEvent, (event) => {
  if (!event || !event.list || !event.list.agents) return
  const incoming = event.list.agents || []
  const newOnes = []
  incoming.forEach((agent) => {
    if (!agentMap.value[agent.id]) {
      newOnes.push(agent)
    }
    agentMap.value[agent.id] = agent
  })

  list.value = Object.values(agentMap.value)
  newOnes.forEach((agent) => {
    ElMessage.info(`您有新的NPC上线: ${agent.hostname}\\${agent.username}@${agent.intranet}`)
  })
})

function heartbeat(row) {
  return timeAgo(row.updateat, nowTick.value)
}

function rowStatus(row) {
  const hb = heartbeat(row)
  if (!hb.alive) return 'row-dead'
  if (row.npc2) return 'row-online'
  return 'row-npc1'
}

const stats = computed(() => {
  const total = list.value.length
  const online = list.value.filter((a) => a.npc2).length
  const offline = total - online

  const timeout = list.value.filter((a) => timeAgo(a.updateat, nowTick.value).seconds > 120).length
  const platforms = {}
  list.value.forEach((a) => {
    const p = a.platform || 'unknown'
    platforms[p] = (platforms[p] || 0) + 1
  })
  return { total, online, offline, timeout, platforms }
})

watch(stats, (s) => {
  appStore.setAgentStats({ total: s.total, online: s.online, offline: s.offline, timeout: s.timeout })
}, { immediate: true })

async function loadData() {
  loading.value = true
  try {
    const res = await agentList()
    const items = (res && res.result) || []
    list.value = items

    const m = {}
    items.forEach((a) => {
      m[a.id] = a
    })
    agentMap.value = m
  } catch {

  } finally {
    loading.value = false
  }
}

// 使用 computed 缓存过滤结果，避免每次渲染都重新过滤并分配新数组
const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (a) =>
      (a.id || '').toLowerCase().includes(kw) ||
      (a.intranet || '').toLowerCase().includes(kw) ||
      (a.internet || '').toLowerCase().includes(kw) ||
      (a.username || '').toLowerCase().includes(kw) ||
      (a.hostname || '').toLowerCase().includes(kw) ||
      (a.platform || '').toLowerCase().includes(kw) ||
      (a.process || '').toLowerCase().includes(kw),
  )
})

function openDetail(row) {
  router.push({ name: 'AgentDetail', params: { id: row.id } })
}

// 存活列排序: 按心跳时间戳(updateat 越新越靠前)
function sortByHeartbeat(a, b) {
  return (a.updateat || 0) - (b.updateat || 0)
}
// 系统类型排序: platform.arch 字符串比较
function sortByPlatform(a, b) {
  const pa = `${a.platform || ''}.${a.arch || ''}`
  const pb = `${b.platform || ''}.${b.arch || ''}`
  return pa.localeCompare(pb)
}
// 通用字符串字段排序(null 安全)
function makeSortBy(field) {
  return (a, b) => (a[field] || '').localeCompare(b[field] || '')
}

async function handleDelete(row) {
  try {
    await agentDelete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

async function handleNote(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入备注', '编辑备注', {
      inputValue: row.note || '',
      inputPlaceholder: '例如: 边界 Web 服务器',
    })
    await agentNote(row.id, value || '')
    row.note = value || ''
    ElMessage.success('备注已保存')
  } catch {

  }
}

function startAutoRefresh() {
  if (!autoRefresh.value) return
  stopAutoRefresh()
  timer = setInterval(loadData, 30000)
}
function stopAutoRefresh() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
    ElMessage.success('已开启自动刷新')
  } else {
    stopAutoRefresh()
  }
}

onMounted(() => {
  loadData()
  startAutoRefresh()
  startTick()
  connect()
})
onActivated(() => {
  loadData()
  startAutoRefresh()
  startTick()
})
onBeforeUnmount(() => {
  stopAutoRefresh()
  stopTick()
})
</script>

<template>
  <div class="page-container">
    <el-card shadow="never" class="page-card">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索 IP / 用户名 / 主机名 / 进程"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 300px"
        />
        <div class="flex-grow"></div>
        <el-button
          size="small"
          type="danger"
          :icon="Delete"
          :disabled="!selectedRows.length"
          :loading="batchDeleting"
          @click="handleBatchDelete"
        >
          删除选中{{ selectedRows.length ? ` (${selectedRows.length})` : '' }}
        </el-button>
        <el-button size="small" :class="{ 'auto-refresh-on': autoRefresh }" @click="toggleAutoRefresh">
          {{ autoRefresh ? '自动刷新: 开' : '自动刷新: 关' }}
        </el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredList"
        :row-class-name="rowStatus"
        :default-sort="{ prop: 'updateat', order: 'descending' }"
        border
        stripe
        size="small"
        empty-text="暂无在线主机"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="42" align="center" />
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="存活" width="110" align="center" prop="updateat" sortable :sort-method="sortByHeartbeat">
          <template #default="{ row }">
            <span
              class="alive-cell"
              :class="[rowStatus(row), { stale: heartbeat(row).seconds > 120 }]"
            >
              <span class="status-dot"></span>
              <span class="alive-text">{{ heartbeat(row).text }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="系统类型" min-width="140" align="center" prop="platform" sortable :sort-method="sortByPlatform">
          <template #default="{ row }">
            <el-tag size="small" :style="{ color: platformColor(row.platform) }" effect="plain">
              {{ row.platform ? `${row.platform}.${row.arch || ''}` : '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内网地址" prop="intranet" min-width="130" show-overflow-tooltip sortable :sort-method="makeSortBy('intranet')">
          <template #default="{ row }">
            <span class="link-text" @click="openDetail(row)">{{ row.intranet || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户名" prop="username" min-width="100" show-overflow-tooltip sortable :sort-method="makeSortBy('username')" />
        <el-table-column label="主机名" prop="hostname" min-width="120" show-overflow-tooltip sortable :sort-method="makeSortBy('hostname')" />
        <el-table-column label="进程名称" prop="process" min-width="140" show-overflow-tooltip sortable :sort-method="makeSortBy('process')" />
        <el-table-column label="备注" prop="note" min-width="120" show-overflow-tooltip sortable :sort-method="makeSortBy('note')" />
        <el-table-column label="操作" width="250" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Link" @click="openDetail(row)">
              连接
            </el-button>
            <el-button size="small" :icon="Edit" @click="handleNote(row)">备注</el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

  </div>
</template>

<style scoped>

.alive-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}
.alive-cell .status-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.alive-cell.row-online,
.alive-cell.row-online .alive-text {
  color: #4ade80;
}
.alive-cell.row-online .status-dot {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  animation: pulse-green 2s infinite;
}

.alive-cell.row-npc1 {
  color: #ffaa00;
}
.alive-cell.row-npc1 .status-dot {
  background: #ffaa00;
  box-shadow: 0 0 6px rgba(255, 170, 0, 0.6);
}

.alive-cell.row-dead,
.alive-cell.row-dead .status-dot {
  color: #6b7280;
}
.alive-cell.row-dead .status-dot {
  background: #6b7280;
}

.alive-cell.stale,
.alive-cell.stale .status-dot {
  color: #ff3b3b;
}
.alive-cell.stale .status-dot {
  background: #ff3b3b;
  box-shadow: 0 0 6px rgba(255, 59, 59, 0.7);
}
@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.page-card :deep(.el-table__row) {
  transition: background-color 0.3s;
}

.page-card :deep(.el-table__row.row-online) > td,
.page-card :deep(.el-table__row.row-npc1) > td {
  background-color: transparent !important;
  color: var(--tk-accent-soft) !important;
}
.page-card :deep(.el-table__row.row-online.el-table__row--striped) > td,
.page-card :deep(.el-table__row.row-npc1.el-table__row--striped) > td {
  background: rgba(255, 255, 255, 0.035) !important;
}

.page-card :deep(.el-table__row.row-dead) > td,
.page-card :deep(.el-table__row.row-dead.el-table__row--striped) > td {
  background-color: rgba(107, 114, 128, 0.12) !important;
  color: #6b7280 !important;
}
.page-card :deep(.el-table__row.row-dead):hover > td {
  background-color: rgba(107, 114, 128, 0.18) !important;
}

.page-card :deep(.el-table__row.row-dead) .el-tag,
.page-card :deep(.el-table__row.row-dead) .link-text {
  color: #6b7280 !important;
  border-color: rgba(107, 114, 128, 0.4) !important;
}

.auto-refresh-on {
  border-color: var(--tk-accent) !important;
  color: var(--tk-accent) !important;
  box-shadow: 0 0 8px var(--tk-accent-hover) !important;
}
.auto-refresh-on::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tk-accent);
  margin-right: 6px;
  box-shadow: 0 0 6px var(--tk-accent);
  animation: pulse-green 2s infinite;
  vertical-align: middle;
}
</style>
