<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Delete, Download, Upload, Picture, Files, EditPen } from '@element-plus/icons-vue'
import {
  fileList,
  uploadedFileList,
  fileDelete,
  fileUploadPath,
  fileStorage,
  s3FileList,
  s3FileDelete,
  s3FileRename,
  s3FileUploadPath,
  s3FileDownloadUrl,
} from '@/api/file'
import { settingList, settingUpdate } from '@/api/setting'
import { formatSize, formatTime } from '@/utils/format'
import http from '@/api/index.js'
import { getApiBase } from '@/utils/config'

const loading = ref(false)
const activeTab = ref('collect')
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 20, keyword: '' })

// 存储模式: local = 本地库, s3 = 云存储 (s3.storageType)
const storageType = ref('local')
const isCloud = computed(() => activeTab.value === 'upload' && storageType.value === 's3')

async function loadStorageType() {
  try {
    const res = await fileStorage()
    const v = ((res && res.result) || {}).storagetype || 'local'
    storageType.value = v === 's3' ? 's3' : 'local'
  } catch {
    storageType.value = 'local'
  }
}

// S3 ISO 时间 → 秒级时间戳
function isoToSeconds(iso) {
  if (!iso) return 0
  const t = Date.parse(iso)
  return isNaN(t) ? 0 : Math.floor(t / 1000)
}

async function loadData() {
  loading.value = true
  try {
    if (isCloud.value) {
      // 云存储: 后端一次返回 (上限 1000), 前端本地分页
      const res = await s3FileList({ keyword: query.keyword || undefined })
      const data = (res && res.result) || {}
      const items = (data.items || []).map((it) => ({
        id: it.key,
        key: it.key,
        agent: 'S3',
        filepath: it.key,
        filename: it.filename,
        filesize: it.size,
        updateat: isoToSeconds(it.last_modified),
      }))
      cloudAll.value = items
      total.value = items.length
      const start = (query.page - 1) * query.size
      list.value = items.slice(start, start + query.size)
    } else {
      const api = activeTab.value === 'collect' ? fileList : uploadedFileList
      const res = await api({ page: query.page, size: query.size, keyword: query.keyword || undefined })
      const data = (res && res.result) || {}
      list.value = data.items || []
      total.value = data.total || 0
    }
  } catch {

  } finally {
    loading.value = false
  }
}

// 云存储全量列表 (本地分页用)
const cloudAll = ref([])

function handleTabChange() {
  query.page = 1
  query.keyword = ''
  loadData()
}

function handleSearch() {
  query.page = 1
  loadData()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除文件 ${row.filename} 吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    if (isCloud.value) {
      await s3FileDelete(row.key)
    } else {
      await fileDelete(row.id)
    }
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

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
      `确定删除选中的 ${rows.length} 个文件吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  batchDeleting.value = true
  let ok = 0
  let fail = 0
  for (const row of rows) {
    try {
      if (isCloud.value) {
        await s3FileDelete(row.key)
      } else {
        await fileDelete(row.id)
      }
      ok++
    } catch {
      fail++
    }
  }
  batchDeleting.value = false
  if (fail === 0) {
    ElMessage.success(`已删除 ${ok} 个文件`)
  } else {
    ElMessage.warning(`删除完成: 成功 ${ok} 个, 失败 ${fail} 个`)
  }
  selectedRows.value = []
  loadData()
}

function handleDownload(row) {
  if (isCloud.value) {
    window.open(s3FileDownloadUrl(row.key), '_blank')
    return
  }
  const url = `${http.defaults.baseURL}/filedownload?id=${encodeURIComponent(row.id)}`
  window.open(url, '_blank')
}

// 云存储重命名 (copy + delete)
async function handleRename(row) {
  let name
  try {
    const { value } = await ElMessageBox.prompt('新的对象名称', '重命名', {
      inputValue: row.filename,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (v) => {
        const s = (v || '').trim()
        if (!s) return '名称不能为空'
        if (s.includes('/') || s.includes('\\') || s.includes('..')) return '名称不能包含 / \\ ..'
        return true
      },
    })
    name = (value || '').trim()
  } catch {
    return
  }
  if (!name || name === row.filename) return
  const parent = row.key.includes('/') ? row.key.slice(0, row.key.lastIndexOf('/') + 1) : ''
  try {
    await s3FileRename(row.key, parent + name)
    ElMessage.success('重命名成功')
    loadData()
  } catch {
    ElMessage.error('重命名失败')
  }
}

const uploadRef = ref(null)
function triggerUpload() {
  uploadRef.value && uploadRef.value.$el && uploadRef.value.$el.querySelector('input').click()
}
async function handleUpload(opts) {
  const file = opts.file
  const formData = new FormData()
  formData.append('file', file, file.name)
  const path = isCloud.value ? s3FileUploadPath() : fileUploadPath()
  try {
    await http.post(path, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    ElMessage.success('上传成功')
    if (activeTab.value !== 'upload') {
      activeTab.value = 'upload'
      handleTabChange()
    } else {
      loadData()
    }
  } catch {
    ElMessage.error('上传失败')
  }
}

async function refreshWithStorage() {
  await loadStorageType()
  loadData()
}

onMounted(refreshWithStorage)

// ---- 存储配置 (s3.* 设置, 独立于 npc1 项目级存储) ----

const ossVisible = ref(false)
const ossSubmitting = ref(false)
// 字段名与设置键一一对应: s3.{field}
const ossForm = reactive({
  storageType: 'local',
  endpoint: '',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: '',
  prefix: '',
})

async function openOss() {
  try {
    const res = await settingList({ page: 1, size: 200 })
    const items = ((res && res.result) || {}).items || []
    const cfg = { storageType: 'local' }
    items.forEach((item) => {
      if (item.key && item.key.startsWith('s3.')) {
        cfg[item.key.slice(3)] = item.value
      }
    })
    Object.assign(ossForm, cfg)
  } catch {
    Object.assign(ossForm, {
      storageType: 'local',
      endpoint: '',
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      prefix: '',
    })
  }
  ossVisible.value = true
}

async function submitOss() {
  ossSubmitting.value = true
  try {
    const items = Object.entries(ossForm).map(([field, val]) => ({
      key: `s3.${field}`,
      value: val,
    }))
    await settingUpdate(items)
    ElMessage.success('存储配置保存成功')
    ossVisible.value = false
    await loadStorageType()
    if (activeTab.value === 'upload') {
      query.page = 1
      loadData()
    }
  } catch {
    ElMessage.error('存储配置保存失败')
  } finally {
    ossSubmitting.value = false
  }
}

const previewVisible = ref(false)
const previewUrl = ref('')
const previewList = ref([])
const isImage = (name) => /\.(PNG|JPG|JPEG|GIF|BMP|WEBP)$/i.test(name || '')

function handlePreview(row) {
  if (isCloud.value) {
    previewUrl.value = s3FileDownloadUrl(row.key)
  } else {
    previewUrl.value = `${getApiBase()}/filedownload?id=${encodeURIComponent(row.id)}`
  }
  if (!previewList.value.includes(previewUrl.value)) {
    previewList.value = [previewUrl.value]
  }
  previewVisible.value = true
}
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="采集文件" name="collect" />
        <el-tab-pane label="上传文件" name="upload" />
      </el-tabs>

      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索文件名/路径"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 260px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
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
        <template v-if="activeTab === 'upload'">
          <el-button size="small" :icon="Files" @click="openOss">存储配置</el-button>
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :http-request="handleUpload"
            style="display: inline-block"
          >
            <el-button size="small" :icon="Upload" type="primary">上传</el-button>
          </el-upload>
        </template>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe size="small" empty-text="暂无文件" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="42" align="center" />
        <el-table-column label="NPC" prop="agent" min-width="160" show-overflow-tooltip />
        <el-table-column label="路径" prop="filepath" min-width="220" show-overflow-tooltip />
        <el-table-column label="名称" prop="filename" min-width="200" show-overflow-tooltip />
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ formatSize(row.filesize) }}</template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="290" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button
              v-if="isImage(row.filename)"
              size="small"
              :icon="Picture"
              @click="handlePreview(row)"
            >预览</el-button>
            <el-button type="primary" size="small" :icon="Download" @click="handleDownload(row)">
              下载
            </el-button>
            <el-button v-if="isCloud" size="small" :icon="EditPen" @click="handleRename(row)">
              重命名
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
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

    
    <el-dialog v-model="ossVisible" title="文件存储配置" width="520px">
      <el-form :model="ossForm" label-width="110px">
        <el-form-item label="存储方式" required>
          <el-radio-group v-model="ossForm.storageType">
            <el-radio-button value="local">本地存储</el-radio-button>
            <el-radio-button value="s3">云存储 (S3)</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="ossForm.storageType === 's3'">
          <el-form-item label="Endpoint" required>
            <el-input v-model="ossForm.endpoint" placeholder="如 oss-cn-hangzhou.aliyuncs.com 或 192.168.0.200:9000" />
          </el-form-item>
          <el-form-item label="AccessKeyId" required>
            <el-input v-model="ossForm.accessKeyId" placeholder="Access Key ID" autocomplete="off" name="s3-ak" />
          </el-form-item>
          <el-form-item label="AccessKeySecret" required>
            <el-input v-model="ossForm.accessKeySecret" show-password placeholder="Access Key Secret" autocomplete="new-password" name="s3-sk" />
          </el-form-item>
          <el-form-item label="Bucket" required>
            <el-input v-model="ossForm.bucket" placeholder="存储桶名称" />
          </el-form-item>
          <el-form-item label="路径前缀">
            <el-input v-model="ossForm.prefix" placeholder="如 uploads/" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="ossVisible = false">取消</el-button>
        <el-button type="primary" :loading="ossSubmitting" @click="submitOss">保存</el-button>
      </template>
    </el-dialog>

    
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewList"
      :initial-index="0"
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped>
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
