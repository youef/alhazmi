import { createHmac } from 'node:crypto';

export const RELATIVE_ROLES = {
  father: { gender: 'male', father: 'father_father', mother: 'father_mother' },
  mother: { gender: 'female', father: 'mother_father', mother: 'mother_mother' },
  father_father: { gender: 'male' },
  father_mother: { gender: 'female' },
  mother_father: { gender: 'male' },
  mother_mother: { gender: 'female' },
};
export const RELATIVE_ORDER = ['father_father','father_mother','mother_father','mother_mother','father','mother'];
export const UNIT_TYPES = ['branch','clan','subclan','family','house'];

export function cleanName(raw, max = 200) {
  const value = typeof raw === 'string' ? raw.trim().replace(/\s+/gu, ' ').slice(0, max) : '';
  if (value && (value.length < 2 || /[<>\u0000-\u001f]/u.test(value))) throw new Error('INVALID_NAME');
  return value;
}
export function canonicalName(raw) {
  return cleanName(raw).normalize('NFKC').toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/gu, '')
    .replace(/[إأآٱ]/gu, 'ا').replace(/ى/gu, 'ي').replace(/ة/gu, 'ه').trim();
}
export function fingerprintIdentity(number, kind, secret) {
  if (!secret || typeof secret !== 'string') throw new Error('IDENTITY_KEY_MISSING');
  const normalized = String(number || '').trim().replace(/[\s-]/gu, '').toUpperCase();
  if (!['national_id', 'residency', 'passport', 'birth_certificate'].includes(kind)) throw new Error('IDENTITY_KIND');
  if (kind === 'national_id' || kind === 'residency') {
    if (!/^[12][0-9]{9}$/.test(normalized)) throw new Error('IDENTITY_FORMAT');
  } else if (!/^[A-Z0-9]{6,16}$/.test(normalized)) throw new Error('IDENTITY_FORMAT');
  const key = createHmac('sha256', secret).update('diwan:identity-index:v1').digest();
  return {
    digest: createHmac('sha256', key).update('SA|' + kind + '|' + normalized).digest(),
    last4: normalized.slice(-4),
  };
}
export function relativePlan(fields) {
  const list = RELATIVE_ORDER.filter(role =>
    fields[role + '_id'] || fields[role + '_name'] || fields[role + '_identity']);
  for (const role of list) {
    if (role.startsWith('father_') && !list.includes('father')) throw new Error('FATHER_REQUIRED');
    if (role.startsWith('mother_') && !list.includes('mother')) throw new Error('MOTHER_REQUIRED');
  }
  return list;
}
export function assertDistinctParents(fatherId, motherId, personId = null) {
  if (fatherId && motherId && fatherId === motherId) throw new Error('SAME_PARENTS');
  if (personId && [fatherId, motherId].includes(personId)) throw new Error('SELF_PARENT');
}
