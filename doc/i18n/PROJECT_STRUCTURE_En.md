# Project Structure

XiaoShiLiu Community uses a frontend/backend separated architecture: Vue 3 + Vite for the frontend, Express + MySQL for the backend.

## Overall Structure

```
XiaoShiLiu Community/
├── vue3-project/            # Frontend project
├── express-project/         # Backend project
├── doc/                     # Project documentation
│   ├── API_DOCS.md          # API reference
│   ├── DATABASE_DESIGN.md   # Database design
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── PROJECT_STRUCTURE.md # Project structure (this document)
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
| `users.js` | `/api/users` | User profile, follow relationships |
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
| `admin.js` | `/api/admin` | Admin back office |
| `docs.js` | `/api/system` | System info and API reference |

### Script Files

| File | Function |
|------|----------|
| `init-database.js` | Create the database and tables |
| `init-database.sql` | SQL version of the schema, runnable in a MySQL client |
| `generate-data.js` | Generate test data for development |
| `update-sample-images.js` | Batch update sample image links |
| `local-sensitive-word-check.js` | Scan posts and comments for sensitive words |
| `migrate-audit-to-verification.js` | Migrate verification data from the audit table into user_verification |

## Technical Architecture

### Frontend Architecture

```
┌──────────────────────────────────────┐
│              Vue 3 App               │
├──────────────────────────────────────┤
│   Views          │  Components       │
├──────────────────────────────────────┤
│   Router         │  Stores (State)   │
├──────────────────────────────────────┤
│   API            │  Utils            │
├──────────────────────────────────────┤
│           Vite (Build Tool)          │
└──────────────────────────────────────┘
```

### Backend Architecture

```
┌──────────────────────────────────────┐
│           Express Server             │
├──────────────────────────────────────┤
│   Routes         │ Middleware        │
├──────────────────────────────────────┤
│   Config         │  Utils            │
├──────────────────────────────────────┤
│           MySQL Database             │
└──────────────────────────────────────┘
```

## Data Flow

```
Frontend Vue App
     ↓ HTTP Request
Express Routes
     ↓ Data Processing
Middleware Validation
     ↓ Database Operations
MySQL Database
     ↓ Return Data
Frontend State Update
     ↓ View Rendering
User Interface Display
```
