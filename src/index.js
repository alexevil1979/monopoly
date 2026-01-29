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

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
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
