# Installation Guide

## Frontend Dependencies ✅
Frontend dependencies (React, Vite, Tailwind) have been installed successfully!

## Backend Dependencies

### Option 1: Install with SSL bypass (for better-sqlite3)
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED=0
npm install @slack/bolt dotenv express pg better-sqlite3 --save
$env:NODE_TLS_REJECT_UNAUTHORIZED=1
```

### Option 2: Install without better-sqlite3 (use PostgreSQL only)
If you're using PostgreSQL, you can skip better-sqlite3:
```bash
npm install @slack/bolt dotenv express pg --save
```

Then update your `.env` to use `DATABASE_URL` for PostgreSQL.

### Option 3: Use prebuilt binaries
```bash
npm install better-sqlite3 --build-from-source=false
```

## Running the App

### Development Mode

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

Visit: `http://localhost:5173`

### Production Build

```bash
npm run build
npm start
```

## SSL Certificate Issue Fix

The `better-sqlite3` package requires native compilation and is hitting SSL certificate issues. Solutions:

1. **Temporary SSL bypass** (for installation only):
   ```powershell
   $env:NODE_TLS_REJECT_UNAUTHORIZED=0
   npm install better-sqlite3
   $env:NODE_TLS_REJECT_UNAUTHORIZED=1
   ```

2. **Use PostgreSQL instead** (recommended for production):
   - Set `DATABASE_URL` in `.env`
   - The app will automatically use PostgreSQL instead of SQLite

3. **Configure npm to trust your certificate**:
   ```bash
   npm config set cafile /path/to/certificate.pem
   ```

## Current Status

✅ Frontend: React + Vite + Tailwind installed  
⏳ Backend: Install backend dependencies using one of the options above

