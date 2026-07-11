# WhaleComment v1.1.4 — 导航误操修复

**日期**: 2026-07-10
**问题**: Worker 跳到金主主页后，点到推荐流/侧边栏里主播（登录用户）自己的视频，导致评论+点赞都打在主播自己身上。

## 根因
1. `page.goto` 跳到金主主页后，若 TikTok 重定向回登录用户主页（主播），`isProfile` 判断仍为真，继续点视频。
2. 点击选择器 `a[href*="/video/"]` 太宽泛，匹配到页面上任何 `/video/` 链接（含推荐/侧边栏里主播自己的视频），不一定是金主本人的视频。

## 修复（worker.js）
- 导航后验证确实落在 `https://www.tiktok.com/@<金主用户名>` 主页；若被重定向（/login 或回主播主页），标记 failed 并跳过。
- 点击视频时只选 `a[href*="/@<金主用户名>/video/"]` 链接（金主本人视频）。
- 点击后二次校验确实在金主视频页 `.../@<金主用户名>/video/...`，否则标记 failed 跳过。
- `hasVideos()` 里的宽泛选择器保留（仅用于"是否有视频"检测，不参与点击，安全）。

## 构建与分发
- asar 手动提取→替换 worker.js→重新打包（19.97 MB，含 31981 字节 worker.js，旧版 28944）。
- `WhaleComment-1.1.4-Portable.zip`（124.4 MB）打包自 `release/win-unpacked`。
- GitHub Release v1.1.4 创建并上传 zip：`https://github.com/hanhan130909-design/whalecomment/releases/tag/v1.1.4`
- `download.html` + `share-download.ps1` 更新到 1.1.4。
- 后端 `CURRENT_VERSION` → 1.1.4，部署 Railway 成功（/api/version/latest 返回 1.1.4）。
- worker.js + package.json 已 push 到 GitHub master（46682fc）。

## 运营使用流程
1. 下载 v1.1.4 zip → 解压 → 运行 WhaleComment.exe
2. Host ID: 自己的 TikTok 用户名（如 rachelliyagtha03）
3. Host Token: 从 admin.html 复制的完整 operator token（必须完整，如 wc_op_02ecc9c1...b5c5c5）
4. Start → 扫码登录 → 自动执行（现在只评论/点赞金主本人视频）

## 待办
- Railway 余额 $2.93，服务随时可能停，需充值或迁移。
- 构建产物目录 `release/`、`tmp_asar_114/` 已加入 .gitignore。
