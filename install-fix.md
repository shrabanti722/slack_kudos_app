# Fixing npm install Issues

## Problem
The installation is failing because `better-sqlite3` needs to compile native code and is hitting SSL certificate issues.

## Solutions

### Option 1: Install without better-sqlite3 (Frontend Only)
If you're only working on the frontend React app, you can skip the database dependency:

```bash
npm install --ignore-scripts
```

Then manually install frontend dependencies:
```bash
npm install react react-dom @vitejs/plugin-react tailwindcss autoprefixer postcss vite --save-dev
```

### Option 2: Fix SSL Certificate Issue

#### A. Disable SSL verification (temporary, not recommended for production)
```bash
npm config set strict-ssl false
npm install
npm config set strict-ssl true
```

#### B. Set NODE_TLS_REJECT_UNAUTHORIZED (temporary)
```bash
$env:NODE_TLS_REJECT_UNAUTHORIZED=0
npm install
```

#### C. Use prebuilt binaries (if available)
```bash
npm install better-sqlite3 --build-from-source=false
```

### Option 3: Install Build Tools
Make sure you have the required build tools:
- Visual Studio Build Tools (Windows)
- Python (already detected: Python 3.14.0)

### Option 4: Skip Optional Dependencies
```bash
npm install --no-optional
```

### Option 5: Install Frontend Dependencies Separately
```bash
# Install only frontend dependencies first
npm install react react-dom @vitejs/plugin-react tailwindcss autoprefixer postcss vite --save-dev

# Then try backend dependencies
npm install @slack/bolt dotenv express pg --save

# Skip better-sqlite3 for now (use PostgreSQL instead)
```

## Recommended Approach
Since you're working on the frontend, install frontend dependencies first, then handle the backend separately.

