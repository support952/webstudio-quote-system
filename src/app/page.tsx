"use client";

import { useState } from "react";
import { QuoteContext, defaultQuoteData, QuoteData } from "@/lib/quote-store";
import { SidebarForm } from "@/components/sidebar-form";
import { PdfPreview } from "@/components/pdf-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Zap } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<QuoteData>(defaultQuoteData);
  return (
    <QuoteContext.Provider value={{ data, setData }}>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between p-3 border-b bg-background" dir="rtl">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-500" />
            <span className="font-bold text-sm">WebStudio-IAS</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <Menu className="h-5 w-5" />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 overflow-y-auto">
                <SidebarForm />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Sidebar — always RTL Hebrew */}
        <aside className="hidden lg:flex flex-col w-96 border-l bg-background overflow-hidden shrink-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-500" />
              <span className="font-bold">WebStudio-IAS</span>
            </div>
            <ThemeToggle />
          </div>
          <SidebarForm />
        </aside>

        {/* Main PDF Preview */}
        <main className="flex-1 lg:mt-0 mt-14 overflow-hidden">
          <PdfPreview />
        </main>
      </div>
    </QuoteContext.Provider>
  );
}
