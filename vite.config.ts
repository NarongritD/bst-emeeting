import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-db-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/db') && req.method === 'GET') {
            const dbPath = path.resolve(__dirname, 'db.json');
            if (fs.existsSync(dbPath)) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(fs.readFileSync(dbPath, 'utf-8'));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Database not initialized' }));
            }
          } else if (req.url && req.url.startsWith('/api/db') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              const dbPath = path.resolve(__dirname, 'db.json');
              fs.writeFileSync(dbPath, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true }));
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
