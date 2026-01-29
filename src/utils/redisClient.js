/**
 * Redis client for game state and Socket.IO adapter.
 * If Redis is unavailable, falls back to in-memory store (no Redis adapter).
 */
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CONNECT_TIMEOUT_MS = 2000;

/** In-memory store when Redis is unavailable */
const memoryStore = new Map();

let useRedis = false;
let redis = null;
let redisPub = null;
let redisSub = null;
let initDone = false;

function onRedisError(err) {
  console.error('[Redis] Error:', err?.message || err?.code || String(err));
}

function onRedisConnect() {
  console.log('[Redis] Connected');
}

/**
 * Initialize Redis. Tries to connect; on failure uses in-memory store.
 * @returns {Promise<{ useRedis: boolean, redisPub: Redis|null, redisSub: Redis|null }>}
 */
export function initRedis() {
  if (initDone) {
    return Promise.resolve({
      useRedis,
      redisPub,
      redisSub,
    });
  }
  return new Promise((resolve) => {
    const client = new Redis(REDIS_URL, {
      connectTimeout: CONNECT_TIMEOUT_MS,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
      lazyConnect: true,
    });

    const done = (connected) => {
      if (initDone) return;
      initDone = true;
      if (connected) {
        useRedis = true;
        redis = client;
        redisPub = new Redis(REDIS_URL, {
          maxRetriesPerRequest: null,
          retryStrategy(times) {
            return Math.min(times * 100, 3000);
          },
        });
        redisSub = new Redis(REDIS_URL, {
          maxRetriesPerRequest: null,
          retryStrategy(times) {
            return Math.min(times * 100, 3000);
          },
        });
        redis.on('error', onRedisError);
        redis.on('connect', onRedisConnect);
        redisPub.on('error', onRedisError);
        redisPub.on('connect', onRedisConnect);
        redisSub.on('error', onRedisError);
        redisSub.on('connect', onRedisConnect);
        console.log('[Redis] Using Redis for state and Socket.IO adapter');
        resolve({ useRedis: true, redisPub, redisSub });
      } else {
        client.quit().catch(() => {});
        console.log('[Redis] Unavailable — using in-memory store (data lost on restart). Start Redis for persistence.');
        resolve({ useRedis: false, redisPub: null, redisSub: null });
      }
    };

    client.connect().then(() => done(true)).catch(() => done(false));

    setTimeout(() => {
      if (!initDone) done(false);
    }, CONNECT_TIMEOUT_MS + 500);
  });
}

/** Key prefixes */
export const KEYS = {
  ROOM: (code) => `room:${code}`,
  ROOM_LIST: 'rooms:list',
  PLAYER: (roomCode, socketId) => `room:${roomCode}:player:${socketId}`,
};

/**
 * Save room state (Redis or memory).
 */
export async function saveRoomState(code, state) {
  const key = KEYS.ROOM(code);
  const value = JSON.stringify(state);
  if (useRedis && redis) {
    await redis.set(key, value, 'EX', 86400);
    await redis.sadd(KEYS.ROOM_LIST, code);
  } else {
    memoryStore.set(key, value);
  }
}

/**
 * Load room state (Redis or memory).
 * @returns {Promise<object|null>}
 */
export async function loadRoomState(code) {
  const key = KEYS.ROOM(code);
  if (useRedis && redis) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  const raw = memoryStore.get(key);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Delete room state (Redis or memory).
 */
export async function deleteRoomState(code) {
  const key = KEYS.ROOM(code);
  if (useRedis && redis) {
    const pattern = `room:${code}:player:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
    await redis.del(key);
    await redis.srem(KEYS.ROOM_LIST, code);
  } else {
    memoryStore.delete(key);
  }
}

/**
 * Graceful shutdown: close Redis connections.
 */
export async function closeRedis() {
  if (redis) await redis.quit().catch(() => {});
  if (redisPub) await redisPub.quit().catch(() => {});
  if (redisSub) await redisSub.quit().catch(() => {});
  redis = redisPub = redisSub = null;
  useRedis = false;
  initDone = false;
  console.log('[Redis] Connections closed');
}
