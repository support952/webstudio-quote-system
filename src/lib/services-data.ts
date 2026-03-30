export type Currency = "ILS" | "USD" | "EUR";

export interface ServicePackage {
  id: string;
  nameHe: string;
  nameEn: string;
  priceILS: number;
  priceUSD: number;
  priceEUR: number;
  featuresHe: string[];
  featuresEn: string[];
  isRecurring: boolean;
}

export const SERVICES: ServicePackage[] = [
  {
    id: "landing",
    nameHe: "דף נחיתה",
    nameEn: "Landing Page",
    priceILS: 2500,
    priceUSD: 850,
    priceEUR: 800,
    isRecurring: false,
    featuresHe: [
      "עיצוב דף נחיתה ממוקד המרות",
      "התאמה מלאה למובייל (Responsive)",
      "טופס יצירת קשר / לידים",
      "מהירות טעינה מותאמת",
    ],
    featuresEn: [
      "Conversion-focused landing page design",
      "Fully mobile responsive",
      "Contact / lead capture form",
      "Optimized loading speed",
    ],
  },
  {
    id: "business",
    nameHe: "אתר עסקי",
    nameEn: "Business Site",
    priceILS: 5500,
    priceUSD: 1800,
    priceEUR: 1700,
    isRecurring: false,
    featuresHe: [
      "עד 5 עמודי תוכן ייחודיים",
      "עיצוב רספונסיבי פרימיום",
      "מערכת ניהול תוכן (CMS)",
      "אופטימיזציה למנועי חיפוש (SEO בסיסי)",
      "טפסים חכמים ודף צור קשר",
    ],
    featuresEn: [
      "Up to 5 unique content pages",
      "Premium responsive design",
      "Content Management System (CMS)",
      "Basic SEO optimization",
      "Smart forms & contact page",
    ],
  },
  {
    id: "premium",
    nameHe: "אתר פרימיום גלובלי",
    nameEn: "Global Premium",
    priceILS: 11000,
    priceUSD: 3500,
    priceEUR: 3300,
    isRecurring: false,
    featuresHe: [
      "עד 15 עמודים מעוצבים",
      "עיצוב High-End בהתאמה אישית מלאה",
      "תמיכה רב-שפתית (עברית + אנגלית)",
      "אינטגרציות מתקדמות (CRM, תשלומים, צ׳אט)",
      "אופטימיזציה מלאה ל-SEO + ביצועים",
      "תמיכה טכנית ל-3 חודשים לאחר השקה",
    ],
    featuresEn: [
      "Up to 15 designed pages",
      "Full custom high-end design",
      "Multi-language support (Hebrew + English)",
      "Advanced integrations (CRM, payments, chat)",
      "Full SEO + performance optimization",
      "3-month technical support post-launch",
    ],
  },
  {
    id: "retainer",
    nameHe: "תחזוקה ואחסון (ריטיינר חודשי)",
    nameEn: "Monthly Retainer",
    priceILS: 350,
    priceUSD: 100,
    priceEUR: 100,
    isRecurring: true,
    featuresHe: [
      "אחסון מנוהל",
      "גיבויים אוטומטיים",
      "עדכוני אבטחה ותחזוקה שוטפת",
      "תמיכה טכנית בסיסית",
    ],
    featuresEn: [
      "Managed hosting",
      "Automatic backups",
      "Security updates & ongoing maintenance",
      "Basic technical support",
    ],
  },
];

export function getDefaultPrice(service: ServicePackage, currency: Currency): number {
  if (currency === "EUR") return service.priceEUR;
  return currency === "ILS" ? service.priceILS : service.priceUSD;
}

export function getEffectivePrice(
  service: ServicePackage,
  currency: Currency,
  customPrices: Record<string, number>
): number {
  const key = `${service.id}_${currency}`;
  if (key in customPrices) return customPrices[key];
  return getDefaultPrice(service, currency);
}

export function getCurrencySymbol(currency: Currency): string {
  if (currency === "EUR") return "€";
  return currency === "ILS" ? "₪" : "$";
}

export function formatPrice(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString();
  return currency === "ILS" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export function formatPriceWithRecurring(
  amount: number,
  currency: Currency,
  isRecurring: boolean
): string {
  const base = formatPrice(amount, currency);
  if (!isRecurring) return base;
  return currency === "ILS" ? `${base} / לחודש` : `${base} / month`;
}

export function getFeatures(service: ServicePackage, currency: Currency): string[] {
  return currency === "ILS" ? service.featuresHe : service.featuresEn;
}

export function getServiceName(service: ServicePackage, currency: Currency): string {
  return currency === "ILS" ? service.nameHe : service.nameEn;
}
