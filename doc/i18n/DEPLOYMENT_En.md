# Deployment Guide

This document provides a detailed introduction to the deployment process and configuration instructions for the XiaoShiLiu image and text community project.

## Deployment Methods

The project supports two deployment methods:

1. **Docker One-Click Deployment** (recommended) - Simple and quick, suitable for production environments
2. **Traditional Deployment** - Manual configuration, suitable for development environments

> 💡 **BT-Panel Deployment**: If you are using BT-Panel (宝塔面板), you can refer to this detailed tutorial with screenshots: [Complete Tutorial for Deploying XiaoShiLiu with BT-Panel](https://www.sakuraidc.cc/forum-post/3116.html)

---

## 🐳 Docker One-Click Deployment (Recommended)

### Environment Requirements

- Docker >= 20.0
- Docker Compose >= 2.0
- Available Memory >= 2GB
- Available Disk Space >= 5GB

### Image and Version Description

| Component | Image/Source | Version/Tag | Description |
|-----------|--------------|-------------|-------------|
| Database | mysql | 5.7 | Uses the official image `mysql:5.7` with utf8mb4 default configuration |
| Backend Runtime | node | 18-alpine | `express-project/Dockerfile` uses `node:18-alpine` |
| Frontend Build | node | 18-alpine | `vue3-project/Dockerfile` uses this for the build phase |
| Frontend Runtime | nginx | alpine | Uses `nginx:alpine` to provide static files |
| Compose Health Check | wget | - | Frontend health check uses `wget --spider http://localhost/` |

> Note: The above versions are consistent with `docker-compose.yml` and the front-end and back-end `Dockerfile`; if changes are required, please synchronize adjustments to the corresponding files and documentation.
### Quick Start

#### 1. Clone the Project

```bash
git clone https://github.com/ZTMYO/XiaoShiLiu.git
cd XiaoShiLiu
```

#### 2. Configure Environment Variables

Copy the environment configuration file:
```bash
cp .env.docker .env
```

Edit the `.env` file and modify the configuration as needed:

```env
# Database configuration
DB_HOST=mysql
DB_USER=xiaoshiliu_user
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# JWT configuration
JWT_SECRET=xiaoshiliu_secret_key_2025_docker
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Upload configuration
UPLOAD_MAX_SIZE=50mb
# Image upload strategy (local: local storage, imagehost: third-party image hosting, r2: Cloudflare R2)
IMAGE_UPLOAD_STRATEGY=imagehost
# Video upload strategy (local: local storage, r2: Cloudflare R2)
VIDEO_UPLOAD_STRATEGY=local

# Local storage configuration
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001
VIDEO_UPLOAD_DIR=uploads/videos
VIDEO_COVER_DIR=uploads/covers

# Third-party image hosting configuration (when IMAGE_UPLOAD_STRATEGY=imagehost)
IMAGEHOST_API_URL=https://api.xunjinlu.fun/tc/api.php
IMAGEHOST_TIMEOUT=60000

# Cloudflare R2 configuration (when IMAGE_UPLOAD_STRATEGY=r2 or VIDEO_UPLOAD_STRATEGY=r2)
# Uncomment and fill in real configuration if using R2 storage
# R2_ACCESS_KEY_ID=your_r2_access_key_id_here
# R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
# R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
# R2_BUCKET_NAME=your_bucket_name_here
# R2_ACCOUNT_ID=your_account_id_here
# R2_REGION=auto
# R2_PUBLIC_URL=https://your-custom-domain.com

# API configuration
API_BASE_URL=http://localhost:3001

# Email service configuration
# Enable email functionality (true/false), disabled by default
EMAIL_ENABLED=false
# SMTP server address
SMTP_HOST=smtp.qq.com
# SMTP server port
SMTP_PORT=465
# Use SSL/TLS (true/false)
SMTP_SECURE=true
# Email account
SMTP_USER=your_email@example.com
# Email password/authorization code
SMTP_PASSWORD=your_email_password
# Sender email
EMAIL_FROM=your_email@example.com
# Sender name
EMAIL_FROM_NAME=XiaoShiLiu Campus Community

# Frontend build configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Service port configuration
FRONTEND_PORT=80
BACKEND_PORT=3001
DB_PORT_EXTERNAL=3306

# Production environment flag
NODE_ENV=production
```

#### 3. One-Click Start

**Windows Users:**

```powershell
# Start services
.\deploy.ps1

# Rebuild and start
.\deploy.ps1 -Build

# Start and seed example data (optional)
.\deploy.ps1 -Build -Seed
# Or seed data separately after the service has started
.\deploy.ps1 -Seed

# Check service status
.\deploy.ps1 -Status

# View logs
.\deploy.ps1 -Logs

# Stop services
.\deploy.ps1 -Stop
```

**Linux/macOS Users:**

```bash
# Grant execution permission to the script
chmod +x deploy.sh

# Start services
./deploy.sh

# Rebuild and start
./deploy.sh --build

# Check service status
./deploy.sh --status

# View logs
./deploy.sh --logs

# Stop services
./deploy.sh --stop
```

#### 4. Access the Application

After the service starts successfully, you can access the application through the following addresses:

| Service | Address | Description |
|---------|---------|-------------|
| Frontend Interface | http://localhost:8080 | Main access entry |
| Backend API | http://localhost:3001 | API service |
| Database | localhost:3307 | MySQL database |

### Docker Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     MySQL       │
│   (Nginx)       │◄───┤   (Express)     │◄───┤   (Database)    │
│   Port: 80      │    │   Port: 3001    │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Environment Variable Configuration

The project uses a `.env` file for configuration, with separate environment configurations for the frontend and backend:

#### Backend Environment Variables (express-project/.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=xiaoshiliu_secret_key_2025
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# Upload Configuration
UPLOAD_MAX_SIZE=50mb
# Image Upload Strategy (local: Local Storage, imagehost: Third-party Image Hosting, r2: Cloudflare R2 Storage)
UPLOAD_STRATEGY=imagehost

# Local Storage Configuration
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001

# Third-party Image Hosting Configuration
IMAGEHOST_API_URL=https://api.xunjinlu.fun/tc/api.php
IMAGEHOST_TIMEOUT=60000

# Cloudflare R2 Storage Configuration
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name
R2_ACCOUNT_ID=your_account_id
R2_REGION=auto
# Optional: Custom Domain URL (if a custom domain is configured)
R2_PUBLIC_URL=https://your-custom-domain.com
# Upload Strategy: local (Local Storage), imagehost (Third-party Image Hosting), or r2 (Cloudflare R2 Storage)
UPLOAD_STRATEGY=local

# Local Storage Configuration
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001

# Third-party Image Hosting Configuration
IMAGEHOST_API_URL=https://api.xunjinlu.fun/tc/api.php
IMAGEHOST_TIMEOUT=60000

# API Configuration
API_BASE_URL=http://localhost:3001

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Email Service Configuration
# Enable email functionality (true/false)
# Set to false to skip email verification during registration, suitable for users without SMTP service
EMAIL_ENABLED=true
# SMTP Server Address
SMTP_HOST=smtp.qq.com
# SMTP Server Port
SMTP_PORT=465
# Use SSL/TLS (true/false)
SMTP_SECURE=true
# Email Account
SMTP_USER=your_email@example.com
# Email Password/Authorization Code
SMTP_PASSWORD=your_email_password
# Sender Email
EMAIL_FROM=your_email@example.com
# Sender Name
EMAIL_FROM_NAME=XiaoShiLiu Campus Community
```

#### Frontend Environment Variables (vue3-project/.env)

```env
# API Base URL Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Use Real API
VITE_USE_REAL_API=true

# Application Title
VITE_APP_TITLE=Small Pear Graphic Community
```

#### Docker Environment Variable Description

When deploying with Docker, environment variables are configured through `docker-compose.yml`:

```env
# Database Configuration (Docker Environment)
DB_HOST=mysql
DB_USER=xiaoshiliu_user
DB_PASSWORD=123456
DB_NAME=xiaoshiliu

# JWT Configuration
JWT_SECRET=xiaoshiliu_secret_key_2025_docker
JWT_EXPIRES_IN=7d

# Upload Configuration
UPLOAD_MAX_SIZE=50mb
# Image Upload Strategy (local: Local Storage, imagehost: Third-party Image Hosting, r2: Cloudflare R2 Storage)
UPLOAD_STRATEGY=imagehost

# API Configuration
API_BASE_URL=http://localhost:3001
```

### Common Commands

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend

# Enter the container (sh is used since alpine images typically do not have bash)
docker-compose exec backend sh
# Or enter the MySQL client
docker-compose exec mysql mysql -u root -p

# Backup the database
docker-compose exec mysql mysqldump -u root -p xiaoshiliu > backup.sql

# Restore the database
docker-compose exec -T mysql mysql -u root -p xiaoshiliu < backup.sql
```

### Data Persistence

Docker uses volumes for data persistence in deployment:

- `mysql_data`: MySQL database files
- `backend_uploads`: Backend upload files

### Troubleshooting

#### 1. Port Conflicts

If port conflicts occur, you can modify the port mappings in the `docker-compose.yml` file:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Modify the frontend port
  backend:
    ports:
      - "3002:3001"  # Modify the backend port
```

#### 2. Memory Insufficient

Ensure the system has enough memory, and you can view resource usage with the following command:

```bash
docker stats
```

#### 3. Database Connection Failure / Loading Data

- Check if the database service is started normally:

```bash
docker-compose logs mysql
```

- Load sample data (Windows):
```powershell
.\deploy.ps1 -Seed
```

- Load sample data (manual execution):
```bash
docker-compose exec -T backend node scripts/generate-data.js
```

#### 4. File Upload Permission Issues

**Problem Phenomena**:
- When uploading files from the frontend, a 400 error is returned
- Backend logs show: `EACCES: permission denied, open '/app/uploads/xxx.png'`

**Cause Analysis**:
Permission issue in the Docker container's uploads directory. The directory belongs to the root user, but the application runs under the nodejs user.

**Solution**:

1. **Check the permissions of the uploads directory**:
```bash
docker-compose exec backend ls -la /app/uploads
```

2. **Fix the permission issue**:
```bash
# Modify the directory owner to root user using root user
docker-compose exec --user root backend chown -R nodejs:nodejs /app/uploads
```

3. **Verify the permission fix**:
```bash
# Confirm that the directory now belongs to the nodejs user
docker-compose exec backend ls -la /app/uploads
```

**Preventive Measures**:
- Ensure the uploads directory permissions are set correctly in the Dockerfile
- Automatically fix permissions issues when the container starts

#### 5. Upload Strategy Configuration

The project supports three file upload strategies:

**Local Storage Mode** (recommended for development and small deployments):
```yaml
# Set in docker-compose.yml
environment:
  UPLOAD_STRATEGY: local
```

**Third-party Image Hosting Mode** (recommended for production environments):
```yaml
# Set in docker-compose.yml
environment:
  UPLOAD_STRATEGY: imagehost
```

**Cloudflare R2 Storage Mode** (recommended for production environments, supports CDN acceleration):

```yaml
# Setting in docker-compose.yml
environment:
  UPLOAD_STRATEGY: r2
  R2_ACCESS_KEY_ID: your_r2_access_key_id
  R2_SECRET_ACCESS_KEY: your_r2_secret_access_key
  R2_ENDPOINT: https://your_account_id.r2.cloudflarestorage.com
  R2_BUCKET_NAME: your_bucket_name
  R2_ACCOUNT_ID: your_account_id
  R2_REGION: auto
  # Optional: Custom domain
  R2_PUBLIC_URL: https://your-custom-domain.com

> **Note**: To use Cloudflare R2 storage, you need to first create an R2 bucket and obtain the corresponding access key in the Cloudflare console.

#### 6. Email Feature Configuration

The project supports email verification functionality, controlled by the `EMAIL_ENABLED` switch:

1. **Enable Email Feature** (`EMAIL_ENABLED=true`)
   - Email address and verification required during registration
   - SMTP server configuration required
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.qq.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@example.com
   SMTP_PASSWORD=your_email_password
   EMAIL_FROM=your_email@example.com
   EMAIL_FROM_NAME=XiaoShiLiu Campus Community
   ```

2. **Disable Email Feature** (`EMAIL_ENABLED=false`, default)
   - No email verification required during registration
   - Suitable for scenarios without SMTP service or where email verification is not needed
   ```env
   EMAIL_ENABLED=false
   ```

#### 7. Reverse Proxy Configuration

**Important Note**: If you are using a reverse proxy server such as Nginx or Apache, you need to modify the following configurations:

**Backend Configuration (express-project/.env)**

```env
# Change API_BASE_URL to your domain and port
API_BASE_URL=https://yourdomain.com:port
# Or if using default ports (80/443)
API_BASE_URL=https://yourdomain.com

# CORS configuration also needs to be changed to the frontend access address
CORS_ORIGIN=https://yourdomain.com
```

**Frontend Configuration (vue3-project/.env)**

```env
# Change API base URL to your domain and backend port
VITE_API_BASE_URL=https://yourdomain.com:port/api
# Or if using default ports (80/443)
VITE_API_BASE_URL=https://yourdomain.com/api
```

**Configuration Example**

Assuming your domain is `example.com` and the backend is mapped to port 3001 through a reverse proxy:

**Backend .env:**
```env
API_BASE_URL=https://example.com
CORS_ORIGIN=https://example.com
```

**Frontend .env:**
```env
VITE_API_BASE_URL=https://example.com/api
```

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name example.com;

    # Frontend static resources
    location / {
        root /path/to/vue3-project/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 7. Cleanup and Reset

If you encounter problems and need to start over:

```bash
# Windows
.\deploy.ps1 -Clean

# Linux/macOS
./deploy.sh --clean
```

---

## 📋 Traditional Deployment Method

## System Requirements

| Component | Version Requirement | Description |
|-----------|---------------------|-------------|
| Node.js | >= 16.0.0 | Runtime environment |
| MySQL | >= 5.7 | Database |
| MariaDB | >= 10.3 | Database (optional) |
| npm | >= 8.0.0 | Package manager |
| yarn | >= 1.22.0 | Package manager (optional) |
| Browser | Supports ES6+ | Modern browser |

## Quick Start

### 1. Install Dependencies

```bash
# Using cnpm
cnpm install
# Or using yarn
yarn install
```

### 2. Configure Backend API Address

Create an environment configuration file (optional):

```bash
# Copy environment configuration template
cp .env.example .env
```

Edit the `.env` file to configure the backend API address:

```env
# Backend API address
VITE_API_BASE_URL=http://localhost:3001

# Other configurations...
```

### 3. Start Development Server

```bash
# Start development server
npm run dev

# Or using yarn
yarn dev
```

The development server will start at `http://localhost:5173`.

### 4. Build Production Version

```bash
# Build production version
npm run build

# Preview production version
npm run preview
```

## Backend Service Configuration

⚠️ **Important Reminder**: The frontend project needs to be used with the backend service.

1. **Start Backend Service**:
   ```bash
   # Navigate to the backend project directory
   cd ../express-project
   
   # Install backend dependencies
   npm install
   
   # Start backend service
   npm start
   ```

2. **Backend Service Address**: `http://localhost:3001`

3. **API Documentation**: Check the `API_DOCS.md` file in the backend project.

## Development Environment Configuration

### Environment Check

```bash
# Check Node.js version
node --version

# Check npm version
npm --version
```

### Development Server

```bash
# Start development server (hot reload)
npm run dev

# Access address: http://localhost:5173
```

### Code Conventions

- Use Vue 3 Composition API
- Adhere to the official Vue.js style guide
- Component naming in PascalCase
- File naming in kebab-case

## Explanation of Configuration Files

### Frontend Configuration Files (vue3-project directory)

| File | Description |
|------|-------------|
| `.env` | Environment variable configuration file |
| `vite.config.js` | Vite build tool configuration |
| `package.json` | Project dependencies and script configuration |
| `jsconfig.json` | JavaScript project configuration |

### Backend Configuration Files (express-project directory)

| File | Description |
|------|-------------|
| `config/config.js` | Main configuration file |
| `.env` | Environment variable configuration file |
| `database_design.md` | Database design document |
| `scripts/init-database.js` | Database initialization script |
| `generate-data.js` | Test data generation script |

## npm Script Commands

### Frontend Scripts (to be executed in the vue3-project directory)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production version |
| `npm run preview` | Preview the production version |

### Backend Scripts (to be executed in the express-project directory)

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start the development server (hot reload) |
| `npm run init-db` | Initialize the database |
| `npm run generate-data` | Generate test data |

## Environment Variable Configuration

### Frontend Environment Variables (vue3-project/.env)

```env
# API server address
VITE_API_BASE_URL=http://localhost:3001/api

# Other frontend configurations
VITE_APP_TITLE=Small石榴Image and Text Community
VITE_USE_REAL_API=true
```

### Backend Environment Variables (express-project/.env)

```env
# Server configuration
NODE_ENV=development
PORT=3001

# JWT configuration
JWT_SECRET=xiaoshiliu_secret_key_2025
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Database configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# API configuration
API_BASE_URL=http://localhost:3001

# Upload configuration
UPLOAD_MAX_SIZE=50mb
```

## Database Script Description

The database-related scripts for the project are all placed in the `express-project/scripts/` directory for easy management and use:

### Script File Introduction

#### 1. Database Initialization Script
- **File Location**: `scripts/init-database.js`
- **Function**: Create the database and all table structures
- **Usage Method**:
  ```bash
  cd express-project
  node scripts/init-database.js
  ```
- **Description**: Must be run for the first deployment, which will automatically create the `xiaoshiliu` database and 12 data tables

#### 2. Test Data Generation Script
- **File Location**: `scripts/generate-data.js`
- **Function**: Generate mock user, note, comment, and other test data
- **Usage Method**:
  ```bash
  cd express-project
  node scripts/generate-data.js
  ```
- **Description**: Optional to run, used to quickly populate test data, including 50 users, 200 notes, and 800 comments, etc.

#### 3. SQL Initialization File
- **File Location**: `scripts/init-database.sql`
- **Function**: Pure SQL version of the database initialization script
- **Usage Method**: Can be directly executed in the MySQL client
- **Description**: Has the same function as `init-database.js`, providing an SQL version for reference

#### 4. Sample Image Update Script
- **File Location**: `scripts/update-sample-images.js`
- **Function**: Automatically obtain the latest image links and update the sample images in the database
- **Usage Method**:
  ```bash
  cd express-project
  node scripts/update-sample-images.js
  ```

- **Description**:
  - Automatically fetches the latest image links from the Liziwen API
  - Updates `imgLinks/avatar_link.txt` (50 avatar links)
  - Updates `imgLinks/post_img_link.txt` (300 note image links)
  - Batch updates user avatars and note images in the database
  - Supports statistics showing the number of images before and after the update

## Development Environment Startup Process

### 1. Start Backend Service

```bash
# Open the first terminal, navigate to the backend directory
cd express-project

# Install backend dependencies (first run)
npm install

# Configure the database (first run)
# Edit config/config.js or .env file

# Initialize the database (first run)
node scripts/init-database.js

# Generate test data (optional)
node scripts/generate-data.js

# Start the backend service
npm start
# The backend service runs at http://localhost:3001
```

### 2. Start Frontend Service

```bash
# Open the second terminal, navigate to the frontend directory
cd vue3-project

# Install frontend dependencies (first run)
npm install

# Configure API address (optional)
# Edit .env file, set VITE_API_BASE_URL

# Start the frontend development server
npm run dev
# The frontend service runs at http://localhost:5173
```

### 3. Access the Application

| Service | Address |
|---------|---------|
| Frontend Interface | http://localhost:5173 |
| Backend API | http://localhost:3001 |