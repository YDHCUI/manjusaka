<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Delete, Edit, Search } from '@element-plus/icons-vue'
import { botList, botDelete, botUpdate, botAction, botQrCode } from '@/api/bot'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const list = ref([])
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (b) =>
      String(b.name || '').toLowerCase().includes(kw) ||
      String(b.botype || '').toLowerCase().includes(kw) ||
      String(b.baseurl || '').toLowerCase().includes(kw) ||
      String(b.note || '').toLowerCase().includes(kw),
  )
})

const botTypes = ['qq', 'wecom', 'wxilink', 'tg', 'webhook', 'dingtalk', 'feishu']

// 各类型字段填写提示 (根据所选类型动态展示)
const typeTips = {
  qq: 'apikey=AppID, appsecret=AppSecret (QQ开放平台机器人)',
  tg: 'apikey=Bot Token, baseurl=API地址(留空默认官方)',
  wecom: '企业微信自建应用: apikey=企业ID(CorpID), appsecret=应用Secret, baseurl=API地址(留空默认官方)。备注填可选 JSON: {"agentid":1000002,"token":"回调Token","aeskey":"回调EncodingAESKey(43位)"}。回调地址(接收消息): /<管理路由>/webhook/wecom/<机器人ID>',
  wxilink: '微信个人号(iLink协议): 无需手工填写凭证, 启动运行后在列表点"扫码"用微信扫码登录, bot_token 自动保存到 apikey, API地址自动保存到 baseurl。appsecret 可选填 notify_to (接收上线通知的用户ID)。旧版存在备注 JSON 里的 bot_token/baseurl/notify_to 读取时自动兼容',
  dingtalk: '钉钉企业内部机器人: apikey=AppKey, appsecret=AppSecret, baseurl=API地址(留空默认官方)。备注填可选 JSON: {"robot_code":"机器人编码(缺省=AppKey)","notify_to":"通知目标userid,逗号分隔"}。开发者后台机器人消息接收选 HTTP 模式, 地址填 /<管理路由>/webhook/ding/<机器人ID>',
  feishu: '飞书自建应用机器人: apikey=AppID, appsecret=AppSecret, baseurl=API地址(留空默认官方)。备注填可选 JSON: {"encrypt_key":"事件加密Key","verification_token":"事件Token","notify_to":"通知目标open_id"}。开放平台事件订阅请求地址填 /<管理路由>/webhook/feishu/<机器人ID>, 需订阅 im.message.receive_v1 事件',
  webhook: '通用接入: apikey=访问令牌(建议必填), baseurl=异步回调地址(配合 ?push=1)。AI 聊天: POST /<管理路由>/webhook/<ID>, body {"text":"消息"} 同步返回 AI 回复; ?push=1 时立即 202, AI 回复异步 POST 到 baseurl。适合对接 wechaty 等外部网关 (管理路由即登录地址前缀, 默认 /manjusaka)',
}

// ===== wxilink 扫码登录 =====
const qrDialogVisible = ref(false)
const qrState = ref(null)
let qrTimer = null
let qrDialogRow = null

function openQrLogin(row) {
  qrDialogRow = row
  qrState.value = null
  qrDialogVisible.value = true
  stopQrPoll()
  qrTimer = setInterval(pollQr, 1500)
  pollQr()
}

function stopQrPoll() {
  if (qrTimer) {
    clearInterval(qrTimer)
    qrTimer = null
  }
}

async function pollQr() {
  if (!qrDialogRow) return
  try {
    const res = await botQrCode(qrDialogRow.id)
    const data = (res && res.result) || {}
    qrState.value = data
    if (data.logged_in) {
      stopQrPoll()
      ElMessage.success('微信扫码登录成功')
      qrDialogVisible.value = false
      loadData()
    }
  } catch {

  }
}

onBeforeUnmount(stopQrPoll)

async function loadData() {
  loading.value = true
  try {
    const res = await botList({})
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
  name: '',
  botype: 'qq',
  baseurl: '',
  apikey: '',
  appsecret: '',
  isrun: false,
  isrecv: true,
  issend: true,
  note: '',
})

function openAdd() {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    botype: 'qq',
    baseurl: '',
    apikey: '',
    appsecret: '',
    isrun: false,
    isrecv: true,
    issend: true,
    note: '',
  })
  dialogVisible.value = true
}
function openEdit(row) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function submit() {
  if (!form.name) {
    ElMessage.warning('请填写名称')
    return
  }
  submitting.value = true
  try {
    await botUpdate({ ...form })
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
    await ElMessageBox.confirm(`确定删除机器人 ${row.name} 吗?`, '提示', { type: 'warning' })
    await botDelete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {

  }
}

async function toggleRun(row) {
  try {
    await botAction(row.id, { isrun: !row.isrun })
    ElMessage.success(row.isrun ? '已停止' : '已启动')
    loadData()
  } catch {

  }
}

async function toggleSwitch(row, field) {
  try {
    await botAction(row.id, { [field]: !row[field] })
    loadData()
  } catch {

  }
}

const typeColor = (t) => {
  const m = { qq: '#409eff', wecom: '#67c23a', wxilink: '#2aae67', tg: '#36aee9', ding: '#1677ff', dingtalk: '#1677ff', feishu: '#e6a23c', webhook: '#8b5cf6' }
  return m[t] || '#909399'
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索 名称 / 类型 / URL"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width: 280px"
        />
        <div class="flex-grow"></div>
        <el-button type="primary" size="small" :icon="Plus" @click="openAdd">新建机器人</el-button>
        <el-button size="small" :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" border stripe size="small" empty-text="暂无机器人">
        <el-table-column label="名称" prop="name" min-width="120" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :style="{ color: typeColor(row.botype) }" effect="plain">
              {{ row.botype }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="BaseURL" prop="baseurl" min-width="200" show-overflow-tooltip />
        <el-table-column label="ApiKey" prop="apikey" min-width="160" show-overflow-tooltip />
        <el-table-column label="运行" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.isrun" @change="toggleRun(row)" />
          </template>
        </el-table-column>
        <el-table-column label="接收" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.isrecv" @change="toggleSwitch(row, 'isrecv')" />
          </template>
        </el-table-column>
        <el-table-column label="发送" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.issend" @change="toggleSwitch(row, 'issend')" />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" min-width="120" show-overflow-tooltip />
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateat) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right" class-name="op-col">
          <template #default="{ row }">
            <el-button v-if="row.botype === 'wxilink'" size="small" type="success" @click="openQrLogin(row)">扫码</el-button>
            <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑机器人' : '新建机器人'" width="640px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.botype">
            <el-option v-for="t in botTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="BaseURL"><el-input v-model="form.baseurl" autocomplete="new-password" name="bot-baseurl" /></el-form-item>
        <el-form-item label="ApiKey"><el-input v-model="form.apikey" show-password autocomplete="new-password" name="bot-apikey" /></el-form-item>
        <el-form-item label="AppSecret"><el-input v-model="form.appsecret" show-password autocomplete="new-password" name="bot-appsecret" /></el-form-item>
        <div class="switch-doc-row">
          <div class="switch-col">
            <el-form-item label="运行"><el-switch v-model="form.isrun" /></el-form-item>
            <el-form-item label="接收消息"><el-switch v-model="form.isrecv" /></el-form-item>
            <el-form-item label="发送消息"><el-switch v-model="form.issend" /></el-form-item>
          </div>
          <div class="doc-col">
            <div class="doc-box">
              <div class="doc-title">说明文档</div>
              <div class="doc-text">{{ typeTips[form.botype] }}</div>
            </div>
          </div>
        </div>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="qrDialogVisible" title="微信扫码登录" width="380px" @close="stopQrPoll">
      <div class="qr-box">
        <template v-if="qrState && qrState.logged_in">
          <div class="qr-ok">已登录</div>
        </template>
        <template v-else-if="qrState && qrState.qr_svg">
          <img v-if="qrState.qr_svg" :src="qrState.qr_svg" class="qr-img" alt="二维码" />
          <div class="qr-status">{{ qrState.status_text || qrState.status }}</div>
          <div class="qr-expire" v-if="qrState.expires_in > 0">二维码剩余 {{ qrState.expires_in }} 秒, 过期自动刷新</div>
          <div class="qr-link">无法扫码? 复制链接到微信打开: <a :href="qrState.qr_content" target="_blank" rel="noopener">{{ qrState.qr_content }}</a></div>
        </template>
        <template v-else>
          <div class="qr-status">{{ (qrState && qrState.status_text) || '正在生成二维码... 请先启动机器人 (运行开关打开)' }}</div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.switch-doc-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 18px;
}

.switch-col {
  flex: 0 0 auto;
}

.doc-col {
  flex: 1 1 0;
  min-width: 0;
}

.doc-box {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.doc-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  padding: 6px 10px 0;
}

.doc-text {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  padding: 2px 10px 8px;
  word-break: break-all;
  overflow-y: auto;
}

.qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  min-height: 220px;
  justify-content: center;
}

.qr-img {
  width: 240px;
  height: 240px;
  background: #fff;
  border-radius: 6px;
}

.qr-status {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.qr-ok {
  font-size: 16px;
  color: var(--el-color-success);
}

.qr-expire {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.qr-link {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
  max-width: 100%;
  padding: 0 12px;
}
</style>
