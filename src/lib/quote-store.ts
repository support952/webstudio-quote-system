"use client";

import { createContext, useContext } from "react";
import { Currency } from "./services-data";

export interface CustomService {
  id: string;
  title: string;
  description: string;
  priceILS: number;
  priceUSD: number;
  priceEUR: number;
  isRecurring: boolean;
}

export interface QuoteData {
  clientName: string;
  clientEmail: string;
  projectName: string;
  selectedServices: string[];
  currency: Currency;
  discount: number;
  notes: string;
  validDays: number;
  customPrices: Record<string, number>;
  recurringOverrides: Record<string, boolean>;
  customServices: CustomService[];
}

export const defaultQuoteData: QuoteData = {
  clientName: "",
  clientEmail: "",
  projectName: "",
  selectedServices: [],
  currency: "ILS",
  discount: 0,
  notes: "",
  validDays: 3,
  customPrices: {},
  recurringOverrides: {},
  customServices: [],
};

export const QuoteContext = createContext<{
  data: QuoteData;
  setData: (data: QuoteData) => void;
}>({
  data: defaultQuoteData,
  setData: () => {},
});

export function useQuote() {
  return useContext(QuoteContext);
}
