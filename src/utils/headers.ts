const CF_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;
const CF_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (CF_CLIENT_ID && CF_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = CF_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = CF_CLIENT_SECRET;
  }
  return headers;
}
