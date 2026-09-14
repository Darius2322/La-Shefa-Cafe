/**
 * wa.me links require the phone number as plain international digits — no
 * leading "+", no leading "0", no spaces or dashes. Numbers in this app are
 * mostly entered by customers as local Kenyan numbers (e.g. "0712 345 678"),
 * which wa.me can't route. This normalizes any of the common shapes
 * (0712345678, +254712345678, 254712345678, 712345678) to "254712345678".
 */
export function toWhatsAppDigits(phone: string, defaultCountryCode = "254"): string {
  let digits = (phone || "").replace(/[^\d]/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) {
    digits = defaultCountryCode + digits.slice(1);
  } else if (digits.startsWith(defaultCountryCode)) {
    // already has the country code
  } else if (digits.length <= 10) {
    digits = defaultCountryCode + digits;
  }
  return digits;
}

export function waLink(phone: string, text: string): string {
  const digits = toWhatsAppDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** No fixed recipient — opens WhatsApp's contact picker so the person can send
 * (or save) the message to whichever chat they want, including themselves. */
export function waShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
