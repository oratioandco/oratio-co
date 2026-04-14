/**
 * Legal information for the Impressum, Datenschutzerklärung, and
 * Barrierefreiheitserklärung pages.
 *
 * !!! FILL IN THESE PLACEHOLDERS BEFORE GOING LIVE !!!
 *
 * Required under § 5 TMG (Germany) and Art. 13/14 GDPR.
 */

export const legal = {
  operator: {
    name: 'Tobias Treppmann',
    // Replace with your legal postal address:
    street: 'MUSTERSTRASSE 1',
    postcode: '00000',
    city: 'MUSTERSTADT',
    country: 'Deutschland',
    // Replace / remove if not applicable:
    phone: 'auf Anfrage / available on request',
    email: { user: 'toby', domain: 'oratio', tld: 'co' },
    // Optional – include only if you have them:
    vatId: '', // e.g. 'DE123456789'
    taxNumber: '', // Steuernummer, e.g. '123/456/7890'
  },

  /**
   * Person responsible for editorial content (§ 18 Abs. 2 MStV).
   * Usually the same as the operator.
   */
  editorialResponsible: {
    name: 'Tobias Treppmann',
    street: 'MUSTERSTRASSE 1',
    postcode: '00000',
    city: 'MUSTERSTADT',
  },

  site: {
    domain: 'oratio.co',
    url: 'https://oratio.co',
    host: 'GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA (GitHub Pages)',
  },

  lastUpdated: '2026-04-14',
};
