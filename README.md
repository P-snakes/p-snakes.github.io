# 原神成就达成率

公开前端。React + GitHub Pages。问卷：周年拾光册。同名成就合并，每项最多收集 300 条记录。

本地：`pnpm install`、`pnpm dev`。后端在独立私有仓库运行于 8787 端口。

部署：仓库变量 `API_URL` 设置为 Cloudflare Worker 地址，`TURNSTILE_SITE_KEY` 设置为公开 Site Key；Pages 来源选择 GitHub Actions。验证：`pnpm test`、`pnpm build`。

所有查询读取 `public/snapshot.json` 和 `public/records/`；后端每 5 分钟同步，再由 Actions 发布。记录按数据值分组，本地分页；后台停用时仍能查询已有快照。同一浏览器每天对每个成就只上报一次浏览。凭证默认不加载，开启缩略图和每次打开原图都需 Turnstile 验证。
