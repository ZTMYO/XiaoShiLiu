# Project Structure

XiaoShiLiu UGC Community uses a frontend/backend separated architecture: Vue 3 + Vite for the frontend, Express + MySQL for the backend.

## Overall Structure

```
XiaoShiLiu UGC Community/
├── vue3-project/            # Frontend project
├── express-project/         # Backend project
├── doc/                     # Project documentation
│   ├── OVERVIEW.md          # Documentation overview
│   ├── API_DOCS.md          # API reference
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── PROJECT_STRUCTURE.md # Project structure (this document)
│   ├── DATABASE_DESIGN.md   # Database design
│   ├── i18n/                # English / Traditional Chinese versions
│   └── imgs/                # Documentation images
├── docker-compose.yml       # Docker Compose orchestration
├── .env.docker              # Docker environment template
├── deploy.sh                # One-click deployment for Linux
├── deploy.ps1               # One-click deployment for Windows
├── LICENSE                  # License
└── README.md                # Main project documentation
```

## Frontend Project Structure (vue3-project/)

```
vue3-project/
├── public/                  # Static assets (site icons, manifest.json)
├── src/
│   ├── api/                 # API wrappers
│   ├── assets/              # Images, icons, and style files
│   ├── components/          # Shared components
│   ├── composables/         # Composable functions
│   ├── config/              # App configuration and constants
│   ├── directives/          # Custom directives
│   ├── router/              # Router configuration
│   ├── stores/              # Pinia state management
│   ├── utils/               # Utility functions
│   ├── views/               # Page components
│   ├── App.vue              # Root component
│   └── main.js              # Entry file
├── .env.example             # Environment template
├── Dockerfile               # Image build
├── nginx.conf               # Nginx configuration
├── index.html               # HTML template
├── jsconfig.json            # Path alias configuration
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## Backend Project Structure (express-project/)

```
express-project/
├── config/                  # App configuration (database, JWT, upload, email)
├── constants/               # Business constants
├── fonts/                   # Watermark fonts
├── imgLinks/                # Sample image link library
├── middleware/              # Middleware (auth, CRUD factory)
├── routes/                  # Route definitions
├── scripts/                 # Init, test data, sensitive word check scripts
├── utils/                   # Utility functions (JWT, upload, notifications, jobs)
├── app.js                   # Application entry
├── .env.example             # Environment template
├── Dockerfile               # Image build
└── package.json             # Dependencies and scripts
```

### Route Files

| File | Mount path | Function |
|------|------------|----------|
| `auth.js` | `/api/auth` | Login, registration, token validation |
| `users.js` | `/api/users` | User profile, profile stats, follows and followers, verification request, password change |
| `posts.js` | `/api/posts` | Post publishing, editing, deletion, querying |
| `comments.js` | `/api/comments` | Comment publishing, deletion, querying |
| `likes.js` | `/api/likes` | Liking posts and comments |
| `tags.js` | `/api/tags` | Tag query and management |
| `search.js` | `/api/search` | Post, user, and tag search |
| `notifications.js` | `/api/notifications` | Notification list and read status |
| `upload.js` | `/api/upload` | Image and video upload |
| `stats.js` | `/api/stats` | Platform statistics |
| `categories.js` | `/api/categories` | Category query |
| `files.js` | `/api/files` | File access |
| `admin.js` | `/api/admin` | Admin back office (users, content, sessions, admins) |
| `docs.js` | `/api/system` | Markdown source of the site documentation |

In addition, the `GET /api/health` health check is defined directly in `app.js` and does not go through `routes/`.

### Script Files

| File | Function |
|------|----------|
| `init-database.js` | Create the database and tables |
| `init-database.sql` | SQL version of the schema, runnable in a MySQL client |
| `generate-data.js` | Generate test data for development |
| `update-sample-images.js` | Batch update sample image links |
| `local-sensitive-word-check.js` | Scan posts and comments for sensitive words |
| `migrate-audit-to-verification.js` | Migrate verification data from the audit table into user_verification |
| `违规词库.txt` | Sensitive word list loaded by `local-sensitive-word-check.js` |

## Frontend Pages and Routes

### Main Site Pages

| Page file | Route | Description |
|-----------|-------|-------------|
| `layout/index.vue` | `/` | Main site layout (header, sidebar, footer); the root path redirects to `/explore` |
| `explore/index.vue` | `/explore` | Explore page |
| `explore/ChannelPage.vue` | `/explore`, `/explore/:channel` | Channel feed; an invalid `:channel` falls back to recommendations |
| `PostDetail.vue` | `/post` | Post detail |
| `publish/index.vue` | `/publish` | Publish a post |
| `notification/index.vue` | `/notification` | Notification center |
| `user/index.vue` | `/user` | My profile |
| `user/UserProfile.vue` | `/user/:userId` | Another user's profile |
| `user/FollowList.vue` | `/follow/:type` | Following, follower and mutual lists; `type` is `mutual`, `following` or `followers` |
| `search/SearchResult.vue` | `/search_result`, `/search_result/:tab` | Search results; `tab` is `all`, `post`, `video` or `user` |
| `post-management/index.vue` | `/post-management` | Post management |
| `draft-box/index.vue` | `/draft-box` | Draft box |
| `NotFound.vue` | `/:pathMatch(.*)*` | 404 page |

### Standalone Pages

| Page file | Route | Description |
|-----------|-------|-------------|
| `download/index.vue` | `/download` | Client download page |
| `doc/index.vue` | `/doc/:name?`, `/:lang(zh\|en\|zh-Hant)/doc/:name?` | Documentation reader |

### Admin Pages

| Page file | Route | Description |
|-----------|-------|-------------|
| `admin/AdminLogin.vue` | `/admin/login` | Admin login |
| `admin/AdminLayout.vue` | `/admin` | Admin layout; the root path redirects to `/admin/monitor` |
| `admin/AdminMonitor.vue` | `/admin/monitor` | Activity monitor |
| `admin/UserManagement.vue` | `/admin/users` | User management |
| `admin/PostAudit.vue` | `/admin/post-audit` | Post review |
| `admin/PostManagement.vue` | `/admin/posts` | Post management |
| `admin/CommentManagement.vue` | `/admin/comments` | Comment management |
| `admin/CategoryManagement.vue` | `/admin/categories` | Category management |
| `admin/TagManagement.vue` | `/admin/tags` | Tag management |
| `admin/LikeManagement.vue` | `/admin/likes` | Like management |
| `admin/CollectionManagement.vue` | `/admin/collections` | Collection management |
| `admin/FollowManagement.vue` | `/admin/follows` | Follow management |
| `admin/NotificationManagement.vue` | `/admin/notifications` | Notification management |
| `admin/SessionManagement.vue` | `/admin/sessions` | User session management |
| `admin/AdminSessionManagement.vue` | `/admin/admin-sessions` | Admin session management |
| `admin/AdminManagement.vue` | `/admin/admins` | Admin management |
| `admin/AuditManagement.vue` | `/admin/audit` | Verification review |

## Request Lifecycle

```
Browser
  ↓ Frontend axios instance (src/api/request.js)
     A request interceptor injects Authorization: Bearer <token> (admin_token on admin pages)
Vite dev server / Nginx (production: static hosting + /api reverse proxy to backend port 3001)
  ↓
Express (app.js)
  ├── cors
  ├── express.json / urlencoded (50MB body limit)
  ├── Rate limiting: /api 500 per 15 min, /api/auth 20 per 5 min, /api/upload 60 per 15 min
  ├── Route dispatch (routes/*.js, mount paths above)
  ├── Auth middleware (authenticateToken, optionalAuth in middleware/auth.js)
  └── utils/dbHelper.js → MySQL connection pool (pool exported by config/config.js)
  ↓ JSON response (uniform { code, message, data })
A response interceptor maps code to success, clears the token and redirects on 401, warns on 429
  ↓
Pinia store updates state → components re-render
```

## Where to Make Changes

| Task | Files to touch |
|------|----------------|
| Add a frontend page | Create the component under `src/views/` → register the route in `src/router/index.js` → add a wrapper in `src/api/` and state in `src/stores/` when data is needed |
| Add a backend endpoint | Add the route to the matching file under `routes/`, or create a new file and mount it in `app.js` → add a `middleware/auth.js` middleware when authentication is needed → run database work through `utils/dbHelper.js` |
| Add a database table | Keep `scripts/init-database.js` and `scripts/init-database.sql` in sync |
