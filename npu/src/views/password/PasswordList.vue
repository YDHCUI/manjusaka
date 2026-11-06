<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Delete, Edit, Plus, CopyDocument } from '@element-plus/icons-vue'
import { passList, passDelete, passUpdate } from '@/api/password'
import { formatTime } from '@/utils/format'
import { copyToClipboard } from '@/utils/clipboard'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 20, keyword: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await passList({ page: query.page, size: query.size, keyword: query.keyword || undefined, target: authStore.target })
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
const form = reactive({ id: null, username: '', password: '', passtype: '', passfrom: '' })

function openAdd() {
  Object.assign(form, { id: null, username: '', password: '', passtype: '', passfrom: '' })
  dialogVisible.value = true
}
function openEdit(row) {
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function submit() {
  submitting.value = true
  try {
    await passUpdate({ ...form, target: authStore.target })
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
    await ElMessageBox.confirm('确定删除该密码记录吗？该操作不可恢复。', '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await passDelete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

function copyText(text) {
  copyToClipboard(text)
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索用户名/密码/来源"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <div class="flex-grow"></div>
        <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新增</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe size="small" empty-text="暂无数据">
        <el-table-column label="NPC" prop="agent" min-width="150" show-overflow-tooltip />
        <el-table-column label="用户名" prop="username" min-width="140">
          <template #default="{ row }">
            {{ row.username }}
            <el-button text size="small" :icon="CopyDocument" @click="copyText(row.username)" />
          </template>
        </el-table-column>
        <el-table-column label="密码" prop="password" min-width="160">
          <template #default="{ row }">
            <span class="mono">{{ row.password }}</span>
            <el-button text size="small" :icon="CopyDocument" @click="copyText(row.password)" />
          </template>
        </el-table-column>
        <el-table-column label="来源" prop="passfrom" min-width="160" show-overflow-tooltip />
        <el-table-column label="类型" prop="passtype" width="120" align="center" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑密码' : '新增密码'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="form.passtype" placeholder="如: SSH/RDP/WEB" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="form.passfrom" /></el-form-item>
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
