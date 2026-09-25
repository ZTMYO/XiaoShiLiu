# 二次开发指南

本文面向想把小石榴图文社区改造成自己项目的人，讲清楚三件事：**必须改的品牌元素、必须遵守的开源协议、可以按需裁剪的功能**。

环境搭建、参数含义、上线配置等内容不在这里，请先阅读[部署指南](DEPLOYMENT.md)。两篇文档的分工如下：

| 文档 | 负责内容 |
|------|----------|
| [部署指南](DEPLOYMENT.md) | 环境准备、Docker/传统部署、上传与邮件等参数配置、OSS 控制台操作、上线检查 |
| 二次开发指南（本文） | 品牌元素替换、关于页与作者署名、AGPL-3.0 协议义务、第三方资源授权、功能裁剪 |

> 💡 建议流程：先按本文完成品牌与协议层面的改造，再按部署指南完成环境配置与上线。

---

## 一、开源协议与法律义务

仓库根目录的 `LICENSE` 为 **GNU Affero General Public License v3.0（AGPL-3.0）** 全文。它与常见的 GPLv3 最大区别在于**第 13 条**：只要你的修改版通过网络对外提供服务，就必须向使用者提供获取其完整对应源码的方式。Web 社区类项目正是典型场景，因此这条对二次开发者最需要注意。

二次开发时你需要履行：

- **保留版权声明**：不得删除或修改源码中的版权声明、作者署名与协议文本（`LICENSE` 与各文件头部的协议注释）。
- **修改版同样以 AGPL-3.0 开源**：你基于本项目改造后的代码，整体也必须以 AGPL-3.0 对外提供。
- **网络交互提供源码（第 13 条）**：站点上线后，应在页面上提供明显入口（如页脚链接），让访问者能下载到你所部署版本的完整源码。
- **注明修改**：建议在关于页或页脚标注"本项目基于小石榴图文社区二次开发"，并附上原仓库地址。

> ⚠️ 本项目为学习交流用途，作者不对二次开发的运营风险与合规问题负责。商业使用前请自行确认法律与平台合规要求。

---

## 二、品牌元素改造清单

下面按类别列出所有带有"小石榴"品牌信息的资源。改名、换图时建议逐项核对，避免遗漏。

### 2.1 站点名称与标题

| 位置 | 内容 | 说明 |
|------|------|------|
| `vue3-project/index.html` | `<title>小石榴 - 你的校园图文部落</title>` | 浏览器标签标题 |
| `vue3-project/public/manifest.json` | `name`、`short_name`、`description`、`theme_color` | PWA 应用名称、描述与主题色 |
| `vue3-project/.env.example` | `VITE_APP_TITLE=小石榴图文社区` | 应用标题变量 |
| `vue3-project/package.json` | `description`、`author` | 前端包信息 |
| `express-project/package.json` | `description`、`author` | 后端包信息 |
| `express-project/config/config.js` | 站点相关默认值 | 后端默认站点信息 |
| `express-project/utils/email.js` | 邮件主题与正文标题 | 见 2.5 |

### 2.2 图片资源（`vue3-project/src/assets/imgs/`）

| 文件 | 用途 | 引用范围 |
|------|------|----------|
| `小石榴.png` | 站点 Logo，含小石榴元素 | 关于页、顶部导航、搜索页、管理后台登录页与布局 |
| `avatar.png` | 默认头像（无头像时的兜底） | 大量用户、评论、通知相关组件 |
| `未加载.png` | 图片占位图（加载失败/未加载） | 帖子卡片、详情页、内容渲染、通知等 |
| `ztmyo.png` | 关于页作者头像 | AboutModal |
| `栗次元.ico` / `夏柔.ico` / `百度.ico` | 关于页第三方服务图标 | AboutModal |
| `avatars/avatar_1.png ~ avatar_24.png` | 示例数据使用的头像 | `generate-data` 灌装的示例数据 |

替换要求：

- `小石榴.png`：换成你自己的 Logo，**注意保持文件名或同步修改引用处的路径**（当前引用该文件名的组件较多）。
- `avatar.png`、`未加载.png`：建议替换为无品牌的中性图，避免默认头像/占位图残留原作者元素。
- `avatars/`：示例数据头像，可整体替换，重新灌装数据时会重新引用。
- 第三方服务图标（栗次元/夏柔/百度）：若不使用对应服务，应在关于页移除相关内容（见第四章）。

### 2.3 `public/` 目录资源

用户可自由替换的静态资源都在 `vue3-project/public/` 下：

| 文件 | 用途 |
|------|------|
| `manifest.json` | PWA 清单，见 2.1 |
| `favicon-32x32.png`、`favicon-64x64.png` | 浏览器标签图标 |
| `apple-touch-icon.png` | iOS 主屏图标 |
| `android-icon-192x192.png`、`android-icon-512x512.png` | Android 主屏图标 |
| `stickers/小石榴心情.png`、`stickers/小石榴日常.png` | 表情包雪碧图，见 2.4 |

> ⚠️ `vue3-project/index.html` 引用了 `/logo.ico`，但项目中并不存在该文件，属于原有缺失项。请自行准备一个 `.ico` 图标放入 `public/logo.ico`，或删除该行引用，避免浏览器 404。全部图标建议使用同一套设计的新 Logo 统一替换，尺寸与文件名保持不变即可直接生效。

### 2.4 表情包

表情包配置在 `vue3-project/src/components/emoji-picker/stickers.json`，包含分组标题（当前为"小石榴心情""小石榴日常"）与雪碧图路径。替换方式：

1. 用等宽等高的雪碧图替换 `public/stickers/` 下的图片；
2. 在 `stickers.json` 中同步修改分组 `title`、`sheet` 路径以及 `columns`（每行张数）等参数。

具体字段说明见同目录下的 `stickers.js` 注释。

### 2.5 邮件模板

启用邮箱验证后，注册邮件中的标题与正文带有品牌名，位于 `express-project/utils/email.js`，同时 `.env` 中的 `EMAIL_FROM_NAME` 也会展示发件人名称，请一并修改。

### 2.6 页面可见的品牌文案

除名称与图片外，以下位置在界面上直接可见，需要按需修改：

| 位置 | 内容 |
|------|------|
| `vue3-project/src/components/modals/AuthModal.vue` | "登录/注册小石榴"、字段标签与校验提示中的"小石榴号" |
| `vue3-project/src/views/user/UserProfile.vue`、`vue3-project/src/views/user/index.vue`、`vue3-project/src/views/search/components/UserCard.vue` | "小石榴号：xxx" |
| `vue3-project/src/components/DetailCard.vue` | 分享文案中的站点名 |
| `vue3-project/src/components/menu/CommonMenu.vue` | "关于小石榴"菜单项 |
| `vue3-project/src/components/modals/SiteSearchModal.vue` | 搜索提示文案 |
| `vue3-project/src/views/admin/AdminLayout.vue` | 管理后台标题"小石榴管理后台" |
| `vue3-project/src/views/download/index.vue` | 下载页标题、版本号、GitHub 链接 |
| `vue3-project/src/views/doc/index.vue` | 文档站侧栏标题、页脚版权与协议链接 |

> 💡 **"小石榴号"是用户唯一标识字段的界面称呼**（数据库字段为 `user_id`）。若只改展示名称，修改上述组件文案即可；若连同术语一起替换，还需同步后端提示语、违规词检测脚本与文档说明，改动面较大，建议保留内部字段名、仅调整界面文案。

### 2.7 代码注释与仓库链接

源码文件头部的作者与仓库信息（`@author`、`@github`）及文档、README、下载页中的 GitHub 仓库链接，二次开发时请替换为你自己的信息：

- `express-project/app.js`、`vue3-project/src/main.js`、`vue3-project/vite.config.js` 的文件头注释
- `README.md`、`vue3-project/src/views/doc/index.vue`、`vue3-project/src/views/download/index.vue` 中的 `GITHUB_URL`
- [OVERVIEW.md](OVERVIEW.md) 等文档中指向原仓库的"原文件"链接

原仓库地址为 `https://github.com/ZTMYO/XiaoShiLiu`。

但**涉及作者署名的部分不能直接删除**，处理方式见下一章。

---

## 三、关于页与作者署名

`vue3-project/src/components/modals/AboutModal.vue` 是项目的"关于"弹窗，包含项目简介、开发者、项目亮点、接口服务、隐私声明与版权声明。二次开发时：

- **可以修改**：项目简介、项目亮点、接口服务（改为你自己实际使用的服务）、隐私声明、页面文案与图标、页脚版权行 `© xxxx 你的项目名`。
- **必须保留**：对原作者的署名。AGPL-3.0 要求保留版权声明，且这是对开源贡献者最基本的尊重。
- **建议做法**：保留原"开发者"信息，并新增一句"本项目基于小石榴图文社区二次开发"的说明，附上原仓库地址；页脚改为 `© xxxx 你的项目名 · Based on XiaoShiLiu by @ZTMYO`。

| 区块 | 处理建议 |
|------|----------|
| 项目简介 | 改为你的项目定位 |
| 开发者 | 保留原作者（@ZTMYO + 原仓库），可另加你的信息 |
| 项目亮点 | 保留或按实际技术栈调整 |
| 接口服务 | 若不再使用栗次元/夏柔/百度等服务，删除对应条目 |
| 隐私声明 | 按你的实际数据处理方式修改 |
| 版权声明 | 补充"基于 AGPL-3.0 二次开发"说明 |
| 页脚 | 保留原作者署名，加注你的项目名 |

---

## 四、第三方资源与授权

项目中使用的外部服务与素材，二次开发时注意各自的授权与合规要求：

| 资源 | 用途 | 注意事项 |
|------|------|----------|
| 栗次元图床（t.alcy.cc） | 示例数据图片来源 | 仅作示例，生产环境请替换为你自己的图床；示例链接见 `express-project/imgLinks/post_img_link.txt` |
| 夏柔 API（aa1.cn） | 第三方图片上传接口 | 第三方公共接口，稳定性与可用性不受本项目控制，建议改为 OSS/R2 或自建上传 |
| 百度 opendata | IP 属地查询 | 免费公开接口，无需密钥；如涉及隐私合规请自行评估 |
| UI 参考（小红书） | 界面设计参考 | 仅作布局参考，**不要**使用对方商标、Logo 或受版权保护的素材 |
| 表情包雪碧图 | 站内表情 | 当前标注为原创素材，若替换请确保自己拥有所用素材的授权 |

> ⚠️ 请勿在二次开发的站点中保留或使用任何第三方品牌标识（包括原作者的相关素材）来暗示官方关联，避免商标与版权风险。关于页的"免责声明"也应据此调整为你的实际情况。

---

## 五、功能裁剪

以下功能可通过配置开关关闭，或直接移除对应模块，按需裁剪：

| 功能 | 开关 / 位置 | 裁剪方式 |
|------|-------------|----------|
| 图片/视频上传 | `IMAGE_UPLOAD_STRATEGY`、`VIDEO_UPLOAD_STRATEGY` | 选择 `local` 即可不依赖任何第三方存储，无需 OSS/R2/图床 |
| 邮箱验证注册 | `EMAIL_ENABLED` | 设为 `false` 后注册无需邮箱验证，也不用配置 SMTP |
| IP 属地展示 | `IP_LOCATION_API` 等 | 不使用时可关闭相关展示逻辑 |
| 定时违规词检测 | `SENSITIVE_WORD_CHECK_ENABLED` | 设为 `false` 不注册检测任务 |
| 多语言文档 | `express-project/routes/docs.js` 的 `LANG_SUFFIX` | 不需要多语言时保留中文即可，缺失的语言版本会自动隐藏 |
| 表情包 | `public/stickers/` 与 `stickers.json` | 删除配置项即可移除对应分组 |
| 关于页第三方服务区块 | AboutModal | 删除不使用的服务条目 |

> 💡 裁剪文档时，记得同步 `express-project/routes/docs.js` 的 `DOC_ITEMS` 清单与 [OVERVIEW.md](OVERVIEW.md)、`README.md` 的文档索引，避免站点出现无法访问的文档入口。

---

## 六、上线前自查清单（品牌与合规）

- 站点名称、标题、PWA 清单已换成自己的品牌
- Logo、默认头像、占位图、favicon 系列、表情包已替换
- 界面可见文案（"小石榴号"、"关于小石榴"、分享文案等）已按需调整
- `public/logo.ico` 已补齐或删除引用
- 邮件模板与发件人名称已修改
- 关于页保留原作者署名，并注明"二次开发"，页脚版权行已更新
- 已按 AGPL-3.0 第 13 条，为线上访问者提供获取完整源码的入口
- 不再使用的第三方服务相关内容已从关于页移除
- 代码注释与仓库链接中的作者信息已替换（署名部分保留）
- 管理员默认密码已修改（见[部署指南](DEPLOYMENT.md)）

---

## 七、常见问题

**Q：只改界面文案、不改数据库字段，可以吗？**
可以。"小石榴号"等术语只是 `user_id` 字段的展示名称，仅调整前端文案不影响数据。若要连字段术语一起更换，需同步后端提示语、检测脚本与文档，改动面较大。

**Q：可以不保留原作者信息吗？**
不可以。AGPL-3.0 要求保留版权与许可声明，请至少在关于页与 `LICENSE` 中保留原作者署名，并注明你的修改。

**Q：我的站点需要公开源码吗？**
如果你修改后的版本对外提供网络服务，需要按 AGPL-3.0 第 13 条向使用者提供获取完整对应源码的途径；纯内部自用而不对外服务时通常不受此约束，具体请以协议原文为准。

**Q：换 Logo 后图片不显示？**
检查文件名是否与引用路径一致。`小石榴.png` 被多个组件按文件名引用，直接替换同名文件最省事；改名则需同步更新所有引用处。

---

> 相关文档：[部署指南](DEPLOYMENT.md) · [项目结构](PROJECT_STRUCTURE.md) · [接口文档](API_DOCS.md) · [数据库设计](DATABASE_DESIGN.md)
