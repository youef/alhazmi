import {
  createAuthServer,
  extractNeonAuthCookies,
  NEON_AUTH_SESSION_COOKIE_NAME,
  parseCookieValue,
  serializeSetCookie,
} from '@neondatabase/auth/server';

const rememberPreferenceCookie = NEON_AUTH_SESSION_COOKIE_NAME.replace(/session_token$/, 'dont_remember');

export function memberAuth(request, headers, origin) {
  const cookies = extractNeonAuthCookies(request.headers);
  const auth = createAuthServer({
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET,
    context: () => ({
      getCookies: () => cookies,
      getOrigin: () => origin,
      getHeader: name => request.headers.get(name),
      getFramework: () => 'node',
      setCookie(name, value, options) {
        // Session data is fetched fresh for protected pages.
        if (name !== NEON_AUTH_SESSION_COOKIE_NAME && name !== rememberPreferenceCookie) return;
        headers.append('Set-Cookie', serializeSetCookie({
          name, value, path: '/', expires: options.expires, maxAge: options.maxAge,
          sameSite: 'lax', secure: true, httpOnly: true,
        }));
      },
    }),
  });

  return {
    auth,
    async session() {
      if (!parseCookieValue(cookies, NEON_AUTH_SESSION_COOKIE_NAME)) return null;
      const { data, error } = await auth.getSession({ query: { disableCookieCache: 'true' } });
      if (error && error.status >= 500) throw new Error('Could not verify member session');
      return data?.session && data?.user?.emailVerified === true ? data.user : null;
    },
  };
}
