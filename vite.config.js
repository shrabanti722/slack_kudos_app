import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [react()],
    root: './',
    publicDir: false,
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, 'index.html'),
        },
    },
    server: {
        port: 5173,
        strictPort: false,
        allowedHosts: ['all', 'nonenforceable-shandi-mightily.ngrok-free.dev'],
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, res) => {
                        console.error('Proxy error:', err);
                        if (res && !res.headersSent) {
                            res.writeHead(500, {
                                'Content-Type': 'application/json',
                            });
                            res.end(JSON.stringify({
                                success: false,
                                error: 'Backend server is not running. Please start it with "npm run dev"',
                            }));
                        }
                    });
                },
            },
        },
    },
});

