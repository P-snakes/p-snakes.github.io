# 长理 WebVPN 链接转换

<https://p-snakes.github.io/> · 长沙理工大学 WebVPN 网址转换器。

在浏览器中将 HTTP / HTTPS 网址转换为学校网关链接。可复制、打开、按名称收藏，或开启转换后自动跳转。访问资源时由学校网关处理登录。收藏、最近转换和跳转偏好使用本站 Cookie，保留期为各自最后一次写入后一年。收藏空间满时提示，历史记录按空间保留最近条目。

在首页或 [跳转页](https://p-snakes.github.io/go/) 点击常用页面即可访问，也可在站点域名后直接输入缩写。学校首页用 `/sy`，大物实验用 `/dwsy`，教务选课用 `/xk`，图书馆用 `/tsg`，办事大厅用 `/bsdt`，网络教学平台用 `/wljx`。

## 转换格式

地址栏直达支持把原网址拼在站点根地址后，例如 <https://p-snakes.github.io/https://www.csust.edu.cn/>。打开后会立即跳到学校 WebVPN，同时记入转换记录。原网址自带的路径、端口、查询和片段均会保留。省略协议时默认使用 HTTPS。GitHub Pages 通过 `site/404.html` 处理这些动态路径。

Android 应用 [changli-planet-app](https://github.com/CreaMakers/changli-planet-app) 使用的 CSUSTDataGet 1.1.9 在 [PhysicsLabConfig.kt](https://github.com/CreaMakers/CSUSTDataGet/blob/33096286ea225c78fa6582fcfca8ee77ee32cec6/csust_spider/src/main/java/com/dcelysia/csust_spider/physicsexperiment/data/remote/PhysicsLabConfig.kt) 中保存物理实验平台的固定 token。通用转换移植自 [CSUSTKit 的 WebVPNUtils.swift](https://github.com/zHElEARN/CSUSTKit/blob/bc6f0f287b129b5a76c548c13324be03c3b24eb0/Sources/CSUSTKit/Utils/WebVPN/WebVPNUtils.swift)，对应授权见 [LICENSE-CSUSTKit.txt](site/LICENSE-CSUSTKit.txt)。

Web Crypto 在浏览器内加密主机名和显式端口，保留路径、查询及片段。测试覆盖学校官网的上游测试向量及 Android 依赖内的物理实验平台地址。

## 本地运行

用 Node.js 22 或更新版本执行 `node --test tests/*.test.mjs`。预览时先执行 `node scripts/prepare-shortcuts.mjs` 生成缩写入口，再执行 `python3 -m http.server 8000 --directory dist`，然后打开 <http://localhost:8000/>。GitHub Pages 发布 `dist/` 目录。
