"use client";

import { useState } from "react";
import { useQuote, CustomService } from "@/lib/quote-store";
import {
  SERVICES, formatPrice, getEffectivePrice, getCurrencySymbol, Currency,
} from "@/lib/services-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, CalendarClock, Repeat, Plus, Trash2, X } from "lucide-react";

export function SidebarForm() {
  const { data, setData } = useQuote();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", price: 0, isRecurring: false });

  const update = (partial: Partial<typeof data>) => setData({ ...data, ...partial });

  const toggleService = (id: string) => {
    const selected = data.selectedServices.includes(id)
      ? data.selectedServices.filter((s) => s !== id)
      : [...data.selectedServices, id];
    update({ selectedServices: selected });
  };

  const setCustomPrice = (serviceId: string, value: number) => {
    const key = `${serviceId}_${data.currency}`;
    update({ customPrices: { ...data.customPrices, [key]: value } });
  };

  const toggleRecurring = (serviceId: string) => {
    const svc = SERVICES.find((s) => s.id === serviceId);
    const currentDefault = svc?.isRecurring ?? false;
    const currentOverride = data.recurringOverrides[serviceId];
    const currentValue = currentOverride !== undefined ? currentOverride : currentDefault;
    update({ recurringOverrides: { ...data.recurringOverrides, [serviceId]: !currentValue } });
  };

  const isRecurring = (serviceId: string): boolean => {
    const override = data.recurringOverrides[serviceId];
    if (override !== undefined) return override;
    return SERVICES.find((s) => s.id === serviceId)?.isRecurring ?? false;
  };

  const getCustomPrice = (cs: CustomService) => {
    if (data.currency === "EUR") return cs.priceEUR;
    return data.currency === "ILS" ? cs.priceILS : cs.priceUSD;
  };

  const addCustomService = () => {
    if (!draft.title.trim()) return;
    const cs: CustomService = {
      id: `custom_${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      priceILS: data.currency === "ILS" ? draft.price : Math.round(draft.price * 3.5),
      priceUSD: data.currency === "USD" ? draft.price : Math.round(draft.price / 3.5),
      priceEUR: data.currency === "EUR" ? draft.price : Math.round(draft.price / 3.7),
      isRecurring: draft.isRecurring,
    };
    update({ customServices: [...data.customServices, cs] });
    setDraft({ title: "", description: "", price: 0, isRecurring: false });
    setShowCustomForm(false);
  };

  const removeCustomService = (id: string) => {
    update({ customServices: data.customServices.filter((s) => s.id !== id) });
  };

  const updateCustomService = (id: string, partial: Partial<CustomService>) => {
    update({ customServices: data.customServices.map((s) => s.id === id ? { ...s, ...partial } : s) });
  };

  const oneTimeTotal =
    data.selectedServices.reduce((sum, id) => {
      if (isRecurring(id)) return sum;
      const svc = SERVICES.find((s) => s.id === id);
      return svc ? sum + getEffectivePrice(svc, data.currency, data.customPrices) : sum;
    }, 0) + data.customServices.filter((cs) => !cs.isRecurring).reduce((sum, cs) => sum + getCustomPrice(cs), 0);

  const recurringTotal =
    data.selectedServices.reduce((sum, id) => {
      if (!isRecurring(id)) return sum;
      const svc = SERVICES.find((s) => s.id === id);
      return svc ? sum + getEffectivePrice(svc, data.currency, data.customPrices) : sum;
    }, 0) + data.customServices.filter((cs) => cs.isRecurring).reduce((sum, cs) => sum + getCustomPrice(cs), 0);

  const afterDiscount = oneTimeTotal - (oneTimeTotal * data.discount) / 100;
  const vatRate = 0.18;
  const showVat = data.currency === "ILS" && data.includeVat;
  const oneTimeVat = showVat ? afterDiscount * vatRate : 0;
  const oneTimeWithVat = afterDiscount + oneTimeVat;
  const recurringVat = showVat ? recurringTotal * vatRate : 0;
  const recurringWithVat = recurringTotal + recurringVat;
  const symbol = getCurrencySymbol(data.currency);
  const suffix = data.currency === "ILS" ? "/ לחודש" : "/ month";

  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + data.validDays);
  const fmtDate = (d: Date) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 pb-2">
        {/* מטבע */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">מטבע</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {(["ILS", "USD", "EUR"] as Currency[]).map((c) => (
                <button key={c} type="button" onClick={() => update({ currency: c })} className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${data.currency === c ? "bg-[#111827] text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {getCurrencySymbol(c)} {c}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* פרטי לקוח */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">פרטי לקוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>שם הלקוח</Label>
              <Input value={data.clientName} onChange={(e) => update({ clientName: e.target.value })} placeholder="שם מלא" className="focus-visible:ring-[#C5A065]" />
            </div>
            <div className="space-y-1">
              <Label>אימייל</Label>
              <Input type="email" value={data.clientEmail} onChange={(e) => update({ clientEmail: e.target.value })} placeholder="email@example.com" dir="ltr" className="focus-visible:ring-[#C5A065]" />
            </div>
            <div className="space-y-1">
              <Label>שם הפרויקט</Label>
              <Input value={data.projectName} onChange={(e) => update({ projectName: e.target.value })} placeholder="שם הפרויקט" className="focus-visible:ring-[#C5A065]" />
            </div>
          </CardContent>
        </Card>

        {/* שירותים */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">שירותים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SERVICES.map((svc) => {
              const isSelected = data.selectedServices.includes(svc.id);
              const effectivePrice = getEffectivePrice(svc, data.currency, data.customPrices);
              const recurring = isRecurring(svc.id);
              return (
                <div key={svc.id} className={`rounded-lg border p-3 transition-colors ${isSelected ? "border-[#C5A065] bg-[#C5A065]/5" : "border-border hover:bg-accent/50"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleService(svc.id)} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{svc.nameHe}</div>
                      <div className="text-xs text-muted-foreground">{svc.nameEn}</div>
                    </div>
                    {recurring && <span className="text-[10px] bg-[#C5A065]/15 text-[#C5A065] px-1.5 py-0.5 rounded font-medium">חודשי</span>}
                  </label>
                  <div className="mt-2 flex items-center gap-2 mr-8">
                    <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="relative flex-1">
                      <Input type="number" min={0} value={effectivePrice} onChange={(e) => setCustomPrice(svc.id, Number(e.target.value))} className="h-8 text-sm font-semibold pr-8 focus-visible:ring-[#C5A065]" dir="ltr" />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#C5A065] font-bold">{symbol}</span>
                    </div>
                    <button type="button" onClick={() => { const key = `${svc.id}_${data.currency}`; const { [key]: _, ...rest } = data.customPrices; update({ customPrices: rest }); }} className="text-[10px] text-muted-foreground hover:text-foreground underline">איפוס</button>
                  </div>
                  <div className="mt-1.5 mr-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={recurring} onCheckedChange={() => toggleRecurring(svc.id)} />
                      <Repeat className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">מחזורי (חודשי)</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* שירותים מותאמים אישית */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">שירותים מותאמים אישית</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.customServices.map((cs) => (
              <div key={cs.id} className="rounded-lg border border-[#C5A065]/30 bg-[#C5A065]/5 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Input value={cs.title} onChange={(e) => updateCustomService(cs.id, { title: e.target.value })} className="h-7 text-sm font-semibold focus-visible:ring-[#C5A065]" placeholder="שם השירות" />
                    <Input value={cs.description} onChange={(e) => updateCustomService(cs.id, { description: e.target.value })} className="h-7 text-xs focus-visible:ring-[#C5A065]" placeholder="תיאור" />
                  </div>
                  <button type="button" onClick={() => removeCustomService(cs.id)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input type="number" min={0} value={getCustomPrice(cs)} onChange={(e) => {
                      const val = Number(e.target.value);
                      const upd: Partial<CustomService> = data.currency === "ILS" ? { priceILS: val } : data.currency === "EUR" ? { priceEUR: val } : { priceUSD: val };
                      updateCustomService(cs.id, upd);
                    }} className="h-8 text-sm font-semibold pr-8 focus-visible:ring-[#C5A065]" dir="ltr" />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#C5A065] font-bold">{symbol}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={cs.isRecurring} onCheckedChange={(checked) => updateCustomService(cs.id, { isRecurring: !!checked })} />
                    <Repeat className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">חודשי</span>
                  </label>
                </div>
              </div>
            ))}

            {showCustomForm ? (
              <div className="rounded-lg border-2 border-dashed border-[#C5A065]/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#C5A065]">שירות חדש</span>
                  <button type="button" onClick={() => setShowCustomForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="שם השירות" className="h-8 text-sm focus-visible:ring-[#C5A065]" />
                <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="תיאור קצר..." rows={2} className="text-xs focus-visible:ring-[#C5A065]" />
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input type="number" min={0} value={draft.price || ""} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} className="h-8 text-sm font-semibold pr-8 focus-visible:ring-[#C5A065]" dir="ltr" placeholder="מחיר" />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#C5A065] font-bold">{symbol}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Checkbox checked={draft.isRecurring} onCheckedChange={(checked) => setDraft({ ...draft, isRecurring: !!checked })} />
                    <span className="text-[10px] text-muted-foreground">חודשי</span>
                  </label>
                </div>
                <Button onClick={addCustomService} disabled={!draft.title.trim() || !draft.price} size="sm" className="w-full bg-[#C5A065] hover:bg-[#b49157] text-white">הוסף להצעה</Button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCustomForm(true)} className="w-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-[#C5A065]/50 p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#C5A065] transition-colors">
                <Plus className="h-4 w-4" />הוסף שירות מותאם אישית
              </button>
            )}
          </CardContent>
        </Card>

        {/* הנחה */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">הנחה (על פרויקט)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={100} value={data.discount || ""} onChange={(e) => update({ discount: Math.min(100, Math.max(0, Number(e.target.value))) })} className="w-20 focus-visible:ring-[#C5A065]" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </CardContent>
        </Card>

        {/* מע"מ — רק בשקלים */}
        {data.currency === "ILS" && (
          <Card>
            <CardContent className="py-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={data.includeVat} onCheckedChange={(checked) => update({ includeVat: !!checked })} />
                <span className="text-sm font-medium">הוסף מע״מ (18%)</span>
              </label>
            </CardContent>
          </Card>
        )}

        {/* הערות */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">הערות</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="הערות נוספות להצעה..." rows={3} className="focus-visible:ring-[#C5A065]" />
          </CardContent>
        </Card>

        {/* תוקף הצעה */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#C5A065]" />תוקף הצעה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={30} value={data.validDays} onChange={(e) => update({ validDays: Math.min(30, Math.max(1, Number(e.target.value))) })} className="w-16 focus-visible:ring-[#C5A065]" />
              <span className="text-sm text-muted-foreground">ימים</span>
            </div>
            <p className="text-xs text-[#C5A065] font-medium mt-2">תקף עד: {fmtDate(validUntil)}</p>
          </CardContent>
        </Card>
      </div>

      {/* סה״כ */}
      <div className="shrink-0 border-t bg-background p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="rounded-lg bg-[#111827] text-white p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>השקעה בפרויקט</span>
            <span className="font-bold text-lg">{formatPrice(oneTimeTotal, data.currency)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-white/20">
              <span>אחרי הנחה ({data.discount}%)</span>
              <span className="font-bold text-base text-[#C5A065]">{formatPrice(afterDiscount, data.currency)}</span>
            </div>
          )}
          {showVat && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-white/20">
              <span>מע״מ (18%)</span>
              <span className="font-bold text-base text-[#C5A065]">{formatPrice(oneTimeVat, data.currency)}</span>
            </div>
          )}
          {showVat && (
            <div className="flex justify-between items-center text-sm pt-1 border-t border-white/20">
              <span>סה״כ כולל מע״מ</span>
              <span className="font-bold text-lg text-[#C5A065]">{formatPrice(oneTimeWithVat, data.currency)}</span>
            </div>
          )}
          {recurringTotal > 0 && (
            <div className="flex justify-between items-center text-sm pt-2 border-t border-white/20">
              <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />ריטיינר חודשי</span>
              <span className="font-bold text-base text-[#C5A065]">{formatPrice(recurringTotal, data.currency)} {suffix}</span>
            </div>
          )}
          {showVat && recurringTotal > 0 && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-white/20">
              <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />ריטיינר + מע״מ</span>
              <span className="font-bold text-base text-[#C5A065]">{formatPrice(recurringWithVat, data.currency)} {suffix}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
