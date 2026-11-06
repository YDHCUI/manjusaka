<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  Document,
  Refresh,
  ArrowUp,
  Upload,
  Download,
  Delete,
  EditPen,
  HomeFilled,
  CopyDocument,
  Files,
} from '@element-plus/icons-vue'
import { sftpReadDir, sftpRemove, sftpRename, sftpUploadUrl, sftpDownloadPath } from '@/api/agent'
import { sendAgentEvent } from '@/api/event'
import { nps } from '@/utils/nps.js'
import { useAgentLogSocket } from '@/composables/useAgentLogSocket'
import { copyToClipboard } from '@/utils/clipboard'
import http from '@/api/index.js'
import { formatSize } from '@/utils/format'

const props = defineProps({
  agentId: { type: String, required: true },
  hasNpc1: { type: Boolean, default: false },
})

const { uid } = useAgentLogSocket()

const loading = ref(false)
const currentDir = ref('/')
const tableData = ref([])

function normalizeSftpPath(p) {
  let s = String(p || '').replace(/\\/g, '/')
  s = s.replace(/^\/+([A-Za-z]:)/, '$1')
  return s
}

function joinPath(dir, name) {

  if (/^[A-Za-z]:/.test(name)) {
    return name.replace(/\/+$/, '') + '/'
  }

  if (dir === '/' || dir === '') {
    return '/' + name.replace(/^\/+/, '')
  }
  return dir.replace(/\/+$/, '') + '/' + name
}

function parentPath(dir) {
  const d = normalizeSftpPath(dir).replace(/\/+$/, '')
  if (d === '' || d === '/') return '/'
  if (/^[A-Za-z]:$/.test(d)) return '/'
  const parts = d.split('/')
  parts.pop()
  let p = parts.join('/')
  if (/^[A-Za-z]:$/.test(p)) p += '/'
  return p || '/'
}

function fileType(row) {
  const t = String(row.file_type || '').toLowerCase()
  return t.includes('dir')
}

async function loadDir(path) {
  if (!path) path = currentDir.value || '/'
  loading.value = true
  try {
    const res = await sftpReadDir(props.agentId, path)
    const data = (res && res.result) || {}
    currentDir.value = normalizeSftpPath(data.current_dir || path)
    tableData.value = data.entrys || []
    syncTreeCurrent(currentDir.value)
  } catch (e) {

  } finally {
    loading.value = false
  }
}

function refresh() {
  loadDir()
}

function goUp() {
  loadDir(parentPath(currentDir.value))
}
function goHome() {
  loadDir('/')
}

const fullPathStr = computed(() => {
  const d = currentDir.value || '/'
  if (d === '/') return '/'
  if (/^[A-Za-z]:/.test(d)) return '/' + d.replace(/\/+$/, '') + '/'
  return d.replace(/\/+$/, '') + '/'
})

const pathInput = ref(fullPathStr.value)

watch(fullPathStr, (v) => {
  pathInput.value = v
})

function onPathEnter() {
  let p = normalizeSftpPath(pathInput.value.trim())
  if (!p) p = '/'
  loadDir(p)
}

async function copyPath() {
  await copyToClipboard(pathInput.value)
}

const treeRef = ref(null)
const defaultProps = {
  label: 'label',
  isLeaf: 'leaf',
}

const currentTreePath = ref('/')

async function loadTreeNode(node, resolve) {
  const parentPath = node.level === 0 ? '/' : node.data.path
  try {
    const res = await sftpReadDir(props.agentId, parentPath)
    const data = (res && res.result) || {}
    const dirs = (data.entrys || []).filter((e) => {
      const t = String(e.file_type || '').toLowerCase()
      return t.includes('dir')
    })
    const nodes = dirs.map((e) => ({
      label: e.file_name,
      path: joinPath(parentPath, e.file_name),
      leaf: false,
    }))
    resolve(nodes)
  } catch {
    resolve([])
  }
}

function handleNodeClick(data) {
  const p = data.path || '/'
  loadDir(p)
}

function syncTreeCurrent(path) {
  currentTreePath.value = path
  if (treeRef.value) {

    try {
      treeRef.value.setCurrentKey(path)
    } catch {

    }
  }
}

function handleRowDblClick(row) {
  if (fileType(row)) enterDir(row)
}

function enterDir(row) {
  currentDir.value = joinPath(currentDir.value, row.file_name)
  loadDir(currentDir.value)
}

function handleDownload(row) {
  const path = normalizeSftpPath(joinPath(currentDir.value, row.file_name))
  const url = `${http.defaults.baseURL}${sftpDownloadPath(props.agentId, path)}`
  window.open(url, '_blank')
  ElMessage.success('已开始下载并保存到敏感文件')
}

async function handleNpc1Download(row) {
  try {
    const path = normalizeSftpPath(joinPath(currentDir.value, row.file_name))
    const action = nps.Action.create()
    action.act = 'fr'
    action.path = path
    const event = nps.AgentEvent.create()
    event.action = action
    await sendAgentEvent(event, uid, props.agentId)
    ElMessage.success('FR下载命令已发送，请到敏感文件查看')
  } catch {
    ElMessage.error('FR下载命令发送失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.file_name} 吗?`, '提示', { type: 'warning' })
    const path = joinPath(currentDir.value, row.file_name)
    const type = fileType(row) ? 'Dir' : 'File'
    await sftpRemove(props.agentId, type, path)
    ElMessage.success('已删除')
    loadDir()
  } catch {

  }
}

async function handleRename(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新名称', '重命名', {
      inputValue: row.file_name,
    })
    if (!value || value === row.file_name) return
    const oldPath = joinPath(currentDir.value, row.file_name)
    await sftpRename(props.agentId, oldPath, value)
    ElMessage.success('已重命名')
    loadDir()
  } catch {

  }
}

const uploadRef = ref(null)
function openUpload() {
  uploadRef.value && uploadRef.value.$el && uploadRef.value.$el.querySelector('input').click()
}
async function handleUpload(opts) {
  const file = opts.file

  const fullPath = joinPath(currentDir.value, file.name)
  const formData = new FormData()
  formData.append('file', file, fullPath)
  try {
    await http.post(sftpUploadUrl(props.agentId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    ElMessage.success('上传成功')
    loadDir()
  } catch {
    ElMessage.error('上传失败')
  }
}

// fw 单次事件上传的上限
// 注意：fw 走的是"事件队列 → agent 拉取"通道，整份数据会在服务端队列里
// 完整驻留一次，超过这个体量请改用 SFTP 上传（流式分块，不经过事件队列）
const FW_MAX_SIZE = 256 * 1024 * 1024

async function handleFwUpload(file) {
  if (file.size > FW_MAX_SIZE) {
    ElMessage.warning(`fw 上传单次上限 ${formatSize(FW_MAX_SIZE)}，大文件请用「上传」(SFTP)`)
    return false
  }
  const fullPath = normalizeSftpPath(joinPath(currentDir.value, file.name))
  try {
    // 用异步 arrayBuffer 读取（不阻塞主线程），再交给 O(n) 的 base64 编码
    const buf = await file.arrayBuffer()
    const action = nps.Action.create()
    action.act = 'fw'
    action.path = fullPath
    action.data = new Uint8Array(buf)
    const event = nps.AgentEvent.create()
    event.action = action
    await sendAgentEvent(event, uid, props.agentId)
    ElMessage.success(`fw 上传完成 文件:${file.name} 大小:${formatSize(file.size)}`)
    loadDir()
  } catch {
    ElMessage.error('fw 上传失败')
  }
  return false
}

onMounted(() => {
  loadDir('/')
})
</script>

<template>
  <div class="file-manager">

    <div class="fm-toolbar">
      <el-button-group>
        <el-button size="small" :icon="HomeFilled" @click="goHome">根目录</el-button>
        <el-button size="small" :icon="ArrowUp" @click="goUp">上级</el-button>
        <el-button size="small" :icon="Refresh" @click="refresh">刷新</el-button>
      </el-button-group>
      <el-upload
        ref="uploadRef"
        :show-file-list="false"
        :http-request="handleUpload"
        style="display: inline-block"
      >
        <el-button size="small" :icon="Upload" type="primary">上传</el-button>
      </el-upload>
      <el-upload
        v-if="hasNpc1"
        :show-file-list="false"
        :before-upload="handleFwUpload"
        style="display: inline-block"
      >
        <el-button size="small" :icon="Upload" type="warning">fw上传</el-button>
      </el-upload>
    </div>

    <div class="path-bar">
      <el-icon class="path-bar-icon"><Files /></el-icon>
      <input
        v-model="pathInput"
        class="path-input"
        spellcheck="false"
        placeholder="输入目录路径后回车进入，如 /D:/ 或 /home/user"
        @keyup.enter="onPathEnter"
      />
      <el-icon class="path-copy" @click="copyPath" title="点击复制路径"><CopyDocument /></el-icon>
      <el-icon class="path-refresh" @click="refresh" title="刷新当前目录"><Refresh /></el-icon>
    </div>

    <div class="fm-body">

      <div class="fm-tree">
        <div class="fm-tree-head">目录树</div>
        <el-tree
          ref="treeRef"
          :props="defaultProps"
          :load="loadTreeNode"
          lazy
          node-key="path"
          highlight-current
          :expand-on-click-node="false"
          :current-node-key="currentTreePath"
          @node-click="handleNodeClick"
          empty-text="空"
        />
      </div>

      <div class="fm-list">
        <el-table
          v-loading="loading"
          :data="tableData"
          size="small"
          border
          stripe
          height="100%"
          @row-dblclick="handleRowDblClick"
          empty-text="空目录"
        >
          <el-table-column label="名称" min-width="240">
            <template #default="{ row }">
              <el-icon class="fm-icon" :color="fileType(row) ? '#ffb74d' : 'var(--tk-accent-dim)'">
                <Folder v-if="fileType(row)" />
                <Document v-else />
              </el-icon>
              <span class="fm-name" :class="{ dir: fileType(row) }" @click="fileType(row) && enterDir(row)">
                {{ row.file_name }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="110">
            <template #default="{ row }">
              {{ fileType(row) ? '-' : formatSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="权限" prop="permissions" width="120" show-overflow-tooltip />
          <el-table-column label="属主/组" width="140">
            <template #default="{ row }">
              {{ row.user }}:{{ row.group }}
            </template>
          </el-table-column>
          <el-table-column label="修改时间" width="170">
            <template #default="{ row }">
              {{ row.modified }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" class-name="op-col">
            <template #default="{ row }">
              <template v-if="!fileType(row)">
                <el-button size="small" :icon="Download" @click="handleDownload(row)">下载</el-button>
                <el-button v-if="hasNpc1" size="small" :icon="Download" @click="handleNpc1Download(row)">FR</el-button>
              </template>
              <el-button size="small" :icon="EditPen" @click="handleRename(row)">重命名</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)"></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}

.fm-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.path-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  background: var(--tk-bg-input);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  &:focus-within {
    border-color: var(--el-color-primary);
  }
}
.path-bar-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.path-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--el-color-primary);
  font-family: inherit;
  font-size: inherit;
  padding: 6px 0;
  letter-spacing: 0.5px;
}
.path-input::placeholder {
  color: var(--el-text-color-secondary);
  opacity: 0.6;
}
.path-copy {
  color: var(--el-text-color-secondary);
  cursor: pointer;
  flex-shrink: 0;
}
.path-refresh {
  color: var(--el-color-primary);
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.3s;
}
.path-refresh:hover {
  transform: rotate(180deg);
}

.fm-body {
  flex: 1;
  display: flex;
  gap: 8px;
  min-height: 0;
}
.fm-tree {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--tk-bg-input);
  overflow: hidden;
}
.fm-tree-head {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color);
  background: var(--tk-bg-panel);
}
.fm-tree :deep(.el-tree) {
  flex: 1;
  overflow: auto;
  background: transparent;
  --el-tree-node-hover-bg-color: var(--tk-accent-hover);
}
.fm-tree :deep(.el-tree-node__content) {
  height: 28px;
}
.fm-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.fm-icon {
  vertical-align: middle;
  margin-right: 6px;
}
.fm-name {
  cursor: default;
  vertical-align: middle;
}
.fm-name.dir {
  color: var(--el-color-primary);
  cursor: pointer;
}
.fm-name.dir:hover {
  text-decoration: underline;
}
</style>
