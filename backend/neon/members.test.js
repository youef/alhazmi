import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { dashboard } from './member-views.js';
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
    if (sql.includes('user_custom_role_assignments') || sql.includes('permission_overrides')) return { rows: [] };
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
  assert.doesNotMatch(body, /<script>hidden<\/script>/);
  const dashboard = await members.fetch(new Request(`${origin}/dashboard`, { headers }));
  assert.equal(dashboard.status, 200);
  assert.doesNotMatch(await dashboard.text(), /href="\/dashboard\/audit"/);
  const direct = await members.fetch(new Request(`${origin}/dashboard/audit`, { headers }));
  assert.equal(direct.status, 403);
});

test('unlinked system administrators can reach audit but not personal genealogy', async () => {
  pool.query = async (sql, args) => {
    if (sql.includes('neon_auth')) return { rows: [{ id: userId, person_id: null }] };
    if (sql.includes('user_custom_role_assignments')) return { rows: [{ decision: 'allow', scope_type: 'system' }] };
    if (sql.includes('permission_overrides')) return { rows: [] };
    if (sql.includes('permission_audit_events')) return { rows: [{ event_type: 'admin_access', outcome: 'success' }] };
    throw new Error('Unexpected SQL: ' + sql);
  };
  const request = path => new Request(origin + path, { headers });
  const dashboard = await members.fetch(request('/dashboard'));
  assert.equal(dashboard.status, 200);
  const body = await dashboard.text();
  assert.match(body, /href="\/dashboard\/audit"/);
  assert.doesNotMatch(body, /href="\/dashboard\/profile"/);
  const audit = await members.fetch(request('/dashboard/audit'));
  assert.equal(audit.status, 200);
  assert.match(await audit.text(), /admin_access/);
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

test('member home reflects the saved session and signed-in users skip the login form', async () => {
  const guest = await members.fetch(new Request(`${origin}/`));
  assert.match(await guest.text(), /href="\/register"/);

  const home = await members.fetch(new Request(`${origin}/`, { headers }));
  const body = await home.text();
  assert.equal(home.status, 200);
  assert.match(body, /href="\/dashboard"/);
  assert.match(body, /action="\/logout"/);
  assert.match(home.headers.get('cache-control'), /no-store/);

  const login = await members.fetch(new Request(`${origin}/login`, { headers }));
  assert.equal(login.status, 303);
  assert.equal(login.headers.get('location'), '/dashboard');
});

test('remember me forwards the preference and preserves secure session cookie attributes', async () => {
  for (const remember of [true, false]) {
    globalThis.fetch = async (url, options) => {
      if (new URL(url).pathname === '/auth/get-session') return Response.json(null);
      assert.equal(new URL(url).pathname, '/auth/sign-in/email');
      assert.equal(JSON.parse(options.body).rememberMe, remember);
      const expires = remember ? '; Max-Age=604800' : '';
      return Response.json({}, { headers: {
        'Set-Cookie': `__Secure-neon-auth.session_token=fixture; Secure; HttpOnly${expires}`,
      } });
    };
    const fields = new URLSearchParams({ email: 'test@example.test', password: 'test-password' });
    if (remember) fields.set('rememberMe', 'yes');
    const result = await members.fetch(new Request(`${origin}/login`, {
      method: 'POST', headers: { Origin: origin }, body: fields,
    }));
    assert.equal(result.status, 303);
    const [sessionCookie] = result.headers.getSetCookie();
    assert.match(sessionCookie, /HttpOnly/i);
    assert.match(sessionCookie, /Secure/i);
    assert.match(sessionCookie, /SameSite=Lax/i);
    assert.equal(/max-age=604800/i.test(sessionCookie), remember);
  }
});

test('member pages authorize the exact inline portal script and approved brand assets', async () => {
  const response = await members.fetch(new Request(origin + '/login'));
  const source = (await response.text()).match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source);
  const hash = createHash('sha256').update(source).digest('base64');
  const policy = response.headers.get('content-security-policy');
  assert.ok(policy.includes("script-src 'sha256-" + hash + "';"));
  assert.ok(policy.includes('img-src https://youef.github.io/alhazmi/brand/;'));
});

test('service categories and search only include accessible dashboard modules', () => {
  const html = dashboard(user, ['profile', 'notifications'], 'نشط');
  assert.match(html, /href="\/dashboard\/profile"/);
  assert.match(html, /href="\/dashboard\/notifications"/);
  assert.match(html, /data-service-category="membership"/);
  assert.doesNotMatch(html, /data-service-category="system"/);
  assert.doesNotMatch(html, /href="\/dashboard\/audit"/);
  assert.doesNotMatch(html, /href="\/admin\/genealogy"/);
});
