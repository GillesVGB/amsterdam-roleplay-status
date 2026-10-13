import {timingSafeEqual} from 'node:crypto';

const ttlSeconds = 45;
const key = '31.56.25.179:30120';
const validCounts = (players, capacity) => Number.isInteger(players) && Number.isInteger(capacity)
  && players >= 0 && capacity >= 1 && capacity <= 10000 && players <= capacity;

export function createHeartbeatService({cache, token = '', now = Date.now}) {
  function authorized(header) {
    if (!token || typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
    const supplied = Buffer.from(header.slice(7));
    const expected = Buffer.from(token);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  }

  return {
    async receive(header, data) {
      if (!token) return {code: 503, error: 'HEARTBEAT_NOT_CONFIGURED'};
      if (!authorized(header)) return {code: 401, error: 'UNAUTHORIZED'};
      const receivedAt = now();
      if (!validCounts(data?.players, data?.capacity) || !Number.isInteger(data?.sentAt)) {
        return {code: 400, error: 'INVALID_HEARTBEAT'};
      }
      const age = receivedAt - data.sentAt * 1000;
      if (age > 30000 || age < -10000) return {code: 400, error: 'HEARTBEAT_TOO_OLD'};
      try {
        await cache.set(key, {players: data.players, capacity: data.capacity, sentAt: data.sentAt, receivedAt}, {ttl: ttlSeconds});
        return {code: 204};
      } catch {
        console.warn('FiveM heartbeat cache write failed');
        return {code: 503, error: 'HEARTBEAT_STORAGE_UNAVAILABLE'};
      }
    },

    async read() {
      if (!token) return null;
      let data;
      try { data = await cache.get(key); } catch {
        console.warn('FiveM heartbeat cache read failed');
        return null;
      }
      if (!validCounts(data?.players, data?.capacity) || !Number.isInteger(data?.sentAt)
        || !Number.isFinite(data?.receivedAt)) return null;
      const current = now();
      if (current - data.receivedAt > ttlSeconds * 1000 || data.receivedAt > current
        || current - data.sentAt * 1000 > ttlSeconds * 1000 || data.sentAt * 1000 > current + 10000) return null;
      const checkedAt = new Date(data.sentAt * 1000).toISOString();
      return {
        serverName: 'Heerlen Roleplay', source: 'FiveM heartbeat',
        join: 'fivem://connect/31.56.25.179:30120', joinUrl: 'fivem://connect/31.56.25.179:30120',
        online: true, status: 'online', players: data.players, maxPlayers: data.capacity,
        capacity: data.capacity, queue: null, maintenance: false, maintenanceText: '',
        updatedAt: checkedAt, checkedAt, approximate: false,
        message: 'Actuele spelerstelling rechtstreeks van de FiveM-server.',
      };
    },
  };
}
