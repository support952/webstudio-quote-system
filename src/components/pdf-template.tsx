"use client";

import {
  Document, Page, Text, View, StyleSheet, Font, Svg, Path, Rect, G,
} from "@react-pdf/renderer";
import { QuoteData } from "@/lib/quote-store";
import {
  SERVICES, getEffectivePrice, formatPrice, formatPriceWithRecurring,
  getFeatures, getServiceName,
} from "@/lib/services-data";
import { getLang, isRTL, t, tFn } from "@/lib/i18n";

// Hebrew font
Font.register({
  family: "Heebo",
  fonts: [
    { src: "https://fonts.gstatic.com/s/heebo/v28/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSyccg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/heebo/v28/NGSpv5_NC0k9P_v6ZUCbLRAHxK1Ebiuccg.ttf", fontWeight: 700 },
  ],
});

const GOLD = "#C5A065";
const DARK = "#111827";

function LogoSvg() {
  return (
    <Svg viewBox="0 0 32 32" width={36} height={36}>
      <Rect width="32" height="32" rx="6" fill="#ffffff" />
      <G transform="translate(4 4)">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#06B6D4" stroke="#06B6D4" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

interface PdfTemplateProps {
  data: QuoteData;
}

export function PdfTemplate({ data }: PdfTemplateProps) {
  const lang = getLang(data.currency);
  const rtl = isRTL(data.currency);
  const align = rtl ? "right" as const : "left" as const;
  const alignOpp = rtl ? "left" as const : "right" as const;
  // Hebrew PDF uses Heebo font; English PDF uses Helvetica (built-in, clean sans-serif)
  const fontFamily = rtl ? "Heebo" : "Helvetica";

  const selectedServices = SERVICES.filter((svc) => data.selectedServices.includes(svc.id));

  const isRecurring = (serviceId: string): boolean => {
    const override = data.recurringOverrides[serviceId];
    if (override !== undefined) return override;
    return SERVICES.find((s) => s.id === serviceId)?.isRecurring ?? false;
  };

  const getCustomPrice = (cs: { priceILS: number; priceUSD: number; priceEUR: number }) =>
    data.currency === "EUR" ? cs.priceEUR : data.currency === "ILS" ? cs.priceILS : cs.priceUSD;

  const oneTimeSubtotal =
    selectedServices.filter((s) => !isRecurring(s.id)).reduce((sum, svc) => sum + getEffectivePrice(svc, data.currency, data.customPrices), 0) +
    data.customServices.filter((cs) => !cs.isRecurring).reduce((sum, cs) => sum + getCustomPrice(cs), 0);
  const recurringTotal =
    selectedServices.filter((s) => isRecurring(s.id)).reduce((sum, svc) => sum + getEffectivePrice(svc, data.currency, data.customPrices), 0) +
    data.customServices.filter((cs) => cs.isRecurring).reduce((sum, cs) => sum + getCustomPrice(cs), 0);
  const discountAmount = (oneTimeSubtotal * data.discount) / 100;
  const total = oneTimeSubtotal - discountAmount;
  const vatRate = 0.18;
  const showVat = data.currency === "ILS" && data.includeVat;
  const vatAmount = showVat ? total * vatRate : 0;
  const totalWithVat = total + vatAmount;
  const recurringVat = showVat ? recurringTotal * vatRate : 0;
  const recurringWithVat = recurringTotal + recurringVat;
  const allEmpty = selectedServices.length === 0 && data.customServices.length === 0;

  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + data.validDays);
  const fmtDate = (d: Date) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

  // Dynamic styles based on direction
  const s = StyleSheet.create({
    page: { fontFamily, fontSize: 11, padding: 40, backgroundColor: "#FFFFFF", color: DARK },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    logoBlock: { alignItems: rtl ? "flex-end" : "flex-start" },
    brandName: { fontSize: 16, fontWeight: 700, color: DARK, marginTop: 6, textAlign: align },
    brandEmail: { fontSize: 8, color: "#6B7280", marginTop: 2, textAlign: align },
    dateBlock: { alignItems: rtl ? "flex-start" : "flex-end" },
    dateText: { fontSize: 9, color: "#9CA3AF", textAlign: alignOpp },
    goldLine: { height: 2, backgroundColor: GOLD, marginVertical: 12 },
    proposalTitle: { fontSize: 20, fontWeight: 700, color: DARK, textAlign: align, marginBottom: 4 },
    subtitle: { fontSize: 11, color: "#6B7280", textAlign: align, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: DARK, textAlign: align, marginBottom: 8, marginTop: 16 },
    table: { width: "100%", marginBottom: 16 },
    tableHeader: { flexDirection: "row", backgroundColor: DARK, padding: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    thCell: { color: "#FFFFFF", fontSize: 10, fontWeight: 700, textAlign: align },
    tRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    tRowAlt: { flexDirection: "row", padding: 8, backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    tCell: { fontSize: 10, textAlign: align },
    tCellDesc: { fontSize: 9, textAlign: align, color: "#9CA3AF", lineHeight: 1.4 },
    // LTR: Service | Details | Price   RTL: Price | Details | Service
    colFirst: { width: rtl ? "20%" : "30%" },
    colMiddle: { width: "50%" },
    colLast: { width: rtl ? "30%" : "20%" },
    summaryBox: { marginTop: 16, padding: 16, backgroundColor: "#F9FAFB", borderRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    summaryLabel: { fontSize: 11, color: "#6B7280", textAlign: align },
    summaryValue: { fontSize: 11, fontWeight: 700, textAlign: alignOpp },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderTopColor: GOLD },
    totalLabel: { fontSize: 14, fontWeight: 700, color: DARK, textAlign: align },
    totalValue: { fontSize: 14, fontWeight: 700, color: DARK, textAlign: alignOpp },
    goldSeparator: { height: 1, backgroundColor: GOLD, marginTop: 20, marginBottom: 4 },
    termsSection: { marginTop: 16, padding: 16, backgroundColor: "#FAFAFA", borderRadius: 4, flexDirection: "column", alignItems: rtl ? "flex-end" : "flex-start" },
    termsTitle: { fontSize: 12, fontWeight: 700, color: DARK, textAlign: align, marginBottom: 10, width: "100%" },
    termRow: { flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start", marginBottom: 6, width: "100%" },
    termBullet: { fontSize: 10, color: GOLD, fontWeight: 700, marginLeft: rtl ? 6 : 0, marginRight: rtl ? 0 : 6, lineHeight: 1.5 },
    termText: { fontSize: 10, color: "#4B5563", textAlign: align, lineHeight: 1.5, flex: 1 },
    validityNote: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB", width: "100%" },
    validityText: { fontSize: 10, color: GOLD, textAlign: align, fontWeight: 700, lineHeight: 1.6 },
    notesSection: { marginTop: 16, padding: 12, borderWidth: 1, borderColor: GOLD, borderRadius: 4 },
    notesTitle: { fontSize: 11, fontWeight: 700, color: DARK, textAlign: align, marginBottom: 4 },
    notesText: { fontSize: 9, color: "#4B5563", textAlign: align, lineHeight: 1.5 },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8 },
    footerText: { fontSize: 8, color: "#9CA3AF" },
  });

  // Table column rendering helpers — order depends on direction
  const renderThRow = () => {
    if (rtl) {
      return (
        <View style={s.tableHeader}>
          <Text style={[s.thCell, s.colFirst, { textAlign: "left" }]}>{t("pdfPrice", lang)}</Text>
          <Text style={[s.thCell, s.colMiddle]}>{t("pdfDetails", lang)}</Text>
          <Text style={[s.thCell, s.colLast]}>{t("pdfService", lang)}</Text>
        </View>
      );
    }
    return (
      <View style={s.tableHeader}>
        <Text style={[s.thCell, s.colFirst]}>{t("pdfService", lang)}</Text>
        <Text style={[s.thCell, s.colMiddle]}>{t("pdfDetails", lang)}</Text>
        <Text style={[s.thCell, s.colLast, { textAlign: "right" }]}>{t("pdfPrice", lang)}</Text>
      </View>
    );
  };

  const renderRow = (name: string, desc: string, priceStr: string, idx: number, key: string) => {
    const rowStyle = idx % 2 === 0 ? s.tRow : s.tRowAlt;
    if (rtl) {
      return (
        <View key={key} style={rowStyle}>
          <Text style={[s.tCell, s.colFirst, { fontWeight: 700, textAlign: "left" }]}>{priceStr}</Text>
          <Text style={[s.tCellDesc, s.colMiddle]}>{desc}</Text>
          <Text style={[s.tCell, s.colLast, { fontWeight: 700 }]}>{name}</Text>
        </View>
      );
    }
    return (
      <View key={key} style={rowStyle}>
        <Text style={[s.tCell, s.colFirst, { fontWeight: 700 }]}>{name}</Text>
        <Text style={[s.tCellDesc, s.colMiddle]}>{desc}</Text>
        <Text style={[s.tCell, s.colLast, { fontWeight: 700, textAlign: "right" }]}>{priceStr}</Text>
      </View>
    );
  };

  let rowIdx = 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          {rtl ? (
            <>
              <View style={s.dateBlock}>
                <Text style={s.dateText}>{t("pdfDate", lang)}: {fmtDate(today)}</Text>
                <Text style={s.dateText}>{t("pdfValidUntil", lang)}: {fmtDate(validUntil)}</Text>
              </View>
              <View style={s.logoBlock}>
                <LogoSvg />
                <Text style={s.brandName}>WebStudio-IAS</Text>
                <Text style={s.brandEmail}>support@webstudio-ias.com</Text>
              </View>
            </>
          ) : (
            <>
              <View style={s.logoBlock}>
                <LogoSvg />
                <Text style={s.brandName}>WebStudio-IAS</Text>
                <Text style={s.brandEmail}>support@webstudio-ias.com</Text>
              </View>
              <View style={s.dateBlock}>
                <Text style={s.dateText}>{t("pdfDate", lang)}: {fmtDate(today)}</Text>
                <Text style={s.dateText}>{t("pdfValidUntil", lang)}: {fmtDate(validUntil)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.goldLine} />

        {/* Title */}
        <Text style={s.proposalTitle}>
          {data.projectName
            ? `${t("pdfProposal", lang)} — ${data.projectName}`
            : t("pdfProposal", lang)}
        </Text>
        {data.clientName && (
          <Text style={s.subtitle}>{t("pdfFor", lang)}: {data.clientName}</Text>
        )}

        {/* Scope of Work */}
        <Text style={s.sectionTitle}>{t("pdfScope", lang)}</Text>
        <View style={s.table}>
          {renderThRow()}
          {allEmpty && (
            <View style={s.tRow}>
              <Text style={[s.tCell, { width: "100%", color: "#9CA3AF", textAlign: "center" }]}>
                {t("pdfNoServices", lang)}
              </Text>
            </View>
          )}
          {selectedServices.map((svc) => {
            const price = getEffectivePrice(svc, data.currency, data.customPrices);
            const recurring = isRecurring(svc.id);
            const name = getServiceName(svc, data.currency);
            const features = getFeatures(svc, data.currency);
            const priceStr = formatPriceWithRecurring(price, data.currency, recurring);
            const row = renderRow(name, features.join("  ·  "), priceStr, rowIdx, svc.id);
            rowIdx++;
            return row;
          })}
          {data.customServices.map((cs) => {
            const price = getCustomPrice(cs);
            const priceStr = formatPriceWithRecurring(price, data.currency, cs.isRecurring);
            const row = renderRow(cs.title, cs.description || "—", priceStr, rowIdx, cs.id);
            rowIdx++;
            return row;
          })}
        </View>

        {/* Investment Summary */}
        <Text style={s.sectionTitle}>{t("pdfSummary", lang)}</Text>
        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{t("pdfSubtotal", lang)}</Text>
            <Text style={s.summaryValue}>{formatPrice(oneTimeSubtotal, data.currency)}</Text>
          </View>
          {data.discount > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{t("pdfDiscount", lang)} ({data.discount}%)</Text>
              <Text style={[s.summaryValue, { color: "#EF4444" }]}>-{formatPrice(discountAmount, data.currency)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{t("pdfTotal", lang)}</Text>
            <Text style={s.totalValue}>{formatPrice(total, data.currency)}</Text>
          </View>
          {showVat && (
            <View style={[s.summaryRow, { marginTop: 4 }]}>
              <Text style={s.summaryLabel}>{t("pdfVat", lang)}</Text>
              <Text style={s.summaryValue}>{formatPrice(vatAmount, data.currency)}</Text>
            </View>
          )}
          {showVat && (
            <View style={[s.summaryRow, { marginTop: 4, paddingTop: 6, borderTopWidth: 2, borderTopColor: GOLD }]}>
              <Text style={[s.totalLabel, { fontSize: 13 }]}>{t("pdfTotalWithVat", lang)}</Text>
              <Text style={[s.totalValue, { fontSize: 13, color: GOLD }]}>{formatPrice(totalWithVat, data.currency)}</Text>
            </View>
          )}
          {recurringTotal > 0 && (
            <View style={[s.summaryRow, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB" }]}>
              <Text style={[s.summaryLabel, { fontWeight: 700, color: DARK }]}>{t("pdfRetainer", lang)}</Text>
              <Text style={[s.summaryValue, { color: GOLD }]}>
                {formatPrice(recurringTotal, data.currency)} {t("pdfPerMonth", lang)}
              </Text>
            </View>
          )}
          {showVat && recurringTotal > 0 && (
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { fontWeight: 700, color: DARK }]}>{t("pdfRetainer", lang)} + {t("pdfVat", lang)}</Text>
              <Text style={[s.summaryValue, { color: GOLD }]}>
                {formatPrice(recurringWithVat, data.currency)} {t("pdfPerMonth", lang)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={s.notesSection}>
            <Text style={s.notesTitle}>{t("pdfNotes", lang)}</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        )}

        <View style={s.goldSeparator} />

        {/* Terms */}
        <View style={s.termsSection}>
          <Text style={s.termsTitle}>{t("pdfTermsTitle", lang)}</Text>
          <View style={s.termRow}>
            <Text style={s.termBullet}>●</Text>
            <Text style={s.termText}>{t("pdfTerm1", lang)}</Text>
          </View>
          <View style={s.termRow}>
            <Text style={s.termBullet}>●</Text>
            <Text style={s.termText}>{t("pdfTerm2", lang)}</Text>
          </View>
          <View style={s.termRow}>
            <Text style={s.termBullet}>●</Text>
            <Text style={s.termText}>{t("pdfTerm3", lang)}</Text>
          </View>
          <View style={s.validityNote}>
            <Text style={s.validityText}>
              {tFn("pdfValidity", lang)(data.validDays, fmtDate(validUntil))}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>support@webstudio-ias.com</Text>
          <Text style={s.footerText}>WebStudio-IAS © {today.getFullYear()}</Text>
        </View>
      </Page>
    </Document>
  );
}
