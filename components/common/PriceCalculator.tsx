"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/utils";

export function PriceCalculator() {
  const [revenue, setRevenue] = useState("0");
  const [productCost, setProductCost] = useState("0");
  const [commission, setCommission] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [serviceFee, setServiceFee] = useState("0");
  const [otherCosts, setOtherCosts] = useState("0");

  const estimatedProfit = useMemo(() => {
    return (
      Number(revenue || 0) -
      Number(productCost || 0) -
      Number(commission || 0) -
      Number(shippingCost || 0) -
      Number(serviceFee || 0) -
      Number(otherCosts || 0)
    );
  }, [commission, otherCosts, productCost, revenue, serviceFee, shippingCost]);

  const fields = [
    { key: "revenue", label: "Ciro", value: revenue, setValue: setRevenue },
    { key: "productCost", label: "Ürün Maliyeti", value: productCost, setValue: setProductCost },
    { key: "commission", label: "Komisyon", value: commission, setValue: setCommission },
    { key: "shippingCost", label: "Kargo", value: shippingCost, setValue: setShippingCost },
    { key: "serviceFee", label: "Hizmet Bedeli", value: serviceFee, setValue: setServiceFee },
    { key: "otherCosts", label: "Diğer Giderler", value: otherCosts, setValue: setOtherCosts },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h3 className="font-heading text-xl font-bold text-slate-900">Kâr Hesaplayıcı</h3>
        <p className="mt-1 text-sm text-slate-500">
          Sipariş başına tahmini kârı maliyet, komisyon ve operasyon giderleriyle hesaplayın.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="space-y-2">
              <span className="text-sm font-medium text-slate-700">{field.label}</span>
              <input
                value={field.value}
                onChange={(event) => field.setValue(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
          Sonuç
        </p>
        <p className="mt-4 font-heading text-4xl font-bold text-slate-900">
          {formatCurrency(estimatedProfit)}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Formül: Ciro - Ürün Maliyeti - Komisyon - Kargo - Hizmet Bedeli - Diğer Giderler
        </p>
      </div>
    </div>
  );
}
