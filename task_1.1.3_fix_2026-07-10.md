# WhaleComment v1.1.3 修复总结

## 问题
- **main.js `getUnpackedWorkerPath()` 路径错误**：新构建的 asar 里 worker.js 在 asar 内部（不是 `asar.unpacked`），但代码错误拼了 `app.asar\app.asar.unpacked\worker.js`
- **puppeteer-core 未打包**：只在 devDependencies 里，构建 asar 时没打进去

## 修复
1. **main.js 路径逻辑**：`getUnpackedWorkerPath()` → `getWorkerPath()`，优先用 `app.asar` 内的 worker.js
2. **添加 puppeteer-core 到 dependencies**（不是 devDependencies）
3. **重新构建 asar**（19 MB，含 node_modules）

## 发布结果

| 渠道 | 状态 |
|------|------|
| 本地 zip | ✅ `WhaleComment-1.1.3-Portable.zip` (124 MB) |
| GitHub Release v1.1.3 | ✅ `WhaleComment-1.1.3-Portable.zip` 上传成功 |
| Railway 后端版本 | ✅ v1.1.3，downloadUrl 指向 GitHub |
| 下载页 | ✅ `/tools/download.html` 更新 |
| CI macOS | ❌ 网络问题无法下载 artifact（本地已备 zip） |

## GitHub Release
- **URL**: https://github.com/hanhan130909-design/whalecomment/releases/tag/v1.1.3
- **Asset**: WhaleComment-1.1.3-Portable.zip (130 MB)
- **wc_profile.zip**: 在 v1.1.2 release

## 下一步
- Adam 测试 v1.1.3：关闭旧 App，运行新 exe 扫码登录
- CI macOS 构建问题：artifact 下载网络超时，考虑本地构建 macOS 版本
