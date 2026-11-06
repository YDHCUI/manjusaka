import { ElMessage } from 'element-plus'

export async function copyToClipboard(text, silent = false) {
  const str = text == null ? '' : String(text)

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(str)
      if (!silent) ElMessage.success('已复制')
      return true
    }
  } catch {

  }

  try {
    const ta = document.createElement('textarea')
    ta.value = str
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.left = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    if (ok) {
      if (!silent) ElMessage.success('已复制')
      return true
    }
  } catch {

  }
  if (!silent) ElMessage.warning('复制失败，请手动选择')
  return false
}
