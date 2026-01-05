import express from 'express';
import cookieSession from 'cookie-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Use PORT if set, otherwise default to 3001 (3000 might be used by other services)
const PORT = process.env.PORT || 3001;

// Session middleware
app.use(cookieSession({
  name: 'slack-kudos-session',
  keys: [process.env.SESSION_SECRET || 'kudos-secret-key'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve Vite build in production, or redirect to Vite dev server in development
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Serve static files from Vite build directory
  app.use(express.static(join(__dirname, 'dist')));

  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, Vite dev server handles the frontend
  // This server only handles API routes
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>Slack Kudos - Development</title></head>
        <body>
          <h1>Slack Kudos Bot - Development Mode</h1>
          <p>Frontend is running on Vite dev server at <a href="http://localhost:5173">http://localhost:5173</a></p>
          <p>API is available at <a href="/api">/api</a></p>
        </body>
      </html>
    `);
  });
}

// Start web server
export function startWebServer() {
  app.listen(PORT, () => {
    console.log(`🌐 Web server is running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    if (!isProduction) {
      console.log(`💡 Frontend dev server: Run "npm run dev:frontend" to start Vite`);
    }
  });

  return app;
}

export default app;

