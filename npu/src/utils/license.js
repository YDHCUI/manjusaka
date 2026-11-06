import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

// npc2 相关操作的前端授权检查 (npc1 基础功能不受限)
// 返回 true 放行; 无授权/过期时弹提示并返回 false
export function licenseAllowed() {
  const appStore = useAppStore()
  if (appStore.licenseValid) return true
  const msg = appStore.license.state === 'expired'
    ? '软件授权已过期，无法使用 NPC2 功能，请联系管理员续期'
    : '未找到有效授权，无法使用 NPC2 功能，请联系管理员获取 license'
  ElMessage.error(msg)
  return false
}
