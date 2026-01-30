/**
 * Monopoly Online — entry point.
 * Express (lobby, health) + Socket.IO (game) + Redis adapter & state.
 */
try { await import('dotenv/config'); } catch (_) { /* optional */ }
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Server } from 'socket.io';
import { attachGameSocket } from './sockets/gameSocket.js';
import { initRedis, closeRedis } from './utils/redisClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Favicon: avoid 404 (browser often requests /favicon.ico)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// 404: plain text only, so /js/* never gets HTML (avoids "Unexpected token '<'" when a script URL returns index.html)
app.use((req, res) => {
  res.status(404).type('text/plain').send('Not Found');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

async function start() {
  const { useRedis, redisPub, redisSub } = await initRedis();
  attachGameSocket(io, { useRedis, redisPub, redisSub });
  httpServer.listen(PORT, () => {
    console.log(`[Server] listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`[Server] ${signal} received, shutting down...`);
  httpServer.close(() => {
    closeRedis().then(() => process.exit(0)).catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
