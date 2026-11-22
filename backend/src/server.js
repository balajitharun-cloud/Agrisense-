import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import { createApiApp } from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const app = createApiApp({ serveFrontend: true, logging: true });

app.listen(PORT, () => {
  const distDir = path.resolve(__dirname, '../../frontend/dist');
  const distOk = fs.existsSync(distDir);
  console.log('');
  console.log('  AgriSense — field intelligence, in real time');
  console.log('');
  console.log(`  API:       http://localhost:${PORT}/api`);
  console.log(`  Health:    http://localhost:${PORT}/health`);
  if (distOk) {
    console.log(`  App:       http://localhost:${PORT}   (serving frontend/dist)`);
  } else {
    console.log(`  App:       run "npm run dev" in frontend/ on :5173 (frontend/dist not built)`);
  }
  console.log('');
});
