<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, Search, Top, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { taskAll, taskDeleteGlobal, taskReorder, taskDispatch, taskDeleteAgent } from '@/api/agent'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const list = ref([])
const keyword = ref('')
let timer = null

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (t) =>
      String(t.agent_id || '').toLowerCase().includes(kw) ||
      String(t.kind || '').toLowerCase().includes(kw) ||
      String(t.act || '').toLowerCase().includes(kw) ||
      String(t.detail || '').toLowerCase().includes(kw),
  )
})

const groupedByAgent = computed(() => {
  const map = new Map()
  for (const t of filteredList.value) {
    if (!map.has(t.agent_id)) map.set(t.agent_id, { pending: [], running: [] })
    const g = map.get(t.agent_id)
    if (t.phase === 'pending') g.pending.push(t)
    else g.running.push(t)
  }
  return Array.from(map.entries()).map(([agent_id, g]) => ({ agent_id, ...g }))
})

const totalCount = computed(() => list.value.length)

async function loadData() {
  loading.value = true
  try {
    const res = await taskAll()
    list.value = (res && res.result) || []
  } catch {
  } finally {
    loading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确认删除该任务？', '删除任务', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
    if (row.phase === 'pending') {
      await taskDeleteGlobal(row.agent_id, row.index)
    } else {
      await taskDeleteAgent(row.agent_id, row.id)
    }
    ElMessage.success('已删除')
    loadData()
  } catch {
  }
}

async function handleClearAgent(agentId) {
  try {
    await ElMessageBox.confirm(`确认清空 ${agentId} 的所有待发送任务？`, '清空任务', {
      type: 'warning', confirmButtonText: '清空', cancelButtonText: '取消',
    })
    await taskDeleteGlobal(agentId, null)
    ElMessage.success('已清空')
    loadData()
  } catch {
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确认清空所有待发送任务？该操作不可恢复。', '清空全部', {
      type: 'warning', confirmButtonText: '清空全部', cancelButtonText: '取消',
    })
    await taskDeleteGlobal('*', null)
    ElMessage.success('已清空')
    loadData()
  } catch {
  }
}

async function handleDispatch(row) {
  try {
    await taskDispatch(row.agent_id, row.index)
    ElMessage.success('已置顶，将在下次心跳下发')
    loadData()
  } catch {
  }
}

async function handleMove(row, dir) {
  const agentId = row.agent_id
  const grp = groupedByAgent.value.find((g) => g.agent_id === agentId)
  if (!grp) return
  const pending = grp.pending
  const from = pending.findIndex((t) => t.index === row.index)
  if (from < 0) return
  const to = dir === 'up' ? from - 1 : from + 1
  if (to < 0 || to >= pending.length) return
  await taskReorder(agentId, row.index, pending[to].index)
  loadData()
}

function kindTag(k) {
  if (k === 'Action') return ''
  if (k === 'Plugin') return 'success'
  if (k === 'Config') return 'warning'
  return 'info'
}

onMounted(() => {
  loadData()
  timer = setInterval(loadData, 15000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索 Agent / 类型 / 详情"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
        />
        <span class="task-count">共 {{ totalCount }} 个任务</span>
        <div class="flex-grow"></div>
        <el-button type="danger" size="small" plain :icon="Delete" @click="handleClearAll">清空全部</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <div v-loading="loading" class="task-groups">
        <template v-if="groupedByAgent.length">
          <div v-for="grp in groupedByAgent" :key="grp.agent_id" class="task-group">
            <div class="task-group-header">
              <span class="agent-id">{{ grp.agent_id }}</span>
              <el-tag v-if="grp.pending.length" size="small" type="warning">待发 {{ grp.pending.length }}</el-tag>
              <el-tag v-if="grp.running.length" size="small" type="success">执行中 {{ grp.running.length }}</el-tag>
              <div class="flex-grow"></div>
              <el-button type="danger" size="small" plain :icon="Delete" @click="handleClearAgent(grp.agent_id)">清空待发</el-button>
            </div>

            <el-table v-if="grp.pending.length" :data="grp.pending" size="small" border stripe class="group-table">
              <el-table-column label="序号" width="60" align="center">
                <template #default="{ row }">{{ row.index }}</template>
              </el-table-column>
              <el-table-column label="阶段" width="80" align="center">
                <template #default><el-tag size="small" type="warning">待发送</el-tag></template>
              </el-table-column>
              <el-table-column label="类型" width="90" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="kindTag(row.kind)">{{ row.kind }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" prop="act" width="100" show-overflow-tooltip />
              <el-table-column label="详情" prop="detail" min-width="200" show-overflow-tooltip />
              <el-table-column label="入队时间" width="160">
                <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="优先级" width="120" align="center">
                <template #default="{ row }">
                  <el-button text size="small" :icon="ArrowUp" @click="handleMove(row, 'up')">上</el-button>
                  <el-button text size="small" :icon="ArrowDown" @click="handleMove(row, 'down')">下</el-button>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right" align="right" class-name="op-col">
                <template #default="{ row }">
                  <el-button text type="primary" size="small" :icon="Top" @click="handleDispatch(row)">立即下发</el-button>
                  <el-button text type="danger" size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-table v-if="grp.running.length" :data="grp.running" size="small" border stripe class="group-table">
              <el-table-column label="序号" width="60" align="center">
                <template #default="{ $index }">{{ $index }}</template>
              </el-table-column>
              <el-table-column label="阶段" width="80" align="center">
                <template #default><el-tag size="small" type="success">执行中</el-tag></template>
              </el-table-column>
              <el-table-column label="类型" width="90" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="kindTag(row.kind)">{{ row.kind }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" prop="act" width="100" show-overflow-tooltip />
              <el-table-column label="详情" prop="detail" min-width="200" show-overflow-tooltip />
              <el-table-column label="开始时间" width="160">
                <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default><el-tag size="small" type="success">运行中</el-tag></template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right" align="right" class-name="op-col">
                <template #default="{ row }">
                  <el-button text type="danger" size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
        <el-empty v-else description="暂无任务" />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  .flex-grow { flex: 1; }
}

.task-count {
  font-size: 12px;
  color: var(--tk-accent-dim);
  font-family: 'Consolas', monospace;
}

.task-groups {
  min-height: 100px;
}

.task-group {
  margin-bottom: 16px;
}

.group-table {
  margin-bottom: 8px;
}

.task-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: var(--tk-bg-input);
  border-left: 2px solid var(--tk-accent);
  border-radius: 0 3px 3px 0;
  .flex-grow { flex: 1; }
  .agent-id {
    font-family: 'Consolas', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--tk-accent);
    text-shadow: 0 0 6px var(--tk-accent-glow);
  }
}
</style>
