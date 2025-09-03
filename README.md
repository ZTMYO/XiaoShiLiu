

<p align="center">
  <img alt="logo" src="./doc/imgs/小石榴.png" width="100"/>
</p>
<h1 align="center" style="margin: 20px 0 30px; font-weight: bold;">XiaoShiLiu</h1>
<p align="center">
  <b>基于 Express + Vue 前后端分离仿小红书项目</b>
</p>
<p align="center">
  <i>一个高仿小红书的图文社区项目，支持图文发布、社交互动等核心功能，旨在提供从前端到后端的完整实践范本</i>
</p>



> **声明**  
> 本项目基于 MIT 协议，免费开源，仅供学习交流，禁止转卖，谨防受骗。如需商用请保留版权信息，确保合法合规使用，运营风险自负，与作者无关。

---

> 📁 **项目结构说明**：本项目包含完整的前后端代码，前端位于 `vue3-project/` 目录，后端位于 `express-project/` 目录。详细结构请查看 [项目结构文档](./doc/PROJECT_STRUCTURE.md)。
## 演示站点

🌐 **在线体验**: [www.shiliu.space](https://www.shiliu.space)

## 项目展示

### PC端界面

<table>
  <tr>
    <td><img src="./doc/imgs/1.png" alt="PC端界面1" width="300"/></td>
    <td><img src="./doc/imgs/2.png" alt="PC端界面2" width="300"/></td>
    <td><img src="./doc/imgs/3.png" alt="PC端界面3" width="300"/></td>
  </tr>
  <tr>
    <td><img src="./doc/imgs/4.png" alt="PC端界面4" width="300"/></td>
    <td><img src="./doc/imgs/5.png" alt="PC端界面5" width="300"/></td>
    <td><img src="./doc/imgs/6.png" alt="PC端界面6" width="300"/></td>
  </tr>
  <tr>
    <td><img src="./doc/imgs/7.png" alt="PC端界面7" width="300"/></td>
    <td><img src="./doc/imgs/8.png" alt="PC端界面8" width="300"/></td>
    <td><img src="./doc/imgs/9.png" alt="PC端界面9" width="300"/></td>
  </tr>
    <tr>
    <td><img src="./doc/imgs/10.png" alt="PC端界面7" width="300"/></td>
    <td><img src="./doc/imgs/11.png" alt="PC端界面8" width="300"/></td>
    <td><img src="./doc/imgs/12.png" alt="PC端界面9" width="300"/></td>
  </tr>
</table>


### 移动端界面

<table>
  <tr>
    <td><img src="./doc/imgs/m1.png" alt="移动端界面1" width="200"/></td>
    <td><img src="./doc/imgs/m2.png" alt="移动端界面2" width="200"/></td>
    <td><img src="./doc/imgs/m3.png" alt="移动端界面3" width="200"/></td>
    <td><img src="./doc/imgs/m4.png" alt="移动端界面4" width="200"/></td>
  </tr>
  <tr>
    <td><img src="./doc/imgs/m5.png" alt="移动端界面5" width="200"/></td>
    <td><img src="./doc/imgs/m6.png" alt="移动端界面6" width="200"/></td>
    <td><img src="./doc/imgs/m7.png" alt="移动端界面7" width="200"/></td>
    <td><img src="./doc/imgs/m8.png" alt="移动端界面8" width="200"/></td>
  </tr>
</table>
## 项目文档

| 文档 | 说明 |
|------|------|
| [部署指南](./doc/DEPLOYMENT.md) | 部署配置和环境搭建说明 |
| [项目结构](./doc/PROJECT_STRUCTURE.md) | 项目目录结构架构说明 |
| [数据库设计](./doc/DATABASE_DESIGN.md) | 数据库表结构设计文档 |
| [API接口文档](./doc/API_DOCS.md) | 后端API接口说明和示例 |

## 项目亮点

- **工程化：** 环境配置、代码规范、构建与产物优化的完整流程
- **业务能力：** 鉴权流程、路由守卫、状态管理与接口封装
- **体验优化：** 骨架屏、懒加载、预加载、无障碍与响应式适配
- **组件与分层：** 可复用组件拆分、按领域分组与别名引入
- **后台管理：** 基础CRUD、数据管理与配置面板，支持后续扩展权限与统计

## 技术栈

> 💡点击可展开查看详细内容
<details>
<summary><b>前端技术</b></summary>

- **Vue.js 3** - 前端框架（Composition API）
- **Vue Router 4** - 路由管理
- **Pinia** - 状态管理
- **Vite** - 构建工具和开发服务器
- **Axios** - HTTP客户端
- **VueUse** - Vue组合式工具库
- **CropperJS** - 图片裁剪
- **Vue3 Emoji Picker** - 表情选择器

</details>

<details>
<summary><b>后端技术</b></summary>

- **Node.js** - 运行环境
- **Express.js** - Web框架
- **MySQL** - 数据库
- **JWT** - 身份认证
- **Multer** - 文件上传
- **bcrypt** - 密码加密
- **CORS** - 跨域资源共享

</details>



#### 第三方API
- **图片存储：** 灌装的示例图片来自 [栗次元图床](https://t.alcy.cc/)，提供稳定的图片存储服务
- **图片上传：** 用户上传图片使用了 [夏柔API](https://api.aa1.cn/doc/xinyew_jdtc.html)，确保图片上传的稳定性和速度
- **属地查询：** IP属地查询服务使用 [保罗API](https://api.pearktrue.cn/dashboard/detail/290)，实现精准的IP属地定位功能


### 环境要求

| 组件 | 版本要求 |
|------|----------|
| Node.js | >= 16.0.0 |
| MySQL | >= 5.7 |
| MariaDB | >= 10.3 |
| npm | >= 8.0.0 |
| yarn | >= 1.22.0 |
| 浏览器 | 支持ES6+ |

### 1. 安装依赖

```bash
# 使用 cnpm或npm
cnpm install
# 或使用 yarn
yarn install
```

### 2. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或使用 yarn
yarn dev
```

开发服务器将在 `http://localhost:5173` 启动

### 3. 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

> ⚠️ **重要提醒**：前端项目需要配合后端服务使用，详细配置请查看 [部署指南](./doc/DEPLOYMENT.md)

## 作者

**@ZTMYO**
- GitHub: [https://github.com/ZTMYO](https://github.com/ZTMYO)

