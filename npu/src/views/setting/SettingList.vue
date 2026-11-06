<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Delete, Edit, RefreshRight, Plus } from '@element-plus/icons-vue'
import { settingList, settingDelete, settingUpdate, restartNps } from '@/api/setting'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 20, keyword: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await settingList({ page: query.page, size: query.size, keyword: query.keyword || undefined })
    const data = (res && res.result) || {}
    list.value = data.items || []
    total.value = data.total || 0
  } catch {

  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const form = reactive({ key: '', value: '', keynote: '', valuenote: '' })

function openAdd() {
  isEdit.value = false
  Object.assign(form, { key: '', value: '', keynote: '', valuenote: '' })
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    key: row.key,
    value: row.value,
    keynote: row.keynote || '',
    valuenote: row.valuenote || '',
  })
  dialogVisible.value = true
}

async function submit() {
  if (!form.key || !form.value) {
    ElMessage.warning('键和值不能为空')
    return
  }
  submitting.value = true
  try {
    await settingUpdate([{ key: form.key, value: form.value, keynote: form.keynote }])
    ElMessage.success('已保存')
    dialogVisible.value = false
    loadData()
  } catch {

  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除配置 ${row.key} 吗?`, '提示', { type: 'warning' })
    await settingDelete(row.key)
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

const restarting = ref(false)
async function handleRestart() {
  try {
    await ElMessageBox.confirm(
      '重启将中断当前会话与所有连接，确定重启后台 nps 程序吗?',
      '重启 nps',
      { type: 'warning', confirmButtonText: '重启', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  restarting.value = true
  try {
    await restartNps()
    ElMessage.success('重启指令已发送，后台将在数秒内重启')

    setTimeout(() => {
      restarting.value = false
      loadData()
    }, 4000)
  } catch {
    restarting.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索配置项"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <div class="flex-grow"></div>
        <el-button size="small" type="primary" :icon="Plus" @click="openAdd">新增配置</el-button>
        <el-button size="small" type="warning" :icon="RefreshRight" :loading="restarting" @click="handleRestart">重启</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe size="small" empty-text="暂无配置">
        <el-table-column label="键" prop="key" min-width="180" show-overflow-tooltip />
        <el-table-column label="值" prop="value" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono">{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="keynote" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" prop="stype" width="100" />
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置' : '新增配置'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="键"><el-input v-model="form.key" :disabled="isEdit" /></el-form-item>
        <el-form-item label="值"><el-input v-model="form.value" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.keynote" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mono {
  font-family: 'Consolas', monospace;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
