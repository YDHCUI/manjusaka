<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Delete,
  Edit,
  CopyDocument,
  View,
  Hide,
  Search,
} from '@element-plus/icons-vue'
import { mcpKeyList, mcpKeyCreate, mcpKeyUpdate, mcpKeyDelete, mcpKeyTools } from '@/api/mcp'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const list = ref([])
const allTools = ref([]) // [{ name, description }]
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (k) =>
      String(k.keyname || '').toLowerCase().includes(kw) ||
      String(k.keyvalue || '').toLowerCase().includes(kw) ||
      (k.tools || []).some((t) => t.toLowerCase().includes(kw)),
  )
})

async function loadData() {
  loading.value = true
  try {
    const res = await mcpKeyList()
    const data = (res && res.result) || {}
    list.value = data.keys || []
  } catch {
  } finally {
    loading.value = false
  }
}

async function loadTools() {
  try {
    const res = await mcpKeyTools()
    const data = (res && res.result) || {}
    allTools.value = data.tools || []
  } catch {
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制')
  }
}

const revealed = ref({})
function toggleReveal(row) {
  revealed.value[row.id] = !revealed.value[row.id]
}
function maskKey(v) {
  if (!v) return ''
  return v.length > 14 ? v.slice(0, 10) + '****' + v.slice(-4) : '****'
}

// ===== 新建/编辑 =====
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: '',
  keyname: '',
  tools: [],
  enabled: true,
})

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: '', keyname: '', tools: [], enabled: true })
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    keyname: row.keyname,
    tools: [...(row.tools || [])],
    enabled: row.enabled,
  })
  dialogVisible.value = true
}

function selectAllTools() {
  form.tools = allTools.value.map((t) => t.name)
}

function clearTools() {
  form.tools = []
}

async function submit() {
  if (!form.keyname.trim()) {
    ElMessage.warning('请填写密钥名称')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await mcpKeyUpdate({
        id: form.id,
        keyname: form.keyname.trim(),
        tools: form.tools,
        enabled: form.enabled,
      })
      ElMessage.success('已保存')
    } else {
      await mcpKeyCreate({ keyname: form.keyname.trim(), tools: form.tools })
      ElMessage.success('密钥已创建, 在列表中复制令牌')
    }
    dialogVisible.value = false
    loadData()
  } catch {
  } finally {
    submitting.value = false
  }
}

async function toggleEnabled(row) {
  try {
    await mcpKeyUpdate({ id: row.id, enabled: !row.enabled })
    ElMessage.success(row.enabled ? '已禁用' : '已启用')
    loadData()
  } catch {
  }
}

async function regenerate(row) {
  try {
    await ElMessageBox.confirm(
      `重新生成 "${row.keyname}" 的令牌? 旧令牌将立即失效, 使用该令牌的客户端需更新配置。`,
      '重置令牌',
      { type: 'warning' },
    )
    const res = await mcpKeyUpdate({ id: row.id, regenerate: true })
    const item = (res && res.result) || {}
    ElMessage.success('令牌已重新生成')
    if (item.keyvalue) copyText(item.keyvalue)
    loadData()
  } catch {
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除密钥 ${row.keyname} 吗? 使用该令牌的客户端将立即失联。`, '提示', {
      type: 'warning',
    })
    await mcpKeyDelete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {
  }
}

onMounted(() => {
  loadData()
  loadTools()
})
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索 名称 / 令牌 / 工具"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
        />
        <div class="flex-grow"></div>
        <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新建密钥</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" border stripe size="small" empty-text="暂无 MCP 密钥">
        <el-table-column label="名称" prop="keyname" min-width="120" />
        <el-table-column label="令牌" min-width="240">
          <template #default="{ row }">
            <span class="key-text">{{ revealed[row.id] ? row.keyvalue : maskKey(row.keyvalue) }}</span>
            <el-button size="small" text :icon="revealed[row.id] ? Hide : View" @click="toggleReveal(row)" />
            <el-button size="small" text :icon="CopyDocument" @click="copyText(row.keyvalue)" />
          </template>
        </el-table-column>
        <el-table-column label="允许工具" min-width="220">
          <template #default="{ row }">
            <template v-if="!(row.tools || []).length">
              <el-tag size="small" type="success" effect="plain">全部工具</el-tag>
            </template>
            <template v-else>
              <el-tag v-for="t in row.tools" :key="t" size="small" effect="plain" class="tool-tag">{{ t }}</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="regenerate(row)">重置令牌</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="usage-tip">
        MCP 客户端接入: 地址填 <code>https://&lt;nps主机&gt;/&lt;管理路由&gt;/mcp</code>, 令牌作为 Authorization Bearer
        Token (或 X-Api-Key / ?auth=) 携带; 仅勾选部分工具的密钥, 客户端 tools/list 只会看到被允许的工具。
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 MCP 密钥' : '新建 MCP 密钥'" width="620px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.keyname" placeholder="如 claude-desktop / 渗透助手" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="允许工具">
          <div class="tools-box">
            <div class="tools-ops">
              <el-button size="small" @click="selectAllTools">全选</el-button>
              <el-button size="small" @click="clearTools">清空</el-button>
              <span class="tools-hint">不勾选任何工具 = 允许全部工具</span>
            </div>
            <el-checkbox-group v-model="form.tools" class="tools-group">
              <el-checkbox v-for="t in allTools" :key="t.name" :value="t.name">
                <el-tooltip popper-class="mcp-tool-tip" :content="t.description" placement="top" :show-after="300">
                  <span>{{ t.name }}</span>
                </el-tooltip>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.key-text {
  font-family: 'Consolas', monospace;
  font-size: 12px;
}
.tool-tag {
  margin: 2px 4px 2px 0;
}
.tools-box {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 12px;
}
.tools-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}
.tools-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.tools-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px 12px;
  align-items: center;
}
.tools-group :deep(.el-checkbox) {
  margin-right: 0;
  min-width: 0;
  overflow: hidden;
}
.tools-group :deep(.el-checkbox__label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  min-width: 0;
}
.usage-tip {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 8px 10px;
  word-break: break-all;
}
.usage-tip code {
  font-family: 'Consolas', monospace;
  color: var(--el-color-primary);
}
</style>

<!-- tooltip 挂载在 body 下, scoped 样式不生效, 需全局样式 -->
<style>
.mcp-tool-tip {
  max-width: min(480px, 80vw);
  max-height: 50vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 12px;
}
</style>
