import React, { createContext, useContext, useState } from "react";

export type CurrencyCode = "THB" | "USD" | "EUR" | "RUB";

interface CurrencyContextProps {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convertPrice: (thbValue: number) => number;
  formatPrice: (thbValue: number) => string;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(
  undefined,
);

const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  THB: 1.0,
  USD: 0.027,
  EUR: 0.025,
  RUB: 2.45,
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  THB: "฿",
  USD: "$",
  EUR: "€",
  RUB: "₽",
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (
      (localStorage.getItem("preferred_currency") as CurrencyCode) || "THB"
    );
  });

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    localStorage.setItem("preferred_currency", curr);
  };

  const convertPrice = (thbValue: number): number => {
    return Math.round(thbValue * EXCHANGE_RATES[currency]);
  };

  const formatPrice = (thbValue: number): string => {
    const converted = convertPrice(thbValue);
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = converted.toLocaleString();
    if (currency === "THB") {
      return `${symbol}${formatted}`;
    } else if (currency === "USD") {
      return `${symbol}${formatted}`;
    } else if (currency === "EUR") {
      return `${symbol}${formatted}`;
    } else {
      return `${formatted} ${symbol}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, convertPrice, formatPrice }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
