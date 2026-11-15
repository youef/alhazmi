import { describe, expect, it } from 'vitest';
import { direction, getDictionary, isLocale } from './i18n';

describe('locale foundations', () => {
  it('accepts only supported locales', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
  it('switches text direction', () => {
    expect(direction('ar')).toBe('rtl');
    expect(direction('en')).toBe('ltr');
  });
  it('provides localized public page strings', () => {
    expect(getDictionary('ar').brand).toBe('ديوان الحازمي');
    expect(getDictionary('en').nav.archive).toBe('Archive');
  });
});
