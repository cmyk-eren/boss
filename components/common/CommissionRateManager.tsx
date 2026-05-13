"use client";

import { useState } from "react";

type CommissionRate = {
  id: string;
  categoryName: string;
  rate: number;
  shippingCost: number;
  serviceFee: number;
  otherCosts: number;
};

type CommissionRateManagerProps = {
  storeId: string;
  initialRates: CommissionRate[];
};

export function CommissionRateManager({
  storeId,
  initialRates,
}: CommissionRateManagerProps) {
  const [rates, setRates] = useState(initialRates);
  const [form, setForm] = useState({
    categoryName: "",
    rate: "",
    shippingCost: "",
    serviceFee: "",
    otherCosts: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form
        className="rounded-[28px] border border-slate-200 bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();

          const response = await fetch(`/api/stores/${storeId}/commission-rates`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              categoryName: form.categoryName,
              rate: Number(form.rate),
              shippingCost: Number(form.shippingCost || 0),
              serviceFee: Number(form.serviceFee || 0),
              otherCosts: Number(form.otherCosts || 0),
            }),
          });

          const payload = await response.json();
          if (!response.ok) {
            setMessage(payload.error ?? "Kayıt başarısız.");
            return;
          }

          const nextRates = rates.filter((rate) => rate.categoryName !== payload.categoryName);
          setRates([payload, ...nextRates]);
          setForm({
            categoryName: "",
            rate: "",
            shippingCost: "",
            serviceFee: "",
            otherCosts: "",
          });
          setMessage("Komisyon oranı kaydedildi.");
        }}
      >
        <h3 className="font-heading text-xl font-bold text-slate-900">Kategori kuralı ekle</h3>
        <div className="mt-5 space-y-4">
          {[
            ["categoryName", "Kategori Adı"],
            ["rate", "Komisyon (%)"],
            ["shippingCost", "Varsayılan Kargo"],
            ["serviceFee", "Hizmet Bedeli"],
            ["otherCosts", "Diğer Giderler"],
          ].map(([key, label]) => (
            <label key={key} className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <input
                value={form[key as keyof typeof form]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="mt-5 rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
        >
          Kaydet
        </button>
        {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      </form>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h3 className="font-heading text-xl font-bold text-slate-900">Tanımlı oranlar</h3>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Komisyon</th>
                <th className="pb-3">Kargo</th>
                <th className="pb-3">Hizmet</th>
                <th className="pb-3">Diğer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map((rate) => (
                <tr key={rate.id}>
                  <td className="py-3 font-medium text-slate-900">{rate.categoryName}</td>
                  <td className="py-3">{rate.rate}%</td>
                  <td className="py-3">{rate.shippingCost} TL</td>
                  <td className="py-3">{rate.serviceFee} TL</td>
                  <td className="py-3">{rate.otherCosts} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
