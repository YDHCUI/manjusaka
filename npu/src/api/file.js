import http from './index.js'

export function fileList(params = {}) {
  return http.post('/filelist', params)
}

export function uploadedFileList(params = {}) {
  return http.post('/ufilelist', params)
}

export function fileDelete(id) {
  return http.post('/filedelete', { id })
}

export function fileUploadPath() {
  return '/fileupload'
}

// ---- S3 云存储 (敏感文件上传 tab, 走全局 s3.* 配置) ----

// 当前存储模式: { storagetype: 'local' | 's3' }
export function fileStorage() {
  return http.get('/filestorage')
}

export function s3FileList(params = {}) {
  return http.post('/s3list', params)
}

export function s3FileDelete(key) {
  return http.post('/s3delete', { key })
}

export function s3FileRename(from, to) {
  return http.post('/s3rename', { from, to })
}

export function s3FileUploadPath() {
  return '/s3upload'
}

export function s3FileDownloadUrl(key) {
  return `${http.defaults.baseURL}/s3download?key=${encodeURIComponent(key)}`
}
