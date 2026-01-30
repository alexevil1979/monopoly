/**
 * Socket.IO game namespace: lobby, rooms, roll/buy/end turn, chat, reconnect.
 * Server-authoritative; validate all actions.
 */
import { createAdapter } from '@socket.io/redis-adapter';
import { loadRoomState } from '../utils/redisClient.js';
import {
  generateRoomCode,
  getOrCreateRoom,
  joinRoom,
  setReady,
  leaveRoom,
  rollDice,
  buyProperty,
  skipBuy,
  jailChoice,
  endTurn,
  getPublicState,
} from '../game/GameRoom.js';

/**
 * Attach game socket handlers to io.
 * @param {import('socket.io').Server} io - Socket.IO server
 * @param {{ useRedis: boolean, redisPub: object|null, redisSub: object|null }} redisOpts - from initRedis()
 */
export function attachGameSocket(io, redisOpts = {}) {
  const { useRedis, redisPub, redisSub } = redisOpts;
  if (useRedis && redisPub && redisSub) {
    io.adapter(createAdapter(redisPub, redisSub));
  }

  io.on('connection', (socket) => {
    socket.on('create_room', async (name, reply) => {
      try {
        const code = generateRoomCode();
        const state = await getOrCreateRoom(code, socket.id, name || 'Player');
        socket.join(`room:${code}`);
        socket.roomCode = code;
        socket.playerName = String(name || 'Player').trim().slice(0, 20);
        reply?.({ ok: true, code, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[create_room]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('join_room', async (payload, reply) => {
      const { code, name } = typeof payload === 'string' ? { code: payload, name: 'Player' } : payload || {};
      if (!code || typeof code !== 'string') {
        reply?.({ ok: false, error: 'Invalid room code' });
        return;
      }
      const normalizedCode = code.toUpperCase().trim().slice(0, 6);
      try {
        const state = await joinRoom(normalizedCode, socket.id, name || 'Player');
        if (!state) {
          const loaded = await loadRoomState(normalizedCode);
          const error =
            loaded?.phase === 'playing'
              ? 'Game already started. You can rejoin within 30 seconds after disconnect.'
              : 'Room full or not found';
          reply?.({ ok: false, error });
          return;
        }
        socket.join(`room:${normalizedCode}`);
        socket.roomCode = normalizedCode;
        socket.playerName = String(name || 'Player').trim().slice(0, 20);
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${normalizedCode}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[join_room]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('set_ready', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await setReady(code, socket.id);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot set ready' });
          return;
        }
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
        if (state.phase === 'playing') {
          io.to(`room:${code}`).emit('game_started', getPublicState(state));
        }
      } catch (err) {
        console.error('[set_ready]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('roll', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await rollDice(code, socket.id);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot roll' });
          return;
        }
        const publicState = getPublicState(state);
        reply?.({ ok: true, state: publicState });
        io.to(`room:${code}`).emit('room_state', publicState);
      } catch (err) {
        console.error('[roll]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('buy', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await buyProperty(code, socket.id);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot buy' });
          return;
        }
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[buy]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('skip_buy', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await skipBuy(code, socket.id);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot skip' });
          return;
        }
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[skip_buy]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('jail_pay', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await jailChoice(code, socket.id, true);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot pay jail' });
          return;
        }
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[jail_pay]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('jail_wait', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await jailChoice(code, socket.id, false);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot wait' });
          return;
        }
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[jail_wait]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('end_turn', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false, error: 'Not in a room' });
        return;
      }
      try {
        const state = await endTurn(code, socket.id);
        if (!state) {
          reply?.({ ok: false, error: 'Cannot end turn' });
          return;
        }
        reply?.({ ok: true, state: getPublicState(state) });
        io.to(`room:${code}`).emit('room_state', getPublicState(state));
      } catch (err) {
        console.error('[end_turn]', err);
        reply?.({ ok: false, error: err.message });
      }
    });

    socket.on('chat', (msg) => {
      const code = socket.roomCode;
      if (!code || typeof msg !== 'string') return;
      const text = String(msg).slice(0, 200);
      const player = socket.playerName || 'Guest';
      io.to(`room:${code}`).emit('chat', { id: socket.id, name: player, text });
    });

    socket.on('sync_state', async (_, reply) => {
      const code = socket.roomCode;
      if (!code) {
        reply?.({ ok: false });
        return;
      }
      try {
        const state = await loadRoomState(code);
        reply?.({ ok: true, state: getPublicState(state) });
      } catch (err) {
        reply?.({ ok: false });
      }
    });

    socket.on('disconnect', async () => {
      const code = socket.roomCode;
      if (!code) return;
      try {
        const state = await leaveRoom(code, socket.id);
        if (state) {
          io.to(`room:${code}`).emit('room_state', getPublicState(state));
          if (state.phase === 'finished') {
            io.to(`room:${code}`).emit('game_ended', getPublicState(state));
          }
        }
      } catch (err) {
        console.error('[disconnect leaveRoom]', err);
      }
    });
  });
}
