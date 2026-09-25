<p align="center">
    <img alt="logo" src="../imgs/小石榴.png" width="100" />
</p>
<h1 align="center" style="margin: 20px 30px 0px 30px; font-weight: bold;">XiaoShiLiu</h1>

---
<p align="center">
    <b>基於 Express + Vue 前後端分離仿小紅書項目</b>
</p>
<p align="center">
    <i>一個高仿小紅書的圖文社群項目，支援圖文發布、社交互動等核心功能，旨在提供從前端到後端的完整實踐範本</i>
</p>
<p align="center">
    <a href="https://www.shiliu.space">演示網站</a> · <a href="https://www.shiliu.space/doc">線上文件</a> · <a href="https://www.bilibili.com/video/BV1J4agztEBX/?spm_id_from=333.1387.homepage.video_card.click">影片介紹</a>
</p>
<p align="center">
    <a href="https://github.com/ZTMYO/XiaoShiLiu">簡體中文</a>|<a href="README_En.md">English</a>|<a href="README_zh-Hant.md">繁體中文</a>
</p>

<p align="center">
    <a href="https://github.com/ZTMYO/XiaoShiLiu/stargazers">
        <img src="https://img.shields.io/github/stars/ZTMYO/XiaoShiLiu?style=flat&logo=github&color=brightgreen&label=Stars">
    </a>
    <a href="https://github.com/ZTMYO/XiaoShiLiu/network/members">
        <img src="https://img.shields.io/github/forks/ZTMYO/XiaoShiLiu?style=round-square&color=brightgreen&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik01IDUuMzcydi44NzhjMCAuNDE0LjMzNi43NS43NS43NWg0LjVhLjc1Ljc1IDAgMCAwIC43NS0uNzV2LS44NzhhMi4yNSAyLjI1IDAgMSAxIDEuNSAwdi44NzhhMi4yNSAyLjI1IDAgMCAxLTIuMjUgMi4yNWgtMS41djIuMTI4YTIuMjUxIDIuMjUxIDAgMSAxLTEuNSAwVjguNWgtMS41QTIuMjUgMi4yNSAwIDAgMSAzLjUgNi4yNXYtLjg3OGEyLjI1IDIuMjUgMCAxIDEgMS41IDBaTTUgMy4yNWEuNzUuNzUgMCAxIDAtMS41IDAgLjc1Ljc1IDAgMCAwIDEuNSAwWm02Ljc1Ljc1YS43NS43NSAwIDEgMCAwLTEuNS43NS43NSAwIDAgMCAwIDEuNVptLTMgOC43NWEuNzUuNzUgMCAxIDAtMS41IDAgLjc1Ljc1IDAgMCAwIDEuNSAwWiI+PC9wYXRoPgo8L3N2Zz4=">
    </a>
    <a href="https://github.com/ZTMYO/XiaoShiLiu">
        <img src="https://img.shields.io/badge/XiaoShiLiu-v1.3.3-brightgreen.svg?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj4KPHBhdGggZD0iTTAgMCBDNC4yMzMwMTEyMSAyLjgyMjAwNzQ3IDcuMTcxNTk2NjQgNS45NTIyODk5MiA4LjgxMjUgMTAuODc1IEM5LjE4MDc2MjI0IDE2LjQ5MDk5OTE2IDkuMDI4MDYwMDcgMjAuMDUxNjU5ODkgNS44MTI1IDI0Ljg3NSBDMS44ODAxNjE5MSAyOC44NTAzMTQ0NiAtMS4zMzIwOTg0OSAzMC43NTMzMzQzMyAtNyAzMS4xMjUgQy0xMS43MTg5MjIyMyAzMS4wMzg1NzI4NSAtMTUuMjAxOTI2NjkgMjkuODM5MTA3NjUgLTE4LjYzMjgxMjUgMjYuNDQ1MzEyNSBDLTIyLjQ1Nzc0Mjg2IDIyLjA1MjEwNjc3IC0yMy41MDQ5MDc2NCAxOC43NDI5NTY4OSAtMjMuMzk4NDM3NSAxMi45Mjk2ODc1IEMtMjIuOTEyNTgwNTggOC4xOTcwODExNiAtMjAuNjcwMDc0MTQgNS4wOTQ1OTE5MSAtMTcuMTg3NSAyLjA2MjUgQy0xMS43NzQzMTUyMyAtMS44ODQ2MTM5IC02LjE5MjU0NDY4IC0yLjE4NTYwNDAxIDAgMCBaIE0tNy4xODc1IDQuODc1IEMtOC4xNzc1IDUuNTM1IC05LjE2NzUgNi4xOTUgLTEwLjE4NzUgNi44NzUgQy0xMC4xODc1IDcuNTM1IC0xMC4xODc1IDguMTk1IC0xMC4xODc1IDguODc1IEMtMTAuODA2MjUgOS4xNDMxMjUgLTExLjQyNSA5LjQxMTI1IC0xMi4wNjI1IDkuNjg3NSBDLTE0LjQ4NzAyMzMgMTAuODMwNTY4NDggLTE0LjQ4NzAyMzMgMTAuODMwNTY4NDggLTE2LjE4NzUgMTMuODc1IEMtMTYuNTc3NjM3MTYgMTUuODY0Njk5NSAtMTYuOTE5NTI2NDkgMTcuODY1MTk4NjkgLTE3LjE4NzUgMTkuODc1IEMtMTYuMTk3NSAyMC4zNyAtMTYuMTk3NSAyMC4zNyAtMTUuMTg3NSAyMC44NzUgQy0xNC40NjU5MDU3NiAyMi41MTg2MzEzNCAtMTMuNzkzOTg1NzkgMjQuMTg1NTAzODYgLTEzLjE4NzUgMjUuODc1IEMtMTIuNTI3NSAyNS44NzUgLTExLjg2NzUgMjUuODc1IC0xMS4xODc1IDI1Ljg3NSBDLTEwLjg1NzUgMjYuODY1IC0xMC41Mjc1IDI3Ljg1NSAtMTAuMTg3NSAyOC44NzUgQy05LjUyNzUgMjcuODg1IC04Ljg2NzUgMjYuODk1IC04LjE4NzUgMjUuODc1IEMtNi44Njc1IDI1Ljg3NSAtNS41NDc1IDI1Ljg3NSAtNC4xODc1IDI1Ljg3NSBDLTMuODU3NSAyNi44NjUgLTMuNTI3NSAyNy44NTUgLTMuMTg3NSAyOC44NzUgQy0zLjE4NzUgMjcuODg1IC0zLjE4NzUgMjYuODk1IC0zLjE4NzUgMjUuODc1IEMtMi4xOTc1IDI1LjU0NSAtMS4yMDc1IDI1LjIxNSAtMC4xODc1IDI0Ljg3NSBDMC40MDMyMDAxNCAyMi45Mjg5NjcyNiAwLjQwMzIwMDE0IDIyLjkyODk2NzI2IDAuODEyNSAyMC44NzUgQzEuNDcyNSAyMC4yMTUgMi4xMzI1IDE5LjU1NSAyLjgxMjUgMTguODc1IEMxLjU3OTU5MDMxIDEzLjExMDE4NTAyIDEuNTc5NTkwMzEgMTMuMTEwMTg1MDIgLTIuMTg3NSA4Ljg3NSBDLTIuODQ3NSA4Ljg3NSAtMy41MDc1IDguODc1IC00LjE4NzUgOC44NzUgQy00LjE4NzUgNy44ODUgLTQuMTg3NSA2Ljg5NSAtNC4xODc1IDUuODc1IEMtNS4xNzc1IDUuNTQ1IC02LjE2NzUgNS4yMTUgLTcuMTg3NSA0Ljg3NSBaIE0tMTguMTg3NSAxOS44NzUgQy0xOC4xODc1IDIyLjg3NSAtMTguMTg3NSAyMi44NzUgLTE4LjE4NzUgMjIuODc1IFogTTIuODEyNSAxOS44NzUgQzMuMTQyNSAyMC44NjUgMy40NzI1IDIxLjg1NSAzLjgxMjUgMjIuODc1IEMzLjgxMjUgMjEuODg1IDMuODEyNSAyMC44OTUgMy44MTI1IDE5Ljg3NSBDMy40ODI1IDE5Ljg3NSAzLjE1MjUgMTkuODc1IDIuODEyNSAxOS44NzUgWiAiIGZpbGw9IiNGQ0ZDRkMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIzLjE4NzUsMS4xMjUpIi8+CjxwYXRoIGQ9Ik0wIDAgQzIuMDYyNSAwLjQzNzUgMi4wNjI1IDAuNDM3NSA0IDEgQzQgMS45OSA0IDIuOTggNCA0IEM0Ljk5IDQuMzMgNS45OCA0LjY2IDcgNSBDMy43ODU0ODczMSA2LjYwNzI1NjM1IDAuNTYzODc0NjQgNi4wNTc0ODE4NSAtMyA2IEMtMS4xMjUgMS4xMjUgLTEuMTI1IDEuMTI1IDAgMCBaICIgZmlsbD0iI0U5RTlFOSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUsMjYpIi8+Cjwvc3ZnPgo=">
    </a>
    <a href="https://github.com/ZTMYO/XiaoShiLiu/blob/master/LICENSE">
        <img src="https://img.shields.io/github/license/ZTMYO/XiaoShiLiu?color=8ebc06">
    </a>
</p>
<p align="center">
    <img src="https://img.shields.io/static/v1?message=Vue&color=4f4f4f&logo=Vue.js&logoColor=4FC08D&label=">
    <img src="https://img.shields.io/static/v1?&message=JavaScript&color=4f4f4f&logo=JavaScript&logoColor=F7DF1E&label=">
</p>

> **聲明**  
> 本項目基於 [AGPL-3.0 協議](../../LICENSE)，免費開源，僅供學習交流，禁止轉賣，謹防受騙。如需商用請保留版權信息，確保合法合規使用，運營風險自負，與作者無關。

---

> 📁 前端位於 `vue3-project/`，後端位於 `express-project/`，詳見[項目結構文件](PROJECT_STRUCTURE_zh-Hant.md)。

## 項目展示

### PC端界面

<table>
  <tr>
    <td><img src="../imgs/1.png" alt="PC端界面1" width="300"/></td>
    <td><img src="../imgs/2.png" alt="PC端界面2" width="300"/></td>
    <td><img src="../imgs/3.png" alt="PC端界面3" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/4.png" alt="PC端界面4" width="300"/></td>
    <td><img src="../imgs/5.png" alt="PC端界面5" width="300"/></td>
    <td><img src="../imgs/6.png" alt="PC端界面6" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/7.png" alt="PC端界面7" width="300"/></td>
    <td><img src="../imgs/8.png" alt="PC端界面8" width="300"/></td>
    <td><img src="../imgs/9.png" alt="PC端界面9" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/10.png" alt="PC端界面10" width="300"/></td>
    <td><img src="../imgs/11.png" alt="PC端界面11" width="300"/></td>
    <td><img src="../imgs/12.png" alt="PC端界面12" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/13.png" alt="PC端界面13" width="300"/></td>
    <td><img src="../imgs/14.png" alt="PC端界面14" width="300"/></td>
    <td><img src="../imgs/15.png" alt="PC端界面15" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/16.png" alt="PC端界面16" width="300"/></td>
    <td><img src="../imgs/17.png" alt="PC端界面17" width="300"/></td>
    <td><img src="../imgs/18.png" alt="PC端界面18" width="300"/></td>
  </tr>
</table>

### 移動端界面

<table>
  <tr>
    <td><img src="../imgs/m1.png" alt="移動端界面1" width="200"/></td>
    <td><img src="../imgs/m2.png" alt="移動端界面2" width="200"/></td>
    <td><img src="../imgs/m3.png" alt="移動端界面3" width="200"/></td>
    <td><img src="../imgs/m4.png" alt="移動端界面4" width="200"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/m5.png" alt="移動端界面5" width="200"/></td>
    <td><img src="../imgs/m6.png" alt="移動端界面6" width="200"/></td>
    <td><img src="../imgs/m7.png" alt="移動端界面7" width="200"/></td>
    <td><img src="../imgs/m8.png" alt="移動端界面8" width="200"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/m9.png" alt="移動端界面9" width="200"/></td>
    <td><img src="../imgs/m10.png" alt="移動端界面10" width="200"/></td>
    <td><img src="../imgs/m11.png" alt="移動端界面11" width="200"/></td>
    <td><img src="../imgs/m12.png" alt="移動端界面12" width="200"/></td>
  </tr>
</table>

## 項目文件

| 文件 | 說明 |
|------|------|
| [部署指南](DEPLOYMENT_zh-Hant.md) | 部署配置和環境搭建說明 |
| [二次開發指南](DEVELOPER_GUIDE_zh-Hant.md) | 品牌改造、作者署名與開源協議義務說明 |
| [項目結構](PROJECT_STRUCTURE_zh-Hant.md) | 項目目錄結構架構說明 |
| [資料庫設計](DATABASE_DESIGN_zh-Hant.md) | 資料庫表結構設計文件 |
| [API接口文件](API_DOCS_zh-Hant.md) | 後端API接口說明和示例 |

## 項目亮點

- **工程化：** 環境配置、程式碼規範、建構與產物最佳化的完整流程
- **業務能力：** 鑑權流程、路由守衛、狀態管理與接口封裝
- **體驗優化：** 骨架屏、延遲載入、預載入、無障礙與響應式適配
- **元件與分層：** 可復用元件拆分、按領域分組與別名引入
- **後台管理：** 基礎CRUD、數據管理與配置面板，支援後續擴展權限與統計
- **快速部署：** 基於 Docker 的一鍵部署方案，支援多環境配置與自動化部署

## 技術棧

> 💡點擊可展開查看詳細內容
<details>
<summary><b>前端技術</b></summary>

- **Vue.js 3** - 前端框架（Composition API）
- **Vue Router 4** - 路由管理
- **Pinia** - 狀態管理
- **Vite** - 建構工具和開發伺服器
- **Axios** - HTTP用戶端
- **VueUse** - Vue組合式工具庫
- **CropperJS** - 圖片裁剪
- **Vue3 Emoji Picker** - 表情選擇器
- **svg-captcha** - 驗證碼產生器
</details>

<details>
<summary><b>後端技術</b></summary>

- **Node.js** - 執行環境
- **Express.js** - Web框架
- **MySQL** - 資料庫
- **JWT** - 身份驗證
- **Multer** - 文件上傳
- **bcrypt** - 密碼加密
- **CORS** - 跨域資源共享

</details>

## 第三方API
- **圖片儲存：** 灌裝的示例圖片來自 [栗次元圖床](https://t.alcy.cc/)，提供穩定的圖片儲存服務
- **圖片上傳：** 使用者上傳圖片使用了 [夏柔API](https://api.aa1.cn/doc/360tc.html)，確保圖片上傳的穩定性和速度
- **屬地查詢：** IP屬地查詢服務使用 [百度opendata](https://www.baidu.com/)，免費、無需密鑰，實現精準的IP屬地定位功能

## 環境要求

| 元件 | 版本要求 |
|------|----------|
| Node.js | >= 18.0.0 |
| MySQL | >= 5.7 |
| MariaDB | >= 10.3 |
| npm | >= 8.0.0 |
| yarn | >= 1.22.0 |
| 瀏覽器 | 支援 ES6+ |

> 上述為傳統本地開發的最低版本要求；Docker 部署的鏡像版本與前置條件見[部署指南](DEPLOYMENT_zh-Hant.md)。

## 快速開始

### 1. 環境配置

前後端各有一份 `.env`，從對應目錄的 `.env.example` 複製。後端 `express-project/.env` 至少確認以下四項：

```env
DB_PASSWORD=123456                      # 資料庫密碼
JWT_SECRET=xiaoshiliu_secret_key_2025   # JWT 金鑰，生產環境務必更換
API_BASE_URL=http://localhost:3001      # 後端對外存取地址
CORS_ORIGIN=http://localhost:5173       # 允許跨域的前端地址
```

前端 `vue3-project/.env` 只需確認 `VITE_API_BASE_URL` 指向後端 API（預設 `http://localhost:3001/api`）。

其餘變數（上傳策略、郵件、IP 屬地、違規詞檢測等）保持預設即可：完整列表見 [express-project/.env.example](../../express-project/.env.example) 與 [vue3-project/.env.example](../../vue3-project/.env.example)，各項含義見[部署指南](DEPLOYMENT_zh-Hant.md)。

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開發伺服器預設執行在 `http://localhost:5173`。

### 4. 建構生產版本

```bash
npm run build     # 建構到 dist/
npm run preview   # 本地預覽，預設 http://localhost:4173
```

## Star歷史

[![Star History Chart](https://api.star-history.com/svg?repos=ZTMYO/XiaoShiLiu&type=Date&theme=dark)](https://www.star-history.com/#ZTMYO/XiaoShiLiu&Date)

---

<div align="center">

Copyright © 2025 - **XiaoShiLiu**\
By ZTMYO\
Made with ❤️ & ⌨️

</div>
