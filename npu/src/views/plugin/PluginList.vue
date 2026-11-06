<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Edit, Delete, Check, Close, Upload, Search } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { pluginList, pluginInfo, pluginUpload, pluginUpdate, pluginDelete } from '@/api/plugin'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text) {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch {
    return `<pre>${text}</pre>`
  }
}

const loading = ref(false)
const keyword = ref('')
const list = ref([])

// 同基础名多平台版本计数: 出现多个版本时在列表项上展示 platform/arch 以区分
const variantCounts = computed(() => {
  const counts = {}
  for (const p of list.value) {
    const key = p.name || p.filename
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
})

// 当前选中插件 (filename 为唯一标识)
const activeName = ref('')
const activeInfo = ref(null)

// 编辑态
const isEditing = ref(false)
const editForm = reactive({ description: '', plugargs: '', plugentry: '' })
const saving = ref(false)

const pathLabel = computed(() => {
  if (!activeName.value) return '目录: plugins/'
  return `文件: plugins/${activeName.value}`
})

function bytesToSize(bytes) {
  if (!bytes && bytes !== 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes || 1) / Math.log(1024))
  if (i === 0) return `${bytes} B`
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

async function loadData() {
  loading.value = true
  try {
    const res = await pluginList(keyword.value)
    const data = (res && res.result) || {}
    list.value = data.plugins || []
  } catch {

  } finally {
    loading.value = false
  }
}

async function selectPlugin(row) {
  activeName.value = row.filename
  isEditing.value = false
  activeInfo.value = null
  try {
    const res = await pluginInfo(row.filename)
    activeInfo.value = (res && res.result) || null
  } catch {
    activeInfo.value = null
  }
}

function startEdit() {
  if (!activeInfo.value) return
  isEditing.value = true
  editForm.description = activeInfo.value.description || ''
  editForm.plugargs = activeInfo.value.plugargs || ''
  editForm.plugentry = activeInfo.value.plugentry || ''
}

function cancelEdit() {
  isEditing.value = false
}

async function saveMeta() {
  if (!activeName.value) return
  saving.value = true
  try {
    const res = await pluginUpdate({
      filename: activeName.value,
      description: editForm.description,
      plugargs: editForm.plugargs,
      plugentry: editForm.plugentry,
    })
    ElMessage.success('保存成功')
    isEditing.value = false
    const data = (res && res.result) || null
    if (data) activeInfo.value = data
    loadData()
  } catch {

  } finally {
    saving.value = false
  }
}

async function toggleEnabled(row) {
  try {
    await pluginUpdate({ filename: row.filename, enabled: !row.enabled })
    ElMessage.success(row.enabled ? '已下架 (AI 不再匹配执行)' : '已启用')
    row.enabled = !row.enabled
    if (activeInfo.value && activeInfo.value.filename === row.filename) {
      activeInfo.value.enabled = row.enabled
    }
  } catch {

  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除插件 ${row.filename} 吗? (将同时删除磁盘文件与库中记录)`,
      '提示',
      { type: 'warning' }
    )
    await pluginDelete(row.filename)
    ElMessage.success('已删除')
    if (activeName.value === row.filename) {
      activeName.value = ''
      activeInfo.value = null
    }
    loadData()
  } catch {

  }
}

// ===== 上传注册 =====
const PLATFORM_OPTIONS = ['windows', 'linux', 'unix', 'darwin', 'macos']
const ARCH_OPTIONS = ['x86_64', 'x86', 'aarch64', 'arm64', 'x64', 'x32', 'mips64', 'loongarch64']
const TYPE_OPTIONS = ['exe', 'dll', 'elf', 'so', 'bof', 'net', 'bin']

const uploadVisible = ref(false)
const uploading = ref(false)
const uploadForm = ref({
  name: '',
  platform: 'windows',
  arch: 'x86_64',
  filetype: 'dll',
  description: '',
  plugargs: '',
  plugentry: '',
})
const uploadFile = ref(null)

const builtFilename = computed(() => {
  const f = uploadForm.value
  const name = (f.name || '').trim()
  if (!name) return ''
  return `${name}.${f.platform}.${f.arch}.${f.filetype}`
})

function openUpload() {
  uploadForm.value = {
    name: '',
    platform: 'windows',
    arch: 'x86_64',
    filetype: 'dll',
    description: '',
    plugargs: '',
    plugentry: '',
  }
  uploadFile.value = null
  uploadVisible.value = true
}

// 与后端 MAX_PLUGIN_FILE_BYTES 保持一致
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

function handleFileChange(file) {
  const raw = file.raw || file
  if (raw && raw.size > MAX_UPLOAD_BYTES) {
    ElMessage.warning(`文件超过 100MB 上限 (当前 ${bytesToSize(raw.size)})`)
    uploadFile.value = null
    return false
  }
  uploadFile.value = raw
  // 文件名符合 name.os.arch.type 约定时自动填充表单
  const fname = (file.name || '').split('/').pop()
  const parts = fname.split('.')
  if (parts.length >= 4 && !uploadForm.value.name) {
    uploadForm.value.filetype = parts[parts.length - 1].toLowerCase()
    uploadForm.value.arch = parts[parts.length - 2].toLowerCase()
    uploadForm.value.platform = parts[parts.length - 3].toLowerCase()
    uploadForm.value.name = parts.slice(0, parts.length - 3).join('.')
  }
  return false
}

function handleFileRemove() {
  uploadFile.value = null
}

async function submitUpload() {
  const name = (uploadForm.value.name || '').trim()
  if (!name) {
    ElMessage.warning('请填写插件名称')
    return
  }
  if (!/^[A-Za-z0-9]+$/.test(name)) {
    ElMessage.warning('插件名称只能包含英文字母和数字')
    return
  }
  const filename = builtFilename.value
  if (!filename) {
    ElMessage.warning('请填写插件名称')
    return
  }
  if (!uploadFile.value) {
    ElMessage.warning('请先选择插件文件')
    return
  }
  if (uploadFile.value.size > MAX_UPLOAD_BYTES) {
    ElMessage.warning(`文件超过 100MB 上限 (当前 ${bytesToSize(uploadFile.value.size)})`)
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value, filename)
    formData.append('description', uploadForm.value.description || '')
    formData.append('args', uploadForm.value.plugargs || '')
    formData.append('entry', uploadForm.value.plugentry || '')
    await pluginUpload(formData)
    ElMessage.success(`插件 ${filename} 上传注册成功`)
    uploadVisible.value = false
    await loadData()
    const created = list.value.find((p) => p.filename === filename)
    if (created) {
      await selectPlugin(created)
    }
  } catch {

  } finally {
    uploading.value = false
  }
}

function handleSearch() {
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container plugin-manager">
    <el-card shadow="never" class="plugin-card">
      <div class="plugin-layout">

        <div class="plugin-left">
          <div class="left-header">
            <span class="left-title">插件库</span>
            <div class="left-actions">
              <el-button size="small" :icon="Refresh" @click="loadData">刷新</el-button>
              <el-button type="primary" size="small" :icon="Upload" @click="openUpload">上传</el-button>
            </div>
          </div>
          <el-input
            v-model="keyword"
            placeholder="按名称/文件名/描述筛选"
            :prefix-icon="Search"
            clearable
            size="small"
            style="margin-bottom: 10px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <div class="left-tree" v-loading="loading">
            <div
              v-for="row in list"
              :key="row.filename"
              class="tree-item"
              :class="{ active: activeName === row.filename, disabled: !row.enabled }"
              :title="row.filename"
              @click="selectPlugin(row)"
            >
              <span class="tree-icon">🧩</span>
              <span class="tree-name">{{ row.name || row.filename }}</span>
              <span
                v-if="(variantCounts[row.name || row.filename] || 0) > 1 && (row.platform || row.arch)"
                class="tree-arch"
              >{{ [row.platform, row.arch].filter(Boolean).join('/') }}</span>
              <span v-if="!row.enabled" class="tree-off">停</span>
            </div>
            <el-empty v-if="!loading && !list.length" description="暂无插件" :image-size="60" />
          </div>
        </div>

        <div class="plugin-right">
          <div class="right-header">
            <span class="file-path mono">{{ pathLabel }}</span>
            <div class="right-actions">
              <template v-if="activeName && !isEditing">
                <el-button
                  size="small"
                  :type="activeInfo && activeInfo.enabled ? 'warning' : 'success'"
                  @click="toggleEnabled(activeInfo || { filename: activeName, enabled: true })"
                >
                  {{ activeInfo && activeInfo.enabled ? '下架' : '启用' }}
                </el-button>
                <el-button size="small" type="primary" :icon="Edit" @click="startEdit">编辑</el-button>
                <el-button size="small" type="danger" :icon="Delete" @click="handleDelete({ filename: activeName })">
                  删除
                </el-button>
              </template>
              <template v-else-if="activeName && isEditing">
                <el-button size="small" type="primary" :icon="Check" :loading="saving" @click="saveMeta">
                  保存
                </el-button>
                <el-button size="small" :icon="Close" @click="cancelEdit">取消</el-button>
              </template>
            </div>
          </div>

          <div v-if="activeName && !isEditing && activeInfo" class="meta-row">
            <el-tag size="small">{{ activeInfo.platform || '?' }}</el-tag>
            <el-tag size="small" type="info">{{ activeInfo.arch || '?' }}</el-tag>
            <el-tag size="small" type="warning">{{ activeInfo.filetype || '?' }}</el-tag>
            <el-tag size="small" :type="activeInfo.enabled ? 'success' : 'danger'">
              {{ activeInfo.enabled ? '启用' : '已下架' }}
            </el-tag>
            <el-tag size="small" type="info" effect="plain">{{ bytesToSize(activeInfo.size) }}</el-tag>
            <span class="meta-sha mono" :title="activeInfo.sha256">sha256: {{ (activeInfo.sha256 || '').slice(0, 12) }}</span>
          </div>

          <div class="right-body">
            <template v-if="!activeName">
              <div class="empty-hint">
                <p>插件对应工作目录下的 <code>plugins/</code> 文件（按 <code>name.os.arch.type</code> 命名）。</p>
                <p class="tip">在左侧选择插件查看功能描述与用法；上传时填写描述（支持 Markdown）供 AI 选型参考。</p>
              </div>
            </template>
            <template v-else-if="isEditing">
              <el-form label-position="top" class="edit-form">
                <el-row :gutter="12">
                  <el-col :span="6">
                    <el-form-item label="入口函数 (dll 插件, 默认 plugmain)">
                      <el-input v-model="editForm.plugentry" placeholder="plugmain" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="18">
                    <el-form-item label="默认参数 (调用未传 args 时使用)">
                      <el-input v-model="editForm.plugargs" placeholder="如 -p 445 -t 8" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="功能描述 (Markdown, 展示给 AI 与管理员)" class="desc-item">
                  <el-input
                    v-model="editForm.description"
                    type="textarea"
                    class="code-textarea"
                    placeholder="插件功能、用法示例、参数说明... (支持 Markdown)"
                  />
                </el-form-item>
              </el-form>
            </template>
            <template v-else-if="activeInfo">
              <div v-if="activeInfo.description" class="md-body" v-html="renderMarkdown(activeInfo.description)"></div>
              <div v-else class="empty-hint">
                <p>暂无描述，点击右上角「编辑」补充功能描述与用法 (Markdown)。</p>
              </div>
            </template>
            <template v-else>
              <div v-loading="true" class="loading-body"></div>
            </template>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="uploadVisible" title="上传注册插件" width="620px">
      <el-form label-width="90px">
        <el-form-item label="插件文件" required>
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="uploadFile ? [{ name: uploadFile.name }] : []"
            drag
            style="width: 100%"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip">单文件不超过 100MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="插件名称" required>
              <el-input v-model="uploadForm.name" placeholder="仅英文字母与数字, 如 netstat2" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台">
              <el-select v-model="uploadForm.platform" filterable allow-create style="width: 100%">
                <el-option v-for="p in PLATFORM_OPTIONS" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="CPU架构">
              <el-select v-model="uploadForm.arch" filterable allow-create style="width: 100%">
                <el-option v-for="a in ARCH_OPTIONS" :key="a" :label="a" :value="a" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="uploadForm.filetype" filterable allow-create style="width: 100%">
                <el-option v-for="t in TYPE_OPTIONS" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="功能描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="5"
            placeholder="插件功能、用法示例、参数说明... (支持 Markdown, 供 AI 选型参考)"
            class="code-textarea"
          />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="6">
            <el-form-item label="入口函数">
              <el-input v-model="uploadForm.plugentry" placeholder="dll 插件入口, 默认 plugmain" />
            </el-form-item>
          </el-col>
          <el-col :span="18">
            <el-form-item label="默认参数">
              <el-input v-model="uploadForm.plugargs" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="落盘文件名">
          <span class="built-name mono">{{ builtFilename || '(请填写插件名称)' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">上传注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mono {
  font-family: 'Consolas', monospace;
}
.plugin-manager {
  height: 100%;
}
.plugin-card {
  height: 100%;
  :deep(.el-card__body) {
    height: 100%;
  }
}
.plugin-layout {
  display: flex;
  height: 100%;
  min-height: 500px;
  gap: 0;
}

.plugin-left {
  width: 300px;
  border-right: 1px solid var(--tk-border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.left-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.left-title {
  font-weight: 600;
  color: var(--tk-accent);
  font-family: 'Consolas', monospace;
}
.left-tree {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 8px;
}
.tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
  color: var(--tk-accent-soft);
  font-family: 'Consolas', monospace;
  transition: all 0.15s;
}
.tree-item:hover {
  background: var(--tk-accent-hover);
}
.tree-item.active {
  background: var(--tk-accent-active);
  color: var(--tk-accent);
  text-shadow: 0 0 6px var(--tk-accent-glow);
}
.tree-item.disabled {
  opacity: 0.5;
}
.tree-icon {
  flex-shrink: 0;
}
.tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-off {
  flex-shrink: 0;
  font-size: 11px;
  border: 1px solid var(--tk-border);
  border-radius: 3px;
  padding: 0 4px;
  color: var(--tk-accent-dim);
}
.tree-arch {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--tk-accent-dim);
}
.left-actions {
  display: flex;
  gap: 8px;
}

.plugin-right {
  flex: 1;
  padding: 12px 0 0 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.right-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--tk-border);
}
.file-path {
  font-size: 14px;
  color: var(--tk-accent);
}
.right-actions {
  display: flex;
  gap: 8px;
}
.meta-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.meta-sha {
  color: var(--tk-accent-dim);
  font-size: 12px;
}
.right-body {
  flex: 1;
  overflow: auto;
}
.loading-body {
  min-height: 200px;
}
.empty-hint {
  padding: 40px 20px;
  text-align: center;
  color: var(--tk-accent-dim);
}
.empty-hint code {
  background: var(--tk-accent-hover);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--tk-accent);
}
.empty-hint .tip {
  color: var(--tk-accent-dim);
  font-size: 12px;
  margin-top: 8px;
}
.built-name {
  color: var(--tk-accent-soft);
  word-break: break-all;
}
:deep(.code-textarea textarea) {
  font-family: 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 编辑表单: 宽度占满, 描述输入框撑满剩余高度且不出滚动条 */
.edit-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.edit-form .desc-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  min-height: 0;
}
.edit-form .desc-item :deep(.el-form-item__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
}
.edit-form .desc-item :deep(.el-textarea) {
  flex: 1;
  min-height: 0;
}
.edit-form .desc-item :deep(.el-textarea__inner) {
  height: 100%;
  resize: none;
}

/* ===== Markdown 渲染样式 (与 AiChat md-body 一致) ===== */
.md-body {
  margin: 0;
}
.md-body :deep(p) {
  margin: 0 0 8px 0;
}
.md-body :deep(p:last-child) {
  margin-bottom: 0;
}
.md-body :deep(h1),
.md-body :deep(h2),
.md-body :deep(h3),
.md-body :deep(h4) {
  margin: 12px 0 6px;
  color: var(--tk-accent);
  font-weight: bold;
}
.md-body :deep(h1) { font-size: 18px; }
.md-body :deep(h2) { font-size: 16px; }
.md-body :deep(h3) { font-size: 15px; }
.md-body :deep(h4) { font-size: 14px; }
.md-body :deep(ul),
.md-body :deep(ol) {
  margin: 6px 0;
  padding-left: 22px;
}
.md-body :deep(li) {
  margin: 2px 0;
}
.md-body :deep(code) {
  background: var(--tk-bg-card);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: var(--tk-accent);
}
.md-body :deep(pre) {
  background: var(--tk-bg-card);
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 6px 0;
}
.md-body :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--tk-accent-soft);
}
.md-body :deep(blockquote) {
  border-left: 3px solid var(--tk-accent-dim);
  padding-left: 10px;
  margin: 6px 0;
  color: var(--tk-accent-dim);
}
.md-body :deep(a) {
  color: var(--tk-accent);
  text-decoration: underline;
}
.md-body :deep(table) {
  border-collapse: collapse;
  margin: 6px 0;
  font-size: 13px;
}
.md-body :deep(th),
.md-body :deep(td) {
  border: 1px solid var(--tk-border);
  padding: 4px 8px;
}
.md-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--tk-border);
  margin: 10px 0;
}
</style>
