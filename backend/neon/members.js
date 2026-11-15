import { createHash } from 'node:crypto';
import { accountFromId, authorized, HttpError, route } from './shared.js';
import { accessibleModules, readModule } from './api.js';
import { ADMIN_SECTIONS, adminAction, adminData, csrfFor } from './admin.js';
import { familyAction, familyAdminData, familySupervisorData } from './family-management.js';
import { familyAdminView, familyMemberView } from './family-views.js';
import { adminView } from './admin-views.js';
import { memberAuth } from './member-auth.js';
import { authPage, dashboard, memberHome, moduleNames, modulePage, page, profilePage, portalScript } from './member-views.js';

const publicForms = new Set(['login', 'register', 'verify', 'forgot', 'reset']);
const maxFormBytes = 8192;
const minute = 60;
const inlineScriptHash = createHash('sha256').update(portalScript).digest('base64');

function headersForPage() {
  return new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'sha256-${inlineScriptHash}'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'X-Content-Type-Options': 'nosniff',
    // HTML form submissions need a non-opaque Origin for the CSRF check.
    'Referrer-Policy': 'same-origin',
    'X-Robots-Tag': 'noindex',
  });
}

function redirect(headers, location) {
  headers.set('Location', location);
  return new Response(null, { status: 303, headers });
}

async function readForm(request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded') {
    throw new HttpError(415, 'Unsupported form');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Form required');
  const decoder = new TextDecoder();
  let size = 0;
  let encoded = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxFormBytes) {
      await reader.cancel();
      throw new HttpError(413, 'Form is too large');
    }
    encoded += decoder.decode(value, { stream: true });
  }
  return new URLSearchParams(encoded + decoder.decode());
}

const nameFrom = form => (form.get('name') || '').trim();
const emailFrom = form => (form.get('email') || '').trim().toLowerCase();
const passwordFrom = form => form.get('password') || '';
const validEmail = email => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = password => password.length >= 8 && password.length <= 128;
const validToken = token => /^[A-Za-z0-9_.~-]{1,512}$/.test(token);

async function submitAuth(kind, form, auth, origin, headers) {
  const html = (message, level = 400, token = '') => new Response(authPage(kind, message, token, level >= 400), { status: level, headers });
  const email = emailFrom(form);
  const password = passwordFrom(form);
  const formError = 'راجع الحقول المطلوبة وحاول مرة أخرى.';
  if (kind !== 'reset' && !validEmail(email)) return html(formError);

  switch (kind) {
    case 'login': {
      if (!password || password.length > 128) return html(formError);
      const { error } = await auth.signIn.email({ email, password, rememberMe: form.get('rememberMe') === 'yes' });
      if (!error) return redirect(headers, '/dashboard');
      if (error.status >= 500) return html('خدمة تسجيل الدخول غير متاحة مؤقتًا.', 503);
      if (error.status === 429) return html('كثرت المحاولات. انتظر قليلًا ثم أعد المحاولة.', 429);
      if (error.code === 'EMAIL_NOT_VERIFIED') return redirect(headers, '/verify');
      return html('تعذّر تسجيل الدخول. راجع البريد وكلمة المرور، وأكّد بريدك عند الحاجة.', 401);
    }
    case 'register': {
      const name = nameFrom(form);
      if (!name || name.length > 100 || !validPassword(password)) return html(formError);
      const { error } = await auth.signUp.email({ name, email, password });
      if (error?.status >= 500) return html('خدمة إنشاء الحساب غير متاحة مؤقتًا.', 503);
      if (error?.status === 429) return html('انتظر قليلًا ثم أعد المحاولة.', 429);
      return redirect(headers, '/verify');
    }
    case 'verify': {
      const otp = form.get('otp') || '';
      if (!/^\d{6}$/.test(otp)) return html(formError);
      const { error } = await auth.emailOtp.verifyEmail({ email, otp });
      if (error) return html('تعذّر تأكيد البريد. تحقق من الرمز أو أعد تسجيل الدخول لطلب رمز جديد.', error.status >= 500 ? 503 : 400);
      return redirect(headers, '/dashboard');
    }
    case 'forgot': {
      const { error } = await auth.requestPasswordReset({ email, redirectTo: new URL('/reset', origin).href });
      if (error?.status >= 500) return html('خدمة الاستعادة غير متاحة مؤقتًا.', 503);
      return html('إذا كان البريد مسجّلًا فستصلك رسالة تعليمات الاستعادة.', 200);
    }
    case 'reset': {
      const token = form.get('token') || '';
      if (!validToken(token)) return redirect(headers, '/forgot');
      if (!validPassword(password)) return html(formError, 400, token);
      const { error } = await auth.resetPassword({ token, newPassword: password });
      return error ? html('تعذّر حفظ كلمة المرور. اطلب رابط استعادة جديدًا.', 400, token) : redirect(headers, '/login');
    }
    default:
      throw new HttpError(404, 'Unknown form');
  }
}

function membershipStatus(account) {
  if (account.account_status === 'active' && account.record_status === 'verified' && account.person_id) return 'عضو موثّق';
  return account.person_id ? 'قيد التفعيل' : 'لم يُربط بسجل عضوية';
}

export default {
  async fetch(request) {
    const path = route(request);
    if (path === '/health') return Response.json({ ok: true, service: 'diwanmembers' });
    const headers = headersForPage();
    const html = (content, status = 200) => new Response(content, { status, headers });
    try {
      const origin = new URL(process.env.DIWAN_MEMBER_ORIGIN).origin;
      const url = new URL(request.url);
      if (request.method !== 'GET' && request.method !== 'POST') {
        headers.set('Allow', 'GET, POST');
        return html(page('طريقة غير مدعومة', '<p>هذا المسار يقبل العرض وإرسال النماذج.</p>'), 405);
      }
      if (request.method === 'POST' && request.headers.get('origin') !== origin) {
        return html(page('طلب مرفوض', '<p>أعد فتح الصفحة من بوابة الديوان الرسمية.</p>'), 403);
      }
      const { auth, session } = memberAuth(request, headers, origin);
      if (path === '/' && request.method === 'GET') {
        const user = await session();
        const account = user ? await accountFromId(user.id) : null;
        return html(memberHome(user, account ? membershipStatus(account) : null));
      }
      const formName = path.slice(1);
      if (publicForms.has(formName)) {
        if (request.method === 'POST') return await submitAuth(formName, await readForm(request), auth, origin, headers);
        if (formName === 'login') {
          const user = await session();
          if (user) {
            try {
              await accountFromId(user.id);
              return redirect(headers, '/dashboard');
            } catch (error) {
              if (!(error instanceof HttpError && [401, 403].includes(error.status))) throw error;
            }
          }
        }
        if (formName === 'reset') {
          const token = url.searchParams.get('token') || '';
          return validToken(token) ? html(authPage(formName, '', token)) : redirect(headers, '/forgot');
        }
        const verified = formName === 'verify' ? 'أدخل الرمز الذي أرسل إلى بريدك الإلكتروني.' : '';
        return html(authPage(formName, verified));
      }

      if (path === '/logout' && request.method === 'POST') {
        const { error } = await auth.signOut();
        if (error?.status >= 500) return html(page('تعذّر تسجيل الخروج', '<p>أعد المحاولة لإنهاء الجلسة.</p>', true), 503);
        return redirect(headers, '/login');
      }

      const user = await session();
      if (!user) return redirect(headers, '/login');
      const account = await accountFromId(user.id);
      const status = membershipStatus(account);
      if (path === '/admin/supervisors') {
        if (request.method === 'POST')
          return redirect(headers, await familyAction(account, request, await readForm(request), 'admin'));
        const data = await familyAdminData(account);
        return html(familyAdminView(data, csrfFor(account,request), url.searchParams.get('done') === '1'));
      }
      if (path === '/family/manage') {
        if (request.method === 'POST')
          return redirect(headers, await familyAction(account, request, await readForm(request), 'family'));
        const data = await familySupervisorData(account);
        return html(familyMemberView(data, csrfFor(account,request), url.searchParams.get('done') === '1'));
      }
      if (path === '/admin' || path.startsWith('/admin/')) {
        const section = path === '/admin' ? 'overview' : path.slice('/admin/'.length);
        if (!ADMIN_SECTIONS.includes(section)) return html(page('الصفحة غير موجودة', '<p>القسم الإداري غير موجود.</p>', true), 404);
        if (request.method === 'POST') {
          return redirect(headers, await adminAction(account, section, request, await readForm(request)));
        }
        const {data, filter} = await adminData(account, section, url);
        return html(adminView(section, user, data, filter, csrfFor(account, request), url.searchParams.get('done') === '1'));
      }
      if (path === '/dashboard' && request.method === 'GET') {
        const [modules, isAdmin] = await Promise.all([accessibleModules(account), authorized(account, 'roles.view')]);
        return html(dashboard(user, modules, status, isAdmin));
      }
      if (path === '/profile' && request.method === 'GET') return html(profilePage(user, status));
      if (path === '/profile' && request.method === 'POST') {
        const name = nameFrom(await readForm(request));
        if (!name || name.length > 100) return html(profilePage(user, status, 'أدخل اسمًا صالحًا.', true), 400);
        const { error } = await auth.updateUser({ name });
        return error ? html(profilePage(user, status, 'تعذّر حفظ الاسم.', true), 400) : redirect(headers, '/profile');
      }
      if (path === '/profile/password' && request.method === 'POST') {
        const form = await readForm(request);
        const currentPassword = form.get('currentPassword') || '';
        const newPassword = passwordFrom(form);
        if (!currentPassword || currentPassword.length > 128 || !validPassword(newPassword)) {
          return html(profilePage(user, status, 'أدخل كلمة المرور الحالية وكلمة مرور جديدة صالحة.', true), 400);
        }
        const { error } = await auth.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
        return html(profilePage(user, status, error ? 'تعذّر تغيير كلمة المرور.' : 'تم تغيير كلمة المرور.', !!error), error ? 400 : 200);
      }
      const match = /^\/dashboard\/([A-Za-z]+)$/.exec(path);
      if (match && request.method === 'GET' && Object.hasOwn(moduleNames, match[1])) {
        const { items } = await readModule(match[1], account);
        return html(modulePage(match[1], items));
      }
      return html(page('الصفحة غير موجودة', '<p>تحقق من الرابط أو عد إلى لوحة التحكم.</p>', true), 404);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('member request failed', error?.code || error?.name);
        headers.set('Retry-After', String(minute));
        return html(page('الخدمة غير متاحة', '<p>تعذّر إكمال الطلب. حاول مرة أخرى بعد قليل.</p>'), 503);
      }
      return html(page('تعذّر إكمال الطلب', '<p>' + (path.startsWith('/admin') ? 'لم ينفّذ الإجراء: ' + error.message.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])) : 'تأكد من صلاحية الحساب والبيانات المدخلة.') + '</p>', [403, 404].includes(error.status)), error.status);
    }
  },
};
