/**
 * 补丁: noVNC (@novnc/novnc)
 *
 * 1. package.json exports 仅声明了 "./core/rfb.js",
 *    Vite 在打包 noVNC 内部相对导入(如 ../vendor/pako/...)时会触发 commonjs resolver
 *    报错 "Package subpath 'undefined' is not defined by exports"。
 *    本脚本将 exports 改为允许内部 core/vendor 子路径访问的映射表。
 *
 * 2. core/util/browser.js 的 WebCodecs H.264 探测只检查了 'VideoDecoder' in window，
 *    部分 Chromium 套壳浏览器(360/QQ 等)存在残缺的 WebCodecs:
 *    VideoDecoder 存在但没有静态方法 isConfigSupported，
 *    导致顶层 await 抛 TypeError → AgentDetail 整个 chunk 加载失败。
 *    补丁: 增加 isConfigSupported 存在性检查 + 顶层调用兜底 catch 降级为 false。
 *
 * 通过 package.json 的 postinstall 钩子自动执行, 保证 npm install 后补丁不丢失。
 */
const fs = require('fs')
const path = require('path')

const novncDir = path.join(__dirname, '..', 'node_modules', '@novnc', 'novnc')
const pkgPath = path.join(novncDir, 'package.json')

if (!fs.existsSync(pkgPath)) {
  console.log('[patch-novnc] @novnc/novnc 未安装, 跳过')
  process.exit(0)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const desired = {
  '.': './core/rfb.js',
  './core/*': './core/*.js',
  './vendor/*': './vendor/*',
  './core/rfb.js': './core/rfb.js',
}

const current = pkg.exports
const same =
  current &&
  typeof current === 'object' &&
  Object.keys(desired).every((k) => current[k] === desired[k])

if (!same) {
  pkg.exports = desired
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log('[patch-novnc] 已修补 @novnc/novnc package.json exports')
} else {
  console.log('[patch-novnc] exports 已是目标结构, 跳过')
}

// ---- 补丁 2: browser.js WebCodecs 探测防御 ----
const browserPath = path.join(novncDir, 'core', 'util', 'browser.js')
if (fs.existsSync(browserPath)) {
  let src = fs.readFileSync(browserPath, 'utf8')
  if (src.includes("typeof VideoDecoder.isConfigSupported !== 'function'")) {
    console.log('[patch-novnc] browser.js WebCodecs 补丁已存在, 跳过')
  } else {
    const before = src
    // 1) 探测函数入口: 残缺 WebCodecs (无 isConfigSupported 静态方法) 直接判不支持
    src = src.replace(
      "if (!('VideoDecoder' in window)) {",
      "if (!('VideoDecoder' in window) || typeof VideoDecoder.isConfigSupported !== 'function') {",
    )
    // 2) 顶层调用兜底: 探测过程中任何异常都降级为 false, 不能让模块加载失败
    src = src.replace(
      'supportsWebCodecsH264Decode = await _checkWebCodecsH264DecodeSupport();',
      'supportsWebCodecsH264Decode = await _checkWebCodecsH264DecodeSupport().catch(function () { return false; });',
    )
    if (src !== before) {
      fs.writeFileSync(browserPath, src)
      console.log('[patch-novnc] 已修补 browser.js WebCodecs H.264 探测 (残缺实现降级)')
    } else {
      console.log('[patch-novnc] browser.js 结构与预期不符, 未打补丁 (请检查 noVNC 版本)')
    }
  }
} else {
  console.log('[patch-novnc] browser.js 不存在, 跳过 WebCodecs 补丁')
}
