# 线上演示站部署（production profile）

同一套代码，线上只通过 `.env` 关闭高级能力：

```env
DEPLOY_PROFILE=online
NODE_ENV=production
TRUST_PROXY=true
CORS_ORIGIN=https://shiliu.space,https://www.shiliu.space,http://localhost:5173,http://localhost:5174
FEATURE_ADMIN_WRITE=false
FEATURE_USER_UPLOAD=false
FEATURE_VIDEO_UPLOAD=false
FEATURE_RAG=false
FEATURE_SEMANTIC_SEARCH=false
FEATURE_QA=false
FEATURE_SEMANTIC_MODERATION=false
FEATURE_AI_CONTENT=false
```

前端构建（`.env.production`）：

```env
VITE_SHOW_USER_AGENT=false
VITE_SHOW_GITHUB_BADGES=true
VITE_FEATURE_USER_UPLOAD=false
VITE_FEATURE_VIDEO_UPLOAD=false
```

部署流程：主仓库 `master` 合并到 `production` → 服务器拉 `production` → `npm ci` → 前端 `npm run build` → 重启后端。`.env` 只留在服务器，不进仓库。

> 原先的 `nginx.conf`、`deploy-backend.ps1`、`deploy-frontend.ps1` 包含服务器 IP 和密钥路径，已移到本地私有 `backup/online-ops/deploy/`；本目录只保留脱敏示例。
