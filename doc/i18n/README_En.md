<p align="center">
    <img alt="logo" src="../imgs/小石榴.png" width="100" />
</p>
<h1 align="center" style="margin: 20px 30px 0px 30px; font-weight: bold;">XiaoShiLiu</h1>

---
<p align="center">
    <b>Express + Vue Separation of Frontend and Backend Xiaohongshu Clone Project</b>
</p>
<p align="center">
    <i>A high-fidelity Xiaohongshu-style graphic community project supporting core features like graphic posting and social interaction, designed to provide a complete frontend-to-backend practice template</i>
</p>
<p align="center">
    <a href="https://www.shiliu.space">Demo Site</a> · <a href="https://www.bilibili.com/video/BV1J4agztEBX/?spm_id_from=333.1387.homepage.video_card.click">Video Introduction</a>
</p>
<p align="center">
    <a href="https://github.com/ZTMYO/XiaoShiLiu">简体中文</a>|<a href="README_En.md">English</a>|<a href="README_zh-Hant.md">繁體中文</a>
</p>

<p align="center">
    <a href="https://github.com/ZTMYO/XiaoShiLiu/stargazers">
        <img src="https://img.shields.io/github/stars/ZTMYO/XiaoShiLiu?style=flat&logo=github&color=brightgreen&label=Stars">
    </a>
    <a href="https://github.com/ZTMYO/XiaoShiLiu/network/members">
        <img src="https://img.shields.io/github/forks/ZTMYO/XiaoShiLiu?style=round-square&color=brightgreen&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik01IDUuMzcydi44NzhjMCAuNDE0LjMzNi43NS43NS43NWg0LjVhLjc1Ljc1IDAgMCAwIC43NS0uNzV2LS44NzhhMi4yNSAyLjI1IDAgMSAxIDEuNSAwdi44NzhhMi4yNSAyLjI1IDAgMCAxLTIuMjUgMi4yNWgtMS41djIuMTI4YTIuMjUxIDIuMjUxIDAgMSAxLTEuNSAwVjguNWgtMS41QTIuMjUgMi4yNSAwIDAgMSAzLjUgNi4yNXYtLjg3OGEyLjI1IDIuMjUgMCAxIDEgMS41IDBaTTUgMy4yNWEuNzUuNzUgMCAxIDAtMS41IDAgLjc1Ljc1IDAgMCAwIDEuNSAwWm02Ljc1Ljc1YS43NS43NSAwIDEgMCAwLTEuNS43NS43NSAwIDAgMCAwIDEuNVptLTMgOC43NWEuNzUuNzUgMCAxIDAtMS41IDAgLjc1Ljc1IDAgMCAwIDEuNSAwWiI+PC9wYXRoPgo8L3N2Zz4=">
    </a>
    <a href="https://github.com/ZTMYO/XiaoShiLiu">
        <img src="https://img.shields.io/badge/XiaoShiLiu-v1.3.2-brightgreen.svg?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj4KPHBhdGggZD0iTTAgMCBDNC4yMzMwMTEyMSAyLjgyMjAwNzQ3IDcuMTcxNTk2NjQgNS45NTIyODk5MiA4LjgxMjUgMTAuODc1IEM5LjE4MDc2MjI0IDE2LjQ5MDk5OTE2IDkuMDI4MDYwMDcgMjAuMDUxNjU5ODkgNS44MTI1IDI0Ljg3NSBDMS44ODAxNjE5MSAyOC44NTAzMTQ0NiAtMS4zMzIwOTg0OSAzMC43NTMzMzQzMyAtNyAzMS4xMjUgQy0xMS43MTg5MjIyMyAzMS4wMzg1NzI4NSAtMTUuMjAxOTI2NjkgMjkuODM5MTA3NjUgLTE4LjYzMjgxMjUgMjYuNDQ1MzEyNSBDLTIyLjQ1Nzc0Mjg2IDIyLjA1MjEwNjc3IC0yMy41MDQ5MDc2NCAxOC43NDI5NTY4OSAtMjMuMzk4NDM3NSAxMi45Mjk2ODc1IEMtMjIuOTEyNTgwNTggOC4xOTcwODExNiAtMjAuNjcwMDc0MTQgNS4wOTQ1OTE5MSAtMTcuMTg3NSAyLjA2MjUgQy0xMS43NzQzMTUyMyAtMS44ODQ2MTM5IC02LjE5MjU0NDY4IC0yLjE4NTYwNDAxIDAgMCBaIE0tNy4xODc1IDQuODc1IEMtOC4xNzc1IDUuNTM1IC05LjE2NzUgNi4xOTUgLTEwLjE4NzUgNi44NzUgQy0xMC4xODc1IDcuNTM1IC0xMC4xODc1IDguMTk1IC0xMC4xODc1IDguODc1IEMtMTAuODA2MjUgOS4xNDMxMjUgLTExLjQyNSA5LjQxMTI1IC0xMi4wNjI1IDkuNjg3NSBDLTE0LjQ4NzAyMzMgMTAuODMwNTY4NDggLTE0LjQ4NzAyMzMgMTAuODMwNTY4NDggLTE2LjE4NzUgMTMuODc1IEMtMTYuNTc3NjM3MTYgMTUuODY0Njk5NSAtMTYuOTE5NTI2NDkgMTcuODY1MTk4NjkgLTE3LjE4NzUgMTkuODc1IEMtMTYuMTk3NSAyMC4zNyAtMTYuMTk3NSAyMC4zNyAtMTUuMTg3NSAyMC44NzUgQy0xNC40NjU5MDU3NiAyMi41MTg2MzEzNCAtMTMuNzkzOTg1NzkgMjQuMTg1NTAzODYgLTEzLjE4NzUgMjUuODc1IEMtMTIuNTI3NSAyNS44NzUgLTExLjg2NzUgMjUuODc1IC0xMS4xODc1IDI1Ljg3NSBDLTEwLjg1NzUgMjYuODY1IC0xMC41Mjc1IDI3Ljg1NSAtMTAuMTg3NSAyOC44NzUgQy05LjUyNzUgMjcuODg1IC04Ljg2NzUgMjYuODk1IC04LjE4NzUgMjUuODc1IEMtNi44Njc1IDI1Ljg3NSAtNS41NDc1IDI1Ljg3NSAtNC4xODc1IDI1Ljg3NSBDLTMuODU3NSAyNi44NjUgLTMuNTI3NSAyNy44NTUgLTMuMTg3NSAyOC44NzUgQy0zLjE4NzUgMjcuODg1IC0zLjE4NzUgMjYuODk1IC0zLjE4NzUgMjUuODc1IEMtMi4xOTc1IDI1LjU0NSAtMS4yMDc1IDI1LjIxNSAtMC4xODc1IDI0Ljg3NSBDMC40MDMyMDAxNCAyMi45Mjg5NjcyNiAwLjQwMzIwMDE0IDIyLjkyODk2NzI2IDAuODEyNSAyMC44NzUgQzEuNDcyNSAyMC4yMTUgMi4xMzI1IDE5LjU1NSAyLjgxMjUgMTguODc1IEMxLjU3OTU5MDMxIDEzLjExMDE4NTAyIDEuNTc5NTkwMzEgMTMuMTEwMTg1MDIgLTIuMTg3NSA4Ljg3NSBDLTIuODQ3NSA4Ljg3NSAtMy41MDc1IDguODc1IC00LjE4NzUgOC44NzUgQy00LjE4NzUgNy44ODUgLTQuMTg3NSA2Ljg5NSAtNC4xODc1IDUuODc1IEMtNS4xNzc1IDUuNTQ1IC02LjE2NzUgNS4yMTUgLTcuMTg3NSA0Ljg3NSBaIE0tMTguMTg3NSAxOS44NzUgQy0xOC4xODc1IDIyLjg3NSAtMTguMTg3NSAyMi44NzUgLTE4LjE4NzUgMjIuODc1IFogTTIuODEyNSAxOS44NzUgQzMuMTQyNSAyMC44NjUgMy40NzI1IDIxLjg1NSAzLjgxMjUgMjIuODc1IEMzLjgxMjUgMjEuODg1IDMuODEyNSAyMC44OTUgMy44MTI1IDE5Ljg3NSBDMy40ODI1IDE5Ljg3NSAzLjE1MjUgMTkuODc1IDIuODEyNSAxOS44NzUgWiAiIGZpbGw9IiNGQ0ZDRkMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIzLjE4NzUsMS4xMjUpIi8+CjxwYXRoIGQ9Ik0wIDAgQzIuMDYyNSAwLjQzNzUgMi4wNjI1IDAuNDM3NSA0IDEgQzQgMS45OSA0IDIuOTggNCA0IEM0Ljk5IDQuMzMgNS45OCA0LjY2IDcgNSBDMy43ODU0ODczMSA2LjYwNzI1NjM1IDAuNTYzODc0NjQgNi4wNTc0ODE4NSAtMyA2IEMtMS4xMjUgMS4xMjUgLTEuMTI1IDEuMTI1IDAgMCBaICIgZmlsbD0iI0U5RTlFOSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUsMjYpIi8+Cjwvc3ZnPgo=">
    </a>
    <a href="https://github.com/ZTMYO/XiaoShiLiu/blob/master/LICENSE">
        <img src="https://img.shields.io/github/license/ZTMYO/XiaoShiLiu?color=8ebc06">
    </a>
</p>
<p align="center">
    <img src="https://img.shields.io/static/v1?message=Vue&color=4f4f4f&logo=Vue.js&logoColor=4FC08D&label=">
    <img src="https://img.shields.io/static/v1?&message=JavaScript&color=4f4f4f&logo=JavaScript&logoColor=F7DF1E&label=">
</p>

> **Disclaimer**  
> This project is licensed under the [GPLv3 License](../../LICENSE), free and open-source, for learning and communication purposes only. Resale is prohibited; please beware of scams. For commercial use, retain copyright information to ensure legal compliance. Operational risks shall be borne by the user, and the author is not liable.

---

> 📁 The frontend lives in `vue3-project/` and the backend in `express-project/`; see the [Project Structure Document](PROJECT_STRUCTURE_En.md).

## Project Demonstration

### PC Interface

<table>
  <tr>
    <td><img src="../imgs/1.png" alt="PC Interface 1" width="300"/></td>
    <td><img src="../imgs/2.png" alt="PC Interface 2" width="300"/></td>
    <td><img src="../imgs/3.png" alt="PC Interface 3" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/4.png" alt="PC Interface 4" width="300"/></td>
    <td><img src="../imgs/5.png" alt="PC Interface 5" width="300"/></td>
    <td><img src="../imgs/6.png" alt="PC Interface 6" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/7.png" alt="PC Interface 7" width="300"/></td>
    <td><img src="../imgs/8.png" alt="PC Interface 8" width="300"/></td>
    <td><img src="../imgs/9.png" alt="PC Interface 9" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/10.png" alt="PC Interface 10" width="300"/></td>
    <td><img src="../imgs/11.png" alt="PC Interface 11" width="300"/></td>
    <td><img src="../imgs/12.png" alt="PC Interface 12" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/13.png" alt="PC Interface 13" width="300"/></td>
    <td><img src="../imgs/14.png" alt="PC Interface 14" width="300"/></td>
    <td><img src="../imgs/15.png" alt="PC Interface 15" width="300"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/16.png" alt="PC Interface 16" width="300"/></td>
    <td><img src="../imgs/17.png" alt="PC Interface 17" width="300"/></td>
    <td><img src="../imgs/18.png" alt="PC Interface 18" width="300"/></td>
  </tr>
</table>

### Mobile Interface

<table>
  <tr>
    <td><img src="../imgs/m1.png" alt="Mobile Interface 1" width="200"/></td>
    <td><img src="../imgs/m2.png" alt="Mobile Interface 2" width="200"/></td>
    <td><img src="../imgs/m3.png" alt="Mobile Interface 3" width="200"/></td>
    <td><img src="../imgs/m4.png" alt="Mobile Interface 4" width="200"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/m5.png" alt="Mobile Interface 5" width="200"/></td>
    <td><img src="../imgs/m6.png" alt="Mobile Interface 6" width="200"/></td>
    <td><img src="../imgs/m7.png" alt="Mobile Interface 7" width="200"/></td>
    <td><img src="../imgs/m8.png" alt="Mobile Interface 8" width="200"/></td>
  </tr>
  <tr>
    <td><img src="../imgs/m9.png" alt="Mobile Interface 9" width="200"/></td>
    <td><img src="../imgs/m10.png" alt="Mobile Interface 10" width="200"/></td>
    <td><img src="../imgs/m11.png" alt="Mobile Interface 11" width="200"/></td>
    <td><img src="../imgs/m12.png" alt="Mobile Interface 12" width="200"/></td>
  </tr>
</table>

## Project Documents

| Document | Description |
|----------|-------------|
| [Deployment Guide](DEPLOYMENT_En.md) | Deployment configuration and environment setup instructions |
| [Project Structure](PROJECT_STRUCTURE_En.md) | Project directory structure and architecture explanation |
| [Database Design](DATABASE_DESIGN_En.md) | Database table structure design document |
| [API Docs](API_DOCS_En.md) | Backend API interface description and examples |

## Project Highlights

- **Engineering Practice**: Complete workflow of environment configuration, code standards, building, and product optimization
- **Business Capabilities**: Authentication flow, route guards, state management, and interface encapsulation
- **Experience Optimization**: Skeleton screens, lazy loading, preloading, accessibility, and responsive adaptation
- **Component & Layering**: Reusable component splitting, domain-based grouping, and alias introduction
- **Backend Management**: Basic CRUD, data management, configuration panel, supporting subsequent permission and statistics expansion
- **Quick Deployment**: Docker-based one-click deployment solution, supporting multi-environment configuration and automated deployment

## Technology Stack

> 💡 Click to expand for details
<details>
<summary><b>Frontend Technology</b></summary>

- **Vue.js 3** - Frontend framework (Composition API)
- **Vue Router 4** - Routing management
- **Pinia** - State management
- **Vite** - Build tool and development server
- **Axios** - HTTP client
- **VueUse** - Vue composable utility library
- **CropperJS** - Image cropping tool
- **Vue3 Emoji Picker** - Emoji selector
- **svg-captcha** - CAPTCHA generator
</details>

<details>
<summary><b>Backend Technology</b></summary>

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Identity authentication
- **Multer** - File upload handling
- **bcrypt** - Password encryption
- **CORS** - Cross-origin resource sharing

</details>

## Third-Party APIs
- **Image Storage**: Sample images are from [Liciyuan Image Hosting](https://t.alcy.cc/), providing stable image storage service
- **Image Upload**: User-uploaded images use [Xiarou API](https://api.aa1.cn/doc/360tc.html) to ensure stability and speed
- **IP Location Query**: IP location service uses [Pear API](https://api.pearktrue.cn/console/detail?id=290) for accurate IP positioning

## Environment Requirements

| Component | Version Requirement |
|-----------|---------------------|
| Node.js | >= 18.0.0 |
| MySQL | >= 5.7 |
| MariaDB | >= 10.3 |
| npm | >= 8.0.0 |
| yarn | >= 1.22.0 |
| Browser | ES6+ supported |

> The above are the minimum version requirements for traditional local development; Docker image versions and prerequisites are covered in the [Deployment Guide](DEPLOYMENT_En.md).

## Quick Start

### 1. Environment Configuration

Both the frontend and backend have their own `.env`, copied from the `.env.example` in the corresponding directory. In the backend `express-project/.env`, confirm at least these four items:

```env
DB_PASSWORD=123456                      # Database password
JWT_SECRET=xiaoshiliu_secret_key_2025   # JWT secret; be sure to change it in production
API_BASE_URL=http://localhost:3001      # Backend public access address
CORS_ORIGIN=http://localhost:5173       # Frontend address allowed for CORS
```

The frontend `vue3-project/.env` only needs `VITE_API_BASE_URL` pointing to the backend API (defaults to `http://localhost:3001/api`).

All other variables (upload strategy, email, IP location, sensitive word detection, etc.) can keep their defaults: see [express-project/.env.example](../../express-project/.env.example) and [vue3-project/.env.example](../../vue3-project/.env.example) for the complete list, and the [Deployment Guide](DEPLOYMENT_En.md) for what each item means.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The development server runs at `http://localhost:5173`.

### 4. Build Production

```bash
npm run build     # Build to dist/
npm run preview   # Local preview, defaults to http://localhost:4173
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ZTMYO/XiaoShiLiu&type=Date&theme=dark)](https://www.star-history.com/#ZTMYO/XiaoShiLiu&Date)

---

<div align="center">

Copyright © 2025 - **XiaoShiLiu**\
By ZTMYO\
Made with ❤️ & ⌨️

</div>
