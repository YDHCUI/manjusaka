import http from './index.js'

// 插件库 (方案A: 元数据入库, 文件留盘 plugins/)
// filename 即磁盘文件名 (name.os.arch.type 约定), 是插件的唯一标识

export function pluginList(keyword) {
  return http.post('/pluginlist', { keyword: keyword || undefined })
}

export function pluginInfo(filename) {
  return http.post('/plugininfo', { filename })
}

// formData: file(二进制, 文件名须为 name.platform.arch.type) + 可选文本字段 description/args/entry
export function pluginUpload(formData) {
  return http.post('/pluginupload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 编辑元数据: { filename, description?, plugargs?, plugentry?, enabled? }
export function pluginUpdate(data) {
  return http.post('/pluginupdate', data)
}

export function pluginDelete(filename) {
  return http.post('/plugindelete', { filename })
}
