/**
 * The contact facts, written once.
 *
 * These same values go out in the campaign-1 email footer, so they are the
 * business's name/address/phone of record. Search engines and AI answers score
 * a business on how consistently those three agree across every surface, and a
 * number typed twice is a number that eventually disagrees with itself.
 *
 * If one of these changes, it changes here and nowhere else.
 */
export const CONTACT = {
  email: 'info@secureprospective.com',

  /**
   * E.164, for `tel:` hrefs and structured data. A `tel:` href with dots or
   * parentheses in it is parsed by some Android dialers as an extension and
   * silently dials wrong, so the machine-readable form never carries
   * punctuation and the human-readable form is kept separately below.
   */
  phone: '+18323032277',
  phoneDisplay: '832.303.2277',

  address: {
    poBox: '1931',
    locality: 'Montgomery',
    region: 'TX',
    postalCode: '77356',
    country: 'US',
  },
} as const;

/** The one-line postal address, matching the campaign email footer exactly. */
export const ADDRESS_LINE = `PO Box ${CONTACT.address.poBox}, ${CONTACT.address.locality}, ${CONTACT.address.region} ${CONTACT.address.postalCode}`;
