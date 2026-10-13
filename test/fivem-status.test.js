import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createFiveMStatusReader, requestJsonNative} from '../fivem-status.js';

const noListing = async () => { throw Error('Listing unavailable'); };
const listing = (override = {}) => ({
  EndPoint: 'y994lqm',
  Data: {clients: 0, sv_maxclients: 64, connectEndPoints: ['31.56.25.179:30120'], lastSeen: new Date().toISOString(), ...override},
});

async function withServer(handler, run) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await run('http://127.0.0.1:' + server.address().port);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('subpath reads live 0/64 counts while the bare dynamic endpoint stalls', async () => {
  const paths = [];
  await withServer((req, res) => {
    paths.push(req.url);
    if (req.url !== '/dynamic.json/status') return;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({clients: 0, sv_maxclients: '64'}));
  }, async origin => {
    let listingCalls = 0;
    const read = createFiveMStatusReader({
      url: origin + '/dynamic.json/status',
      fallbackUrl: origin + '/dynamic.json',
      listingFetcher: async () => { listingCalls++; throw Error('Should not fetch'); },
    });
    const result = await read();
    assert.equal(result.online, true);
    assert.equal(result.status, 'online');
    assert.equal(result.players, 0);
    assert.equal(result.maxPlayers, 64);
    assert.equal(result.capacity, 64);
    assert.equal(result.approximate, false);
    assert.equal(result.maintenance, false);
    assert.deepEqual(paths, ['/dynamic.json/status']);
    assert.equal(listingCalls, 0);
  });
});

test('ordinary endpoint remains a fallback when the subpath is unsupported', async () => {
  const paths = [];
  await withServer((req, res) => {
    paths.push(req.url);
    if (req.url !== '/dynamic.json') { res.writeHead(404); res.end(); return; }
    res.end(JSON.stringify({clients: 12, sv_maxclients: '64'}));
  }, async origin => {
    const result = await createFiveMStatusReader({
      url: origin + '/dynamic.json/status',
      fallbackUrl: origin + '/dynamic.json',
      listingFetcher: noListing,
    })();
    assert.equal(result.online, true);
    assert.equal(result.players, 12);
    assert.equal(result.capacity, 64);
    assert.deepEqual(paths, ['/dynamic.json/status', '/dynamic.json']);
  });
});

test('production defaults use the subpath on the configured game IP', async () => {
  let requested;
  const result = await createFiveMStatusReader({
    requestJson: async url => { requested = url; return {clients: 2, sv_maxclients: 64}; },
    listingFetcher: noListing,
  })();
  assert.equal(requested, 'http://31.56.25.179:30120/dynamic.json/status');
  assert.equal(result.players, 2);
  assert.equal(result.joinUrl, 'fivem://connect/31.56.25.179:30120');
});

test('malformed counts and network errors do not invent an offline count', async () => {
  for (const requestJson of [
    async () => ({clients: 65, sv_maxclients: 64}),
    async () => ({clients: null, sv_maxclients: 64}),
    async () => null,
    async () => { throw Error('Failure'); },
  ]) {
    const result = await createFiveMStatusReader({requestJson, listingFetcher: noListing})();
    assert.equal(result.status, 'unreachable');
    assert.equal(result.online, false);
    assert.equal(result.players, null);
    assert.equal(result.capacity, null);
    assert.equal(result.maintenance, false);
  }
});

test('native request timeout closes a stalled socket', async () => {
  await withServer(() => {}, async origin => {
    await assert.rejects(requestJsonNative(origin, {timeoutMs: 50}), error => error.code === 'TIMEOUT');
  });
});

test('a stopped server stays unreachable even while FiveM still lists it', async () => {
  const requested = [];
  const result = await createFiveMStatusReader({
    requestJson: async url => { requested.push(url); throw Error('Timeout'); },
    listingFetcher: async () => Response.json(listing()),
  })();
  assert.deepEqual(requested, [
    'http://31.56.25.179:30120/dynamic.json/status',
    'http://31.56.25.179:30120/dynamic.json',
  ]);
  assert.equal(result.status, 'unreachable');
  assert.equal(result.online, false);
  assert.equal(result.players, null);
  assert.equal(result.maxPlayers, null);
  assert.equal(result.lastKnown.players, 0);
  assert.equal(result.lastKnown.capacity, 64);
  assert.equal(result.maintenance, false);
});

test('fallback rejects another server, stale data, missing timestamps and impossible counts', async () => {
  for (const override of [
    {connectEndPoints: ['1.2.3.4:30120']},
    {lastSeen: new Date(Date.now() - 660000).toISOString()},
    {lastSeen: null},
    {clients: 65},
  ]) {
    const result = await createFiveMStatusReader({
      requestJson: async () => { throw Error('Timeout'); },
      listingFetcher: async () => Response.json(listing(override)),
    })();
    assert.equal(result.status, 'unreachable');
    assert.equal(result.players, null);
  }
});
