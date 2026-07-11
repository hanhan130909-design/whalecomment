# WhaleComment Backend — Render 部署指南

## 前置条件
- Render.com 账号（GitHub 一键登录）
- GitHub 仓库已推送：`hanhan130909-design/whalecomment`

## 部署步骤

### 1. 创建 Render Blueprint 部署

1. 打开 https://render.com
2. 登录 → Dashboard → **New** → **Blueprint**
3. Connect GitHub → 选择 `whalecomment` 仓库
4. Render 自动检测到 `render.yaml` → 显示预览
5. 点击 **Apply Blueprint**
6. Render 开始部署（约 2-3 分钟）

### 2. 配置环境变量（关键！）

在 Render Dashboard → `whalecomment-backend` → **Environment** 手动添加：

| Key | Value | 说明 |
|-----|-------|------|
| `SUPABASE_URL` | `https://sxsmjfkxllepntgzfqbl.supabase.co` | Supabase 项目地址 |
| `SUPABASE_SERVICE_KEY` | _(从 Supabase Dashboard 复制)_ | **注意：当前硬编码 key 是假值！** |
| `ARK_API_KEY` | _(可选)_ | 豆包 API（用于 AI 评论生成） |
| `ADMIN_TOKEN` | _(留空或填自定义)_ | 管理员密码，默认 `wc_admin_2026_secret_token` |

> ⚠️ **SUPABASE_SERVICE_KEY 重要提示**：
> 当前 server.js 里没有硬编码默认值（已清空），
> 真正的 Supabase Service Role Key 需要从：
> https://supabase.com/dashboard/project/sxsmjfkxllepntgzfqbl → Settings → API
> → `service_role` 密钥复制过来。

### 3. 获取新的 Backend URL

部署成功后，Render 给你一个 URL：
```
https://whalecomment-backend-xxxx.onrender.com
```

### 4. 更新 worker.js 指向新后端

拿到 Render URL 后，修改 `worker.js` 第 3 行：

```javascript
// 旧
var API = 'https://prolific-adventure-production-9b13.up.railway.app';

// 新
var API = 'https://whalecomment-backend-xxxx.onrender.com';
```

然后重新打 ZIP（参考下面的打包命令）。

### 5. 更新 Backend 分发版本号

同样更新 `backend/server.js` 中的 `CURRENT_VERSION` 和 `downloadUrl`。

---

## Render Free Plan 限制

- **每月 750 小时**（足够跑 1 个服务 24/7）
- 服务在 15 分钟无流量后休眠，冷启动约 30 秒
- 不影响 Worker：Worker 请求时 Render 会自动唤醒

---

## 快速验证

部署完成后测试：
```bash
curl https://whalecomment-backend-xxxx.onrender.com/api/version/latest
```

预期返回：
```json
{"version":"1.1.7","downloadUrl":"...","releaseNotes":[...],"forceUpdate":false}
```

---

## 如需修改代码

1. 修改 `backend/server.js`
2. Git push → Render **自动重新部署**
3. 无需手动操作

---

## 故障排除

**Q: Deploy 失败？**
→ 检查 Render 日志，常见错误：port 未设置（设为 10000）

**Q: /api/version/latest 返回 404？**
→ 服务可能还在冷启动，等 30 秒再试

**Q: Supabase 连接失败？**
→ 检查 SUPABASE_SERVICE_KEY 是否正确，需 Service Role Key 而非 anon key
