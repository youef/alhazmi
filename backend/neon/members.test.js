import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import members from './members.js';
import { pool } from './shared.js';

const origin = 'https://members.example.test';
const userId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const cookie = '__Secure-neon-auth.session_token=fixture';
const headers = { Cookie: cookie };
const user = { id: userId, name: '<script>hidden</script>', email: 'test@example.test', emailVerified: true };
let originalFetch;
let originalQuery;

beforeEach(() => {
  process.env.NEON_AUTH_BASE_URL = 'https://auth.example.test/auth';
  process.env.NEON_AUTH_COOKIE_SECRET = 'test-only-secret-0000000000000000000000';
  process.env.DIWAN_MEMBER_ORIGIN = origin;
  originalFetch = globalThis.fetch;
  originalQuery = pool.query;
  globalThis.fetch = async url => {
    assert.equal(new URL(url).pathname, '/auth/get-session');
    assert.equal(new URL(url).searchParams.get('disableCookieCache'), 'true');
    return Response.json({ user, session: { userId } });
  };
  pool.query = async sql => {
    assert.match(sql, /neon_auth/);
    return { rows: [{ id: userId, person_id: null }] };
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  pool.query = originalQuery;
});

test('anonymous users are redirected from protected pages', async () => {
  const response = await members.fetch(new Request(`${origin}/dashboard`));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/login');
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('same-origin form submissions reach Neon Auth', async () => {
  const login = await members.fetch(new Request(`${origin}/login`));
  assert.equal(login.headers.get('referrer-policy'), 'same-origin');
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/auth/sign-in/email');
    assert.equal(new Headers(options.headers).get('origin'), origin);
    return Response.json({ code: 'INVALID_EMAIL_OR_PASSWORD' }, { status: 401 });
  };
  const response = await members.fetch(new Request(`${origin}/login`, {
    method: 'POST', headers: { Origin: origin },
    body: new URLSearchParams({ email: 'test@example.test', password: 'test-password' }),
  }));
  assert.equal(response.status, 401);
  assert.match(await response.text(), /تعذّر تسجيل الدخول/);
});

test('cross-origin forms cannot log in or sign out', async () => {
  for (const path of ['/login', '/logout', '/profile']) {
    for (const headers of [{ Origin: 'https://other.example.test' }, { Origin: 'null' }, {}]) {
      const response = await members.fetch(new Request(origin + path, { method: 'POST', headers }));
      assert.equal(response.status, 403);
    }
  }
});

test('unlinked users can edit their profile but cannot read membership modules', async () => {
  const profile = await members.fetch(new Request(`${origin}/profile`, { headers }));
  assert.equal(profile.status, 200);
  const body = await profile.text();
  assert.match(body, /&lt;script&gt;hidden/);
  assert.doesNotMatch(body, /<script>/);
  const dashboard = await members.fetch(new Request(`${origin}/dashboard`, { headers }));
  assert.equal(dashboard.status, 200);
  assert.doesNotMatch(await dashboard.text(), /href="\/dashboard\/audit"/);
  const direct = await members.fetch(new Request(`${origin}/dashboard/audit`, { headers }));
  assert.equal(direct.status, 403);
});

test('system modules require a system scope and recheck permissions on page access', async () => {
  let scope = 'tribe';
  const tribeId = '33333333-3333-4333-8333-333333333333';
  pool.query = async (sql, args) => {
    if (sql.includes('neon_auth')) return { rows: [{ id: userId, person_id: personId, tribe_id: tribeId, account_status: 'active', record_status: 'verified' }] };
    if (sql.includes('user_custom_role_assignments')) return { rows: args[1] === 'audit.read' ? [{ decision: 'allow', scope_type: scope, scope_tribe_id: tribeId }] : [] };
    if (sql.includes('permission_overrides')) return { rows: [] };
    assert.match(sql, /permission_audit_events/);
    return { rows: [{ event_type: 'role_updated', outcome: 'success' }] };
  };
  const request = (path) => new Request(origin + path, { headers });
  assert.equal((await members.fetch(request('/dashboard/audit'))).status, 403);
  scope = 'system';
  const dashboard = await members.fetch(request('/dashboard'));
  assert.match(await dashboard.text(), /href="\/dashboard\/audit"/);
  const audit = await members.fetch(request('/dashboard/audit'));
  assert.equal(audit.status, 200);
  assert.match(await audit.text(), /role_updated/);
  scope = 'tribe';
  assert.equal((await members.fetch(request('/dashboard/audit'))).status, 403);
});
