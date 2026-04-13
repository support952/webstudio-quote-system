import { Currency } from "./services-data";

export type Lang = "he" | "en";

export function getLang(currency: Currency): Lang {
  return currency === "ILS" ? "he" : "en";
}

export function isRTL(currency: Currency): boolean {
  return currency === "ILS";
}

/** PDF-only translations — sidebar stays Hebrew always */
const translations = {
  pdfDate: { he: "תאריך", en: "Date" },
  pdfValidUntil: { he: "בתוקף עד", en: "Valid until" },
  pdfProposal: { he: "הצעת מחיר", en: "Project Proposal" },
  pdfFor: { he: "עבור", en: "For" },
  pdfScope: { he: "היקף העבודה", en: "Scope of Work" },
  pdfService: { he: "שירות", en: "Service" },
  pdfDetails: { he: "פירוט", en: "Details" },
  pdfPrice: { he: "מחיר", en: "Price" },
  pdfNoServices: { he: "לא נבחרו שירותים", en: "No services selected" },
  pdfSummary: { he: "סיכום השקעה", en: "Investment Summary" },
  pdfSubtotal: { he: "סה״כ השקעה בפרויקט", en: "Total Project Investment" },
  pdfDiscount: { he: "הנחה", en: "Discount" },
  pdfTotal: { he: "סה״כ לתשלום (חד פעמי)", en: "Total Due (one-time)" },
  pdfRetainer: { he: "ריטיינר חודשי לניהול ותחזוקה", en: "Monthly Management & Maintenance Retainer" },
  pdfTermsTitle: { he: "תנאי תשלום", en: "Payment Terms" },
  pdfTerm1: { he: "50% מקדמה להתחלת עבודה.", en: "50% deposit to commence work." },
  pdfTerm2: { he: "25% לאחר אישור עיצוב (סקיצה).", en: "25% upon design approval (mockup)." },
  pdfTerm3: { he: "25% ביום עליית האתר (לפני מסירת סיסמאות).", en: "25% on launch day (before credentials handover)." },
  pdfValidity: {
    he: (days: number, date: string) =>
      `הצעה זו תקפה ל-${days} ימים בלבד (עד לתאריך: ${date}) לצורך שריון מקום בסבב הפיתוח הקרוב.`,
    en: (days: number, date: string) =>
      `This proposal is valid for ${days} days only (until: ${date}) to reserve a spot in the upcoming development cycle.`,
  },
  pdfNotes: { he: "הערות", en: "Notes" },
  pdfPerMonth: { he: "/ לחודש", en: "/ month" },
  pdfVat: { he: 'מע"מ (18%)', en: "VAT (18%)" },
  pdfTotalWithVat: { he: 'סה"כ כולל מע"מ', en: "Total Including VAT" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  const entry = translations[key];
  if (typeof entry === "object" && "he" in entry && typeof entry.he === "string") {
    return entry[lang] as string;
  }
  return key;
}

export function tFn(key: "pdfValidity", lang: Lang): (days: number, date: string) => string {
  const entry = translations[key];
  return entry[lang] as (days: number, date: string) => string;
}
