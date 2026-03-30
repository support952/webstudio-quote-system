"use client";

import { useQuote } from "@/lib/quote-store";
import { PdfTemplate } from "./pdf-template";
import { Download, Loader2, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
// Toolbar is always Hebrew — only the PDF document auto-translates

export function PdfPreview() {
  const { data } = useQuote();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const dataKey = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    if (!mounted) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const blob = await pdf(<PdfTemplate data={data} />).toBlob();
        const url = URL.createObjectURL(blob);
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setPdfUrl(url);
        setError(null);
      } catch (err) {
        console.error("PDF generation error:", err);
        setError(err instanceof Error ? err.message : "PDF generation error");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [dataKey, mounted]);

  useEffect(() => {
    return () => { if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current); };
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    const prefix = data.currency === "ILS" ? "הצעת-מחיר" : "proposal";
    a.download = `${prefix}${data.clientName ? `-${data.clientName}` : ""}.pdf`;
    a.click();
  }, [pdfUrl, data.clientName, data.currency]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;
    const win = window.open(pdfUrl, "_blank");
    if (win) win.addEventListener("load", () => win.print());
  }, [pdfUrl]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">תצוגה מקדימה</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#C5A065]" />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!pdfUrl || loading} onClick={handlePrint} className="gap-1.5 text-gray-700 border-gray-300">
            <Printer className="h-3.5 w-3.5" />הדפסה
          </Button>
          <Button size="sm" disabled={!pdfUrl || loading} onClick={handleDownload} className="bg-[#111827] hover:bg-[#C5A065] text-white transition-all duration-200 gap-1.5 shadow-md hover:shadow-lg">
            <Download className="h-3.5 w-3.5" />הורד PDF
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-slate-200 dark:bg-slate-200 overflow-auto" style={{ minHeight: 0 }}>
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500 p-6 bg-white rounded-lg shadow-sm max-w-md">
              <p className="font-semibold mb-2">PDF Error</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">מייצר תצוגה מקדימה...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
