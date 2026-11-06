<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Edit, Delete, Check, Close } from '@element-plus/icons-vue'
import { marked } from 'marked'
import {
  skillList,
  skillInfo,
  skillCreate,
  skillUpdate,
  skillDelete,
  validateSkillName,
  skillFileBody,
} from '@/api/skill'

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

const activeName = ref('')
const activeContent = ref('')
const activeMeta = reactive({
  description: '',
  version: '',
  author: '',
  tags: [],
})

const isEditing = ref(false)
const editingContent = ref('')
const saving = ref(false)

const createVisible = ref(false)
const createLoading = ref(false)
const createForm = reactive({ name: '', content: '' })

const pathLabel = computed(() => {
  if (!activeName.value) return '目录: skills/'
  return `文件: skills/${activeName.value}.md`
})

async function loadData() {
  loading.value = true
  try {
    const res = await skillList(keyword.value)
    const data = (res && res.result) || {}
    list.value = data.skills || []
  } catch {

  } finally {
    loading.value = false
  }
}

async function selectSkill(row) {
  activeName.value = row.name
  isEditing.value = false
  try {
    const res = await skillInfo(row.name)
    const data = (res && res.result) || {}
    activeContent.value = skillFileBody(data)
    editingContent.value = activeContent.value
    Object.assign(activeMeta, {
      description: data.description || '',
      version: data.version || '',
      author: data.author || '',
      tags: data.tags || [],
    })
  } catch {
    activeContent.value = ''
    editingContent.value = ''
  }
}

function startEdit() {
  isEditing.value = true
  editingContent.value = activeContent.value
}

function cancelEdit() {
  isEditing.value = false
  editingContent.value = activeContent.value
}

async function saveContent() {
  if (!activeName.value) return
  saving.value = true
  try {
    await skillUpdate({ name: activeName.value, content: editingContent.value })
    ElMessage.success('保存成功')
    activeContent.value = editingContent.value
    isEditing.value = false
    loadData()
  } catch {

  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除技能 ${row.name} 吗?`, '提示', { type: 'warning' })
    await skillDelete(row.name)
    ElMessage.success('已删除')
    if (activeName.value === row.name) {
      activeName.value = ''
      activeContent.value = ''
    }
    loadData()
  } catch {

  }
}

function openCreate() {
  Object.assign(createForm, { name: '', content: '' })
  createVisible.value = true
}

async function submitCreate() {
  const name = createForm.name.trim()
  const err = validateSkillName(name)
  if (err) {
    ElMessage.warning(err)
    return
  }
  createLoading.value = true
  try {
    let finalName = name
    if (finalName.toLowerCase().endsWith('.md')) {
      finalName = finalName.slice(0, -3).trim()
    }
    await skillCreate({ name: finalName, content: createForm.content })
    ElMessage.success('创建成功')
    createVisible.value = false
    await loadData()

    const created = list.value.find((s) => s.name === finalName)
    if (created) {
      await selectSkill(created)
    }
  } catch {

  } finally {
    createLoading.value = false
  }
}

function handleSearch() {
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container skill-manager">
    <el-card shadow="never" class="skill-card">
      <div class="skill-layout">

        <div class="skill-left">
          <div class="left-header">
            <span class="left-title">本地技能</span>
            <div class="left-actions">
              <el-button size="small" :icon="Refresh" @click="loadData">刷新</el-button>
              <el-button type="primary" size="small" :icon="Plus" @click="openCreate">新增</el-button>
            </div>
          </div>
          <el-input
            v-model="keyword"
            placeholder="按名称/描述/标签筛选"
            clearable
            size="small"
            style="margin-bottom: 10px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <div class="left-tree" v-loading="loading">
            <div
              v-for="row in list"
              :key="row.name"
              class="tree-item"
              :class="{ active: activeName === row.name }"
              @click="selectSkill(row)"
            >
              <span class="tree-icon">📄</span>
              <span class="tree-name">{{ row.name }}.md</span>
              <el-button
                class="tree-del"
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click.stop="handleDelete(row)"
              />
            </div>
            <el-empty v-if="!loading && !list.length" description="暂无技能" :image-size="60" />
          </div>
        </div>

        <div class="skill-right">
          <div class="right-header">
            <span class="file-path mono">{{ pathLabel }}</span>
            <div class="right-actions">
              <template v-if="activeName">
                <template v-if="!isEditing">
                  <el-button size="small" type="primary" :icon="Edit" @click="startEdit">编辑</el-button>
                  <el-button size="small" type="danger" :icon="Delete" @click="handleDelete({ name: activeName })">
                    删除
                  </el-button>
                </template>
                <template v-else>
                  <el-button size="small" type="primary" :icon="Check" :loading="saving" @click="saveContent">
                    保存
                  </el-button>
                  <el-button size="small" :icon="Close" @click="cancelEdit">取消</el-button>
                </template>
              </template>
            </div>
          </div>

          
          <div v-if="activeName && !isEditing" class="meta-row">
            <el-tag v-if="activeMeta.version" size="small">v{{ activeMeta.version }}</el-tag>
            <el-tag v-if="activeMeta.author" size="small" type="info">{{ activeMeta.author }}</el-tag>
            <el-tag v-for="tag in activeMeta.tags" :key="tag" size="small" type="success">{{ tag }}</el-tag>
            <span v-if="activeMeta.description" class="meta-desc">{{ activeMeta.description }}</span>
          </div>

          <div class="right-body" :class="{ editing: isEditing }">
            <template v-if="!activeName">
              <div class="empty-hint">
                <p>技能对应工作目录下的 <code>skills/*.md</code> 文件（仅平面文件）。</p>
                <p class="tip">在左侧选择某个 .md 可查看与编辑内容。</p>
              </div>
            </template>
            <template v-else-if="isEditing">
              <el-input
                v-model="editingContent"
                type="textarea"
                resize="none"
                placeholder="SKILL.md 全文..."
                class="code-textarea fill-textarea"
              />
            </template>
            <template v-else>
              <div v-if="activeContent" class="md-body" v-html="renderMarkdown(activeContent)"></div>
              <div v-else class="content-view">(空)</div>
            </template>
          </div>
        </div>
      </div>
    </el-card>

    
    <el-dialog v-model="createVisible" title="新增技能文件" width="560px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="技能名" required>
          <el-input v-model="createForm.name" placeholder="例如 my-skill（不含 .md）" />
        </el-form-item>
        <el-form-item label="初始内容">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="6"
            placeholder="可选，Markdown 全文"
            class="code-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mono {
  font-family: 'Consolas', monospace;
}
.skill-manager {
  height: 100%;
}
.skill-card {
  height: 100%;
  :deep(.el-card__body) {
    height: 100%;
  }
}
.skill-layout {
  display: flex;
  height: 100%;
  min-height: 500px;
  gap: 0;
}

.skill-left {
  width: 280px;
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
.tree-icon {
  flex-shrink: 0;
}
.tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-del {
  opacity: 0;
  transition: opacity 0.15s;
}
.tree-item:hover .tree-del {
  opacity: 1;
}
.left-actions {
  display: flex;
  gap: 8px;
}

.skill-right {
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
.meta-desc {
  color: var(--tk-accent-dim);
  font-size: 12px;
}
.right-body {
  flex: 1;
  overflow: auto;
}
/* 编辑态: 输入框占满剩余空间, 不出现双层滚动 */
.right-body.editing {
  display: flex;
  overflow: hidden;
}
.right-body.editing :deep(.fill-textarea) {
  flex: 1;
  display: flex;
}
.right-body.editing :deep(.fill-textarea .el-textarea__inner) {
  height: 100%;
  flex: 1;
  box-sizing: border-box;
}
.content-view {
  background: var(--tk-bg-input);
  border: 1px solid var(--tk-border);
  border-radius: 4px;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--tk-accent-soft);
  margin: 0;
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
:deep(.code-textarea textarea) {
  font-family: 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* ===== Markdown 渲染样式 (与 AiChat/PluginList md-body 一致) ===== */
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
