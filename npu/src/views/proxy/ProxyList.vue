<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, VideoPause, Search } from '@element-plus/icons-vue'
import { proxyList, proxyStop } from '@/api/proxy'
import ProxyDialog from '@/components/proxy/ProxyDialog.vue'

const loading = ref(false)
const list = ref([])
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (p) =>
      String(p.id || '').toLowerCase().includes(kw) ||
      String(p.agent || '').toLowerCase().includes(kw) ||
      String(p.name || '').toLowerCase().includes(kw) ||
      String(p.local_port || '').includes(kw) ||
      String(p.remote_addr || '').toLowerCase().includes(kw),
  )
})

async function loadData() {
  loading.value = true
  try {
    const res = await proxyList()
    list.value = (res && res.result) || []
  } catch {

  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)

function openAdd() {
  dialogVisible.value = true
}

async function handleStop(row) {
  try {
    await ElMessageBox.confirm(
      `确定关停隧道代理 ${row.name || row.id} 吗？该操作不可恢复。`,
      '关停确认',
      { type: 'warning', confirmButtonText: '关停', cancelButtonText: '取消' },
    )
    await proxyStop(row.id)
    ElMessage.success('已关停')
    loadData()
  } catch {

  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索 ID / NPC / 类型 / 端口"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
        />
        <div class="flex-grow"></div>
        <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新建代理</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" border stripe size="small" empty-text="暂无代理">
        <el-table-column label="ID" prop="id" min-width="160" show-overflow-tooltip />
        <el-table-column label="NPC" prop="agent" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.agent || '-' }}</template>
        </el-table-column>
        <el-table-column label="隧道类型" prop="name" min-width="120" show-overflow-tooltip />
        <el-table-column label="本地端口" prop="local_port" width="100" align="center" />
        <el-table-column label="远程地址" prop="remote_addr" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remote_addr || '-' }}</template>
        </el-table-column>
        <el-table-column label="代理验证" min-width="140">
          <template #default="{ row }">
            {{ row.username || '-' }} / {{ row.password || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center" class-name="op-col">
          <template #default="{ row }">
            <el-button type="danger" size="small" :icon="VideoPause" @click="handleStop(row)">
              关停
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <ProxyDialog v-model="dialogVisible" @success="loadData" />
  </div>
</template>
