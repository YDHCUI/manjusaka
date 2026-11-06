<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock, Key, Refresh, CopyDocument, Check } from '@element-plus/icons-vue'
import { getUserProfile, resetUserAuth, changePassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { sha256 } from '@/utils/crypto'
import { copyToClipboard } from '@/utils/clipboard'
import { getApiBase } from '@/utils/config'

defineOptions({ name: 'Profile' })

const authStore = useAuthStore()

const loading = ref(false)
const profile = ref(null)
const copied = ref(false)

const passForm = reactive({
  oldpass: '',
  newpass: '',
  confirm: '',
  captcha: '',
})
const passFormRef = ref(null)
const passLoading = ref(false)
const passCaptchaSrc = ref('')

function refreshPassCaptcha() {
  passCaptchaSrc.value = `${getApiBase()}/captcha?t=${Date.now()}`
}

const passRules = {
  oldpass: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newpass: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        if (value !== passForm.newpass) cb(new Error('两次输入的密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

async function loadProfile() {
  loading.value = true
  try {
    const res = await getUserProfile()
    if (res && res.result) {
      profile.value = res.result
    }
  } catch {

  } finally {
    loading.value = false
  }
}

async function handleResetAuth() {
  try {
    await ElMessageBox.confirm(
      '重置后原有的 userauth 将立即失效，使用旧 token 的 MCP/机器人等集成需要更新。确定重置？',
      '重置 userauth',
      { type: 'warning', confirmButtonText: '重置', cancelButtonText: '取消' },
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await resetUserAuth()
    if (res && res.result) {
      profile.value.userauth = res.result
      ElMessage.success('userauth 已重置')
    }
  } catch {

  } finally {
    loading.value = false
  }
}

async function handleCopyAuth() {
  if (!profile.value) return
  const ok = await copyToClipboard(profile.value.userauth)
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}

async function handleChangePass() {
  if (!passFormRef.value) return
  try {
    await passFormRef.value.validate()
  } catch {
    return
  }

  passLoading.value = true
  try {

    const password = await sha256(passForm.oldpass)
    const newpass = await sha256(passForm.newpass)
    await changePassword({
      username: authStore.username,
      password,
      newpass,
      captcha: passForm.captcha,
    })

    ElMessage.success('密码修改成功，请重新登录')
    authStore.logout()
    setTimeout(() => {
      window.location.hash = '#/login'
      window.location.reload()
    }, 800)
    return
  } catch {
    refreshPassCaptcha()
    passForm.captcha = ''
  } finally {
    passLoading.value = false
  }
}

onMounted(() => {
  loadProfile()
  refreshPassCaptcha()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="profile-grid">

      <div class="page-card info-card">
        <div class="card-title">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </div>
        <div class="info-body" v-if="profile">
          <div class="info-row">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ profile.username || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">用户ID</span>
            <span class="info-value mono">{{ profile.userid || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ profile.email || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">手机</span>
            <span class="info-value">{{ profile.phone || '-' }}</span>
          </div>
        </div>
        <div v-else class="info-empty">暂无数据</div>
      </div>

      <div class="page-card auth-card">
        <div class="card-title">
          <el-icon><Key /></el-icon>
          <span>UserAuth Token</span>
        </div>
        <div class="auth-body" v-if="profile">
          <p class="auth-desc">
            该 token 用于 MCP Server、机器人等外部系统集成鉴权，请妥善保管。
          </p>
          <div class="auth-token-box">
            <code class="auth-token-text">{{ profile.userauth || '-' }}</code>
            <el-button
              size="small"
              :type="copied ? 'success' : 'primary'"
              plain
              @click="handleCopyAuth"
            >
              <el-icon><Check v-if="copied" /><CopyDocument v-else /></el-icon>
              {{ copied ? '已复制' : '复制' }}
            </el-button>
          </div>
          <div class="auth-actions">
            <el-button type="warning" :icon="Refresh" :loading="loading" @click="handleResetAuth">
              重置 Token
            </el-button>
          </div>
        </div>
      </div>

      <div class="page-card pass-card">
        <div class="card-title">
          <el-icon><Lock /></el-icon>
          <span>修改密码</span>
        </div>
        <el-form
          ref="passFormRef"
          :model="passForm"
          :rules="passRules"
          label-width="90px"
          class="pass-form"
        >
          <el-form-item label="原密码" prop="oldpass">
            <el-input
              v-model="passForm.oldpass"
              type="password"
              placeholder="请输入原密码"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newpass">
            <el-input
              v-model="passForm.newpass"
              type="password"
              placeholder="请输入新密码"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirm">
            <el-input
              v-model="passForm.confirm"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input
                v-model="passForm.captcha"
                placeholder="请输入验证码"
                clearable
              />
              <img
                :src="passCaptchaSrc"
                class="pass-captcha"
                @click="refreshPassCaptcha"
                alt="验证码"
                title="点击刷新"
              />
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="passLoading" @click="handleChangePass">
              确认修改
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
}

.page-card {
  background: var(--tk-bg-card);
  border: 1px solid var(--tk-border);
  border-radius: 6px;
  padding: 16px 20px;
  margin-bottom: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--tk-accent);
  text-shadow: 0 0 6px var(--tk-accent-glow);
  margin-bottom: 16px;
  font-family: 'Consolas', monospace;
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 0;
  border-bottom: 1px solid var(--tk-border);
}

.info-label {
  width: 90px;
  flex-shrink: 0;
  color: var(--tk-accent-dim);
  font-size: 13px;
}

.info-value {
  color: var(--tk-accent-soft);
  font-size: 14px;
  word-break: break-all;
}

.info-value.mono {
  font-family: 'Consolas', monospace;
}

.info-empty {
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 24px;
}

.auth-desc {
  font-size: 13px;
  color: var(--tk-accent-dim);
  margin-bottom: 12px;
  line-height: 1.5;
}

.auth-token-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--tk-accent-hover);
  border: 1px solid var(--tk-border);
  border-radius: 4px;
  padding: 8px 12px;
}

.auth-token-text {
  flex: 1;
  font-family: 'Consolas', monospace;
  color: var(--tk-accent);
  font-size: 14px;
  word-break: break-all;
  text-shadow: 0 0 4px var(--tk-accent-glow);
}

.auth-actions {
  margin-top: 16px;
}

.pass-form {
  max-width: 420px;
}

.captcha-row {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.pass-captcha {
  width: 110px;
  height: 32px;
  border: 1px solid var(--tk-border);
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  object-fit: cover;
}
</style>
