// Public, read-only connection. Never place Neon database credentials in this file.
export const API_BASE = 'https://br-flat-boat-azy2ouq3-diwanapi.compute.c-3.ap-southeast-1.aws.neon.tech';

export type PublicUnit = {
  id: string;
  parent_id: string | null;
  unit_type: string;
  name_ar: string;
  name_en: string | null;
};

export type PublicLineagePage = {
  data: PublicUnit[];
  meta: { limit: number; offset: number; nextOffset: number | null; reviewStatus: 'approved' };
};

export async function getPublicLineage(offset = 0, signal?: AbortSignal): Promise<PublicLineagePage> {
  const url = new URL('/v1/public/lineage', API_BASE);
  url.searchParams.set('limit', '50');
  url.searchParams.set('offset', String(offset));
  const response = await fetch(url, { method: 'GET', signal, mode: 'cors', credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error(`API_NOT_READY_${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !('meta' in payload)) throw new Error('INVALID_API_RESPONSE');
  const parsed = payload as PublicLineagePage;
  if (!Array.isArray(parsed.data) || !parsed.meta || parsed.meta.reviewStatus !== 'approved') throw new Error('INVALID_API_RESPONSE');
  return parsed;
}
