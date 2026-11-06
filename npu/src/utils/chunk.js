// ---------------------------------------------------------------------------
// fr 分段元信息解析（大文件分段读取）
// ---------------------------------------------------------------------------
//
// agent 按 ≤100MB 分段回传文件，分片元信息放在 Action.args，分号分隔的 k=v：
//
//   v=1;uid=<上传id>;i=<段序号>;o=<段偏移>;n=<本段长度>;t=<文件总长>;l=<0|1>
//
// 服务端按 o= 偏移把每段写入同一个文件，因此分片乱序/重传都安全；
// 浏览器侧只用来展示文件总长度（内容不再下发到前端）。
// ---------------------------------------------------------------------------

export function parseChunkArgs(args) {
  if (typeof args !== 'string' || !args.startsWith('v=1;')) return null
  const out = { uid: '', idx: 0, off: 0, len: 0, total: 0, last: false }
  for (const kv of args.split(';')) {
    const i = kv.indexOf('=')
    if (i <= 0) continue
    const k = kv.slice(0, i)
    const v = kv.slice(i + 1)
    if (k === 'uid') out.uid = v
    else if (k === 'i') out.idx = Number(v) || 0
    else if (k === 'o') out.off = Number(v) || 0
    else if (k === 'n') out.len = Number(v) || 0
    else if (k === 't') out.total = Number(v) || 0
    else if (k === 'l') out.last = v === '1'
  }
  return out.uid ? out : null
}
