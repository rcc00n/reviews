const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server');
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'feedback-fixture-'));
  const file = path.join(directory, 'feedbacks.json');
  const server = createApp({ feedbackFile: file }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(directory, { recursive: true }); });
  const url = `http://127.0.0.1:${server.address().port}/submit-feedback`;
  const send = (data = {}) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Synthetic Visitor', email: 'person@example.test', comments: 'Synthetic feedback', ...data }) });
  return { file, url, send };
}
test('concurrent accepted submissions all persist exactly once', async t => {
  const { file, send } = await fixture(t);
  const replies = await Promise.all(Array.from({ length: 20 }, (_, n) => send({ comments: `Fixture ${n}` })));
  assert.ok(replies.every(reply => reply.status === 200));
  const saved = JSON.parse(await fs.readFile(file));
  assert.equal(saved.length, 20); assert.equal(new Set(saved.map(x => x.comments)).size, 20);
});
test('corrupt storage is preserved and recovered requests can subsequently succeed', async t => {
  const { file, send } = await fixture(t);
  await fs.writeFile(file, 'malformed-local-fixture');
  const response = await send(); assert.equal(response.status, 503);
  assert.equal(await fs.readFile(file, 'utf8'), 'malformed-local-fixture');
  assert.ok(!(await response.text()).includes(file));
  await fs.writeFile(file, '[]'); assert.equal((await send()).status, 200);
});
test('invalid fields, malformed JSON, and large bodies never persist', async t => {
  const { file, url, send } = await fixture(t);
  for (const data of [{ name: '' }, { email: 'bad' }, { comments: [] }, { comments: 'a'.repeat(5001) }]) assert.equal((await send(data)).status, 400);
  assert.equal((await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await send({ comments: 'x'.repeat(20000) })).status, 413);
  await assert.rejects(fs.readFile(file), { code: 'ENOENT' });
});
