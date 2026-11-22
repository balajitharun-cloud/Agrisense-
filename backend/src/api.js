import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { createRouter } from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApiApp({ serveFrontend = true, logging = true } = {}) {
  const app = express();

  app.disable('x-powered-by');
  if (logging) {
    app.use((req, res, next) => {
      res.on('finish', () => {
        if (req.path === '/health' && res.statusCode === 200) return;
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`);
      });
      next();
    });
  }

  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  const router = createRouter();
  app.use('/api', router);
  if (!serveFrontend) {
    app.use('/', router);
  }

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()), time: new Date().toISOString() });
  });

  if (serveFrontend) {
    const distDir = path.resolve(__dirname, '../../frontend/dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir, {
        index: 'index.html',
        maxAge: '1h',
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
        }
      }));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') return next();
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error('[agrisense] error:', err && err.message);
    res.status(err && err.status ? err.status : 500).json({ error: (err && err.message) || 'Internal error' });
  });

  return app;
}
