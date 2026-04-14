/**
 * Oratio&Co — i18n UI dictionary
 *
 * Short UI strings used across Nav, Footer, and shared components.
 * Long-form page content lives in the pages themselves (one .astro per locale).
 *
 * DRAFT TRANSLATIONS: German copy here is Claude's first draft — Tobias, please review
 * and refine to your preferred register before going live.
 */

export type Locale = 'en' | 'de';

export const defaultLocale: Locale = 'en';
export const locales: Locale[] = ['en', 'de'];

export const ui = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.missionalByDesign': 'Missional by Design',
    'nav.ministryModelCanvas': 'Ministry Model Canvas',
    'nav.about': 'About',

    // Footer
    'footer.tagline': 'Tobias Treppmann',
    'footer.links.imprint': 'Impressum',
    'footer.links.privacy': 'Datenschutz',
    'footer.links.accessibility': 'Barrierefreiheit',
    'footer.credit': '© 2026 Oratio&Co. All rights reserved.',

    // Common
    'cta.getInTouch': 'Get in touch',
    'cta.readMore': 'Read more',
    'common.external': '(external)',
    'common.readInEnglish': 'This page is only available in English right now.',
    'common.readInEnglishLink': 'Read in English',
    'common.translationComing': 'Deutsche Übersetzung folgt bald.',
  },
  de: {
    // Nav
    'nav.home': 'Start',
    'nav.missionalByDesign': 'Missional by Design',
    'nav.ministryModelCanvas': 'Ministry Model Canvas',
    'nav.about': 'Über uns',

    // Footer
    'footer.tagline': 'Tobias Treppmann',
    'footer.links.imprint': 'Impressum',
    'footer.links.privacy': 'Datenschutz',
    'footer.links.accessibility': 'Barrierefreiheit',
    'footer.credit': '© 2026 Oratio&Co. Alle Rechte vorbehalten.',

    // Common
    'cta.getInTouch': 'Kontakt aufnehmen',
    'cta.readMore': 'Weiterlesen',
    'common.external': '(extern)',
    'common.readInEnglish': 'Diese Seite ist derzeit nur auf Englisch verfügbar.',
    'common.readInEnglishLink': 'Auf Englisch lesen',
    'common.translationComing': 'Deutsche Übersetzung folgt bald.',
  },
} as const;

export type UIKey = keyof typeof ui['en'];

export function t(locale: Locale, key: UIKey): string {
  return ui[locale][key] ?? ui[defaultLocale][key] ?? key;
}

/** Derive the locale from a URL pathname. '/' → 'en', '/de/...' → 'de'. */
export function getLocaleFromPath(pathname: string, base = ''): Locale {
  const p = pathname.replace(base, '').replace(/^\/+/, '');
  if (p.startsWith('de/') || p === 'de') return 'de';
  return 'en';
}

/** Swap locale in a pathname. `/about` → `/de/about` and vice versa. */
export function altLocalePath(pathname: string, targetLocale: Locale, base = ''): string {
  // Strip base if present
  const hasBase = base && pathname.startsWith(base);
  const stripped = hasBase ? pathname.slice(base.length) : pathname;
  const withoutDe = stripped.replace(/^\/de(\/|$)/, '/');
  const normalized = withoutDe === '' ? '/' : withoutDe;
  const localePath = targetLocale === 'de'
    ? (normalized === '/' ? '/de' : `/de${normalized}`)
    : normalized;
  return (hasBase ? base : '') + localePath;
}
