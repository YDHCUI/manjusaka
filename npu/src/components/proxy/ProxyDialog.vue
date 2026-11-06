<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { proxyAdd } from '@/api/proxy'
import { agentList } from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, default: false },

  lockedId: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(props.modelValue)
watch(() => props.modelValue, (v) => (visible.value = v))
watch(visible, (v) => emit('update:modelValue', v))

const submitting = ref(false)
const tunnelType = ref('Socks5')
const agents = ref([])
const form = reactive({
  id: '',
  name: 'Socks5',
  local_port: 10086,
  remote_addr: '',
  username: 'buut',
  password: 'buut',
})

watch(visible, (v) => {
  if (!v) return
  tunnelType.value = 'Socks5'
  Object.assign(form, {
    id: props.lockedId || '',
    name: 'Socks5',
    local_port: 10086,
    remote_addr: '',
    username: 'buut',
    password: 'buut',
  })
  if (!props.lockedId) loadAgents()
})

async function loadAgents() {
  try {
    const res = await agentList()
    const all = (res && res.result) || []
    agents.value = all.filter((a) => a.npc2)
  } catch {

  }
}

function onTunnelTypeChange(val) {
  tunnelType.value = val
  form.name = val
}

async function submit() {
  if (!form.id || !form.local_port) {
    ElMessage.warning('请选择主机并填写本地端口')
    return
  }
  submitting.value = true
  try {
    const payload = {
      id: form.id,
      name: form.name || tunnelType.value,
      local_port: Number(form.local_port),
      remote_addr: tunnelType.value === 'Mapping' ? (form.remote_addr || null) : null,
      username: tunnelType.value === 'Socks5' ? (form.username || null) : null,
      password: tunnelType.value === 'Socks5' ? (form.password || null) : null,
    }
    await proxyAdd(payload)
    ElMessage.success('代理已启动')
    emit('success')
    visible.value = false
  } catch {

  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="新建隧道代理" width="520px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="选择主机" required>
        <el-select
          v-if="!lockedId"
          v-model="form.id"
          placeholder="选择在线主机"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="a in agents"
            :key="a.id"
            :label="`${a.username || '-'}@${a.intranet || '-'}`"
            :value="a.id"
          />
        </el-select>
        <el-input v-else :model-value="form.id" disabled />
      </el-form-item>
      <el-form-item label="隧道类型" required>
        <el-radio-group v-model="tunnelType" @change="onTunnelTypeChange">
          <el-radio-button value="Socks5">SOCKS5</el-radio-button>
          <el-radio-button value="Mapping">端口映射</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="本地端口" required>
        <el-input-number v-model="form.local_port" :min="1" :max="65535" controls-position="right" />
      </el-form-item>
      <el-form-item v-if="tunnelType === 'Mapping'" label="远程地址" required>
        <el-input v-model="form.remote_addr" placeholder="如: 127.0.0.1:3389" />
      </el-form-item>
      <template v-if="tunnelType === 'Socks5'">
        <el-form-item label="用户">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">启动</el-button>
    </template>
  </el-dialog>
</template>
