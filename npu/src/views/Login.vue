<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Picture } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getApiBase, getAdminPrefix, setAdminPrefix } from '@/utils/config'
import { sha256 } from '@/utils/crypto'
import MatrixRain from '@/components/MatrixRain.vue'
import lilyBg from '@/assets/lily/lily-bg.svg'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const captchaSrc = ref('')
const booting = ref(true)

const form = reactive({
  username: '',
  password: '',
  captcha: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const formRef = ref(null)
const showSetting = ref(false)
const adminPrefix = ref(getAdminPrefix())

function refreshCaptcha() {
  captchaSrc.value = `${getApiBase()}/captcha?t=${Date.now()}`
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {

    const passwordHash = await sha256(form.password)
    await authStore.login({
      username: form.username,
      password: passwordHash,
      captcha: form.captcha,
    })
    ElMessage.success('ACCESS GRANTED')
    const redirect = (route.query && route.query.redirect) || '/'
    router.push(redirect)
  } catch (e) {
    const msg = (e && e.message) || '登录失败'

    if (!/验证码|账号或密码/.test(msg)) {
      ElMessage.error(msg)
    }
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

function saveAdminPrefix() {
  setAdminPrefix(adminPrefix.value)
  ElMessage.success('前缀已保存，刷新页面生效')
}

onMounted(() => {
  refreshCaptcha()

  setTimeout(() => {
    booting.value = false
  }, 1400)
})
</script>

<template>
  <div class="login-wrapper">

    <MatrixRain charset="matrix" color="#1f7a1f" head-color="#5cff5c" :font-size="12" :speed="1" :opacity="0.4" />
    <div class="scanline"></div>
    <div class="vignette"></div>

    <!-- 曼珠沙华: 右下角背景花丛, 花朝向左上方 -->
    <div class="lily-layer lily-main" aria-hidden="true" :style="{ backgroundImage: `url(${lilyBg})` }"></div>

    <transition name="fade">
      <div v-if="booting" class="boot-screen">
        <!-- 曼珠沙华: 启动画面同款背景, 与主背景同位无缝衔接 -->
        <div class="lily-layer lily-boot" :style="{ backgroundImage: `url(${lilyBg})` }"></div>
        <div class="boot-text">
          <p>&gt; initializing manjusaka core...</p>
          <p>&gt; loading neural modules... OK</p>
          <p>&gt; establishing secure channel... OK</p>
          <p>&gt; ready_</p>
        </div>
      </div>
    </transition>

    <div class="login-box">
      <div class="blue-scan"></div>
      <div class="login-header">
        <h1 class="title glitch" data-text="牛屎花">牛屎花</h1>
        <p class="subtitle">&gt; 牛屎花 · 统一管控平台_</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="USERNAME"
            :prefix-icon="User"
            class="hack-input"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="PASSWORD"
            :prefix-icon="Lock"
            class="hack-input"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="form.captcha"
              placeholder="CAPTCHA"
              :prefix-icon="Picture"
              class="hack-input"
              clearable
            />
            <div class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码">
              <img v-if="captchaSrc" :src="captchaSrc" alt="captcha" />
              <span v-else>·····</span>
            </div>
          </div>
        </el-form-item>

        <button type="button" class="hack-btn" :class="{ loading }" :disabled="loading" @click="handleLogin">
          <span class="btn-text">{{ loading ? 'AUTHENTICATING...' : '&gt; CONNECT' }}</span>
        </button>
      </el-form>

      <div class="login-footer">
        <el-link type="info" :underline="false" @click="showSetting = !showSetting">
          <span class="footer-link">&gt; admin_prefix_config</span>
        </el-link>
        <transition name="slide">
          <div v-show="showSetting" class="admin-setting">
            <el-input v-model="adminPrefix" size="small" placeholder="admin 前缀，如 manjusaka">
              <template #prepend>/</template>
            </el-input>
            <el-button size="small" class="hack-mini-btn" @click="saveAdminPrefix">SAVE</el-button>
          </div>
        </transition>
      </div>
    </div>

    <div class="corner-info">SYS://manjusaka_v2 // encrypted_channel</div>
  </div>
</template>

<style scoped lang="scss">
/* 黑底绿字 + 灰底登录框 */
.login-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Consolas', 'Courier New', monospace;
}

.scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(40, 120, 40, 0.18) 3px,
    rgba(0, 0, 0, 0) 4px
  );
  mix-blend-mode: overlay;
}

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  box-shadow: inset 0 0 200px 60px rgba(0, 0, 0, 0.9);
}

/* 曼珠沙华: 右下角背景花丛 (单图, 花序朝左上)
   lily-boot 用于启动画面, 与 lily-main 同尺寸同位置, 启动淡出时无缝衔接 */
.lily-layer {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(680px, 62vw);
  aspect-ratio: 700 / 640;
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: contain;
  pointer-events: none;
  z-index: 2;
}
.lily-main {
  /* 随风飘曳由 SVG 内部 SMIL animateTransform 实现 (株间相位错开), CSS 不叠加晃动 */
}
.lily-boot {
  opacity: 0.7;
}
@media (max-width: 900px) {
  .lily-main {
    opacity: 0.35;
  }
}

.boot-screen {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boot-text {
  color: #33ff33;
  font-size: 14px;
  line-height: 2;
  p {
    margin: 0;
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 登录框：灰底 */
.login-box {
  position: relative;
  z-index: 5;
  width: 400px;
  max-width: 92vw;
  padding: 36px 34px 24px;
  background: #262626;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  box-shadow: 0 0 30px rgba(51, 255, 51, 0.1), 0 0 0 1px rgba(51, 255, 51, 0.15);
  backdrop-filter: blur(2px);

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border: 2px solid #33ff33;
  }
  &::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
  }
  &::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
  }
}

/* 蓝线自上而下扫描 */
.blue-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  top: 0;
  z-index: 6;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, #2563eb 50%, transparent);
  box-shadow: 0 0 12px 2px rgba(37, 99, 235, 0.6);
  animation: blue-scan 2.6s linear infinite;
}
@keyframes blue-scan {
  0%   { top: 0; opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.login-header {
  text-align: center;
  margin-bottom: 24px;

  .logo-mark {
    color: #33ff33;
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 10px;
    .logo-bracket {
      color: #33ff33;
    }
  }

  .title {
    margin: 0;
    font-size: 30px;
    letter-spacing: 6px;
    color: #e8e8e8;
    position: relative;
  }

  .subtitle {
    margin: 8px 0 0;
    color: #7a7a7a;
    font-size: 12px;
    letter-spacing: 1px;
  }
}

.glitch {
  position: relative;
}
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  overflow: hidden;
}
.glitch::before {
  color: transparent;
  animation: glitch-1 2.5s infinite linear alternate-reverse;
  clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
}
.glitch::after {
  color: transparent;
  animation: glitch-2 3s infinite linear alternate-reverse;
  clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
}
@keyframes glitch-1 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, 0); }
}
@keyframes glitch-2 {
  0%, 100% { transform: translate(0); }
  25% { transform: translate(1px, -1px); }
  50% { transform: translate(-2px, 1px); }
  75% { transform: translate(1px, 0); }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.hack-input {
  :deep(.el-input__wrapper) {
    background: #141414;
    border: 1px solid #3a3a3a;
    box-shadow: 0 0 6px rgba(51, 255, 51, 0.08) inset;
    border-radius: 2px;
    transition: all 0.2s;
  }
  :deep(.el-input__wrapper:hover) {
    border-color: #555555;
  }
  :deep(.el-input__wrapper.is-focus) {
    border-color: #33ff33;
    box-shadow: 0 0 8px rgba(51, 255, 51, 0.25) inset, 0 0 6px rgba(51, 255, 51, 0.15);
  }
  :deep(.el-input__inner) {
    color: #e8e8e8;
    font-family: 'Consolas', monospace;
    letter-spacing: 1px;
    &::placeholder {
      color: #5a5a5a;
      letter-spacing: 2px;
    }
  }
  :deep(.el-input__prefix-inner) {
    color: #33ff33;
  }
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: center;

  .hack-input {
    flex: 1;
  }
  .captcha-img {
    width: 110px;
    height: 40px;
    border: 1px solid #3a3a3a;
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #141414;
    flex-shrink: 0;
    color: #33ff33;
    letter-spacing: 4px;
    transition: all 0.2s;
    &:hover {
      border-color: #33ff33;
      box-shadow: 0 0 8px rgba(51, 255, 51, 0.25);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.hack-btn {
  width: 100%;
  height: 42px;
  margin-top: 4px;
  background: linear-gradient(180deg, #4b82f3, #2563eb);
  border: 1px solid #2563eb;
  border-radius: 2px;
  color: #ffffff;
  font-family: 'Consolas', monospace;
  font-size: 15px;
  letter-spacing: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3), inset 0 0 10px rgba(37, 99, 235, 0.1);
  transition: all 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
    transition: left 0.5s;
  }
  &:hover:not(:disabled)::after {
    left: 100%;
  }
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #5a8de0, #1e4fb8);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.42), inset 0 0 12px rgba(37, 99, 235, 0.15);
  }
  &:disabled {
    cursor: wait;
    opacity: 0.8;
  }
  &.loading .btn-text {
    animation: blink 0.8s infinite;
  }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.login-footer {
  margin-top: 18px;
  text-align: center;

  .footer-link {
    color: #7a7a7a;
    font-family: 'Consolas', monospace;
    font-size: 12px;
    &:hover {
      color: #33ff33;
    }
  }
  .admin-setting {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    align-items: center;
  }
  :deep(.el-input__wrapper) {
    background: #141414;
    border: 1px solid #3a3a3a;
  }
  :deep(.el-input__inner) {
    color: #e8e8e8;
    font-family: 'Consolas', monospace;
  }
  :deep(.el-input-group__prepend) {
    background: #1c1c1c;
    border-color: #3a3a3a;
    color: #33ff33;
  }
}
.hack-mini-btn {
  background: #2eb82e !important;
  border-color: #2eb82e !important;
  color: #ffffff !important;
  font-family: 'Consolas', monospace;
  &:hover {
    background: #3ddc3d !important;
    color: #ffffff !important;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0 !important;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 60px;
}

.corner-info {
  position: absolute;
  bottom: 14px;
  left: 16px;
  z-index: 5;
  color: #33ff33;
  font-family: 'Consolas', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  opacity: 0.8;
}
</style>
