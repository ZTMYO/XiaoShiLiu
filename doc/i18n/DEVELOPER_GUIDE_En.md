# Secondary Development Guide

This document is intended for people who want to adapt the XiaoShiLiu UGC Community into their own project, and it explains three things clearly: **the brand elements that must be changed, the open source license that must be complied with, and the features that can be trimmed as needed**.

Environment setup, the meaning of the parameters, and production configuration are not covered here; please read the [Deployment Guide](DEPLOYMENT_En.md) first. The two documents divide their responsibilities as follows:

| Document | Scope |
|------|----------|
| [Deployment Guide](DEPLOYMENT_En.md) | Environment preparation, Docker/traditional deployment, parameter configuration for uploads and email, OSS console operations, pre-launch checks |
| Secondary Development Guide (this document) | Brand element replacement, about page and author attribution, AGPL-3.0 license obligations, third-party resource licensing, feature trimming |

> 💡 Recommended workflow: first complete the brand and license changes described in this document, then follow the Deployment Guide to finish environment configuration and go live.

---

## 1. Open Source License and Legal Obligations

The `LICENSE` in the repository root contains the full text of the **GNU Affero General Public License v3.0 (AGPL-3.0)**. Its biggest difference from the familiar GPLv3 lies in **Section 13**: as long as your modified version provides services to the public over a network, you must provide users with a way to obtain the complete corresponding source code. Web community projects are exactly such a typical scenario, so this clause deserves the most attention from secondary developers.

When doing secondary development, you need to fulfill the following:

- **Retain copyright notices**: you must not delete or modify the copyright notices, author attribution, or license text in the source code (the `LICENSE` and the license comments at the head of each file).
- **Release modifications under AGPL-3.0 as well**: the code you adapt from this project must also be provided to the public as a whole under AGPL-3.0.
- **Provide source code for network interaction (Section 13)**: after the site goes live, a prominent entry point (such as a footer link) should be provided on the page so that visitors can download the complete source code of the version you have deployed.
- **Indicate modifications**: it is recommended to note "secondary development based on the XiaoShiLiu UGC Community" on the about page or in the footer, along with the original repository address.

> ⚠️ This project is intended for learning and exchange purposes, and the author is not responsible for the operational risks or compliance issues of secondary development. Before commercial use, please confirm the legal and platform compliance requirements on your own.

---

## 2. Brand Element Modification Checklist

All resources that carry "XiaoShiLiu" branding are listed below by category. When renaming or swapping images, it is recommended to check each item one by one to avoid omissions.

### 2.1 Site Name and Title

| Location | Content | Description |
|------|------|------|
| `vue3-project/index.html` | `<title>小石榴 - 你的校园图文部落</title>` | Browser tab title |
| `vue3-project/public/manifest.json` | `name`, `short_name`, `description`, `theme_color` | PWA application name, description, and theme color |
| `vue3-project/.env.example` | `VITE_APP_TITLE=小石榴图文社区` | Application title variable |
| `vue3-project/package.json` | `description`, `author` | Frontend package information |
| `express-project/package.json` | `description`, `author` | Backend package information |
| `express-project/config/config.js` | Site-related default values | Backend default site information |
| `express-project/utils/email.js` | Email subject and body heading | See 2.5 |

### 2.2 Image Resources (`vue3-project/src/assets/imgs/`)

| File | Purpose | Referenced By |
|------|------|----------|
| `小石榴.png` | Site logo, containing XiaoShiLiu elements | About page, top navigation, search page, admin login page and layout |
| `avatar.png` | Default avatar (fallback when there is no avatar) | Many user, comment, and notification related components |
| `未加载.png` | Image placeholder (failed to load / not yet loaded) | Post cards, detail page, content rendering, notifications, etc. |
| `ztmyo.png` | Author avatar on the about page | AboutModal |
| `栗次元.ico` / `夏柔.ico` / `百度.ico` | Third-party service icons on the about page | AboutModal |
| `avatars/avatar_1.png ~ avatar_24.png` | Avatars used by sample data | Sample data seeded by `generate-data` |

Replacement requirements:

- `小石榴.png`: replace it with your own logo, and **be sure to keep the file name or update the paths at the referencing locations accordingly** (many components currently reference this file name).
- `avatar.png` and `未加载.png`: it is recommended to replace them with neutral, unbranded images to avoid leaving the original author's elements in the default avatar/placeholder images.
- `avatars/`: sample data avatars, which can be replaced as a whole and will be re-referenced when the data is re-seeded.
- Third-party service icons (Liciyuan/Xiarou/Baidu): if the corresponding services are not used, the related content should be removed from the about page (see Chapter 4).

### 2.3 `public/` Directory Resources

The static resources that users can freely replace are all under `vue3-project/public/`:

| File | Purpose |
|------|------|
| `manifest.json` | PWA manifest, see 2.1 |
| `favicon-32x32.png`, `favicon-64x64.png` | Browser tab icons |
| `apple-touch-icon.png` | iOS home screen icon |
| `android-icon-192x192.png`, `android-icon-512x512.png` | Android home screen icons |
| `stickers/小石榴心情.png`, `stickers/小石榴日常.png` | Sticker sprite sheets, see 2.4 |

> ⚠️ `vue3-project/index.html` references `/logo.ico`, but this file does not exist in the project; it is a pre-existing missing item. Please prepare your own `.ico` icon and place it at `public/logo.ico`, or remove that line of reference, to avoid browser 404 errors. For all icons, it is recommended to replace them uniformly with a new logo from the same design set; keeping the dimensions and file names unchanged will make them take effect directly.

### 2.4 Sticker Packs

Stickers are configured in `vue3-project/src/components/emoji-picker/stickers.json`, which contains the group titles (currently "XiaoShiLiu Mood" and "XiaoShiLiu Daily") and the sprite sheet paths. How to replace them:

1. Replace the images under `public/stickers/` with a sprite sheet of equal width and height;
2. In `stickers.json`, update the group `title`, the `sheet` path, and parameters such as `columns` (the number of images per row) accordingly.

For detailed field descriptions, see the comments in `stickers.js` in the same directory.

### 2.5 Email Templates

After email verification is enabled, the subject and body of the registration email carry the brand name and are located in `express-project/utils/email.js`; at the same time, `EMAIL_FROM_NAME` in `.env` also displays the sender name, so please modify it as well.

### 2.6 Brand Copy Visible on Pages

In addition to names and images, the following locations are directly visible in the interface and need to be modified as needed:

| Location | Content |
|------|------|
| `vue3-project/src/components/modals/AuthModal.vue` | "Login/Register XiaoShiLiu", and the "XiaoShiLiu ID" in field labels and validation hints |
| `vue3-project/src/views/user/UserProfile.vue`, `vue3-project/src/views/user/index.vue`, `vue3-project/src/views/search/components/UserCard.vue` | "XiaoShiLiu ID: xxx" |
| `vue3-project/src/components/DetailCard.vue` | The site name in the share copy |
| `vue3-project/src/components/menu/CommonMenu.vue` | The "About XiaoShiLiu" menu item |
| `vue3-project/src/components/modals/SiteSearchModal.vue` | Search hint copy |
| `vue3-project/src/views/admin/AdminLayout.vue` | The admin panel title "XiaoShiLiu Admin Panel" |
| `vue3-project/src/views/download/index.vue` | Download page title, version number, and GitHub link |
| `vue3-project/src/views/doc/index.vue` | Documentation site sidebar title, footer copyright and license links |

> 💡 **"the XiaoShiLiu ID" is the interface name of the user's unique identifier field** (the database field is `user_id`). If you only change the display name, you can simply modify the copy in the components above; if you replace the term as well, you also need to update the backend prompts, the sensitive word detection scripts, and the documentation, which is a much larger change, so it is recommended to keep the internal field name and adjust only the interface copy.

### 2.7 Code Comments and Repository Links

The author and repository information at the head of source files (`@author`, `@github`), as well as the GitHub repository links in the documentation, README, and download page, should be replaced with your own information during secondary development:

- The file header comments of `express-project/app.js`, `vue3-project/src/main.js`, and `vue3-project/vite.config.js`
- The `GITHUB_URL` in `README.md`, `vue3-project/src/views/doc/index.vue`, and `vue3-project/src/views/download/index.vue`
- The "original file" links pointing to the original repository in documents such as [OVERVIEW.md](OVERVIEW_En.md)

The original repository address is `https://github.com/ZTMYO/XiaoShiLiu`.

However, **the parts involving author attribution cannot be deleted directly**; for how to handle them, see the next chapter.

---

## 3. The About Page and Author Attribution

`vue3-project/src/components/modals/AboutModal.vue` is the project's "About" modal, containing the project introduction, developers, project highlights, API services, privacy statement, and copyright statement. During secondary development:

- **Can be modified**: the project introduction, project highlights, API services (change them to the services you actually use), the privacy statement, page copy and icons, and the footer copyright line `© xxxx Your Project Name`.
- **Must be retained**: attribution to the original author. AGPL-3.0 requires retaining copyright notices, and this is the most basic respect for open source contributors.
- **Recommended approach**: retain the original "Developers" information, add a statement that "this project is secondary development based on the XiaoShiLiu UGC Community", include the original repository address, and change the footer to `© xxxx Your Project Name · Based on XiaoShiLiu by @ZTMYO`.

| Section | Recommendation |
|------|----------|
| Project introduction | Change it to your project positioning |
| Developers | Retain the original author (@ZTMYO + the original repository); you may add your own information as well |
| Project highlights | Retain them or adjust them according to your actual tech stack |
| API services | If services such as Liciyuan/Xiarou/Baidu are no longer used, delete the corresponding entries |
| Privacy statement | Modify it according to your actual data handling practices |
| Copyright statement | Add a note that it is "secondary development based on AGPL-3.0" |
| Footer | Retain the original author attribution and add your project name |

---

## 4. Third-Party Resources and Licensing

For the external services and assets used in the project, note their respective licensing and compliance requirements during secondary development:

| Resource | Purpose | Notes |
|------|------|----------|
| Liciyuan image hosting (t.alcy.cc) | Source of sample data images | For demonstration only; replace it with your own image hosting in production; see `express-project/imgLinks/post_img_link.txt` for the sample links |
| Xiarou API (aa1.cn) | Third-party image upload endpoint | A third-party public endpoint whose stability and availability are not under this project's control; it is recommended to switch to OSS/R2 or self-built uploads |
| Baidu opendata | IP location query | A free public endpoint requiring no key; if privacy compliance is involved, please assess it yourself |
| UI reference (Xiaohongshu) | Interface design reference | For layout reference only; **do not** use the other party's trademarks, logos, or copyright-protected assets |
| Sticker sprite sheets | In-site stickers | Currently marked as original assets; if you replace them, make sure you own the authorization for the assets you use |

> ⚠️ Do not retain or use any third-party brand marks (including assets related to the original author) in your secondary development site to imply an official affiliation, so as to avoid trademark and copyright risks. The "disclaimer" on the about page should also be adjusted accordingly to reflect your actual situation.

---

## 5. Feature Trimming

The following features can be turned off via configuration switches or removed by deleting the corresponding modules, trimmed as needed:

| Feature | Switch / Location | How to Trim |
|------|-------------|----------|
| Image/video upload | `IMAGE_UPLOAD_STRATEGY`, `VIDEO_UPLOAD_STRATEGY` | Choosing `local` removes the dependency on any third-party storage, so no OSS/R2/image hosting is needed |
| Email-verified registration | `EMAIL_ENABLED` | Setting it to `false` removes the need for email verification during registration and the need to configure SMTP |
| IP location display | `IP_LOCATION_API`, etc. | When not used, you can turn off the related display logic |
| Scheduled sensitive word detection | `SENSITIVE_WORD_CHECK_ENABLED` | Setting it to `false` means no detection task is registered |
| Multilingual documentation | `LANG_SUFFIX` in `express-project/routes/docs.js` | If multilingual support is not needed, simply keep Chinese; missing language versions are automatically hidden |
| Stickers | `public/stickers/` and `stickers.json` | Delete the configuration entries to remove the corresponding groups |
| Third-party service section on the about page | AboutModal | Delete the service entries that are not used |

> 💡 When trimming the documentation, remember to update the `DOC_ITEMS` list in `express-project/routes/docs.js` as well as the document indexes in [OVERVIEW.md](OVERVIEW_En.md) and `README.md`, to avoid document entries on the site that cannot be accessed.

---

## 6. Pre-launch Checklist (Branding and Compliance)

- The site name, title, and PWA manifest have been switched to your own brand
- The logo, default avatar, placeholder images, favicon set, and stickers have been replaced
- The interface-visible copy (the "XiaoShiLiu ID", "About XiaoShiLiu", share copy, etc.) has been adjusted as needed
- `public/logo.ico` has been added or its reference removed
- The email templates and sender name have been modified
- The about page retains the original author attribution and notes "secondary development", and the footer copyright line has been updated
- In accordance with Section 13 of AGPL-3.0, an entry point for obtaining the complete source code has been provided for online visitors
- Content related to third-party services that are no longer used has been removed from the about page
- The author information in code comments and repository links has been replaced (the attribution part is retained)
- The default administrator password has been changed (see the [Deployment Guide](DEPLOYMENT_En.md))

---

## 7. FAQ

**Q: Is it okay to change only the interface copy without changing the database fields?**
Yes. Terms such as "the XiaoShiLiu ID" are merely the display name of the `user_id` field, and adjusting only the frontend copy does not affect the data. If you want to replace the field term as well, you need to update the backend prompts, detection scripts, and documentation accordingly, which is a much larger change.

**Q: Can I omit the original author information?**
No. AGPL-3.0 requires retaining copyright and license notices; please retain the original author attribution at least on the about page and in `LICENSE`, and indicate your modifications.

**Q: Does my site need to make its source code public?**
If your modified version provides network services to the public, you need to provide users with a way to obtain the complete corresponding source code in accordance with Section 13 of AGPL-3.0; when it is used purely internally and not exposed to external services, this constraint usually does not apply. For specifics, please refer to the original license text.

**Q: The image does not display after changing the logo?**
Check whether the file name matches the referencing path. `小石榴.png` is referenced by file name by several components, so replacing the file with the same name is the easiest approach; if you rename it, you need to update all referencing locations accordingly.

---

> Related documents: [Deployment Guide](DEPLOYMENT_En.md) · [Project Structure](PROJECT_STRUCTURE_En.md) · [API Reference](API_DOCS_En.md) · [Database Design](DATABASE_DESIGN_En.md)
