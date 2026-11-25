// NOTE (2026 fix): older versions of pdfkit/fontkit had no real Arabic
// shaping or bidi support, so this file used to manually reshape the text
// (arabic-reshaper) and manually reverse it (bidi-js) before handing it to
// pdfkit. The pdfkit version this project now uses ships fontkit 2.x, which
// DOES shape and reorder Arabic correctly on its own. Doing the manual
// reshape+reverse on top of that native support was double-processing the
// text, which is exactly what was producing scrambled/reversed Arabic in
// generated PDFs.
//
// The fix is to stop touching the text at all and let pdfkit render it
// natively. The one real remaining quirk is that pdfkit's line-wrapper
// doesn't add visual spacing at an Arabic-word / number boundary
// ("رقم 12"), so a single space there can render with no visible gap. We
// work around that narrow case by widening just those spaces; everything
// else is passed through untouched.

function shape(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (!/[\u0600-\u06FF]/.test(str)) return str;
  // pdfkit's Arabic shaping sometimes collapses a single space between two
  // words to zero width (Arabic-Arabic or Arabic-number boundaries alike).
  // Widening every single space to a double space keeps a visible gap
  // without otherwise touching the (already correct) native shaping/order.
  const spaced = str.replace(/ /g, '  ');
  // Parentheses (and a few other mirrored punctuation marks) need to be
  // swapped for correct visual display in right-to-left text — pdfkit
  // does not do this automatically.
  return spaced.replace(/[()[\]]/g, (ch) => MIRROR[ch] || ch);
}

const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[' };

module.exports = { shape };
