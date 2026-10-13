import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeartbeatService} from '../heartbeat.js';

function fixture() {
  let time = 1791929000000;
  let stored;
  let ttl;
  const token = 'local-test-token';
  const cache = {get: async () => stored, set: async (key, value, options) => {stored = value; ttl = options.ttl;}};
  const service = createHeartbeatService({cache, token, now: () => time});
  return {service, cache, auth: 'Bearer ' + token, sample: () => ({players: 0, capacity: 64, sentAt: Math.floor(time / 1000)}), advance: ms => time += ms, ttl: () => ttl};
}

test('an authenticated server sample supplies fresh counts and expires after 45 seconds', async () => {
  const f = fixture();
  assert.equal(await f.service.read(), null);
  assert.deepEqual(await f.service.receive(f.auth, f.sample()), {code: 204});
  const result = await f.service.read();
  assert.equal(result.online, true);
  assert.equal(result.players, 0);
  assert.equal(result.capacity, 64);
  assert.equal(result.approximate, false);
  assert.equal(f.ttl(), 45);
  f.advance(45001);
  assert.equal(await f.service.read(), null);
});

test('unauthorized writes never alter the reported server state', async () => {
  const f = fixture();
  for (const header of [undefined, 'Bearer wrong', 'Basic local-test-token', f.auth + 'extra']) {
    assert.equal((await f.service.receive(header, f.sample())).code, 401);
    assert.equal(await f.service.read(), null);
  }
});

test('invalid counts, old samples and future timestamps are rejected', async () => {
  const f = fixture();
  for (const override of [{players: 65}, {players: true}, {capacity: '64'}, {capacity: 0}, {sentAt: f.sample().sentAt - 31}, {sentAt: f.sample().sentAt + 11}]) {
    assert.equal((await f.service.receive(f.auth, {...f.sample(), ...override})).code, 400);
    assert.equal(await f.service.read(), null);
  }
});

test('a delayed heartbeat cannot extend the sample beyond 45 seconds', async () => {
  const f = fixture();
  const sample = f.sample();
  f.advance(29000);
  assert.equal((await f.service.receive(f.auth, sample)).code, 204);
  f.advance(16001);
  assert.equal(await f.service.read(), null);
});

test('disabled configuration and cache failures never report online', async () => {
  const disabled = createHeartbeatService({cache: {}, token: ''});
  assert.equal((await disabled.receive('Bearer anything', {})).code, 503);
  assert.equal(await disabled.read(), null);
  const f = fixture();
  f.cache.set = f.cache.get = async () => {throw Error('Unavailable');};
  assert.equal((await f.service.receive(f.auth, f.sample())).code, 503);
  assert.equal(await f.service.read(), null);
});
